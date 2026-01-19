import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Utensils, Star } from "lucide-react";
import { getCustomerMenu } from "../../api/customer/menu";
import type { CustomerMenuResponse } from "../../api/customer/menu";
import { fileUrl } from "../../utils/fileUrl";
import { getItemReviews } from "../../api/customer/review";

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

type MenuItemDTO = {
  id: string;
  categoryId?: string;
  name: string;
  description?: string;
  price: number;
  status: string;
  canOrder: boolean;
  ratingAvg?: number;
  ratingCount?: number;
  prepTimeMinutes?: number;
  primaryPhotoUrl?: string | null;
  modifierGroups?: Array<{
    _id: string;
    name: string;
    selectionType: "single" | "multiple";
    isRequired: boolean;
    options: Array<{
      _id: string;
      name: string;
      priceAdjustment: number;
      status: "active" | "inactive";
    }>;
  }>;
};

export default function CustomerMenuDetail() {
  const nav = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const stateItem = (location.state as any)?.item as MenuItemDTO | null;

  const [menuData, setMenuData] = useState<CustomerMenuResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [qty, setQty] = useState(1);
  const [instructions, setInstructions] = useState("");

  const [selected, setSelected] = useState<Record<string, string[]>>({});

  const [reviewsData, setReviewsData] =
    useState<null | Awaited<ReturnType<typeof getItemReviews>>>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const from = (location.state as any)?.from as string | undefined;

  useEffect(() => {
    let mounted = true;

    setLoading(!stateItem);

    getCustomerMenu({ page: 1, limit: 200, sort: "createdAt" })
      .then((res) => {
        if (!mounted) return;
        setMenuData(res);
      })
      .finally(() => {
        if (!mounted) return;
        if (!stateItem) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [stateItem]);

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    setReviewsLoading(true);
    getItemReviews(id, { page: 1, limit: 5, sort: "latest" })
      .then((res) => {
        if (!mounted) return;
        setReviewsData(res);
      })
      .finally(() => {
        if (!mounted) return;
        setReviewsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  const item = useMemo<MenuItemDTO | null>(() => {
    if (!id) return null;
    if (stateItem) return stateItem;
    const list = (menuData?.items ?? []) as any[];
    return (list.find((x) => String(x?.id) === String(id)) as any) ?? null;
  }, [id, stateItem, menuData]);

  useEffect(() => {
    if (!item) return;

    const next: Record<string, string[]> = {};
    for (const g of item.modifierGroups ?? []) {
      next[g._id] = [];
      if (g.isRequired && g.selectionType === "single") {
        const firstActive = g.options?.find((o) => o.status === "active");
        if (firstActive) next[g._id] = [firstActive._id];
      }
    }
    setSelected(next);
    setQty(1);
    setInstructions("");
  }, [item?.id]);

  const photoUrl = useMemo(() => {
    if (!item?.primaryPhotoUrl) return null;
    return fileUrl(item.primaryPhotoUrl);
  }, [item?.primaryPhotoUrl]);

  const canOrder = !!item?.canOrder;

  const modifiersTotal = useMemo(() => {
    if (!item) return 0;
    let sum = 0;
    for (const g of item.modifierGroups ?? []) {
      const picked = selected[g._id] ?? [];
      for (const optId of picked) {
        const opt = g.options?.find((o) => o._id === optId);
        if (opt) sum += Number(opt.priceAdjustment || 0);
      }
    }
    return sum;
  }, [item, selected]);

  const totalPrice = useMemo(() => {
    const base = Number(item?.price || 0);
    return (base + modifiersTotal) * qty;
  }, [item?.price, modifiersTotal, qty]);

  const ratingAvg = useMemo(() => {
    return Number(reviewsData?.summary?.ratingAvg ?? item?.ratingAvg ?? 0);
  }, [reviewsData?.summary?.ratingAvg, item?.ratingAvg]);

  const ratingCount = useMemo(() => {
    return Number(reviewsData?.summary?.ratingCount ?? item?.ratingCount ?? 0);
  }, [reviewsData?.summary?.ratingCount, item?.ratingCount]);

  const relatedItems = useMemo(() => {
    if (!item?.id) return [];
    if (!menuData?.items?.length) return [];

    const catId = (item as any).categoryId;
    if (!catId) return [];

    return (menuData.items as any[])
      .filter((x) => String(x?.id) !== String(item.id))
      .filter((x) => String(x?.categoryId) === String(catId))
      .slice(0, 8);
  }, [item?.id, (item as any)?.categoryId, menuData?.items]);

  function togglePick(group: any, optId: string) {
    setSelected((prev) => {
      const cur = prev[group._id] ?? [];
      if (group.selectionType === "single") return { ...prev, [group._id]: [optId] };
      const has = cur.includes(optId);
      const next = has ? cur.filter((x) => x !== optId) : [...cur, optId];
      return { ...prev, [group._id]: next };
    });
  }

  if (loading) {
    return (
      <div className="min-h-[100svh] bg-[#EEF1F5] flex items-center justify-center">
        <div className="rounded-2xl bg-white px-5 py-4 text-sm text-slate-500 shadow">
          Loading item...
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-[100svh] bg-[#EEF1F5] flex flex-col items-center justify-center gap-3">
        <div className="rounded-2xl bg-white px-5 py-4 text-sm text-slate-600 shadow">
          Item not found.
        </div>
        <button
          onClick={() => {
            if (from) nav(from);
            else nav(-1);
          }}
          className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-[#E2B13C]"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-[#EEF1F5] flex flex-col">
      <div className="mx-auto w-full max-w-[400px] flex flex-col min-h-[100svh] py-4">
        {/* Header */}
        <div className="rounded-t-[28px] bg-slate-900 px-4 pt-4 pb-4">
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={() => nav(-1)}
              className="absolute left-0 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-[#E2B13C]"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <h1 className="text-[#E2B13C] text-lg font-semibold">Item Details</h1>

            <div className="absolute right-0 rounded-full bg-white/20 px-4 py-1.5 text-sm text-[#E2B13C]">
              Table 5
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="relative h-[260px] w-full overflow-hidden bg-gradient-to-b from-indigo-500 to-purple-700">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={item.name}
              className={cn(
                "h-full w-full object-contain bg-gray-100",
                "contrast-105 saturate-110"
              )}
              loading="eager"
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/80">
              <Utensils className="h-14 w-14" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-white px-4 pt-5 pb-[140px] flex-1 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="truncate text-[22px] font-semibold text-slate-800">{item.name}</h2>

              <div className="mt-2 flex items-center gap-2 text-sm">
                <Stars value={ratingAvg} />
                <span className="text-orange-500 font-medium">({ratingCount} reviews)</span>
              </div>

              <div className="mt-2 flex items-center gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-300" />
                  Prep time: ~{item.prepTimeMinutes ?? 15} min
                </span>
                <StatusPill status={item.status} />
              </div>
            </div>

            <div className="shrink-0 text-[22px] font-bold text-slate-900">
              ${Number(item.price).toFixed(2)}
            </div>
          </div>

          {item.description ? (
            <p className="mt-4 text-[14px] leading-6 text-slate-500">{item.description}</p>
          ) : null}

          <div className="my-5 h-px bg-slate-100" />

          {/* Modifiers */}
          <div className="space-y-5">
            <div className="text-sm font-semibold text-slate-800">Modifiers</div>

            {(item.modifierGroups ?? []).length === 0 ? (
              <div className="text-sm text-slate-400">No modifiers.</div>
            ) : (
              (item.modifierGroups ?? []).map((g) => {
                const picked = selected[g._id] ?? [];
                const isSingle = g.selectionType === "single";

                return (
                  <div key={g._id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[13px] font-semibold text-slate-800">{g.name}</div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {isSingle ? "Choose 1" : "Choose multiple"}
                        {g.isRequired ? " • Required" : ""}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {g.options
                        .filter((o) => o.status === "active")
                        .map((o) => {
                          const active = picked.includes(o._id);
                          return (
                            <button
                              key={o._id}
                              type="button"
                              onClick={() => togglePick(g, o._id)}
                              className={cn(
                                "w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left",
                                active ? "border-emerald-600 bg-emerald-50" : "border-slate-200 bg-white"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs",
                                    active
                                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                                      : "border-slate-300 text-slate-300"
                                  )}
                                >
                                  {isSingle ? (active ? "●" : "○") : active ? "☑" : "☐"}
                                </span>
                                <span className="text-[13px] font-medium text-slate-700">{o.name}</span>
                              </div>

                              <span className="text-[12px] font-semibold text-slate-500">
                                {Number(o.priceAdjustment) > 0
                                  ? `+$${Number(o.priceAdjustment).toFixed(2)}`
                                  : "+$0"}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 space-y-2">
            <div className="text-sm font-semibold text-slate-800">Note</div>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="No onions please..."
              className="w-full min-h-[92px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#E64B3C]/20"
            />
          </div>

          {/* Related Items */}
          <div className="mt-6 space-y-3">
            <div className="h-px bg-slate-100" />
            <div className="text-sm font-semibold text-slate-800">Related Items</div>

            {relatedItems.length === 0 ? (
              <div className="text-sm text-slate-400">No related items.</div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {relatedItems.map((x: any) => (
                  <button
                    key={x.id}
                    type="button"
                    onClick={() => nav(`/customer/menu/${x.id}`, { state: { item: x } })}
                    className="shrink-0 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600"
                  >
                    {x.name}
                  </button>
                ))}
              </div>
            )}

            <div className="h-px bg-slate-100" />

            {/* Reviews */}
            <div className="text-sm font-semibold text-slate-800">
              Reviews
              <div className="text-xs font-normal text-gray-500">{ratingCount} review</div>
            </div>

            {reviewsLoading ? (
              <div className="text-sm text-slate-400">Loading reviews...</div>
            ) : (reviewsData?.reviews?.length ?? 0) === 0 ? (
              <div className="text-sm text-slate-400">No reviews yet.</div>
            ) : (
              <div className="space-y-3">
                {reviewsData!.reviews.map((r) => (
                  <div key={r.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <Stars value={r.rating} />
                      <span className="text-[11px] text-slate-400">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-slate-600">{r.comment || "No comment."}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="fixed inset-x-0 bottom-0 z-10">
          <div className="mx-auto w-full max-w-[400px]">
            <div className="bg-white border-t border-slate-100 px-4 py-4 shadow-[0_-10px_28px_rgba(15,23,42,0.10)]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="h-11 w-11 rounded-full border-2 border-[#E2B13C] text-[#E2B13C] font-black"
                  >
                    –
                  </button>
                  <div className="w-8 text-center text-[16px] font-semibold text-slate-800">{qty}</div>
                  <button
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    className="h-11 w-11 rounded-full border-2 border-[#E2B13C] text-[#E2B13C] font-black"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!canOrder}
                  className={cn(
                    "flex-1 h-12 rounded-2xl px-5 text-[15px] font-semibold text-[#E2B13C] shadow-sm transition active:scale-[0.99]",
                    canOrder ? "bg-slate-900" : "bg-slate-200 text-slate-500"
                  )}
                >
                  Add to Cart - ${totalPrice.toFixed(2)}
                </button>
              </div>

              {!canOrder ? (
                <div className="mt-2 text-xs text-rose-600 font-semibold">
                  This item is not available right now.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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

function Stars({ value = 0 }: { value?: number }) {
  const n = Math.max(0, Math.min(5, Math.round(Number(value || 0))));
  return (
    <span className="inline-flex items-center gap-0.5 text-orange-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn("h-4 w-4", i < n && "fill-current")} />
      ))}
    </span>
  );
}
