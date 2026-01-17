// OrderPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import {
  Search,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";

import type { StaffOrder } from "../../api/staff/staff.orders";
import { listStaffOrdersForMonitorApi } from "../../api/staff/staff.orders";
import { connectStaffSocket } from "../../ws/staffSocket";

type TabKey =
  | "all"
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "ready_to_service"
  | "served"
  | "cancelled";

type DatePreset = "all" | "today" | "yesterday" | "this_week" | "this_month";

type PagedRes = {
  ok: true;
  total: number;
  page: number;
  limit: number;
  orders: StaffOrder[];
};

function normalizeOrdersResponse(x: any): PagedRes {
  // backward compatible: API cũ trả StaffOrder[]
  if (Array.isArray(x)) {
    return { ok: true, total: x.length, page: 1, limit: x.length || 20, orders: x };
  }
  if (x && Array.isArray(x.orders)) return x as PagedRes;
  return { ok: true, total: 0, page: 1, limit: 20, orders: [] };
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "pending"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : status === "accepted"
      ? "bg-blue-50 text-blue-800 border-blue-200"
      : status === "preparing"
      ? "bg-purple-50 text-purple-800 border-purple-200"
      : status === "ready" || status === "ready_to_service"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : status === "served"
      ? "bg-slate-100 text-slate-800 border-slate-200"
      : "bg-rose-50 text-rose-800 border-rose-200";

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black border ${cls}`}
    >
      {status}
    </span>
  );
}

export default function OrderPage() {
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [total, setTotal] = useState(0);

  const [tab, setTab] = useState<TabKey>("all");
  const [preset, setPreset] = useState<DatePreset>("today");
  const [q, setQ] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const fetchOrders = async (opts?: { silent?: boolean }) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    if (!opts?.silent) setLoading(true);
    setErr(null);

    try {
      const resAny = await listStaffOrdersForMonitorApi({
        status: tab === "all" ? undefined : tab,
        q: q.trim() || undefined,
        datePreset: preset === "all" ? undefined : preset,
        page,
        limit,
        signal: ac.signal,
      } as any); // (as any) để không bị kẹt nếu bạn chưa update type args

      const res = normalizeOrdersResponse(resAny);
      setOrders(res.orders ?? []);
      setTotal(res.total ?? 0);

      // nếu server trả page khác thì sync (optional)
      if (typeof (res as any).page === "number") setPage((res as any).page);
      if (typeof (res as any).limit === "number") setLimit((res as any).limit);
    } catch (e: any) {
      if (String(e?.name) !== "AbortError") {
        setErr(e?.message ?? "Failed to load orders");
      }
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  // initial + refetch when paging changes
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  // reset page when filters change
  useEffect(() => {
    setPage(1);
    // fetch will run by effect [page,limit]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, preset]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      // fetch runs by page effect
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  // realtime
  useEffect(() => {
    if (!socketRef.current) socketRef.current = connectStaffSocket();
    const s = socketRef.current;

    const onOrderStatusChanged = (p: any) => {
      // payload: { orderId, status }
      setOrders((prev) => {
        const idx = prev.findIndex((x) => String(x.orderId) === String(p.orderId));
        if (idx < 0) return prev;

        const next = [...prev];
        next[idx] = { ...next[idx], status: p.status ?? next[idx].status };
        return next;
      });
    };

    const onLineStatusChanged = (p: any) => {
      // payload: { orderId, lineId, status, orderStatus? }
      setOrders((prev) => {
        const idx = prev.findIndex((x) => String(x.orderId) === String(p.orderId));
        if (idx < 0) return prev;

        const o = prev[idx];
        const items = (o.items ?? []).map((it: any) =>
          String(it.lineId) === String(p.lineId)
            ? { ...it, status: p.status ?? it.status }
            : it
        );

        const next = [...prev];
        next[idx] = { ...o, status: p.orderStatus ?? o.status, items };
        return next;
      });
    };

    s.on("order.status_changed", onOrderStatusChanged);
    s.on("order.line_status_changed", onLineStatusChanged);

    return () => {
      s.off("order.status_changed", onOrderStatusChanged);
      s.off("order.line_status_changed", onLineStatusChanged);
    };
  }, []);

  const tabs: Array<{ key: TabKey; label: string }> = useMemo(
    () => [
      { key: "all", label: "All" },
      { key: "pending", label: "Pending" },
      { key: "accepted", label: "Accepted" },
      { key: "preparing", label: "Preparing" },
      { key: "ready", label: "Ready" },
      { key: "ready_to_service", label: "To Serve" },
      { key: "served", label: "Served" },
      { key: "cancelled", label: "Cancelled" },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Orders Monitor
          </h1>
          <p className="text-slate-500 font-medium">
            Filter by status, table, date — with paging & realtime
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-[340px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search table, note, item name..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {/* Date preset */}
          <div className="relative">
            <CalendarDays
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as DatePreset)}
              className="rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm font-bold text-slate-800 shadow-sm"
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This week</option>
              <option value="this_month">This month</option>
            </select>
          </div>

          <button
            onClick={() => fetchOrders()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 shadow-sm"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              "px-4 py-2 rounded-full text-sm font-bold border transition",
              tab === t.key
                ? "bg-[#1A2F2F] text-white border-[#1A2F2F]"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-sm font-bold text-slate-700">
            {loading ? "Loading..." : `Showing ${orders.length} / ${total} orders`}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Page size</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {err ? (
          <div className="p-6">
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {err}
            </div>
          </div>
        ) : loading ? (
          <div className="py-16 text-center text-slate-500 font-semibold">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-slate-500 font-semibold">
            No orders
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((o: any) => (
              <div key={o.orderId} className="p-6 hover:bg-slate-50/60 transition">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-base font-extrabold text-slate-900">
                        Table {o.tableNumber ?? "?"}
                      </div>
                      <StatusPill status={o.status} />
                      {o.submittedAt ? (
                        <span className="text-xs font-bold text-slate-500">
                          {new Date(o.submittedAt).toLocaleString()}
                        </span>
                      ) : null}
                    </div>

                    <div className="text-xs font-semibold text-slate-500">
                      Order #{String(o.orderId).slice(-8)} • Total:{" "}
                      <span className="text-slate-800">{o.totalCents ?? 0}</span>
                      {o.orderNote ? (
                        <>
                          {" "}
                          • Note:{" "}
                          <span className="text-slate-700">{o.orderNote}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {(o.items ?? []).length > 0 ? (
                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {(o.items ?? []).map((it: any) => (
                      <div
                        key={it.lineId}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-extrabold text-slate-900">
                              {it.nameSnapshot}{" "}
                              <span className="text-slate-400">×{it.qty}</span>
                            </div>
                            {it.note ? (
                              <div className="mt-1 text-xs font-semibold text-slate-500">
                                Note: {it.note}
                              </div>
                            ) : null}
                          </div>
                          <StatusPill status={it.status} />
                        </div>

                        {(it.modifiers ?? []).length > 0 ? (
                          <div className="mt-3 space-y-1">
                            {(it.modifiers ?? []).map((m: any) => (
                              <div
                                key={m.groupId}
                                className="text-xs font-semibold text-slate-600"
                              >
                                <span className="font-extrabold text-slate-700">
                                  {m.groupName}:
                                </span>{" "}
                                {(m.options ?? [])
                                  .map((op: any) => op.optionName)
                                  .filter(Boolean)
                                  .join(", ")}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-500">
            Page {page} / {totalPages}
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Prev
            </button>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
