import { useMemo, useState } from "react";
import { formatMoneyFromCents } from "../../utils/money";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Banknote } from 'lucide-react';

type BillStatus = "REQUESTED" | "PAYMENT_PENDING" | "PAID" | "CANCELLED";

type BillLine = {
  key: string;
  name: string;
  qty: number;
  lineTotalCents: number;
};

type MockBill = {
  billId: string;
  tableNumber: string;
  status: BillStatus;
  method: "CASH" | "ONLINE" | null;
  createdAt: string;
  requestedAt?: string | null;
  paidAt?: string | null;
  servedLines: BillLine[];
};

export default function CustomerBillPage() {
  const nav = useNavigate();
  const [bill] = useState<MockBill>(() => ({
    billId: "bill_9f8a2b",
    tableNumber: "12",
    status: "REQUESTED",
    method: null,
    createdAt: new Date().toISOString(),
    requestedAt: new Date().toISOString(),
    paidAt: null,
    servedLines: [
      { key: "o_a9:l1", name: "Red Wine", qty: 1, lineTotalCents: 800 },
      { key: "o_a9:l2", name: "Grilled Salmon", qty: 1, lineTotalCents: 2450 },
    ],
  }));

  const totalCents = useMemo(
    () => bill.servedLines.reduce((s, x) => s + (x.lineTotalCents || 0), 0),
    [bill.servedLines]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[400px] bg-slate-100 border border-slate-200 shadow-sm px-4 pt-4 space-y-4">
        {/* Top small admin header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => nav(-1)}
            className="rounded-xl bg-white flex items-center gap-1 px-3 py-2 text-sm font-semibold text-slate-900 border border-slate-200"
          >
            <ArrowLeft className="h-4 w-4"/> 
            <p>Back</p>
          </button>
        </div>

        {/* Served items card */}
        <div className="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="text-base font-extrabold text-slate-900">Served items</div>
            <div className="text-sm text-slate-500">Only items marked “served” are included.</div>
          </div>

          <div className="px-5 py-4 space-y-3">
            {bill.servedLines.map((x) => (
              <div key={x.key} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900">
                    {x.qty}× {x.name}
                  </div>
                </div>
                <div className="shrink-0 text-sm font-extrabold text-slate-900">
                  {formatMoneyFromCents(x.lineTotalCents)}
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-dashed border-slate-200">
              <div className="flex items-center justify-between">
                <div className="text-sm font-extrabold text-slate-900">Total</div>
                <div className="text-sm font-extrabold text-emerald-700">
                  {formatMoneyFromCents(totalCents)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="text-base font-extrabold text-slate-900">Payment method</div>
            <div className="text-sm text-slate-500">Mock images are for demo.</div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="text-base font-extrabold text-slate-900">Payment method</div>
              <div className="text-sm text-slate-500">Mock UI • selection only.</div>
            </div>

            <div className="px-5 py-4 space-y-3">
              {/* ONLINE (selected) */}
              <div className="w-full rounded-2xl border border-slate-900 bg-slate-900 text-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-extrabold">Online payment</div>
                      <div className="text-xs text-white/80">Pay by card / QR (mock)</div>
                    </div>
                  </div>

                  {/* selection indicator */}
                  <div className="shrink-0 h-5 w-5 rounded-full border-2 border-[#E2B13C] grid place-items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#E2B13C]" />
                  </div>
                </div>
              </div>

              {/* CASH (not selected) */}
              <div className="w-full rounded-2xl border border-slate-200 bg-white text-slate-900 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100">
                      <Banknote className="h-5 w-5 text-slate-700" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-extrabold">Cash</div>
                      <div className="text-xs text-slate-500">Pay at the counter, staff will confirm</div>
                    </div>
                  </div>

                  {/* selection indicator */}
                  <div className="shrink-0 h-5 w-5 rounded-full border-2 border-slate-300" />
                </div>
              </div>

              {/* Pay button */}
              <button
                type="button"
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold tracking-tight shadow-sm bg-emerald-600 text-white hover:bg-emerald-500 active:scale-[0.99]"
              >
                Pay
              </button>
            </div>
          </div>
        </div>
        <div className="h-3"></div>
      </div>
    </div>
  );
}
