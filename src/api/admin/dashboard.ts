import api from "../axios";

export type AdminDashboardOverview = {
  today: {
    revenueCents: number;
    ordersServed: number;
    tablesServing: number;
    avgPrepTimeSeconds: number | null;
    avgPrepSampleSize: number;
    topItems: Array<{ itemId: string; name: string; orderCount: number }>;
    recentOrders: Array<{
      orderId: string;
      tableNumber: string;
      submittedAt?: string;
      totalCents: number;
      status: string;
      itemsCount: number;
    }>;
  };
  week: {
    revenueSeries: Array<{ key: string; revenueCents: number }>;
  };
};

export async function getAdminDashboardOverview() {
  const res = await api.get(`/admin/dashboard/overview`);
  return res.data as AdminDashboardOverview;
}
