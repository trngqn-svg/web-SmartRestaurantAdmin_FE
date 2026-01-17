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

  // backend của bạn đang trả "method" (không phải paidMethod) -> nên chuẩn hoá lại UI theo field này
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
  // backward compatible: API cũ trả StaffBillRow[]
  if (Array.isArray(x)) {
    return { ok: true, total: x.length, page: 1, limit: x.length || 20, bills: x };
  }
  if (x && Array.isArray(x.bills)) return x as PagedBillsRes;
  return { ok: true, total: 0, page: 1, limit: 20, bills: [] };
}

/** GET /staff/bills?status=&datePreset=&from=&to=&page=&limit= */
export async function listStaffBillsForMonitorApi(args?: {
  status?: string;
  q?: string;
  datePreset?: "today" | "yesterday" | "this_week" | "this_month";
  from?: string; // ISO
  to?: string;   // ISO
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}) {
  try {
    const res = await staffApi.get("/staff/bills", {
      params: {
        ...(args?.status ? { status: args.status } : {}),
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

/** POST /staff/bills/:billId/accept */
export async function acceptStaffBillApi(billId: string) {
  try {
    const res = await staffApi.post(`/staff/bills/${billId}/accept`);
    return res.data as {
      ok: boolean;
      billId: string;
      status?: string;
      session?: { ok: boolean; sessionId: string; status: string; closedAt?: string };
    };
  } catch (e: any) {
    throw new Error(errMsg(e));
  }
}
