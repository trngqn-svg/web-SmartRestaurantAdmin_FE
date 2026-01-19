import api from "../axios";

export type ReportRange = "week" | "month";

export type ReportOverview = {
  range: ReportRange;
  from: string;
  to: string;
  prevFrom: string;
  prevTo: string;
  totals: {
    revenueCents: number;
    revenueDeltaPct: number;

    ordersServed: number;
    ordersDeltaPct: number;

    avgOrderValueCents: number;
    aovDeltaPct: number;

    avgPrepTimeSeconds: number;
    avgPrepSampleSize: number;
  };
  revenueSeries: Array<{ key: string; revenueCents: number }>;
  peakHours: Array<{ hour: number; orders: number }>;
  topItems: Array<{
    itemId: string;
    name: string;
    totalQty: number;
    revenueCents: number;
    trendPct: number;
  }>;
};


export async function getAdminReportOverview(params: {
  range: ReportRange;
  anchorDate?: string;
}) {
  const res = await api.get(`/admin/reports/overview`, { params });
  return res.data as ReportOverview;
}

export function buildReportExportUrl(args: {
  type: "csv" | "pdf";
  range: ReportRange;
  anchorDate?: string;
}) {
  const qs = new URLSearchParams();
  qs.set("range", args.range);
  if (args.anchorDate) qs.set("anchorDate", args.anchorDate);
  return `/admin/reports/export.${args.type}?${qs.toString()}`;
}
