import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { cn } from "../../../utils/cn";
import { formatMoneyFromCents } from "../../../utils/money";
import { Input, Select } from "antd";
import { listStaffBillsForMonitorApi, type StaffBillRow } from "../../../api/staff/staff.bills";
import { RefreshCw, Search } from "lucide-react";

function billPillClass(status: string) {
  const s = String(status || "").toUpperCase();
  if (s === "PAID") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s.includes("PENDING")) return "bg-amber-50 text-amber-800 border-amber-200";
  if (s.includes("REQUEST")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

type BillTab = "ALL" | "REQUESTED" | "PAYMENT_PENDING" | "PAID";

export default function MonitorWaiterBillsPage() {
  const [billStatusTab, setBillStatusTab] = useState<BillTab>("ALL");
  const [billQ, setBillQ] = useState("");

  const [bills, setBills] = useState<StaffBillRow[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [billsErr, setBillsErr] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // avoid stale closure when socket triggers refresh
  const tabRef = useRef<BillTab>("ALL");
  const qRef = useRef<string>("");
  useEffect(() => {
    tabRef.current = billStatusTab;
  }, [billStatusTab]);
  useEffect(() => {
    qRef.current = billQ;
  }, [billQ]);

  function mapBillStatus(tab: BillTab) {
    if (tab === "REQUESTED") return "REQUESTED";
    if (tab === "PAYMENT_PENDING") return "PAYMENT_PENDING";
    if (tab === "PAID") return "PAID";
    return undefined;
  }

  async function loadBills(opts?: { silent?: boolean }) {
    const silent = !!opts?.silent;
    try {
      setBillsErr(null);
      if (!silent) setLoadingBills(true);

      const status = mapBillStatus(tabRef.current);
      const q = (qRef.current || "").trim() || undefined;

      const data = await listStaffBillsForMonitorApi({ status, q });
      setBills(data || []);
    } catch (e: any) {
      setBillsErr(e?.message || "Load bills failed");
    } finally {
      if (!silent) setLoadingBills(false);
    }
  }

  useEffect(() => {
    loadBills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billStatusTab]);

  // socket: connect once
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
      } catch {}
      socketRef.current = null;
    }

    const wsUrl = import.meta.env.VITE_STAFF_WS_URL || "http://localhost:3001/ws";
    const socket = io(wsUrl, { auth: { token }, transports: ["websocket"] });
    socketRef.current = socket;

    const refreshBills = () => loadBills({ silent: true });

    socket.on("bill.paid", refreshBills);
    socket.on("bill.requested", refreshBills);
    socket.on("bill.accepted", refreshBills);
    socket.on("session.closed", refreshBills);

    return () => {
      try {
        socket.off("bill.paid", refreshBills);
        socket.off("bill.requested", refreshBills);
        socket.off("bill.accepted", refreshBills);
        socket.off("session.closed", refreshBills);
        socket.disconnect();
      } catch {}
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function BillCard({ r }: { r: StaffBillRow }) {
    const st = String(r.status || "").toUpperCase();

    return (
      <div className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-extrabold text-slate-900">Table {r.tableNumber ?? "?"}</div>

              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-extrabold",
                  billPillClass(r.status)
                )}
              >
                {st}
              </span>

              {r.paidMethod ? (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-extrabold text-slate-700">
                  {r.paidMethod}
                </span>
              ) : null}
            </div>

            <div className="mt-1 text-xs text-slate-500">
              <span className="font-mono">billId:</span> <span className="font-mono text-slate-700">{r.billId}</span>
            </div>

            <div className="mt-1 text-xs text-slate-500">
              <span className="font-mono">sessionId:</span> <span className="font-mono text-slate-700">{r.sessionId}</span>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-sm font-extrabold text-slate-900">{formatMoneyFromCents(r.totalCents || 0)}</div>
            <div className="text-xs text-slate-500">{r.paidAt ? `Paid at ${new Date(r.paidAt).toLocaleString()}` : "—"}</div>
          </div>
        </div>

        {/* View-only */}
        <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
          View-only (Admin Monitor)
        </div>
      </div>
    );
  }

  const tabOptions = useMemo(
    () => [
      { value: "ALL", label: "All" },
      { value: "REQUESTED", label: "Requested" },
      { value: "PAYMENT_PENDING", label: "Payment pending" },
      { value: "PAID", label: "Paid" },
    ],
    []
  );

  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-4">
      {billsErr ? (
        <div className="mb-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {billsErr}
        </div>
      ) : null}

      <div className="mb-3 rounded-[24px] border border-slate-100 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Select
              value={billStatusTab}
              onChange={(v) => setBillStatusTab(v as BillTab)}
              style={{ width: 190 }}
              options={tabOptions}
            />
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={billQ}
              onChange={(e) => setBillQ(e.target.value)}
              onPressEnter={() => loadBills()}
              placeholder="Search bill/session/table..."
              prefix={<Search className="h-4 w-4 text-slate-400" />}
              allowClear
            />
            <button
              onClick={() => loadBills()}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-sm font-extrabold text-white hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {loadingBills ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600 shadow-sm">Loading bills…</div>
      ) : bills.length === 0 ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600 shadow-sm">No bills found.</div>
      ) : (
        <div className="space-y-3">
          {bills.map((r) => (
            <BillCard key={r.billId} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}
