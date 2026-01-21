import { useEffect, useMemo, useState } from "react";
import { message, Spin } from "antd";
import dayjs from "dayjs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, Utensils, Timer, Table2, Monitor, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAdminDashboardOverview, type AdminDashboardOverview } from "../../api/admin/dashboard";
import { formatMoneyFromCents, formatSecondsToMMSS } from "../../utils/reportFormat";

function formatPctDelta(today: number, yesterday: number) {
  if (yesterday <= 0) {
    if (today <= 0) return "0%";
    return "+100%";
  }
  const pct = ((today - yesterday) / yesterday) * 100;
  const s = `${Math.abs(pct).toFixed(0)}%`;
  return `${pct >= 0 ? "+" : "-"}${s}`;
}

export default function DashboardPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminDashboardOverview | null>(null);

  async function load() {
    try {
      setLoading(true);
      const res = await getAdminDashboardOverview();
      setData(res);
    } catch (e: any) {
      message.error(e?.message || "Load dashboard failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const weekRevenue = useMemo(() => {
    if (!data) return [];
    return data.week.revenueSeries.map((x) => ({
      ...x,
      revenueVnd: x.revenueCents / 100,
      label: x.key.slice(5),
    }));
  }, [data]);

  const topItems = data?.today.topItems ?? [];
  const recentOrders = data?.today.recentOrders ?? [];

  const prepSeconds = data?.today.avgPrepTimeSeconds ?? 0;

  const revenuePct = data
    ? formatPctDelta(data.today.revenueCents, data.yesterday.revenueCents)
    : "0%";

  const ordersPct = data
    ? formatPctDelta(data.today.ordersServed, data.yesterday.ordersServed)
    : "0%";

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Admin Dashboard
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:flex md:items-center md:gap-2">
          <button
            onClick={() => nav("/monitor/kds")}
            className="w-full md:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium hover:bg-slate-50"
          >
            <Monitor className="h-4.5 w-4.5" />
            <span>Open KDS</span>
          </button>

          <button
            onClick={() => nav("/orders")}
            className="w-full md:w-auto flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white font-medium hover:text-black hover:bg-[#E2B13C]"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spin />
        </div>
      ) : !data ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">No data</div>
      ) : (
        <>
          {/* KPI Today */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            <KpiCard
              title="Revenue today"
              value={formatMoneyFromCents(data.today.revenueCents)}
              hint={`vs yesterday: ${revenuePct}`}
              icon={<TrendingUp className="w-5 h-5" />}
              trend={revenuePct.startsWith("+") ? "up" : revenuePct.startsWith("-") ? "down" : "flat"}
            />

            <KpiCard
              title="Orders served today"
              value={data.today.ordersServed.toLocaleString("vi-VN")}
              hint={`vs yesterday: ${ordersPct}`}
              icon={<Utensils className="w-5 h-5" />}
              trend={ordersPct.startsWith("+") ? "up" : ordersPct.startsWith("-") ? "down" : "flat"}
            />

            <KpiCard
              title="Tables occupied"
              value={`${data.today.occupiedTables}/${data.today.totalTables}`}
              hint="occupied / total"
              icon={<Table2 className="w-5 h-5" />}
            />

            <KpiCard
              title="Avg prep time today"
              value={formatSecondsToMMSS(prepSeconds)}
              hint={`sample: ${data.today.avgPrepSampleSize}`}
              icon={<Timer className="w-5 h-5" />}
            />
          </div>

          {/* Week chart + Top items same row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {/* Week revenue chart (BAR) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="font-bold font-xs text-slate-800">Revenue this week</div>

              <div className="h-[280px] mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weekRevenue}
                    margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      interval="preserveStartEnd"
                      tickMargin={8}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      width={52}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => `${Math.round(v).toLocaleString("vi-VN")}`}
                    />
                    <Tooltip
                      labelFormatter={(l) => `Day ${l}`}
                      formatter={(v: any) => `${Number(v).toLocaleString("vi-VN")} VND`}
                    />
                    <Bar dataKey="revenueVnd" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top items today */}
            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="p-4 border-b border-slate-200">
                <div className="font-bold font-xs text-slate-800">Top selling items (Today)</div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-3 w-[60px]">#</th>
                      <th className="text-left font-medium px-4 py-3">Item</th>
                      <th className="text-right font-medium px-4 py-3 w-[140px]">Order count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topItems.length === 0 ? (
                      <tr>
                        <td className="px-4 py-4 text-slate-500" colSpan={3}>
                          No data
                        </td>
                      </tr>
                    ) : (
                      topItems.map((it, idx) => (
                        <tr key={it.itemId} className="border-t border-slate-100">
                          <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{it.name}</div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {it.orderCount.toLocaleString("vi-VN")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent orders today */}
          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold font-xs text-slate-800">Recent orders (Today)</div>
              </div>
              <button
                onClick={() => nav("/orders")}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
              >
                View All Orders
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="hidden md:table-cell text-left font-medium px-4 py-3 w-[220px]">Order ID</th>
                    <th className="text-left font-medium px-4 py-3 w-[90px]">Table</th>
                    <th className="text-left font-medium px-4 py-3">Items</th>
                    <th className="text-right font-medium px-4 py-3 w-[140px]">Total</th>
                    <th className="hidden lg:table-cell text-left font-medium px-4 py-3 w-[140px]">Status</th>
                    <th className="hidden sm:table-cell text-right font-medium px-4 py-3 w-[110px]">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td className="px-4 py-4 text-slate-500" colSpan={6}>
                        No orders
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((o) => (
                      <tr key={o.orderId} className="border-t border-slate-100">
                      <td className="hidden md:table-cell px-4 py-3 font-mono text-xs text-slate-600">
                        {o.orderId}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">#{o.tableNumber}</td>

                      <td className="px-4 py-3 text-slate-700">
                        <div className="line-clamp-2">{o.itemsSummary}</div>
                        {/* mobile show short id */}
                        <div className="mt-1 md:hidden font-mono text-[11px] text-slate-400">
                          {o.orderId.slice(-8)}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                        {formatMoneyFromCents(o.totalCents)}
                      </td>

                      <td className="hidden lg:table-cell px-4 py-3">{o.status}</td>

                      <td className="hidden sm:table-cell px-4 py-3 text-right whitespace-nowrap">
                        {o.submittedAt ? dayjs(o.submittedAt).format("HH:mm") : "—"}
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard(props: {
  title: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "flat";
}) {
  const trendCls =
    props.trend === "up"
      ? "text-emerald-600"
      : props.trend === "down"
      ? "text-rose-600"
      : "text-slate-500";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{props.title}</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">{props.value}</div>
          {props.hint ? <div className={`mt-1 text-xs ${trendCls}`}>{props.hint}</div> : null}
        </div>
        {props.icon ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 text-slate-700">{props.icon}</div>
        ) : null}
      </div>
    </div>
  );
}
