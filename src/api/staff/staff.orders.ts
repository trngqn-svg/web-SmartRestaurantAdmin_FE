import staffApi from "../staffAxios";

export type StaffOrderLine = {
  lineId: string;
  itemId: string;
  nameSnapshot: string;
  qty: number;
  note?: string;
  lineTotalCents: number;
  status: string;
};

export type StaffOrder = {
  orderId: string;
  tableId: string;
  tableNumber?: string;
  status: string;
  totalCents: number;
  submittedAt?: string;
  orderNote?: string;
  items?: StaffOrderLine[];
  prepTimeMinutes: number;
};

export type PagedOrdersRes = {
  ok: true;
  total: number;
  page: number;
  limit: number;
  orders: StaffOrder[];
};

export async function listStaffOrdersForMonitorApi(args: {
  status?: string;
  q?: string;
  datePreset?: "today" | "yesterday" | "this_week" | "this_month";
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}) {
  const res = await staffApi.get<PagedOrdersRes>("/staff/orders", {
    params: {
      ...(args.status && args.status !== "all" ? { status: args.status } : {}),
      ...(args.q ? { q: args.q } : {}),
      ...(args.datePreset ? { datePreset: args.datePreset } : {}),
      ...(args.from ? { from: args.from } : {}),
      ...(args.to ? { to: args.to } : {}),
      ...(args.page ? { page: args.page } : {}),
      ...(args.limit ? { limit: args.limit } : {}),
    },
    signal: args.signal,
  });

  return res.data as { ok: true; total: number; page: number; limit: number; orders: StaffOrder[] };
}