import { useEffect, useMemo, useState } from "react";
import { Input, Pagination, Select, Tag, message, Spin, Button } from "antd";
import { Search, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";

import {
  listAdminOrders,
  type AdminOrderRow,
  type OrdersDateFilter,
} from "../../api/admin/orders";
import { formatMoneyFromCents } from "../../utils/reportFormat";

const DATE_OPTIONS: Array<{ label: string; value: OrdersDateFilter }> = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "This week", value: "this_week" },
  { label: "This month", value: "this_month" },
];

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Preparing", value: "preparing" },
  { label: "Ready", value: "ready" },
  { label: "Ready to service", value: "ready_to_service" },
  { label: "Served", value: "served" },
  { label: "Cancelled", value: "cancelled" },
];

function StatusPill({ status }: { status: string }) {
  const color =
    status === "served"
      ? "green"
      : status === "cancelled"
      ? "red"
      : status === "pending"
      ? "gold"
      : status === "accepted"
      ? "blue"
      : status === "preparing"
      ? "purple"
      : status === "ready" || status === "ready_to_service"
      ? banningFix("cyan")
      : "default";

  return (
    <Tag color={color} className="capitalize">
      {status.replaceAll("_", " ")}
    </Tag>
  );
}

// quick fix since TS sometimes complains about Tag color types in antd versions
function banningFix(v: any) {
  return v;
}

function setQS(sp: URLSearchParams, k: string, v?: string) {
  const next = new URLSearchParams(sp);
  if (!v) next.delete(k);
  else next.set(k, v);
  return next;
}

export default function OrdersPage() {
  const [sp, setSp] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AdminOrderRow[]>([]);
  const [total, setTotal] = useState(0);

  // read from querystring
  const date = (sp.get("date") as OrdersDateFilter) || "today";
  const status = sp.get("status") || "";
  const tableId = sp.get("tableId") || "";
  const q = sp.get("q") || "";
  const page = Number(sp.get("page") || "1");
  const pageSize = Number(sp.get("pageSize") || "10");

  const hasFilters = !!(status || tableId || q || date !== "today");

  const load = async () => {
    try {
      setLoading(true);
      const res = await listAdminOrders({
        date,
        status: status || undefined,
        tableId: tableId || undefined,
        q: q || undefined,
        page,
        pageSize,
      });
      setRows(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch (e: any) {
      message.error(e?.message || "Load orders failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, status, tableId, q, page, pageSize]);

  const showing = useMemo(() => {
    if (total === 0) return "0";
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(total, page * pageSize);
    return `${from}-${to} / ${total}`;
  }, [total, page, pageSize]);

  const onChangeFilter = (k: string, v?: string) => {
    let next = setQS(sp, k, v);

    // changing any filter resets page
    next = setQS(next, "page", "1");
    setSp(next);
  };

  const onChangePaging = (p: number, ps: number) => {
    let next = setQS(sp, "page", String(p));
    next = setQS(next, "pageSize", String(ps));
    setSp(next);
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    next.set("date", "today");
    next.set("page", "1");
    next.set("pageSize", String(pageSize));
    setSp(next);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-xl font-semibold">Orders</div>
          <div className="text-sm text-slate-500">Filter, search and monitor orders</div>
        </div>

        {hasFilters ? (
          <Button onClick={clearFilters} icon={<X className="w-4 h-4" />} className="rounded-xl">
            Clear filters
          </Button>
        ) : null}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-3">
            <div className="text-xs text-slate-500 mb-1">Date</div>
            <Select
              value={date}
              options={DATE_OPTIONS}
              onChange={(v) => onChangeFilter("date", v)}
              className="w-full"
            />
          </div>

          <div className="md:col-span-3">
            <div className="text-xs text-slate-500 mb-1">Status</div>
            <Select
              value={status}
              options={STATUS_OPTIONS}
              onChange={(v) => onChangeFilter("status", v)}
              className="w-full"
            />
          </div>

          <div className="md:col-span-3">
            <div className="text-xs text-slate-500 mb-1">Table (ID)</div>
            <Input
              value={tableId}
              onChange={(e) => onChangeFilter("tableId", e.target.value)}
              placeholder="tableId (optional)"
              allowClear
            />
          </div>

          <div className="md:col-span-3">
            <div className="text-xs text-slate-500 mb-1">Search</div>
            <Input
              value={q}
              onChange={(e) => onChangeFilter("q", e.target.value)}
              prefix={<Search className="w-4 h-4 text-slate-400" />}
              placeholder="Order ID hoặc Table number"
              allowClear
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-600">Showing: {showing}</div>
        </div>

        {loading ? (
          <div className="py-14 flex items-center justify-center">
            <Spin />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3 w-[230px]">Order ID</th>
                  <th className="text-left font-medium px-4 py-3 w-[110px]">Table</th>
                  <th className="text-left font-medium px-4 py-3">Items</th>
                  <th className="text-right font-medium px-4 py-3 w-[140px]">Total</th>
                  <th className="text-left font-medium px-4 py-3 w-[170px]">Status</th>
                  <th className="text-left font-medium px-4 py-3 w-[150px]">Time</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No orders
                    </td>
                  </tr>
                ) : (
                  rows.map((o) => (
                    <OrderRow key={o.orderId} row={o} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-end">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            pageSizeOptions={[5, 10, 20, 50]}
            onChange={onChangePaging}
          />
        </div>
      </div>
    </div>
  );
}

function OrderRow({ row }: { row: AdminOrderRow }) {
  const time =
    row.submittedAt ? dayjs(row.submittedAt) : row.createdAt ? dayjs(row.createdAt) : null;

  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3">
        <div className="font-medium text-slate-900">{row.orderId}</div>
      </td>

      <td className="px-4 py-3">
        <div className="font-medium">#{row.tableNumber}</div>
      </td>

      <td className="px-4 py-3">
        <div className="text-slate-900">
          {(row.items ?? []).slice(0, 3).map((it, idx) => (
            <span key={idx} className="inline-block mr-2">
              {it.name} <span className="text-slate-500">x{it.qty}</span>
            </span>
          ))}
          {(row.items ?? []).length > 3 ? (
            <span className="text-slate-500">+{(row.items ?? []).length - 3} more</span>
          ) : null}
        </div>
      </td>

      <td className="px-4 py-3 text-right font-semibold">
        {formatMoneyFromCents(row.totalCents)}
      </td>

      <td className="px-4 py-3">
        <StatusPill status={row.status} />
      </td>

      <td className="px-4 py-3 text-slate-700">
        {time ? time.format("HH:mm DD/MM") : "—"}
      </td>
    </tr>
  );
}
