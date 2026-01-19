import { useEffect, useMemo, useState } from "react";
import { DatePicker, Segmented, message, Spin } from "antd";
import dayjs, { Dayjs } from "dayjs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { Download, CalendarDays, TrendingUp } from "lucide-react";

import {
  buildReportExportUrl,
  getAdminReportOverview,
  type ReportOverview,
  type ReportRange,
} from "../../api/admin/reports";
import { formatMoneyFromCents, formatSecondsToMMSS } from "../../utils/reportFormat";
import api from "../../api/axios";

function toYYYYMMDD(d: Dayjs) {
  return d.format("YYYY-MM-DD");
}

function downloadViaAxios(url: string, filename: string) {
  return api
    .get(url, { responseType: "blob" })
    .then((res) => {
      const blob = new Blob([res.data]);
      const a = document.createElement("a");
      const objUrl = URL.createObjectURL(blob);
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
    })
    .catch((e) => {
      throw e;
    });
}

function fmtDeltaPct(v?: number) {
  if (v == null || !Number.isFinite(v)) return "0%";
  const n = Math.round(v);
  const s = `${Math.abs(n)}%`;
  return `${n >= 0 ? "+" : "-"}${s}`;
}

function trendClass(v?: number) {
  if (v == null || !Number.isFinite(v) || v === 0) return "text-slate-500";
  return v > 0 ? "text-emerald-600" : "text-rose-600";
}

