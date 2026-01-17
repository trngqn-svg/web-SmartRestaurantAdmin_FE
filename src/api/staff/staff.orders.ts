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

function errMsg(e: any) {
  return e?.response?.data?.message || e?.message || "Request failed";
}

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

/**
 * Các hàm action dưới đây: Admin monitor thường sẽ KHÔNG dùng.
 * Mình vẫn port sẵn, nếu bạn muốn mode "admin-control" thì bật UI lên.
 * (Backend nên chặn ADMIN nếu muốn view-only)
 */
export async function acceptOrderApi(orderId: string) {
  try {
    const res = await staffApi.post(`/staff/orders/${orderId}/accept`);
    return res.data;
  } catch (e: any) {
    throw new Error(errMsg(e));
  }
}

export async function rejectOrderApi(orderId: string) {
  try {
    const res = await staffApi.post(`/staff/orders/${orderId}/reject`);
    return res.data;
  } catch (e: any) {
    throw new Error(errMsg(e));
  }
}

export async function startLineApi(orderId: string, lineId: string) {
  try {
    const res = await staffApi.post(`/staff/orders/${orderId}/lines/${lineId}/start`);
    return res.data;
  } catch (e: any) {
    throw new Error(errMsg(e));
  }
}

export async function readyLineApi(orderId: string, lineId: string) {
  try {
    const res = await staffApi.post(`/staff/orders/${orderId}/lines/${lineId}/ready`);
    return res.data;
  } catch (e: any) {
    throw new Error(errMsg(e));
  }
}

export async function sendToWaiterApi(orderId: string) {
  try {
    const res = await staffApi.post(`/staff/orders/${orderId}/send-to-waiter`);
    return res.data;
  } catch (e: any) {
    throw new Error(errMsg(e));
  }
}

export async function markServedApi(orderId: string) {
  try {
    const res = await staffApi.post(`/staff/orders/${orderId}/served`);
    return res.data;
  } catch (e: any) {
    throw new Error(errMsg(e));
  }
}

export async function startOrderApi(orderId: string) {
  try {
    const res = await staffApi.post(`/staff/orders/${orderId}/start`);
    return res.data;
  } catch (e: any) {
    throw new Error(errMsg(e));
  }
}
