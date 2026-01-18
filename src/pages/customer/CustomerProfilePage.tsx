import { useEffect, useMemo, useState } from "react";
import { message, Pagination } from "antd";
import { Calendar, LogOut } from "lucide-react";
import { formatMoneyFromCents } from "../../utils/money";
import { cn } from "../../utils/cn";
import BottomNavMobileStyled from "../../components/customer/BottomNavMobileStyled";
import { useNavigate } from "react-router-dom";

function fmtTime(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return String(iso);
  return d.toLocaleString();
}

function statusBadge(st: string) {
  const s = String(st || "").toUpperCase();
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-extrabold";
  if (s === "PAID")
    return {
      text: "PAID",
      cls: cn(base, "bg-emerald-50 text-emerald-700 border-emerald-200"),
    };
  if (s === "CANCELLED")
    return {
      text: "CANCELLED",
      cls: cn(base, "bg-rose-50 text-rose-700 border-rose-200"),
    };
  if (s === "PAYMENT_PENDING")
    return {
      text: "PAYMENT PENDING",
      cls: cn(base, "bg-amber-50 text-amber-800 border-amber-200"),
    };
  if (s === "REQUESTED")
    return {
      text: "REQUESTED",
      cls: cn(base, "bg-sky-50 text-sky-800 border-sky-200"),
    };
  return {
    text: s || "—",
    cls: cn(base, "bg-slate-50 text-slate-700 border-slate-200"),
  };
}

type Preset = "today" | "yesterday" | "this_week" | "this_month" | "custom";

type MockBill = {
  billId: string;
  tableNumber?: string | number;
  totalCents: number;
  status: "PAID" | "REQUESTED" | "PAYMENT_PENDING" | "CANCELLED";
  method?: "ONLINE" | "CASH";
  createdAt?: string;
  requestedAt?: string;
  paidAt?: string;
};

const MOCK_BILLS: MockBill[] = [
  {
    billId: "ededbbf6fd",
    tableNumber: 6,
    totalCents: 800,
    status: "PAID",
    method: "ONLINE",
    paidAt: "2026-01-16T15:25:51.000Z",
  },
  {
    billId: "ededbdbe38",
    tableNumber: 6,
    totalCents: 1600,
    status: "PAID",
    method: "CASH",
    paidAt: "2026-01-16T15:23:02.000Z",
  },
];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
function startOfWeekMonday(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day + 6) % 7;
  x.setDate(x.getDate() - diff);
  return startOfDay(x);
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function pickWhen(b: MockBill) {
  return b.paidAt || b.requestedAt || b.createdAt || null;
}

function inRange(iso: string, from: Date, to: Date) {
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && t >= from.getTime() && t <= to.getTime();
}