export default function ReportsPage() {
  const [range, setRange] = useState<ReportRange>("week");
  const [anchor, setAnchor] = useState<Dayjs>(() => dayjs());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportOverview | null>(null);

  const anchorDate = useMemo(() => toYYYYMMDD(anchor), [anchor]);

  async function load() {
    try {
      setLoading(true);
      const res = await getAdminReportOverview({ range, anchorDate });
      setData(res);
    } catch (e: any) {
      message.error(e?.message || "Load report failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [range, anchorDate]);

  const revenueSeries = useMemo(() => {
    if (!data) return [];
    return data.revenueSeries.map((x) => ({
      ...x,
      revenueVnd: x.revenueCents / 100,
    }));
  }, [data]);

  const peakHours = useMemo(() => {
    if (!data) return [];
    return data.peakHours.map((x) => ({ ...x }));
  }, [data]);

  const topItems = data?.topItems ?? [];

  const revenueLabel = (key: string) => {
    if (range === "week") return key.slice(5);
    const m = key.match(/W(\d+)/);
    return m ? `W${m[1]}` : key;
  };

  const subtitle = useMemo(() => {
    if (!data) return "";
    const from = dayjs(data.from).format("DD/MM/YYYY");
    const to = dayjs(data.to).subtract(1, "day").format("DD/MM/YYYY");
    return `${from} → ${to}`;
  }, [data]);

  const compareLabel = range === "week" ? "vs last week" : "vs last month";

  const onExportCsv = async () => {
    try {
      const url = buildReportExportUrl({ type: "csv", range, anchorDate });
      await downloadViaAxios(url, `report-${range}-${anchorDate}.csv`);
      message.success("Export CSV succeeded");
    } catch (e: any) {
      message.error(e?.message || "Export CSV failed");
    }
  };

  const onExportPdf = async () => {
    try {
      const url = buildReportExportUrl({ type: "pdf", range, anchorDate });
      await downloadViaAxios(url, `report-${range}-${anchorDate}.pdf`);
      message.success("Export PDF succeeded");
    } catch (e: any) {
      message.error(e?.message || "Export PDF failed");
    }
  };

  const totals = data?.totals;
  const avgPrepSeconds = totals?.avgPrepTimeSeconds ?? 0;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="text-3xl font-black text-slate-900 tracking-tight">Reports</div>
          <div className="text-sm text-slate-500 flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            <span>{subtitle || "—"}</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <Segmented
            value={range}
            options={[
              { label: "Week", value: "week" },
              { label: "Month", value: "month" },
            ]}
            onChange={(v) => setRange(v as ReportRange)}
          />

          <DatePicker
            value={anchor}
            onChange={(v) => v && setAnchor(v)}
            allowClear={false}
            className="w-full md:w-[160px]"
          />

          <button
            onClick={onExportCsv}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-slate-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          <button
            onClick={onExportPdf}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spin />
        </div>
      ) : !data ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
          No data.
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <KpiCard
              title="Total revenue"
              value={formatMoneyFromCents(totals!.revenueCents)}
              hint={`${compareLabel}: ${fmtDeltaPct((totals as any).revenueDeltaPct)}`}
              hintClass={trendClass((totals as any).revenueDeltaPct)}
              icon={<TrendingUp className="w-5 h-5" />}
            />

            <KpiCard
              title="Total orders"
              value={totals!.ordersServed.toLocaleString("vi-VN")}
              hint={`${compareLabel}: ${fmtDeltaPct((totals as any).ordersDeltaPct)}`}
              hintClass={trendClass((totals as any).ordersDeltaPct)}
            />

            <KpiCard
              title="Avg order value"
              value={formatMoneyFromCents(totals!.avgOrderValueCents)}
              hint={`${compareLabel}: ${fmtDeltaPct((totals as any).aovDeltaPct)}`}
              hintClass={trendClass((totals as any).aovDeltaPct)}
            />

            <KpiCard
              title="Avg prep time"
              value={formatSecondsToMMSS(avgPrepSeconds)}
              hint={`sample: ${totals!.avgPrepSampleSize}`}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
            <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg">Revenue over time</div>
                  <div className="text-xs text-slate-500">
                    {range === "week" ? "Group by day" : "Group by ISO week in month"}
                  </div>
                </div>
              </div>

              <div className="h-[280px] mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="key" tickFormatter={revenueLabel} minTickGap={16} />
                    <YAxis tickFormatter={(v) => `${Math.round(v).toLocaleString("vi-VN")}`} />
                    <Tooltip
                      formatter={(v: any) => `${Number(v).toLocaleString("vi-VN")} VND`}
                      labelFormatter={(l) => (range === "week" ? l : `ISO ${l}`)}
                    />
                    <Line type="monotone" dataKey="revenueVnd" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div>
                <div className="font-bold text-l">Peak hours</div>
                <div className="text-xs text-slate-500">Orders by hour</div>
              </div>

              <div className="h-[280px] mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakHours}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" tickFormatter={(h) => `${h}`} />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      formatter={(v: any) => [`${v}`, "orders"]}
                      labelFormatter={(l) => `${l}:00`}
                    />
                    <Bar dataKey="orders" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top items */}
          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="p-4 border-b border-slate-200">
              <div className="font-semibold">Top selling items</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left font-medium px-4 py-3 w-[70px]">#</th>
                    <th className="text-left font-medium px-4 py-3">Item</th>
                    <th className="text-right font-medium px-4 py-3 w-[120px]">Qty</th>
                    <th className="text-right font-medium px-4 py-3 w-[160px]">Revenue</th>
                    <th className="text-right font-medium px-4 py-3 w-[110px]">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {topItems.length === 0 ? (
                    <tr>
                      <td className="px-4 py-4 text-slate-500" colSpan={5}>
                        No data
                      </td>
                    </tr>
                  ) : (
                    topItems.map((it: any, idx: number) => {
                      const trend = Number(it.trendPct ?? 0);
                      const trendText = `${trend >= 0 ? "+" : "-"}${Math.abs(Math.round(trend))}%`;
                      const tCls = trendClass(trend);

                      return (
                        <tr key={it.itemId} className="border-t border-slate-100">
                          <td className="px-4 py-3 text-slate-500">{idx + 1}</td>

                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{it.name}</div>
                          </td>

                          <td className="px-4 py-3 text-right">
                            {Number(it.totalQty ?? 0).toLocaleString("vi-VN")}
                          </td>

                          <td className="px-4 py-3 text-right font-semibold">
                            {formatMoneyFromCents(Number(it.revenueCents ?? 0))}
                          </td>

                          <td className={`px-4 py-3 text-right font-semibold ${tCls}`}>{trendText}</td>
                        </tr>
                      );
                    })
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
  hintClass?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{props.title}</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">{props.value}</div>
          {props.hint ? (
            <div className={`mt-1 text-xs ${props.hintClass ?? "text-slate-500"}`}>{props.hint}</div>
          ) : null}
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
