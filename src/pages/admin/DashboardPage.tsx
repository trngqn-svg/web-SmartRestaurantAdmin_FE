import { useEffect, useMemo, useState } from "react";
import { message, Spin } from "antd";
import dayjs from "dayjs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, Utensils, Timer, Table2 } from "lucide-react";

import { getAdminDashboardOverview, type AdminDashboardOverview } from "../../api/admin/dashboard";
import { formatMoneyFromCents, formatSecondsToMMSS } from "../../utils/reportFormat";

export default function DashboardPage() {
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
      label: x.key.slice(5), // MM-DD
    }));
  }, [data]);

  const topItems = data?.today.topItems ?? [];
  const recentOrders = data?.today.recentOrders ?? [];

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xl font-semibold">Admin Dashboard</div>
          <div className="text-sm text-slate-500">Today + This week</div>
        </div>
        <button
          onClick={load}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Refresh
        </button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <KpiCard
              title="Revenue today"
              value={formatMoneyFromCents(data.today.revenueCents)}
              hint="Bill PAID"
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <KpiCard
              title="Orders served today"
              value={data.today.ordersServed.toLocaleString("vi-VN")}
              hint="served"
              icon={<Utensils className="w-5 h-5" />}
            />
            <KpiCard
              title="Tables serving now"
              value={data.today.tablesServing.toLocaleString("vi-VN")}
              hint="active tables"
              icon={<Table2 className="w-5 h-5" />}
            />
            <KpiCard
              title="Avg prep time today"
              value={formatSecondsToMMSS(data.today.avgPrepTimeSeconds)}
              hint={`sample: ${data.today.avgPrepSampleSize}`}
              icon={<Timer className="w-5 h-5" />}
            />
          </div>

          {/* Week revenue chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="font-semibold">Revenue this week</div>
            <div className="text-xs text-slate-500">Group by day (Mon–Sun)</div>

            <div className="h-[280px] mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weekRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(v) => `${Math.round(v).toLocaleString("vi-VN")}`} />
                  <Tooltip
                    labelFormatter={(l) => `Day ${l}`}
                    formatter={(v: any) => `${Number(v).toLocaleString("vi-VN")} VND`}
                  />
                  <Line type="monotone" dataKey="revenueVnd" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {/* Top items today */}
            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="p-4 border-b border-slate-200">
                <div className="font-semibold">Top selling items (today)</div>
                <div className="text-xs text-slate-500">Top 5 by number of orders containing item</div>
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
                        <td className="px-4 py-4 text-slate-500" colSpan={3}>No data</td>
                      </tr>
                    ) : (
                      topItems.map((it, idx) => (
                        <tr key={it.itemId} className="border-t border-slate-100">
                          <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{it.name}</div>
                            <div className="text-xs text-slate-500">{it.itemId}</div>
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

            {/* Recent orders today */}
            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="p-4 border-b border-slate-200">
                <div className="font-semibold">Recent orders (today)</div>
                <div className="text-xs text-slate-500">Sorted by submitted time</div>
              </div>

              <div className="divide-y divide-slate-100">
                {recentOrders.length === 0 ? (
                  <div className="p-4 text-sm text-slate-500">No orders</div>
                ) : (
                  recentOrders.map((o) => (
                    <div key={o.orderId} className="p-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">
                          Table {o.tableNumber} <span className="text-slate-400">•</span>{" "}
                          <span className="text-slate-600">{o.status}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {o.submittedAt ? dayjs(o.submittedAt).format("HH:mm:ss") : "—"} • {o.itemsCount} items
                        </div>
                        <div className="text-xs text-slate-400">{o.orderId}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatMoneyFromCents(o.totalCents)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard(props: { title: string; value: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500">{props.title}</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">{props.value}</div>
          {props.hint ? <div className="mt-1 text-xs text-slate-500">{props.hint}</div> : null}
        </div>
        {props.icon ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 text-slate-700">
            {props.icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}