export default function CustomerProfilePage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [allBills, setAllBills] = useState<MockBill[]>([]);
  const [total, setTotal] = useState(0);

  const [preset, setPreset] = useState<Preset>("today");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  function load() {
    setLoading(true);
    setErr(null);

    try {
      setAllBills(MOCK_BILLS);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load bills");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredBills = useMemo(() => {
    const now = new Date();

    let rangeFrom: Date | null = null;
    let rangeTo: Date | null = null;

    if (preset === "today") {
      rangeFrom = startOfDay(now);
      rangeTo = endOfDay(now);
    } else if (preset === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      rangeFrom = startOfDay(y);
      rangeTo = endOfDay(y);
    } else if (preset === "this_week") {
      rangeFrom = startOfWeekMonday(now);
      rangeTo = endOfDay(now);
    } else if (preset === "this_month") {
      rangeFrom = startOfMonth(now);
      rangeTo = endOfDay(now);
    } else if (preset === "custom") {
      if (from) rangeFrom = startOfDay(new Date(from));
      if (to) rangeTo = endOfDay(new Date(to));
    }

    const xs = (allBills ?? []).filter((b) => {
      const when = pickWhen(b);
      if (!when) return false;

      if (!rangeFrom && !rangeTo) return true;
      if (rangeFrom && !rangeTo) return inRange(when, rangeFrom, endOfDay(new Date(8640000000000000)));
      if (!rangeFrom && rangeTo) return inRange(when, startOfDay(new Date(-8640000000000000)), rangeTo);
      return inRange(when, rangeFrom!, rangeTo!);
    });

    xs.sort((a, b) => {
      const ta = new Date(pickWhen(a) || 0).getTime();
      const tb = new Date(pickWhen(b) || 0).getTime();
      return tb - ta;
    });

    return xs;
  }, [allBills, preset, from, to]);

  useEffect(() => {
    setTotal(filteredBills.length);
    setPage(1);
  }, [preset, from, to]);

  const bills = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredBills.slice(start, start + limit);
  }, [filteredBills, page, limit]);

  const stats = useMemo(() => {
    const paidCount = bills.filter((b) => String(b.status).toUpperCase() === "PAID").length;
    const pendingCount = bills.filter((b) =>
      ["REQUESTED", "PAYMENT_PENDING"].includes(String(b.status).toUpperCase())
    ).length;
    const sumPaid = bills
      .filter((b) => String(b.status).toUpperCase() === "PAID")
      .reduce((s, b) => s + Number(b.totalCents || 0), 0);

    return { paidCount, pendingCount, sumPaid };
  }, [bills]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[400px] bg-slate-100 border border-slate-100 shadow-sm px-4 pb-8 pt-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xl font-extrabold text-slate-900">Profile</div>
          </div>

          <button
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-extrabold text-[#E2B13C] hover:bg-slate-800 active:scale-[0.98] transition"
            onClick={() => {
              nav("/customer/login");
              message.success("Logged out");
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        {/* summary */}
        <div className="overflow-hidden rounded-[24px] bg-white border border-slate-200 shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold text-slate-900">Your Bills</div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-bold text-slate-500">Total (page)</div>
                <div className="mt-1 text-base font-extrabold text-slate-900">{bills.length}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-bold text-slate-500">Paid</div>
                <div className="mt-1 text-base font-extrabold text-slate-900">{stats.paidCount}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-bold text-slate-500">Pending</div>
                <div className="mt-1 text-base font-extrabold text-slate-900">{stats.pendingCount}</div>
              </div>
            </div>

            <div className="mt-3 rounded-2xl bg-slate-900 text-[#E2B13C] px-4 py-3">
              <div className="text-[11px] font-bold text-[#E2B13C]/80">Paid Total (page)</div>
              <div className="mt-1 text-lg font-extrabold text-[#E2B13C]">
                {formatMoneyFromCents(stats.sumPaid)}
              </div>
            </div>
          </div>
        </div>

        {/* filters */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <Calendar className="h-4 w-4" />
            Filters
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-500">Date range</div>

            <select
              value={preset}
              onChange={(e) => {
                setPreset(e.target.value as Preset);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-slate-800 outline-none"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This week</option>
              <option value="this_month">This month</option>
              <option value="custom">Custom range</option>
            </select>
          </div>

          {preset === "custom" ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[11px] font-bold text-slate-500 mb-1">From</div>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none"
                />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 mb-1">To</div>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none"
                />
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-slate-500">Page size</div>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* states */}
        {loading ? (
          <div className="rounded-[24px] border bg-white p-4 text-sm text-slate-600 shadow-sm">
            Loading bills...
          </div>
        ) : err ? (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {err}
          </div>
        ) : bills.length === 0 ? (
          <div className="rounded-[24px] border bg-white p-4 text-sm text-slate-600 shadow-sm">
            You don’t have any bills in this range.
          </div>
        ) : (
          <div className="space-y-3">
            {bills.map((b) => {
              const st = statusBadge(b.status);
              const when = pickWhen(b);

              return (
                <div key={b.billId} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-slate-900">
                        Table {b.tableNumber ?? "—"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Bill: <span className="font-mono">{String(b.billId)}</span>
                      </div>
                      {when ? <div className="mt-1 text-xs text-slate-500">{fmtTime(when)}</div> : null}
                    </div>

                    <div className="text-right">
                      <div className="text-base font-extrabold text-slate-900">
                        {formatMoneyFromCents(b.totalCents ?? 0)}
                      </div>
                      <div className="mt-1 flex items-center justify-end gap-2">
                        <span className={st.cls}>{st.text}</span>
                        {b.method ? (
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-extrabold text-slate-700">
                            {b.method}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="pt-2">
              <Pagination
                current={page}
                pageSize={limit}
                total={total}
                onChange={(p) => setPage(p)}
                showSizeChanger={false}
              />
            </div>
          </div>
        )}
      </div>
      <BottomNavMobileStyled cartCount={0}/>
    </div>
  );
}
