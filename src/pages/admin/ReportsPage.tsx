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
  // nếu axios baseURL set sẵn thì url chỉ là path
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

export default function ReportsPage() {
  const [range, setRange] = useState<ReportRange>("week");
  const [anchor, setAnchor] = useState<Dayjs>(() => dayjs()); // default today
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, anchorDate]);

  const revenueSeries = useMemo(() => {
    if (!data) return [];
    // key is YYYY-MM-DD (week) or YYYY-W##
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
    if (range === "week") {
      // show MM-DD
      return key.slice(5);
    }
    // month: YYYY-W##
    const m = key.match(/W(\d+)/);
    return m ? `W${m[1]}` : key;
  };

  const subtitle = useMemo(() => {
    if (!data) return "";
    const from = dayjs(data.from).format("DD/MM/YYYY");
    const to = dayjs(data.to).subtract(1, "day").format("DD/MM/YYYY"); // because backend uses [from,to)
    return `${from} → ${to}`;
  }, [data]);

  const onExportCsv = async () => {
    try {
      const url = buildReportExportUrl({ type: "csv", range, anchorDate });
      await downloadViaAxios(url, `report-${range}-${anchorDate}.csv`);
      message.success("Export CSV thành công");
    } catch (e: any) {
      message.error(e?.message || "Export CSV failed");
    }
  };

  const onExportPdf = async () => {
    try {
      const url = buildReportExportUrl({ type: "pdf", range, anchorDate });
      await downloadViaAxios(url, `report-${range}-${anchorDate}.pdf`);
      message.success("Export PDF thành công");
    } catch (e: any) {
      message.error(e?.message || "Export PDF failed");
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="text-xl font-semibold tracking-tight">Reports</div>
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
          Không có dữ liệu.
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <KpiCard
              title="Total revenue"
              value={formatMoneyFromCents(data.totals.revenueCents)}
              hint="Bill PAID"
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <KpiCard
              title="Total orders"
              value={data.totals.ordersServed.toLocaleString("vi-VN")}
              hint="served"
            />
            <KpiCard
              title="Avg order value"
              value={formatMoneyFromCents(data.totals.avgOrderValueCents)}
              hint="served"
            />
            <KpiCard
              title="Avg prep time"
              value={formatSecondsToMMSS(data.totals.avgPrepTimeSeconds)}
              hint={`sample: ${data.totals.avgPrepSampleSize}`}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
            <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Revenue over time</div>
                  <div className="text-xs text-slate-500">
                    {range === "week" ? "Group by day" : "Group by ISO week in month"}
                  </div>
                </div>
              </div>

              <div className="h-[280px] mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="key"
                      tickFormatter={revenueLabel}
                      minTickGap={16}
                    />
                    <YAxis
                      tickFormatter={(v) => `${Math.round(v).toLocaleString("vi-VN")}`}
                    />
                    <Tooltip
                      formatter={(v: any) =>
                        `${Number(v).toLocaleString("vi-VN")} VND`
                      }
                      labelFormatter={(l) =>
                        range === "week" ? l : `ISO ${l}`
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="revenueVnd"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div>
                <div className="font-semibold">Peak hours</div>
                <div className="text-xs text-slate-500">By served orders (submittedAt)</div>
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
              <div className="text-xs text-slate-500">Top 5 by total quantity (served orders)</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left font-medium px-4 py-3 w-[70px]">#</th>
                    <th className="text-left font-medium px-4 py-3">Item</th>
                    <th className="text-right font-medium px-4 py-3 w-[140px]">Total qty</th>
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
                          <div className="text-xs text-slate-500">{it.itemId}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {it.totalQty.toLocaleString("vi-VN")}
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
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500">{props.title}</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">{props.value}</div>
          {props.hint ? (
            <div className="mt-1 text-xs text-slate-500">{props.hint}</div>
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
