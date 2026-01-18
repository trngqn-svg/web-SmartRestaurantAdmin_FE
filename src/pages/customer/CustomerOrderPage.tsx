import { useMemo } from "react";
import { cn } from "../../utils/cn";
import { formatMoneyFromCents } from "../../utils/money";
import { Utensils, Receipt } from "lucide-react";
import BottomNavMobileStyled from "../../components/customer/BottomNavMobileStyled";
import { useNavigate } from "react-router-dom";

type LineStatus = "queued" | "preparing" | "ready" | "served" | "cancelled";
type OrderStatus = "received" | "preparing" | "ready";

type MockLine = {
  lineId: string;
  qty: number;
  nameSnapshot: string;
  status: LineStatus;
  modifiers?: Array<{ name: string; priceAdjustmentCents?: number }>;
  note?: string;
};

type MockOrder = {
  orderId: string;
  createdAt: string;
  status: OrderStatus;
  note?: string;
  items: MockLine[];
  totalCents: number;
};

function statusLabel(s: OrderStatus) {
  switch (s) {
    case "received":
      return "Received";
    case "preparing":
      return "Preparing";
    case "ready":
      return "Ready";
    default:
      return s;
  }
}

function statusPillClass(s: OrderStatus) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border";
  if (s === "received") return cn(base, "bg-slate-50 text-slate-700 border-slate-200");
  if (s === "preparing") return cn(base, "bg-amber-50 text-amber-700 border-amber-100");
  if (s === "ready") return cn(base, "bg-emerald-100 text-emerald-800 border-emerald-100");
  return cn(base, "bg-slate-50 text-slate-700 border-slate-200");
}

function lineStatusLabel(s: LineStatus) {
  switch (s) {
    case "queued":
      return "Queued";
    case "preparing":
      return "Cooking";
    case "ready":
      return "Ready";
    case "served":
      return "Served";
    case "cancelled":
      return "Cancelled";
    default:
      return s;
  }
}

function linePillClass(s: LineStatus) {
  const base = "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border";
  if (s === "queued") return cn(base, "bg-slate-100 text-slate-600 border-slate-100");
  if (s === "preparing") return cn(base, "bg-amber-50 text-amber-700 border-amber-100");
  if (s === "ready") return cn(base, "bg-emerald-100 text-emerald-800 border-emerald-100");
  if (s === "served") return cn(base, "bg-slate-100 text-slate-700 border-slate-200");
  if (s === "cancelled") return cn(base, "bg-rose-50 text-rose-700 border-rose-100");
  return cn(base, "bg-slate-50 text-slate-700 border-slate-200");
}

function fmtAgo(iso: string) {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  return `${days} days ago`;
}

function orderStepState(orderStatus: OrderStatus) {
  const s = String(orderStatus || "").toLowerCase();
  const receivedDone = true;
  const preparingDone = s === "preparing" || s === "ready";
  const readyDone = s === "ready";
  const preparingActive = s === "preparing";
  const readyActive = s === "ready";
  const receivedActive = s === "received";
  return { receivedDone, preparingDone, readyDone, receivedActive, preparingActive, readyActive };
}

function StepDot({ done, active, label }: { done: boolean; active: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "grid h-10 w-10 place-items-center rounded-full border",
          done && !active
            ? "border-emerald-500 bg-emerald-500 text-white"
            : active
            ? "border-rose-500 bg-rose-500 text-white"
            : "border-slate-200 bg-slate-100 text-slate-400"
        )}
      >
        {done && !active ? "✓" : "•"}
      </div>
      <div className={cn("text-xs font-semibold", done || active ? "text-slate-900" : "text-slate-400")}>{label}</div>
    </div>
  );
}

function StepLine({ on }: { on: boolean }) {
  return (
    <div className="flex-1 px-2">
      <div className={cn("h-1 rounded-full", on ? "bg-emerald-500" : "bg-slate-200")} />
    </div>
  );
}

const now = Date.now();
const mockOrders: MockOrder[] = [
  {
    orderId: "a9",
    createdAt: new Date(now - 20 * 1000).toISOString(),
    status: "received",
    note: "No peanuts please.",
    items: [
      { lineId: "l1", qty: 1, nameSnapshot: "Red Wine", status: "queued" },
      {
        lineId: "l2",
        qty: 1,
        nameSnapshot: "Grilled Salmon",
        status: "queued",
        modifiers: [
          { name: "Medium rare", priceAdjustmentCents: 0 },
          { name: "Extra lemon", priceAdjustmentCents: 50 },
        ],
      },
    ],
    totalCents: 3250,
  },
  {
    orderId: "b4",
    createdAt: new Date(now - 7 * 60 * 1000).toISOString(),
    status: "preparing",
    note: "Bring cutlery later.",
    items: [
      {
        lineId: "l3",
        qty: 2,
        nameSnapshot: "Beef Burger",
        status: "preparing",
        modifiers: [
          { name: "No onion", priceAdjustmentCents: 0 },
          { name: "Add cheese", priceAdjustmentCents: 150 },
        ],
      },
      { lineId: "l4", qty: 1, nameSnapshot: "French Fries", status: "queued", modifiers: [{ name: "Large", priceAdjustmentCents: 100 }] },
    ],
    totalCents: 4290,
  },
  {
    orderId: "c2",
    createdAt: new Date(now - 38 * 60 * 1000).toISOString(),
    status: "ready",
    items: [
      { lineId: "l5", qty: 1, nameSnapshot: "Margherita Pizza", status: "ready" },
      { lineId: "l6", qty: 1, nameSnapshot: "Iced Tea", status: "ready", modifiers: [{ name: "Less sugar", priceAdjustmentCents: 0 }] },
    ],
    totalCents: 5100,
  },
];

