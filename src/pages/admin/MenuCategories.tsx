import { useEffect, useMemo, useState, useRef } from "react";
import {
  Search,
  Plus,
  ArrowUpDown,
  Edit2,
  Power,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { message } from "antd";
import {
  createAdminCategory,
  getAdminCategories,
  patchAdminCategoryStatus,
  updateAdminCategory,
} from "../../api/admin/menu";
import type { CategoryStatus, MenuCategory } from "../../types/menu";
import { CategoryFormModal } from "../../components/menu/CategoryFormModal";
import { ConfirmModal } from "../../components/ConfirmModal";

const LIMIT_OPTIONS = [10, 20, 50];

function errMsg(e: any, fallback: string) {
  return e?.response?.data?.message ?? e?.message ?? fallback;
}

export default function MenuCategories() {
  const [msgApi, msgCtx] = message.useMessage();

  const [rows, setRows] = useState<MenuCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<CategoryStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"displayOrder" | "name" | "createdAt">(
    "displayOrder"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<MenuCategory | null>(null);
  const [formError, setFormError] = useState<{
    field?: "name";
    message: string;
  } | null>(null);

  const reqIdRef = useRef(0);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  async function load() {
    const reqId = ++reqIdRef.current;
    setLoadingList(true);

    try {
      const res = await getAdminCategories({
        q: q || undefined,
        status: status === "all" ? undefined : status,
        sortBy,
        sortDir,
        page,
        limit,
      });

      if (reqId !== reqIdRef.current) return;
      setRows(res.items);
      setTotal(res.total);
    } catch (e: any) {
      if (reqId !== reqIdRef.current) return;
      msgApi.error(errMsg(e, "Failed to load categories"));
    } finally {
      if (reqId === reqIdRef.current) setLoadingList(false);
    }
  }

  useEffect(() => {
    load();
  }, [q, status, sortBy, sortDir, page, limit]);

  function openCreate() {
    setFormError(null);
    setModalMode("create");
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(cat: MenuCategory) {
    setFormError(null);
    setModalMode("edit");
    setEditing(cat);
    setModalOpen(true);
  }

  async function handleSave(values: any) {
    setSaving(true);
    setFormError(null);

    try {
      if (modalMode === "create") {
        await createAdminCategory(values);
        msgApi.success("Category created");
      } else if (editing?._id) {
        await updateAdminCategory(editing._id, values);
        msgApi.success("Category updated");
      }

      setModalOpen(false);
      await load();
    } catch (e: any) {
      const msg = errMsg(e, "Save failed");
      if (e?.response?.status === 409) {
        setFormError({ field: "name", message: msg });
        return;
      }
      msgApi.error(msg);
    } finally {
      setSaving(false);
    }
  }

  function requestToggleStatus(cat: MenuCategory) {
    if (cat.status === "active") {
      setDeactCat(cat);
      setDeactOpen(true);
      return;
    }
    void doToggleStatus(cat);
  }

  async function doToggleStatus(cat: MenuCategory) {
    const next: CategoryStatus = cat.status === "active" ? "inactive" : "active";

    setRows((prev) =>
      prev.map((r) => (r._id === cat._id ? { ...r, status: next } : r))
    );

    try {
      await patchAdminCategoryStatus(cat._id, next);
      msgApi.success(
        next === "active" ? "Category activated" : "Category deactivated"
      );
    } catch (e: any) {
      setRows((prev) => prev.map((r) => (r._id === cat._id ? cat : r)));
      msgApi.error(errMsg(e, "Failed to change status"));
    }
  }

  const [deactOpen, setDeactOpen] = useState(false);
  const [deactCat, setDeactCat] = useState<MenuCategory | null>(null);
  const [deactLoading, setDeactLoading] = useState(false);

  async function confirmDeactivate() {
    if (!deactCat) return;
    setDeactLoading(true);
    try {
      await doToggleStatus(deactCat);
      setDeactOpen(false);
      setDeactCat(null);
    } finally {
      setDeactLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 md:p-6 font-sans text-slate-900">
      {msgCtx}

      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Menu Categories
            </h1>
            <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">
              Manage category visibility and display order.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 gap-2 bg-[#1A2F2F] hover:bg-[#E2B13C] hover:text-[#1A2F2F] rounded-xl text-sm font-bold text-white transition-all shadow-md active:scale-95"
          >
            <Plus size={18} />
            Add Category
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              placeholder="Search categories..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#E2B13C]/20 focus:bg-white transition-all outline-none"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value as any);
              }}
              className="flex-1 sm:w-40 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none cursor-pointer hover:border-slate-300 transition-colors"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 sm:w-44 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none cursor-pointer hover:border-slate-300 transition-colors"
            >
              <option value="displayOrder">Sort: Order</option>
              <option value="name">Sort: Name</option>
            </select>

            <button
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              className="p-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ArrowUpDown
                size={18}
                className={`transition-transform duration-300 ${
                  sortDir === "desc" ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1A2F2F] text-white">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">
                    Details
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-center">
                    Visibility
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-center">
                    Order
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loadingList ? (
                  <LoadingSkeleton count={limit} />
                ) : rows.length === 0 ? (
                  <TableEmptyRow colSpan={4} />
                ) : (
                  rows.map((cat) => (
                    <tr
                      key={cat._id}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#1A2F2F] text-base">
                          {cat.name}
                        </div>
                        {cat.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1 max-w-xs">
                            {cat.description}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={cat.status} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-mono font-black text-slate-400">
                          #{cat.displayOrder ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(cat)}
                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <StatusToggle cat={cat} onToggle={requestToggleStatus} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {loadingList ? (
              <LoadingSkeleton count={3} mobile />
            ) : rows.length === 0 ? (
              <EmptyState />
            ) : (
              rows.map((cat) => (
                <div key={cat._id} className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="font-bold text-[#1A2F2F] text-lg">
                        {cat.name}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {cat.description}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-black bg-slate-100 px-2 py-1 rounded text-slate-500">
                      #{cat.displayOrder}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <StatusBadge status={cat.status} />
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-2.5 bg-slate-100 text-slate-600 rounded-xl"
                      >
                        <Edit2 size={18} />
                      </button>
                      <StatusToggle cat={cat} onToggle={requestToggleStatus} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-5 border-t border-slate-100 bg-white gap-4">
            <div className="text-[11px] text-slate-400 font-black uppercase tracking-widest order-2 sm:order-1">
              {total} Categories Total
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 order-1 sm:order-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Rows
                </span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setPage(1);
                    setLimit(Number(e.target.value));
                  }}
                  className="bg-slate-50 text-xs font-bold text-[#1A2F2F] outline-none cursor-pointer border border-slate-200 rounded-lg px-2 py-1"
                >
                  {LIMIT_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 text-slate-400 hover:text-slate-900 disabled:opacity-20 transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="text-xs font-black text-slate-700 min-w-[60px] text-center bg-slate-100 py-1 rounded-full">
                  {page} / {totalPages}
                </div>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2 text-slate-400 hover:text-slate-900 disabled:opacity-20 transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CategoryFormModal
        open={modalOpen}
        mode={modalMode}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        loading={saving}
        serverFieldError={formError}
      />

      <ConfirmModal
        open={deactOpen}
        title="Deactivate category?"
        description={
          deactCat
            ? `Deactivate "${deactCat.name}"? It will be hidden from the menu until you reactivate it.`
            : "This will hide the category from the menu."
        }
        confirmText="Deactivate"
        cancelText="Cancel"
        tone="warning"
        loading={deactLoading}
        onClose={() =>
          !deactLoading ? (setDeactOpen(false), setDeactCat(null)) : null
        }
        onConfirm={confirmDeactivate}
      />
    </div>
  );
}

const StatusBadge = ({ status }: { status: CategoryStatus }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
      status === "active"
        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
        : "bg-rose-50 text-rose-700 border-rose-100"
    }`}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full ${
        status === "active" ? "bg-emerald-500" : "bg-rose-500"
      }`}
    />
    {status}
  </span>
);

const StatusToggle = ({
  cat,
  onToggle,
}: {
  cat: MenuCategory;
  onToggle: any;
}) => (
  <button
    onClick={() => onToggle(cat)}
    className={`p-2 rounded-lg transition-all border shadow-sm ${
      cat.status === "active"
        ? "bg-rose-500 text-white border-rose-600 hover:bg-rose-600"
        : "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600"
    }`}
  >
    <Power size={16} />
  </button>
);

const TableEmptyRow = ({ colSpan }: { colSpan: number }) => (
  <tr>
    <td colSpan={colSpan} className="px-6 py-16 text-center">
      <div className="mx-auto w-12 h-12 bg-slate-50 flex items-center justify-center rounded-full mb-3">
        <Filter className="text-slate-300" size={24} />
      </div>
      <p className="text-slate-400 text-sm font-medium">
        No categories matching your filters.
      </p>
    </td>
  </tr>
);

const EmptyState = () => (
  <div className="px-6 py-16 text-center">
    <div className="mx-auto w-12 h-12 bg-slate-50 flex items-center justify-center rounded-full mb-3">
      <Filter className="text-slate-300" size={24} />
    </div>
    <p className="text-slate-400 text-sm font-medium">
      No categories matching your filters.
    </p>
  </div>
);

const LoadingSkeleton = ({
  count,
  mobile,
}: {
  count: number;
  mobile?: boolean;
}) => (
  <>
    {Array.from({ length: count }).map((_, i) =>
      mobile ? (
        <div key={i} className="p-5 space-y-4 animate-pulse">
          <div className="h-6 bg-slate-100 rounded-md w-1/3" />
          <div className="h-4 bg-slate-50 rounded-md w-full" />
          <div className="flex justify-between pt-2">
            <div className="h-6 bg-slate-100 rounded-full w-20" />
            <div className="flex gap-2">
              <div className="w-10 h-10 bg-slate-100 rounded-xl" />
              <div className="w-10 h-10 bg-slate-100 rounded-xl" />
            </div>
          </div>
        </div>
      ) : (
        <tr key={i} className="animate-pulse">
          <td colSpan={4} className="px-6 py-6 border-b border-slate-50">
            <div className="h-10 bg-slate-50/50 rounded-lg w-full" />
          </td>
        </tr>
      )
    )}
  </>
);
