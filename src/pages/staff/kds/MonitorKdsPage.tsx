import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { cn } from "../../../utils/cn";
import { formatMoneyFromCents } from "../../../utils/money";
import {
  listStaffOrdersForMonitorApi,
  type StaffOrder,
  type StaffOrderLine,
} from "../../../api/staff/staff.orders";
import { Wifi, WifiOff, StickyNote, RefreshCw, Search } from "lucide-react";

type TabKey = "accepted" | "preparing" | "ready";

type KdsOrder = {
  orderId: string;
  tableId: string;
  tableNumber?: string;
  totalCents?: number;
  submittedAt?: string;
  orderNote?: string;
  status?: string;
  items?: StaffOrderLine[];
  prepTimeMinutes?: number;
};

type DatePreset = "today" | "yesterday" | "this_week" | "this_month";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function normalizeOrdersResponse(x: any): {
  ok: true;
  total: number;
  page: number;
  limit: number;
  orders: StaffOrder[];
} {
  if (Array.isArray(x)) {
    return { ok: true, total: x.length, page: 1, limit: x.length || 20, orders: x };
  }
  if (x && Array.isArray(x.orders)) return x;
  return { ok: true, total: 0, page: 1, limit: 20, orders: [] };
}

export default function MonitorKdsPage() {
  const [connected, setConnected] = useState(false);

  const [tab, setTab] = useState<TabKey>("accepted");
  const tabRef = useRef<TabKey>("accepted");
  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  // filters
  const [tableQ, setTableQ] = useState(""); // search table number
  const qRef = useRef<string>("");
  useEffect(() => {
    qRef.current = tableQ;
  }, [tableQ]);

  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const dateRef = useRef<DatePreset>("today");
  useEffect(() => {
    dateRef.current = datePreset;
  }, [datePreset]);

  // paging
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  const [orders, setOrders] = useState<KdsOrder[]>([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // progress timer
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // progress store
  const lineStartRef = useRef<Record<string, number>>({});

  function getLinePrepMinutes(o: KdsOrder, li: StaffOrderLine) {
    const v = Number((li as any).prepTimeMinutes ?? o.prepTimeMinutes ?? 1);
    // minutes * qty (tối thiểu 1 phút)
    return Math.max(1, Number.isFinite(v) ? v * li.qty : 1);
  }

  function lineKey(orderId: string, lineId: string) {
    return `${orderId}:${lineId}`;
  }
  function markLineStarted(orderId: string, lineId: string) {
    const k = lineKey(orderId, lineId);
    if (!lineStartRef.current[k]) lineStartRef.current[k] = Date.now();
  }

  async function loadQueue(opts?: { silent?: boolean; resetPage?: boolean }) {
    const silent = !!opts?.silent;

    try {
      setErr(null);
      if (!silent) setLoading(true);

      if (opts?.resetPage) setPage(1);

      const res = await listStaffOrdersForMonitorApi({
        status: tabRef.current, // accepted | preparing | ready
        page: opts?.resetPage ? 1 : page,
        limit,
        q: (qRef.current || "").trim() || undefined,
        datePreset: dateRef.current,
      });

      const { orders: rows, total: t } = normalizeOrdersResponse(res);

      const mapped: KdsOrder[] = (rows ?? []).map((o) => ({
        orderId: o.orderId,
        tableId: o.tableId,
        tableNumber: o.tableNumber,
        totalCents: o.totalCents,
        submittedAt: o.submittedAt,
        orderNote: (o as any).orderNote ?? "",
        status: String(o.status || "").toLowerCase(),
        items: o.items ?? [],
        prepTimeMinutes: (o as any).prepTimeMinutes,
      }));

      // mark started lines if status already preparing
      for (const o of mapped) {
        for (const li of o.items ?? []) {
          const lst = String(li.status || "").toLowerCase();
          if (lst === "preparing") markLineStarted(o.orderId, li.lineId);
        }
      }

      setOrders(mapped);
      setTotal(Number(t || 0));
    } catch (e: any) {
      setErr(e?.message || "Load orders failed");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  // initial + tab change
  useEffect(() => {
    // đổi tab thì reset page
    loadQueue({ resetPage: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // paging change
  useEffect(() => {
    loadQueue({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // socket: monitor nên reload theo tab/filter hiện tại (đỡ patch sai)
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setConnected(false);
      return;
    }

    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
      } catch {}
      socketRef.current = null;
    }

    const wsUrl = import.meta.env.VITE_STAFF_WS_URL || "http://localhost:3001/ws";
    const socket = io(wsUrl, { auth: { token }, transports: ["websocket"] });
    socketRef.current = socket;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onConnectError = () => setConnected(false);

    const refresh = () => loadQueue({ silent: true });

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    // events that affect KDS queue
    socket.on("order.accepted", refresh);
    socket.on("order.status_changed", refresh);
    socket.on("order.line_status_changed", refresh);
    socket.on("order.submitted", refresh); // nếu bạn có emit

    return () => {
      try {
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off("connect_error", onConnectError);

        socket.off("order.accepted", refresh);
        socket.off("order.status_changed", refresh);
        socket.off("order.line_status_changed", refresh);
        socket.off("order.submitted", refresh);

        socket.disconnect();
      } catch {}
      socketRef.current = null;
      setConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const tabBtnClass = (active: boolean) =>
    cn(
      "relative -mb-px inline-flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-extrabold",
      active ? "text-[#E2B13C]" : "text-white hover:text-slate-200"
    );

  const badgeClass = (active: boolean) =>
    cn(
      "inline-flex min-w-[28px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-extrabold",
      active ? "bg-slate-700 text-[#E2B13C]" : "bg-white text-slate-600"
    );

  const underlineClass = (active: boolean) =>
    cn(
      "pointer-events-none absolute inset-x-2 -bottom-[1px] h-[2px] rounded-full transition",
      active ? "bg-[#E2B13C]" : "bg-transparent"
    );

  const dateBtn = (active: boolean) =>
    cn(
      "rounded-xl px-3 py-2 text-xs font-extrabold border",
      active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
    );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div>
            <div className="text-lg font-extrabold text-[#E2B13C]">
              KDS Dashboard (Monitor)
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ml-2",
                  connected
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                )}
                title="Realtime connection"
              >
                {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                {connected ? "Online" : "Offline"}
              </span>
            </div>
            <div className="mt-0.5 text-xs font-semibold text-white/60">View-only</div>
          </div>

          <button
            onClick={() => loadQueue()}
            className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm font-extrabold text-white hover:bg-white/15"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-5xl px-2">
          <div className="flex flex-nowrap items-stretch gap-1 border-b border-slate-900 whitespace-nowrap">
            <button onClick={() => setTab("accepted")} className={tabBtnClass(tab === "accepted")}>
              Accepted <span className={badgeClass(tab === "accepted")}>•</span>
              <span className={underlineClass(tab === "accepted")} />
            </button>

            <button onClick={() => setTab("preparing")} className={tabBtnClass(tab === "preparing")}>
              Preparing <span className={badgeClass(tab === "preparing")}>•</span>
              <span className={underlineClass(tab === "preparing")} />
            </button>

            <button onClick={() => setTab("ready")} className={tabBtnClass(tab === "ready")}>
              Send To Waiter <span className={badgeClass(tab === "ready")}>•</span>
              <span className={underlineClass(tab === "ready")} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mx-auto max-w-5xl px-4 pt-4">
        <div className="rounded-2xl border bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button className={dateBtn(datePreset === "today")} onClick={() => setDatePreset("today")}>
                Today
              </button>
              <button className={dateBtn(datePreset === "yesterday")} onClick={() => setDatePreset("yesterday")}>
                Yesterday
              </button>
              <button className={dateBtn(datePreset === "this_week")} onClick={() => setDatePreset("this_week")}>
                This week
              </button>
              <button className={dateBtn(datePreset === "this_month")} onClick={() => setDatePreset("this_month")}>
                This month
              </button>

              <button
                onClick={() => loadQueue({ resetPage: true })}
                className="ml-1 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-extrabold text-white hover:bg-slate-800"
                title="Apply filters"
              >
                Apply
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-[260px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={tableQ}
                  onChange={(e) => setTableQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") loadQueue({ resetPage: true });
                  }}
                  placeholder="Search by table number..."
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-semibold text-slate-800 outline-none focus:border-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="mt-2 text-xs font-semibold text-slate-500">
            Total: <span className="text-slate-800">{total}</span> • Page {page}/{totalPages}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl p-4">
        {err ? (
          <div className="mb-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {err}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-600">Loading...</div>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-600">No orders in this tab.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const st = String(o.status || "").toLowerCase();
              const lines = o.items ?? [];

              const visibleLines = lines.filter(
                (li) => !["served", "cancelled"].includes(String(li.status || "").toLowerCase())
              );

              return (
                <div key={o.orderId} className="rounded-2xl border border-slate-400 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-slate-900">
                        {o.tableNumber ? `Table ${o.tableNumber}` : "Table order"}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        Order #{o.orderId.slice(-6)}
                        {o.submittedAt ? ` • ${new Date(o.submittedAt).toLocaleString()}` : null}
                        {st ? ` • ${st}` : null}
                      </div>
                    </div>

                    <div className="shrink-0 text-sm font-extrabold text-slate-900">
                      {typeof o.totalCents === "number" ? formatMoneyFromCents(o.totalCents) : ""}
                    </div>
                  </div>

                  {o.orderNote ? (
                    <div className="mb-3 mt-2 flex items-start gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      <StickyNote className="mt-0.5 h-4 w-4" />
                      <div className="min-w-0 whitespace-pre-line">{o.orderNote}</div>
                    </div>
                  ) : null}

                  {/* Lines */}
                  <div className="mt-3 space-y-2">
                    {visibleLines.length === 0 ? (
                      <div className="text-sm text-slate-500">All items are done.</div>
                    ) : (
                      visibleLines.map((li) => {
                        const lst = String(li.status || "queued").toLowerCase();
                        const mins = getLinePrepMinutes(o, li);

                        // ✅ FIX: minutes -> ms
                        const durationMs = mins * 60_000;

                        const k = lineKey(o.orderId, li.lineId);
                        const startedAt = lineStartRef.current[k];
                        const elapsed = startedAt ? now - startedAt : 0;

                        const pct =
                          lst === "ready"
                            ? 100
                            : lst === "preparing" && startedAt
                            ? clamp((elapsed / durationMs) * 100, 0, 99.5)
                            : 0;

                        const remainingSec =
                          lst === "preparing" && startedAt
                            ? Math.max(0, Math.ceil((durationMs - elapsed) / 1000))
                            : 0;

                        const remainingLabel =
                          lst === "preparing" && startedAt
                            ? `${Math.floor(remainingSec / 60)}m ${remainingSec % 60}s`
                            : lst === "ready"
                            ? "Done"
                            : "Waiting";

                        // mark start when tab is preparing and line status says preparing
                        if (lst === "preparing") markLineStarted(o.orderId, li.lineId);

                        return (
                          <div key={li.lineId} className="rounded-xl border border-slate-100 bg-white p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-extrabold text-slate-900">
                                  {li.nameSnapshot}{" "}
                                  <span className="text-xs font-semibold text-slate-500">× {li.qty}</span>
                                </div>

                                <div className="mt-1 text-xs text-slate-500">
                                  Status: <span className="font-semibold">{lst}</span> • Prep{" "}
                                  <span className="font-semibold">{mins} min</span>
                                  {tab === "preparing" ? (
                                    <>
                                      {" "}
                                      • <span className="font-semibold">{remainingLabel}</span>
                                    </>
                                  ) : null}
                                </div>

                                {(li as any).modifiers?.length ? (
                                  <div className="mt-1 space-y-1 text-xs text-slate-600">
                                    {(li as any).modifiers.map((m: any, idx: number) => (
                                      <div key={`${m.groupId}-${idx}`} className="truncate">
                                        <span className="font-semibold text-slate-700">{m.groupName}:</span>{" "}
                                        <span className="text-slate-600">
                                          {(m.options ?? []).map((op: any) => op.optionName).join(", ")}
                                        </span>
                                        {m.priceAdjustmentCents ? (
                                          <span className="ml-1 font-semibold text-emerald-700">
                                            +{formatMoneyFromCents(m.priceAdjustmentCents)}
                                          </span>
                                        ) : null}
                                      </div>
                                    ))}
                                  </div>
                                ) : null}

                                {li.note ? (
                                  <div className="mt-1 text-xs text-slate-500 whitespace-pre-line">
                                    <span className="font-semibold text-slate-700">Note:</span> {li.note}
                                  </div>
                                ) : null}

                                {/* progress bar only in preparing tab */}
                                {tab === "preparing" ? (
                                  <div className="mt-3">
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                      <div
                                        className={cn(
                                          "h-full rounded-full transition-[width] duration-1000",
                                          lst === "ready"
                                            ? "bg-emerald-600"
                                            : lst === "preparing"
                                            ? "bg-[#E2B13C]"
                                            : "bg-slate-300"
                                        )}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>

                                    <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                                      <span>
                                        {lst === "preparing"
                                          ? "Cooking…"
                                          : lst === "ready"
                                          ? "Completed"
                                          : "Queued"}
                                      </span>
                                      <span>{Math.round(pct)}%</span>
                                    </div>
                                  </div>
                                ) : null}
                              </div>

                              <div className="shrink-0 text-sm font-extrabold text-slate-900">
                                {typeof li.lineTotalCents === "number"
                                  ? formatMoneyFromCents(li.lineTotalCents)
                                  : ""}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                    View-only (Admin Monitor)
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            className={cn(
              "rounded-xl border px-3 py-2 text-sm font-extrabold",
              page <= 1 ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
            )}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>

          <div className="text-sm font-semibold text-slate-600">
            Page <span className="font-extrabold text-slate-900">{page}</span> / {totalPages}
          </div>

          <button
            className={cn(
              "rounded-xl border px-3 py-2 text-sm font-extrabold",
              page >= totalPages ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
            )}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
