import api from "../axios";

export type AdminDashboardOverview = {
  today: {
    revenueCents: number;
    revenueDeltaCents: number;
    ordersServed: number;
    ordersServedDelta: number;

    occupiedTables: number;
    totalTables: number;

    avgPrepTimeSeconds: number | null;
    avgPrepSampleSize: number;

    topItems: Array<{ itemId: string; name: string; orderCount: number; qty: number; revenueCents: number }>;

    recentOrders: Array<{
      orderId: string;
      tableNumber: string;
      submittedAt?: string;
      totalCents: number;
      status: string;
      itemsSummary: string;
    }>;
  };
  yesterday: {
    revenueCents: number;
    ordersServed: number;
  };
  week: { revenueSeries: Array<{ key: string; revenueCents: number }> };
};

export async function getAdminDashboardOverview() {
  const res = await api.get(`/admin/dashboard/overview`);
  return res.data as AdminDashboardOverview;
}