export default function CustomerOrderPage() {
  const nav = useNavigate();
  const orders = mockOrders;

  const totalAll = useMemo(() => orders.reduce((s, o) => s + (o.totalCents || 0), 0), [orders]);
  const totalItems = useMemo(() => {
    let n = 0;
    for (const o of orders) for (const it of o.items ?? []) n += Number(it.qty || 0);
    return n;
  }, [orders]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[400px] bg-slate-100 border border-slate-200 shadow-sm px-4 pb-8 pt-4 space-y-4">
        {/* Summary header (like screenshot) */}
        <div className="overflow-hidden rounded-[28px] bg-slate-600 text-white shadow-sm">
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm/5 font-medium text-white/85">Current Session Total</div>
                <div className="mt-1 text-4xl font-extrabold tracking-tight">{formatMoneyFromCents(totalAll)}</div>
              </div>

              <button
                className={cn(
                  "shrink-0 rounded-full px-5 py-2.5 text-sm font-extrabold shadow-sm active:scale-[0.99]",
                  "bg-slate-800 text-[#E2B13C] hover:opacity-90"
                )}
                onClick={() => nav("/customer/bill")}
              >
                Request Bill
              </button>
            </div>
          </div>

          <div className="border-t border-white/20 px-5 py-3">
            <div className="flex items-center gap-5 text-sm font-semibold text-white/90">
              <div className="inline-flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                <span>{orders.length} Orders</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <Utensils className="h-4 w-4" />
                <span>{totalItems} Items</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="flex items-center justify-between">
          <button 
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-[#E2B13C]" 
            onClick={() => nav("/customer/menu")}
          >
            + Add more
          </button>
        </div>

        {/* Orders list */}
        <div className="space-y-4">
          {orders.map((o) => {
            const st = o.status;
            const step = orderStepState(st);

            const isReady = st === "ready";
            const isPreparing = st === "preparing";
            const isReceived = st === "received";

            return (
              <div key={o.orderId} className="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <div className="text-lg font-extrabold text-slate-900">Order #{o.orderId}</div>
                      <div className="text-sm font-medium text-slate-500">{fmtAgo(o.createdAt)}</div>
                    </div>

                    {o.note ? (
                      <div className="mt-1 line-clamp-1 text-xs font-medium text-slate-500">
                        <span className="font-semibold text-slate-700">Note:</span> {o.note}
                      </div>
                    ) : null}
                  </div>

                  <span className={statusPillClass(st)}>{statusLabel(st)}</span>
                </div>

                <div className="border-t border-slate-100" />

                <div className="px-5 py-5">
                  <div className="flex items-center">
                    <StepDot done={step.receivedDone} active={isReceived} label="Received" />
                    <StepLine on={step.preparingDone || step.preparingActive} />
                    <StepDot done={step.preparingDone} active={isPreparing} label="Preparing" />
                    <StepLine on={step.readyDone || step.readyActive} />
                    <StepDot done={step.readyDone} active={isReady} label="Ready" />
                  </div>

                  {isReady ? (
                    <div className="mt-5 rounded-2xl bg-emerald-100 px-4 py-4 text-emerald-900">
                      <div className="text-sm font-extrabold">Ready to serve.</div>
                      <div className="mt-1 text-xs font-semibold text-emerald-900/80">Tip: notify waiter to deliver.</div>
                    </div>
                  ) : null}
                </div>

                <div className="border-t border-slate-100" />

                <div className="px-5 py-4">
                  <div className="space-y-3">
                    {(o.items ?? []).map((it) => {
                      const lineSt = it.status;
                      return (
                        <div key={it.lineId} className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <div className="shrink-0 text-sm font-extrabold text-rose-600">{it.qty}x</div>
                              <div className="truncate text-sm font-semibold text-slate-900">{it.nameSnapshot}</div>
                            </div>

                            {/* line note */}
                            {it.note ? (
                              <div className="mt-1 pl-[34px] text-xs font-medium text-slate-500">
                                <span className="font-semibold text-slate-700">Line note:</span> {it.note}
                              </div>
                            ) : null}
                          </div>

                          <span className={linePillClass(lineSt)}>{lineStatusLabel(lineSt)}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 border-t border-dashed border-slate-200 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-extrabold text-slate-900">Order Total</div>
                      <div className="text-sm font-extrabold text-slate-900">{formatMoneyFromCents(o.totalCents)}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="h-5"></div>

        <BottomNavMobileStyled cartCount={0}/>
      </div>
    </div>
  );
}
