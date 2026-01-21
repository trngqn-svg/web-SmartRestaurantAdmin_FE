import { useEffect, useMemo, useState } from "react";
import { Input, Pagination, Select, Tag, message, Spin, Button } from "antd";
import { Search, X, Monitor } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Preparing", value: "preparing" },
  { label: "Ready", value: "ready" },
  { label: "Ready to service", value: "ready_to_service" },
  { label: "Served", value: "served" },
  { label: "Cancelled", value: "cancelled" },
];

function banningFix(v: any) {
  return v;
}

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

function setQS(sp: URLSearchParams, k: string, v?: string) {
  const next = new URLSearchParams(sp);
  if (!v) next.delete(k);
  else next.set(k, v);
  return next;
}

function getOrderTime(row: AdminOrderRow) {
  const t =
    row.submittedAt ? dayjs(row.submittedAt) : row.createdAt ? dayjs(row.createdAt) : null;
  return t;
}

function buildItemsSummary(row: AdminOrderRow) {
  const items = row.items ?? [];
  const head = items.slice(0, 3).map((it) => `${it.name} x${it.qty}`);
  const more = items.length > 3 ? ` +${items.length - 3} more` : "";
  return head.join(", ") + more;
}

export default function OrdersPage() {
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AdminOrderRow[]>([]);
  const [total, setTotal] = useState(0);

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
  }, [date, status, tableId, q, page, pageSize]);

  const showing = useMemo(() => {
    if (total === 0) return "0";
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(total, page * pageSize);
    return `${from}-${to} / ${total}`;
  }, [total, page, pageSize]);

  const onChangeFilter = (k: string, v?: string) => {
    let next = setQS(sp, k, v);
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
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Orders
          </div>
          <div className="text-sm font-semibold text-slate-500">Manage your orders</div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => nav("/monitor/kds")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Monitor className="h-4 w-4" />
              <span>Open KDS</span>
            </button>

            <button
              onClick={() => nav("/monitor/waiter")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-[#E2B13C] hover:text-slate-900"
            >
              <Monitor className="h-4 w-4" />
              <span>Open Waiter</span>
            </button>
          </div>

          {hasFilters ? (
            <Button onClick={clearFilters} icon={<X className="w-4 h-4" />} className="rounded-xl">
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 lg:col-span-7">
            <div className="text-xs text-slate-500 mb-1">Search</div>
            <Input
              value={q}
              onChange={(e) => onChangeFilter("q", e.target.value)}
              prefix={<Search className="w-4 h-4 text-slate-400" />}
              placeholder="Input Order ID or Table number"
              allowClear
            />
          </div>

          <div className="md:col-span-3 lg:col-span-2">
            <div className="text-xs text-slate-500 mb-1">Date</div>
            <Select
              value={date}
              options={DATE_OPTIONS}
              onChange={(v) => onChangeFilter("date", v)}
              className="w-full"
            />
          </div>

          <div className="md:col-span-3 lg:col-span-3">
            <div className="text-xs text-slate-500 mb-1">Status</div>
            <Select
              value={status}
              options={STATUS_OPTIONS}
              onChange={(v) => onChangeFilter("status", v)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* List/Table container */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-600">Total: {showing}</div>
        </div>

        {loading ? (
          <div className="py-14 flex items-center justify-center">
            <Spin />
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-10 text-center text-slate-500">No orders</div>
        ) : (
          <>
            {/* MOBILE: cards (no overflow/tràn) */}
            <div className="md:hidden divide-y divide-slate-100">
              {rows.map((row) => (
                <OrderCard key={row.orderId} row={row} />
              ))}
            </div>

            {/* DESKTOP: table */}
            <div className="hidden md:block w-full overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left font-medium px-4 py-3 w-[230px]">Order ID</th>
                    <th className="text-left font-medium px-4 py-3 w-[110px] whitespace-nowrap">
                      Table
                    </th>
                    <th className="text-left font-medium px-4 py-3">Items</th>
                    <th className="text-right font-medium px-4 py-3 w-[140px] whitespace-nowrap">
                      Total
                    </th>
                    <th className="text-left font-medium px-4 py-3 w-[170px]">Status</th>
                    <th className="text-left font-medium px-4 py-3 w-[150px] whitespace-nowrap">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => (
                    <OrderRowDesktop key={o.orderId} row={o} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="px-4 py-3 border-t border-slate-200 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            responsive
            pageSizeOptions={[5, 10, 20, 50]}
            onChange={onChangePaging}
          />
        </div>
      </div>
    </div>
  );
}

/** MOBILE card */
function OrderCard({ row }: { row: AdminOrderRow }) {
  const time = getOrderTime(row);
  const itemsSummary = buildItemsSummary(row);

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm font-extrabold text-slate-900 whitespace-nowrap">
              Table #{row.tableNumber}
            </div>
            <div className="shrink-0">
              <StatusPill status={row.status} />
            </div>
          </div>

          <div className="mt-1 text-xs text-slate-500 font-mono break-all">
            {row.orderId}
          </div>

          <div className="mt-2 text-sm text-slate-800">
            <div className="line-clamp-2">{itemsSummary}</div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-sm font-bold text-slate-900 whitespace-nowrap">
            {formatMoneyFromCents(row.totalCents)}
          </div>
          <div className="mt-1 text-xs text-slate-500 whitespace-nowrap">
            {time ? time.format("HH:mm DD/MM") : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

/** DESKTOP row */
function OrderRowDesktop({ row }: { row: AdminOrderRow }) {
  const time = getOrderTime(row);

  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3">
        <div className="font-medium text-slate-900">{row.orderId}</div>
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
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

      <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
        {formatMoneyFromCents(row.totalCents)}
      </td>

      <td className="px-4 py-3">
        <StatusPill status={row.status} />
      </td>

      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
        {time ? time.format("HH:mm DD/MM") : "—"}
      </td>
    </tr>
  );
}
