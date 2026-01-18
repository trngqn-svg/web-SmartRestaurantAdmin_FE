import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { getCustomerMenu } from "../../api/customer/menu";
import type { CustomerMenuResponse } from "../../api/customer/menu";
import { Search, Plus, Utensils, Star } from "lucide-react";
import { fileUrl } from "../../utils/fileUrl";
import BottomNavMobileStyled from "../../components/customer/BottomNavMobileStyled";

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; wrap: string; dot: string }> = {
    available: { label: "Available", wrap: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
    sold_out: { label: "Sold Out", wrap: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
  };

  const key = String(status ?? "").toLowerCase();
  const cfg = map[key] ?? { label: key || "unknown", wrap: "bg-slate-100 text-slate-700", dot: "bg-slate-400" };

  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium", cfg.wrap)}>
      <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

export default function CustomerMenuPage() {
  const [sp, setSp] = useSearchParams();
  const location = useLocation();

  const [search, setSearch] = useState(() => sp.get("q") ?? "");
  const [activeCategoryId, setActiveCategoryId] = useState(() => sp.get("cat") ?? "all");
  const [data, setData] = useState<CustomerMenuResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const next = new URLSearchParams(sp);

    if (search.trim()) next.set("q", search.trim());
    else next.delete("q");

    if (activeCategoryId !== "all") next.set("cat", activeCategoryId);
    else next.delete("cat");

    setSp(next, { replace: true });
  }, [search, activeCategoryId]);

   useEffect(() => {
    const key = "menu_scroll_y";
    const y = sessionStorage.getItem(key);
    if (y) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: Number(y), behavior: "auto" });
      });
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      getCustomerMenu({
        q: search.trim() ? search.trim() : undefined,
        categoryId: activeCategoryId !== "all" ? activeCategoryId : undefined,
        page: 1,
        limit: 50,
        sort: "createdAt",
      })
        .then(setData)
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(t);
  }, [search, activeCategoryId]);

  const categories = useMemo(() => {
    const base = data?.categories ?? [];
    return [{ id: "all", name: "All", displayOrder: -999 }, ...base];
  }, [data]);

  const items = data?.items ?? [];

    function openDetail(item: any) {
    const id = item?.id;
    if (!id) return;

    sessionStorage.setItem("menu_scroll_y", String(window.scrollY));
    const from = location.pathname + location.search;

    navigate(`/customer/menu/${id}`, { state: { item, from } });
  }


  return (
    <div className="min-h-[100svh] bg-[#EEF1F5] flex flex-col">
      <div className="mx-auto w-full max-w-[400px] py-4 flex flex-col flex-1">
        {/* Header */}
        <div className="rounded-t-[28px] bg-slate-900 px-4 pt-4 pb-5">
          <div className="relative flex items-center justify-center">
            <div
              className="absolute left-0 inline-flex h-10 w-10 items-center justify-center">
            </div>

            <h1 className="text-[#E2B13C] text-lg font-semibold">Smart Restaurant</h1>

            <div className="absolute right-0 rounded-full px-4 py-1.5 text-sm text-[#E2B13C]">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  Table
                </span>
                <span className="text-lg font-black text-[#E2B13C] leading-none">
                  #1
                </span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-3 rounded-full bg-white px-4 py-3 shadow-sm">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu items..."
                className="w-full bg-transparent text-[15px] outline-none placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* White content */}
        <div className="bg-white px-4 pt-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] flex flex-col flex-1">
          {/* Category sticky */}
          <div className="sticky top-0 z-30 bg-white pt-2">
            <div className="w-full flex gap-3 overflow-x-auto pb-3 touch-pan-x overscroll-x-contain">
              {categories.map((c) => {
                const active = c.id === activeCategoryId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setActiveCategoryId(c.id);

                      window.scrollTo({
                        top: 0,
                        behavior: "smooth",
                      });
                    }}
                    className={cn(
                      "shrink-0 rounded-full px-5 py-2.5 text-[14px] font-medium transition",
                      active ? "bg-slate-900 text-[#E2B13C] shadow-sm" : "bg-[#EEF2F6] text-gray-700"
                    )}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* List */}
          <div className="mt-5 flex-1 pb-[104px] space-y-4">
            {loading && <div className="rounded-2xl bg-[#F7F8FA] p-4 text-sm text-gray-500">Loading menu...</div>}

            {!loading && items.length === 0 && (
              <div className="rounded-2xl bg-[#F7F8FA] p-4 text-sm text-gray-500">No items found.</div>
            )}

            {items.map((it) => (
              <MenuCard
                key={it.id}
                item={it}
                onOpen={openDetail}
                name={it.name}
                description={it.description}
                price={it.price}
                status={it.status}
                canOrder={it.canOrder}
                photoUrl={it.primaryPhotoUrl ? fileUrl(it.primaryPhotoUrl) : null}
                rating={Number((it as any).ratingAvg ?? 0)}
                reviews={Number((it as any).ratingCount ?? 0)}
              />
            ))}
          </div>
        </div>
      </div>

      <BottomNavMobileStyled cartCount={2}/>
    </div>
  );
}

function MenuCard(props: {
  item: any;
  onOpen: (item: any) => void;
  name: string;
  description?: string;
  price: number;
  status: string;
  canOrder: boolean;
  photoUrl: string | null;
  rating: number;
  reviews: number;
}) {
  const { item, onOpen, name, description, price, canOrder, status, photoUrl, rating, reviews } = props;

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="w-full text-left rounded-2xl bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] active:scale-[0.995] transition"
    >
      <div className="flex overflow-hidden rounded-2xl">
        <div className="relative h-[110px] w-[110px] shrink-0 bg-gradient-to-b from-indigo-500 to-purple-700">
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/80">
              <Utensils className="h-10 w-10" />
            </div>
          )}
        </div>

        <div className="flex-1 px-4 py-4">
          <div className="truncate text-[17px] font-semibold text-slate-800">{name}</div>

          <div className="mt-1 flex items-center gap-2 text-sm">
            <Star className="w-4 h-4 text-[#E2B13C] fill-[#E2B13C]" />
            <span className="text-sm font-bold">
              {rating || 0.0}
            </span>
            <span className="text-orange-500">({reviews} reviews)</span>
          </div>

          <div className="mt-2">
            <StatusPill status={status} />
          </div>

          {description ? (
            <div className="mt-2 line-clamp-2 text-[12px] leading-5 text-slate-500">{description}</div>
          ) : null}

          <div className="mt-3 flex items-center justify-between">
            <div className="text-xl font-bold text-slate-900">${price.toFixed(2)}</div>

            <div className="shrink-0">
              <button
                disabled={canOrder}
                className={cn(
                  "h-10 w-10 rounded-2xl flex items-center justify-center transition-all shadow-lg",
                  canOrder
                    ? "bg-[#0F172A] text-[#E2B13C] hover:bg-[#E2B13C] hover:text-[#0F172A]"
                    : "bg-slate-100 text-slate-300 cursor-not-allowed"
                )}
              >
                <Plus className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}