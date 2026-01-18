import api from "../axios";

export type OrdersDateFilter = "today" | "yesterday" | "this_week" | "this_month";

export type AdminOrderRow = {
  orderId: string;
  tableId: string;
  tableNumber: string;

  items: Array<{ name: string; qty: number }>;

  totalCents: number;
  status: string;

  submittedAt?: string;
  createdAt?: string;
};

export type AdminOrdersListResponse = {
  items: AdminOrderRow[];
  page: number;
  pageSize: number;
  total: number;
};

function errMsg(e: any) {
  return e?.response?.data?.message || e?.message || "Request failed";
}

export async function listAdminOrders(params: {
  status?: string;
  tableId?: string;
  date?: OrdersDateFilter;
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const res = await api.get(`/api/admin/orders`, { params });
    return res.data as AdminOrdersListResponse;
  } catch (e: any) {
    throw new Error(errMsg(e));
  }
}