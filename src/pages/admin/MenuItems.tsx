import { useEffect, useMemo, useState } from "react";
import type { MenuItem, ItemStatus } from "../../types/menuItem";
import { getAdminItems, createAdminItem, updateAdminItem, deleteAdminItem } from "../../api/admin/menuItem";
import { getAdminCategories } from "../../api/admin/menu";
import type { MenuCategory } from "../../types/menu";
import { ItemFormModal } from "../../components/menu/ItemFormModal";
import { fileUrl } from "../../utils/fileUrl";
import { ItemPhotosModal } from "../../components/menu/ItemPhotosModal";
import { ItemModifiersModal } from "../../components/menu/ItemModifiersModal";
import { ConfirmModal } from "../../components/ConfirmModal";
import { 
  Search, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Package, 
  Clock, 
  Tag, 
  ArrowUpDown, 
  Edit3,
  Trash2,
  Layers,
} from "lucide-react";

const LIMIT_OPTIONS = [12, 24, 48];

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  available: { label: "Available", color: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  unavailable: { label: "Unavailable", color: "bg-gray-50 text-gray-600 border-gray-100", dot: "bg-gray-400" },
  sold_out: { label: "Sold Out", color: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500" },
};

type SortKey = "createdAt" | "price" | "popularity";

export default function MenuItems() {
  const [rows, setRows] = useState<MenuItem[]>([]);
  const [total, setTotal] = useState(0);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [status, setStatus] = useState<ItemStatus | "all">("all");
  const [sort, setSort] = useState<SortKey>("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [cats, setCats] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [photosOpen, setPhotosOpen] = useState(false);
  const [photoItem, setPhotoItem] = useState<MenuItem | null>(null);
  const [modsOpen, setModsOpen] = useState(false);
  const [modsItemId, setModsItemId] = useState<string | null>(null);

  // Logic Wrapper Functions (Preserved)
  function openPhotos(item: MenuItem) { setPhotoItem(item); setPhotosOpen(true); }
  function openMods(it: MenuItem) { setModsItemId(it._id); setModsOpen(true); }
  async function closeMods() { setModsOpen(false); setModsItemId(null); await load(); }
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);
  async function loadCats() {
    const res = await getAdminCategories({ status: "all", sortBy: "displayOrder", sortDir: "asc", page: 1, limit: 200 });
    const list = (res as any).items ?? (res as any);
    setCats(Array.isArray(list) ? list : []);
  }
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminItems({
        name: name.trim() ? name.trim() : undefined,
        categoryId: categoryId === "all" ? undefined : categoryId,
        status: status === "all" ? undefined : status,
        sort, order, page, limit,
      });
      setRows(res.items);
      setTotal(res.total);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load items");
    } finally { setLoading(false); }
  }
  async function closePhotosModal() { setPhotosOpen(false); setPhotoItem(null); await load(); }
  useEffect(() => { loadCats().catch(() => {}); }, []);
  useEffect(() => { load(); }, [name, categoryId, status, sort, order, page, limit]);

  function openCreate() { setModalMode("create"); setEditing(null); setModalOpen(true); }
  function openEdit(item: MenuItem) { setModalMode("edit"); setEditing(item); setModalOpen(true); }

  async function handleSave(values: any): Promise<void> {
    setLoading(true);
    try {
      if (modalMode === "create") { await createAdminItem(values); } 
      else { if (!editing?._id) throw new Error("Missing item id"); await updateAdminItem(editing._id, values); }
      setModalOpen(false);
      await load();
    } catch (e: any) { setError(e?.response?.data?.message ?? "Save failed"); throw e; } 
    finally { setLoading(false); }
  }

  async function handleDelete(item: MenuItem) {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try { await deleteAdminItem(item._id); await load(); } 
    catch (e: any) { setError(e?.response?.data?.message ?? "Delete failed"); }
  }

  // Handle delete
  const [delOpen, setDelOpen] = useState(false);
  const [delItem, setDelItem] = useState<MenuItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  function requestDelete(item: MenuItem) {
    setDelItem(item);
    setDelOpen(true);
  }

  async function confirmDeleteItem() {
    if (!delItem?._id) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteAdminItem(delItem._id);
      setDelOpen(false);
      setDelItem(null);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-4 md:space-y-6 bg-[#FAFAFB] min-h-screen animate-in fade-in duration-700">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Menu Management</h1>
          <p className="text-slate-500 font-medium">Manage your dishes, prices, and availability.</p>
        </div>

        <button
          onClick={openCreate}
          className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 gap-2 bg-[#1A2F2F] hover:bg-[#E2B13C] hover:text-[#1A2F2F] rounded-xl text-sm font-bold text-white transition-all shadow-md active:scale-95"
        >
          <Plus size={18} />
          <span>Add New Item</span>
        </button>
      </div>

      {/* Filters & Sorting Section */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-2 md:p-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
          {/* Search */}
          <div className="md:col-span-4 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={name}
              onChange={(e) => { setPage(1); setName(e.target.value); }}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#E2B13C]/20 focus:bg-white transition-all outline-none"
              placeholder="Search by name..."
            />
          </div>

          {/* Category */}
          <div className="md:col-span-3">
            <select
              value={categoryId}
              onChange={(e) => { setPage(1); setCategoryId(e.target.value); }}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none cursor-pointer hover:border-slate-300 transition-colors"
            >
              <option value="all">All Categories</option>
              {cats.filter((c) => c.status === "active").map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="md:col-span-2">
            <select
              value={status}
              onChange={(e) => { setPage(1); setStatus(e.target.value as any); }}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none cursor-pointer hover:border-slate-300 transition-colors"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
              <option value="sold_out">Sold Out</option>
            </select>
          </div>

          {/* Sort & Order */}
          <div className="md:col-span-3 flex gap-2">
            <div className="relative flex-1">
              <select
                value={sort}
                onChange={(e) => { setPage(1); setSort(e.target.value as any); }}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none cursor-pointer hover:border-slate-300 transition-colors"
              >
                <option value="createdAt">Date Added</option>
                <option value="price">Price Level</option>
                <option value="popularity">Popularity</option>
              </select>
            </div>
            <button
              onClick={() => setOrder((d) => (d === "asc" ? "desc" : "asc"))}
              className="px-4 py-3 bg-slate-50 text-slate-500 border-transparent rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-90"
              title="Toggle Sort Order"
            >
              <ArrowUpDown size={16} className={order === "asc" ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600 flex items-center gap-3 animate-shake">
          <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Menu Items Grid */}
      <div className="min-h-[500px]">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="bg-white rounded-[32px] border border-slate-100 p-4 space-y-4">
                <div className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
                <div className="space-y-2">
                  <div className="h-5 w-2/3 bg-slate-100 rounded animate-pulse" />
                  <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                </div>
                <div className="flex justify-between pt-2">
                  <div className="h-8 w-20 bg-slate-100 rounded-xl animate-pulse" />
                  <div className="h-8 w-20 bg-slate-100 rounded-xl animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
            <div className="p-6 bg-white rounded-3xl shadow-sm mb-6">
              <Package size={48} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">No menu items found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your filters or add a new item to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {rows.map((it) => {
              const catName = typeof it.categoryId === "object" ? it.categoryId.name : "Uncategorized";
              const statusInfo = STATUS_CONFIG[it.status] || STATUS_CONFIG.available;

              return (
                /* Menu Item Card Design */
                <div key={it._id} className="group bg-white rounded-[32px] border border-slate-200/50 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-500 flex flex-col overflow-hidden">
                  
                  {/* Image Section */}
                  <div className="relative h-52 w-full overflow-hidden p-3">
                    <div 
                      className="relative h-full w-full overflow-hidden rounded-[24px] bg-slate-100 cursor-pointer"
                      onClick={() => openPhotos(it)}
                    >
                      {it.primaryPhoto ? (
                        <img
                          src={fileUrl(it.primaryPhoto)}
                          alt={it.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center text-slate-400 gap-2">
                          <Plus size={24} className="opacity-40" />
                          <span className="text-[10px] font-bold uppercase tracking-wider italic">Add Photos</span>
                        </div>
                      )}
                      
                      {/* Availability Badge */}
                      <div className="absolute top-3 left-3">
                        <span className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-black px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-md bg-white/90 ${statusInfo.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="px-6 pb-6 pt-2 flex flex-1 flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-900 group-hover:text-[#E2B13C] transition-colors line-clamp-1 text-lg">
                          {it.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[#E2B13C] font-bold uppercase text-[10px] tracking-widest">
                          <Tag size={12} />
                          <span>{catName}</span>
                        </div>
                      </div>
                      <div className="text-xl font-black text-slate-900 drop-shadow-sm">
                        ${it.price.toFixed(2)}
                      </div>
                    </div>

                    <p className="flex-1 text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed font-normal">
                      {it.description || "Freshly prepared dish with premium ingredients..."}
                    </p>

                    {/* Minutes & Modifiers */}
                    <div className="flex items-center justify-between gap-4 mb-4 mt-auto">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-tight text-slate-400">
                        <Clock size={14} className="text-slate-300" />
                        <span>{it.prepTimeMinutes ?? 0} mins</span>
                      </div>
                      
                      <button
                        onClick={() => openMods(it)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-slate-900 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all active:scale-95"
                      >
                        <Layers size={13} />
                        Modifiers
                      </button>
                    </div>

                    {/* Edit & Delete */}
                    <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
                      <button
                        onClick={() => openEdit(it)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all active:scale-95"
                      >
                        <Edit3 size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => requestDelete(it)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-500 bg-rose-50/50 rounded-xl hover:bg-rose-50 transition-all active:scale-95 group/del"
                      >
                        <Trash2 size={14} className="group-hover/del:animate-bounce" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Container */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-200/60">
        <p className="text-sm font-medium text-slate-500">
          Showing <span className="text-slate-900 font-bold">{rows.length}</span> of <span className="text-slate-900 font-bold">{total}</span> items
        </p>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <span>Show</span>
            <select
              value={limit}
              onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}
              className="bg-white border border-slate-200 rounded-xl text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none py-2 px-3 transition-all cursor-pointer"
            >
              {LIMIT_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-3 hover:bg-slate-50 disabled:opacity-30 transition-all active:bg-slate-100"
            >
              <ChevronLeft size={20} className="text-slate-600" />
            </button>
            <div className="px-5 py-2 border-x border-slate-100 text-sm font-black text-slate-700 bg-slate-50/30">
              {page} <span className="text-slate-300 font-medium mx-1">/</span> {totalPages}
            </div>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-3 hover:bg-slate-50 disabled:opacity-30 transition-all active:bg-slate-100"
            >
              <ChevronRight size={20} className="text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals (Logic preserved) */}
      <ItemFormModal
        open={modalOpen}
        mode={modalMode}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        loading={loading}
        categories={cats.filter((c) => c.status === "active")}
      />
      <ItemPhotosModal open={photosOpen} item={photoItem} onClose={closePhotosModal} />
      <ItemModifiersModal open={modsOpen} itemId={modsItemId} onClose={closeMods} />

      <ConfirmModal
        open={delOpen}
        title="Delete item?"
        description={
          delItem
            ? `This will permanently delete "${delItem.name}". This action cannot be undone.`
            : "This action cannot be undone."
        }
        confirmText="Delete"
        cancelText="Cancel"
        tone="danger"
        loading={deleting}
        onClose={() => (!deleting ? (setDelOpen(false), setDelItem(null)) : null)}
        onConfirm={confirmDeleteItem}
      />
    </div>
  );
}