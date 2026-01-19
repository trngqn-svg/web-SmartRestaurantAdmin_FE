import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "../Modal";
import type { ItemStatus, MenuItem } from "../../types/menuItem";
import type { MenuCategory } from "../../types/menu";
import { getCategoryId } from "../../utils/getCategoryId";
import { AlertCircle, Star, Clock, DollarSign, Loader2 } from "lucide-react";

type FormValues = {
  name: string;
  categoryId: string;
  price: number;
  description?: string;
  prepTimeMinutes?: number;
  status: ItemStatus;
  isChefRecommended?: boolean;
};

export function ItemFormModal({
  open,
  mode,
  initial,
  categories,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial: MenuItem | null;
  categories: MenuCategory[];
  onClose: () => void;
  onSubmit: (values: FormValues) => Promise<void> | void;
  loading?: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      categoryId: "",
      price: 1,
      description: "",
      prepTimeMinutes: 0,
      status: "available",
      isChefRecommended: false,
    },
  });

  const isRecommended = watch("isChefRecommended");

  useEffect(() => {
    if (!open) return;
    reset({
      name: initial?.name ?? "",
      categoryId: getCategoryId(initial?.categoryId),
      price: initial?.price ?? 1,
      description: initial?.description ?? "",
      prepTimeMinutes: initial?.prepTimeMinutes ?? 0,
      status: initial?.status ?? "available",
      isChefRecommended: initial?.isChefRecommended ?? false,
    });
  }, [open, initial?._id, reset]);

  const inputClasses = `
    w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm 
    outline-none transition-all duration-200 
    focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10
  `;
  const labelClasses = "mb-1 block text-[11px] font-bold uppercase tracking-tight text-slate-400 ml-1";

  return (
    <Modal
      open={open}
      title={mode === "create" ? "New Creation" : "Edit Item"}
      onClose={onClose}
    >
      <form
        className="flex flex-col h-full max-h-[85vh] bg-white" 
        onSubmit={handleSubmit((v) => onSubmit(v))}
      >
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 custom-scrollbar min-h-0">
          
          {/* Section: Main Info */}
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Dish Name</label>
              <div className="relative">
                <input
                  placeholder="e.g. Wagyu Beef Burger"
                  className={`${inputClasses} ${errors.name ? "border-red-300 ring-red-500/10" : ""}`}
                  {...register("name", { required: "Name is required" })}
                />
                {errors.name && (
                  <div className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500 ml-1">
                    <AlertCircle size={12} /> {errors.name.message}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Category</label>
                <select
                  className={`${inputClasses} ${errors.categoryId ? "border-red-300 ring-red-500/10" : ""}`}
                  {...register("categoryId", { required: "Please select a category" })}
                >
                  <option value="">Select...</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {errors.categoryId && (
                  <div className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500 ml-1">
                    <AlertCircle size={12} />
                    {errors.categoryId.message}
                  </div>
                )}
              </div>

              <div>
                <label className={labelClasses}>Price</label>
                <div className="relative flex items-center">
                  <DollarSign size={14} className="absolute left-3.5 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    className={`${inputClasses} pl-8 font-semibold ${
                      errors.price ? "border-red-300 ring-red-500/10" : ""
                    }`}
                    {...register("price", {
                      valueAsNumber: true,
                      required: "Price is required",
                      min: {
                        value: 0.01,
                        message: "Price must be greater than 0",
                      },
                    })}
                  />
                </div>

                {errors.price && (
                  <div className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500 ml-1">
                    <AlertCircle size={12} />
                    {errors.price.message}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section: Secondary Info (Soft Card) */}
          <div className="rounded-2xl bg-slate-50/80 p-4 space-y-4 border border-slate-100">
            <div>
              <label className={labelClasses}>Description</label>
              <textarea
                rows={2}
                placeholder="Brief details about this dish..."
                className={`${inputClasses} bg-white resize-none`}
                {...register("description")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Time (Min)</label>
                <div className="relative">
                  <Clock
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="number"
                    className={`${inputClasses} bg-white pl-9 ${
                      errors.prepTimeMinutes ? "border-red-300 ring-red-500/10" : ""
                    }`}
                    {...register("prepTimeMinutes", {
                      valueAsNumber: true,
                      required: "Preparation time is required",
                      min: {
                        value: 1,
                        message: "Time must be greater than 0",
                      },
                    })}
                  />
                </div>

                {errors.prepTimeMinutes && (
                  <div className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500 ml-1">
                    <AlertCircle size={12} />
                    {errors.prepTimeMinutes.message}
                  </div>
                )}
              </div>

              <div>
                <label className={labelClasses}>Status</label>
                <select className={`${inputClasses} bg-white font-medium`} {...register("status")}>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                  <option value="sold_out">Sold Out</option>
                </select>
              </div>
            </div>
          </div>

          {/* Toggle Area */}
          <div className={`
            flex items-center justify-between p-4 rounded-xl border transition-all
            ${isRecommended ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-slate-100'}
          `}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isRecommended ? 'bg-white shadow-sm' : 'bg-slate-50'}`}>
                <Star className={isRecommended ? "fill-amber-400 text-amber-400" : "text-slate-300"} size={18} />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-bold text-slate-700">Chef's Selection</p>
                <p className="text-[11px] text-slate-400">Highlight on main menu</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" {...register("isChefRecommended")} />
              <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2.5px] after:left-[2.5px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
            </label>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-5 border-t border-slate-100 bg-white">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-400 transition-colors hover:text-slate-600 active:scale-95"
            >
              Cancel
            </button>
            <button
              disabled={loading}
              type="submit"
              className="flex-1 items-center justify-center min-w-[120px] px-6 py-2.5 rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                "Save Item"
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}