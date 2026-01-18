import { useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Minus,
  Plus,
  Trash2,
  Receipt,
  NotebookPen,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import BottomNavMobileStyled from "../../components/customer/BottomNavMobileStyled";

function formatMoneyFromCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

type CartMod = { label: string; value: string };
type CartLine = {
  id: string;
  name: string;
  photoUrl?: string | null;
  qty: number;
  unitPriceCents: number;
  meta?: CartMod[];
  note?: string;
};

export default function CustomerCartPage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const table = sp.get("table") || "";
  const token = sp.get("token") || "";
  const q = `?table=${encodeURIComponent(table)}&token=${encodeURIComponent(token)}`;

  const [lines, setLines] = useState<CartLine[]>([
    {
      id: "wine",
      name: "Red Wine",
      photoUrl:
        "https://images.unsplash.com/photo-1510626176961-4b57d4fbad03?auto=format&fit=crop&w=400&q=60",
      qty: 1,
      unitPriceCents: 800,
    },
    {
      id: "salmon",
      name: "Grilled Salmon",
      photoUrl:
        "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&q=60",
      qty: 1,
      unitPriceCents: 2450,
      meta: [
        { label: "Size", value: "Small" },
        { label: "Extras", value: "Extra sauce, Side salad" },
      ],
      note: "No onion please",
    },
  ]);

  const [orderNote, setOrderNote] = useState("");

  const subtotal = useMemo(
    () => lines.reduce((s, x) => s + x.unitPriceCents * x.qty, 0),
    [lines]
  );
  const serviceFee = 0;
  const total = subtotal + serviceFee;

  const cartCount = useMemo(() => lines.reduce((s, x) => s + x.qty, 0), [lines]);

  function inc(id: string) {
    setLines((prev) => prev.map((x) => (x.id === id ? { ...x, qty: x.qty + 1 } : x)));
  }
  function dec(id: string) {
    setLines((prev) =>
      prev.map((x) => (x.id === id ? { ...x, qty: Math.max(1, x.qty - 1) } : x))
    );
  }
  function remove(id: string) {
    setLines((prev) => prev.filter((x) => x.id !== id));
  }

  const disabled = lines.length === 0;

  return (
    <div className="min-h-[100svh] bg-[#EEF1F5] flex flex-col">
      <div className="mx-auto w-full max-w-[400px] py-4 flex flex-col flex-1">
        {/* Header */}
        <div className="rounded-t-[28px] bg-slate-900 px-4 pt-4 pb-5">
          <div className="relative flex items-center justify-center">
            <div className="absolute left-0 inline-flex h-10 w-10 items-center justify-center" />
            <h1 className="text-[#E2B13C] text-lg font-semibold">Your Cart</h1>

            <div className="absolute right-0 rounded-full px-4 py-1.5 text-sm text-[#E2B13C]">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                Table
              </span>
              <span className="text-lg font-black text-[#E2B13C] leading-none">#1</span>
            </div>
          </div>
        </div>

        {/* White content */}
        <div className="bg-white px-4 pt-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] flex flex-col flex-1">
          {/* Empty */}
          {lines.length === 0 ? (
            <div className="mt-3 rounded-2xl bg-[#F7F8FA] p-4 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-sm">
                  <AlertCircle className="h-5 w-5 text-slate-700" />
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-slate-900">Cart empty</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Add items from Menu to start ordering.
                  </div>

                  <Link
                    to={`/customer/menu${q}`}
                    className="mt-3 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-black tracking-widest uppercase text-[#E2B13C] active:scale-[0.99]"
                  >
                    Browse Menu
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Items */}
              <div className="mt-2 space-y-3 pb-3">
                {lines.map((x) => (
                  <div
                    key={x.id}
                    className="rounded-[26px] border border-slate-100 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
                  >
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="h-20 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                        {x.photoUrl ? (
                          <img src={x.photoUrl} className="h-full w-full object-cover" alt={x.name} />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-400">
                            <ImageIcon className="h-6 w-6 opacity-40" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-extrabold text-slate-900">
                              {x.name}
                            </div>

                            {/* Meta like screenshot */}
                            {x.meta?.length ? (
                              <div className="mt-1 space-y-1 text-xs text-slate-600">
                                {x.meta.map((m, idx) => (
                                  <div key={idx} className="truncate">
                                    <span className="font-semibold text-slate-700">{m.label}:</span>{" "}
                                    <span className="text-slate-600">{m.value}</span>
                                  </div>
                                ))}
                              </div>
                            ) : null}

                            {x.note ? (
                              <div className="mt-1 truncate text-xs text-slate-500">
                                <span className="font-semibold text-slate-700">Note:</span> “{x.note}”
                              </div>
                            ) : null}
                          </div>

                          <button
                            onClick={() => remove(x.id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-rose-50 hover:text-rose-600 active:scale-[0.99]"
                            title="Remove"
                            aria-label="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          {/* Qty */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => dec(x.id)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 active:scale-[0.99]"
                              aria-label="Decrease"
                            >
                              <Minus className="h-4 w-4" />
                            </button>

                            <div className="w-8 text-center text-sm font-extrabold text-slate-900">
                              {x.qty}
                            </div>

                            <button
                              onClick={() => inc(x.id)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 active:scale-[0.99]"
                              aria-label="Increase"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-sm font-extrabold text-emerald-700">
                            {formatMoneyFromCents(x.unitPriceCents * x.qty)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order note */}
              <div className="rounded-[26px] border border-slate-100 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-900">
                  <NotebookPen className="h-4 w-4" />
                  Special Instructions
                </div>

                <textarea
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="e.g. less spicy, no onion..."
                  className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  rows={3}
                />
              </div>
            </>
          )}

          <div className="mt-4 rounded-[26px] border-slate-100 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <Receipt className="h-4 w-4 text-slate-900" />
                Summary
              </div>
              <div className="text-xs font-bold text-slate-500">
                {cartCount} item{cartCount !== 1 ? "s" : ""}
              </div>
            </div>

            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Subtotal</span>
                <span className="font-semibold text-slate-700">{formatMoneyFromCents(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Service fee</span>
                <span className="font-semibold text-slate-700">{formatMoneyFromCents(serviceFee)}</span>
              </div>
              <div className="my-2 h-px bg-white/10" />
              <div className="flex items-center justify-between text-base font-black">
                <span className="text-slate-900">Total</span>
                <span className="text-emerald-700">{formatMoneyFromCents(total)}</span>
              </div>
            </div>
          </div>

          {/* CTA sticky-ish inside content (optional feel like mobile) */}
          {!disabled ? (
            <div className="mt-4 pb-4">
              <button
                onClick={() => nav('/customer/orders')}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black tracking-widest uppercase text-[#E2B13C] shadow-[0_12px_26px_rgba(15,23,42,0.22)] active:scale-[0.99]"
              >
                Place Order
              </button>
            </div>
          ) : null}
        </div>

        <div className="h-12 w-12"></div>

        <BottomNavMobileStyled cartCount={cartCount} />

      </div>
    </div>
  );
}