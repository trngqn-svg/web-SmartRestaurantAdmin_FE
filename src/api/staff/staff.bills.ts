import staffApi from "../staffAxios";

function errMsg(e: any) {
  return e?.response?.data?.message || e?.message || "Request failed";
}

export type StaffBillStatus =
  | "REQUESTED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "CANCELLED"
  | string;

export type StaffBillRow = {
  billId: string;
  sessionId: string;
  tableId?: string;
  tableNumber?: string;
  status: StaffBillStatus;
  totalCents?: number;

  method?: "CASH" | "ONLINE" | null;

  paidAt?: string | null;
  requestedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;

  sessionStatus?: string | null;
  note?: string;
};

export type PagedBillsRes = {
  ok: true;
  total: number;
  page: number;
  limit: number;
  bills: StaffBillRow[];
};

function normalizeBillsResponse(x: any): PagedBillsRes {
  if (Array.isArray(x)) {
    return { ok: true, total: x.length, page: 1, limit: x.length || 20, bills: x };
  }
  if (x && Array.isArray(x.bills)) return x as PagedBillsRes;
  return { ok: true, total: 0, page: 1, limit: 20, bills: [] };
}

export type BillTab = "REQUESTED" | "PAID" | "DONE";

export async function listStaffBillsForMonitorApi(args?: {
  tab?: BillTab;
  datePreset?: "today" | "yesterday" | "this_week" | "this_month";
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}) {
  try {
    const res = await staffApi.get("/staff/bills", {
      params: {
        ...(args?.tab ? { tab: args.tab } : {}),
        ...(args?.datePreset ? { datePreset: args.datePreset } : {}),
        ...(args?.from ? { from: args.from } : {}),
        ...(args?.to ? { to: args.to } : {}),
        ...(args?.page ? { page: args.page } : {}),
        ...(args?.limit ? { limit: args.limit } : {}),
      },
      signal: args?.signal,
    });
    return normalizeBillsResponse(res.data);
  } catch (e: any) {
    throw new Error(errMsg(e));
  }
}
