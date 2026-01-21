import { useEffect, useMemo, useState } from "react";
import { message, Modal } from "antd";
import dayjs from "dayjs";
import { Star, Trash2, ChevronDown } from "lucide-react";

import { adminDeleteReview, adminGetItemReviews, type ListReviewsRes } from "../../api/customer/review";
import { fileAppUrl } from "../../utils/fileAppUrl";

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

type SortKey = "latest" | "highest" | "lowest";

export default function ReviewsSection({ itemId }: { itemId: string }) {
  const [data, setData] = useState<ListReviewsRes | null>(null);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [sort, setSort] = useState<SortKey>("latest");

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    if (!itemId) return;
    setLoading(true);
    try {
      const res = await adminGetItemReviews(itemId, { page, limit, sort });
      setData(res);
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? e?.message ?? "Load reviews failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, page, limit, sort]);

  const ratingAvg = Number(data?.summary?.ratingAvg ?? 0);
  const ratingCount = Number(data?.summary?.ratingCount ?? 0);

  const reviews = data?.reviews ?? [];
  const total = Number(data?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const breakdown = useMemo(() => {
    const b = data?.summary?.ratingBreakdown ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    // ensure keys as strings "1".."5"
    const get = (k: "1" | "2" | "3" | "4" | "5") => Number((b as any)[k] ?? 0);
    return { get };
  }, [data?.summary?.ratingBreakdown]);

  async function doDelete(reviewId: string) {
    setDeletingId(reviewId);
    try {
      await adminDeleteReview(reviewId);
      message.success("Deleted review");
      setConfirmId(null);

      // reload current page; if page becomes empty, go back one page
      // best-effort
      const nextTotal = Math.max(0, total - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / limit));
      if (page > nextTotalPages) setPage(nextTotalPages);
      else await load();
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? e?.message ?? "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-end justify-between">
        <div className="text-sm font-semibold text-slate-800">
          Reviews
          <div className="text-xs font-normal text-gray-500">
            {ratingCount} review(s) • Avg {ratingAvg.toFixed(2)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SortSelect value={sort} onChange={(v) => { setPage(1); setSort(v); }} />
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-slate-100 bg-white p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stars value={ratingAvg} />
            <div className="text-sm font-semibold text-slate-800">{ratingAvg.toFixed(2)}</div>
          </div>
          <div className="text-xs text-slate-500">{ratingCount} total</div>
        </div>

        {/* Breakdown */}
        <div className="mt-3 space-y-2">
          {(["5", "4", "3", "2", "1"] as const).map((k) => {
            const count = breakdown.get(k);
            const pct = ratingCount === 0 ? 0 : Math.round((count / ratingCount) * 100);
            return (
              <div key={k} className="flex items-center gap-2">
                <div className="w-10 text-xs text-slate-500">{k}★</div>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-orange-400" style={{ width: `${pct}%` }} />
                </div>
                <div className="w-12 text-right text-xs text-slate-500">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3">
        {loading ? (
          <div className="text-sm text-slate-400">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-sm text-slate-400">No reviews yet.</div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <ReviewCard
                key={r.id}
                r={r}
                onDelete={() => setConfirmId(r.id)}
                deleting={deletingId === r.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Paging */}
      {total > 0 ? (
        <div className="mt-3 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Page {page} / {totalPages}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold border",
                page <= 1 || loading ? "border-slate-200 text-slate-300" : "border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
            >
              Prev
            </button>

            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold border",
                page >= totalPages || loading ? "border-slate-200 text-slate-300" : "border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
            >
              Next
            </button>

            <LimitSelect value={limit} onChange={(v) => { setPage(1); setLimit(v); }} />
          </div>
        </div>
      ) : null}

      {/* Confirm delete */}
      <Modal
        open={!!confirmId}
        title="Delete review?"
        onCancel={() => (deletingId ? null : setConfirmId(null))}
        onOk={() => (confirmId ? doDelete(confirmId) : null)}
        okText={deletingId ? "Deleting..." : "Delete"}
        okButtonProps={{ danger: true, disabled: !!deletingId }}
        cancelButtonProps={{ disabled: !!deletingId }}
      >
        <div className="text-sm text-slate-600">
          This action can’t be undone.
        </div>
      </Modal>
    </div>
  );
}

/* -------------------- Sub components -------------------- */

function Stars({ value = 0 }: { value?: number }) {
  const n = Math.max(0, Math.min(5, Math.round(Number(value || 0))));
  return (
    <span className="inline-flex items-center gap-0.5 text-orange-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn("h-4 w-4", i < n && "fill-current")} />
      ))}
    </span>
  );
}

function ReviewCard({
  r,
  onDelete,
  deleting,
}: {
  r: ListReviewsRes["reviews"][number];
  onDelete: () => void;
  deleting: boolean;
}) {
  const name = r.user?.name ?? "Guest";
  const avatar = r.user?.avatarUrl ?? null;
  const date = r.createdAt ? dayjs(r.createdAt).format("DD/MM/YYYY") : "";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 shrink-0 rounded-full bg-slate-100 overflow-hidden">
            {avatar ? (
              <img src={avatar.startsWith("http") ? avatar : fileAppUrl(avatar)} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[11px] font-bold text-slate-400">
                {String(name || "G").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-slate-800">{name}</div>
            <div className="text-[11px] text-slate-400">{date}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Stars value={r.rating} />
          <button
            type="button"
            disabled={deleting}
            onClick={onDelete}
            className={cn(
              "h-9 w-9 rounded-xl border flex items-center justify-center",
              deleting ? "border-slate-200 text-slate-300" : "border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200"
            )}
            aria-label="Delete review"
            title="Delete review"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-2 text-[13px] text-slate-600 leading-5">
        {r.comment?.trim() ? r.comment : <span className="text-slate-400">No comment.</span>}
      </div>

      {r.photoUrls?.length ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {r.photoUrls.slice(0, 6).map((u, idx) => {
            const src = u.startsWith("http") ? u : fileAppUrl(u);
            return (
              <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                <img src={src} alt={`review-${idx}`} className="h-full w-full object-cover" />
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function SortSelect({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const [open, setOpen] = useState(false);

  const label =
    value === "latest" ? "Latest" : value === "highest" ? "Highest" : "Lowest";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        {label}
        <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg z-20">
          {(["latest", "highest", "lowest"] as SortKey[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                onChange(k);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50",
                value === k ? "text-slate-900" : "text-slate-600"
              )}
            >
              {k === "latest" ? "Latest" : k === "highest" ? "Highest" : "Lowest"}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function LimitSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
    >
      {[5, 10, 20].map((n) => (
        <option key={n} value={n}>
          {n}/page
        </option>
      ))}
    </select>
  );
}
