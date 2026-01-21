import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { message } from "antd";
import { Modal } from "../Modal";
import type {
  ModifierGroup,
  ModifierOption,
  ModifierSelectionType,
  ModifierStatus,
} from "../../types/menuModifiers";
import {
  getAllModifierGroups,
  getModifierOptions,
  getAdminItemDetails,
} from "../../api/admin/menuModifiers.read";
import {
  createModifierGroup,
  createModifierOption,
  updateModifierOption,
  setItemModifierGroups,
  deleteModifierGroup,
  deleteModifierOption,
} from "../../api/admin/menuModifiers";
import {
  Plus,
  Trash2,
  Settings2,
  CheckCircle2,
  Link,
  Unlink,
  Loader2,
  AlertCircle,
} from "lucide-react";

/** ---------- helpers ---------- */

function getServerMsg(e: any, fallback: string) {
  const msg = e?.response?.data?.message ?? e?.message ?? fallback;
  if (Array.isArray(msg)) return msg.join(", ");
  return String(msg);
}

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function clampInt(n: any, min: number, max: number) {
  const x = Number.isFinite(Number(n)) ? Math.trunc(Number(n)) : min;
  return Math.max(min, Math.min(max, x));
}

function Toggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={cx(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none",
        disabled ? "opacity-60 cursor-not-allowed" : "active:scale-[0.99]",
        value ? "bg-indigo-600" : "bg-gray-200"
      )}
    >
      <span
        className={cx(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200",
          value ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

type CreateGroupForm = {
  name: string;
  selectionType: ModifierSelectionType;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  displayOrder: number;
  status: ModifierStatus;
};

type ConfirmState =
  | null
  | { type: "group"; groupId: string; title: string; desc?: string }
  | {
      type: "option";
      groupId: string;
      optionId: string;
      title: string;
      desc?: string;
    };

/** ---------- component ---------- */

export function ItemModifiersModal({
  open,
  itemId,
  onClose,
}: {
  open: boolean;
  itemId: string | null;
  onClose: () => void | Promise<void>;
}) {
  const [messageApi, contextHolder] = message.useMessage();

  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [optionsMap, setOptionsMap] = useState<Record<string, ModifierOption[]>>(
    {}
  );
  const [attached, setAttached] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [savingAttach, setSavingAttach] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);

  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [newOptName, setNewOptName] = useState("");
  const [newOptPrice, setNewOptPrice] = useState<number>(0);
  const [newOptStatus, setNewOptStatus] =
    useState<ModifierStatus>("active");

  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [confirming, setConfirming] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const form = useForm<CreateGroupForm>({
    mode: "onChange",
    defaultValues: {
      name: "",
      selectionType: "single",
      isRequired: false,
      minSelections: 0,
      maxSelections: 0,
      displayOrder: 0,
      status: "active",
    },
  });

  const selectionType = form.watch("selectionType");
  const isRequired = form.watch("isRequired");

  const attachedSet = useMemo(() => new Set(attached), [attached]);

  /** ---------- effects ---------- */

  useEffect(() => {
    if (showCreate) {
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [showCreate]);

  useEffect(() => {
    // keep form constraints coherent
    if (selectionType === "single") {
      form.setValue("minSelections", 0);
      form.setValue("maxSelections", 0);
      return;
    }

    // multiple
    const minNow = form.getValues("minSelections");
    if (isRequired && minNow < 1) form.setValue("minSelections", 1);
    const maxNow = form.getValues("maxSelections");
    if (maxNow < 0) form.setValue("maxSelections", 0);
  }, [selectionType, isRequired]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) {
      // reset local state when closing
      setGroups([]);
      setOptionsMap({});
      setAttached([]);
      setLoading(false);
      setSavingAttach(null);

      setShowCreate(false);
      setAddingFor(null);
      setNewOptName("");
      setNewOptPrice(0);
      setNewOptStatus("active");

      setConfirmState(null);
      setConfirming(false);

      form.reset();
      return;
    }

    // open => load
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, itemId]);

  /** ---------- data ops ---------- */

  async function refresh() {
    if (!itemId) return;

    setLoading(true);

    try {
      const [allGroups, item] = await Promise.all([
        getAllModifierGroups("all"),
        getAdminItemDetails(itemId),
      ]);

      setGroups(allGroups);

      const groupIds: string[] = (item.modifierGroupIds ?? []).map((x: any) =>
        String(x)
      );
      setAttached(groupIds);

      const entries = await Promise.all(
        allGroups.map(async (g) => {
          const opts = await getModifierOptions(g._id, "all");
          return [g._id, opts] as const;
        })
      );
      setOptionsMap(Object.fromEntries(entries));
    } catch (e: any) {
      messageApi.error(getServerMsg(e, "Failed to load modifiers"));
    } finally {
      setLoading(false);
    }
  }

  async function toggleAttach(groupId: string) {
    if (!itemId) return;

    setSavingAttach(groupId);
    const key = `attach_${groupId}`;
    messageApi.open({ key, type: "loading", content: "Updating..." });

    try {
      const currentlyAttached = attached.includes(groupId);
      const next = currentlyAttached
        ? attached.filter((id) => id !== groupId)
        : [...attached, groupId];

      const res = await setItemModifierGroups(itemId, next);
      setAttached(res.modifierGroupIds ?? next);

      messageApi.open({
        key,
        type: "success",
        content: currentlyAttached ? "Detached" : "Attached",
        duration: 1.1,
      });
    } catch (e: any) {
      messageApi.open({
        key,
        type: "error",
        content: getServerMsg(e, "Attach/detach failed"),
        duration: 2,
      });
    } finally {
      setSavingAttach(null);
    }
  }

  async function handleCreateGroup(values: CreateGroupForm) {
    const name = values.name.trim();
    if (!name) {
      messageApi.warning("Group name is required");
      return;
    }

    const payload = {
      name,
      selectionType: values.selectionType,
      isRequired: values.isRequired,
      minSelections:
        values.selectionType === "multiple" ? clampInt(values.minSelections, 0, 99) : 0,
      maxSelections:
        values.selectionType === "multiple" ? clampInt(values.maxSelections, 0, 99) : 0,
      displayOrder: clampInt(values.displayOrder ?? 0, 0, 9999),
      status: values.status,
    };

    const key = "create_group";
    messageApi.open({ key, type: "loading", content: "Creating group..." });

    try {
      await createModifierGroup(payload);
      form.reset();
      setShowCreate(false);
      await refresh();
      messageApi.open({ key, type: "success", content: "Group created", duration: 1.2 });
    } catch (e: any) {
      messageApi.open({ key, type: "error", content: getServerMsg(e, "Create group failed") });
    }
  }

  function openAddOption(groupId: string) {
    setAddingFor(groupId);
    setNewOptName("");
    setNewOptPrice(0);
    setNewOptStatus("active");
  }

  async function submitAddOption(groupId: string) {
    const name = newOptName.trim();
    if (!name) {
      messageApi.warning("Option name is required");
      return;
    }

    const key = `add_opt_${groupId}`;
    messageApi.open({ key, type: "loading", content: "Adding option..." });

    try {
      const created = await createModifierOption(groupId, {
        name,
        priceAdjustment: Number.isFinite(newOptPrice) ? Number(newOptPrice) : 0,
      });

      if (newOptStatus === "inactive" && created?._id) {
        await updateModifierOption(created._id, { status: "inactive" } as any);
      }

      const opts = await getModifierOptions(groupId, "all");
      setOptionsMap((m) => ({ ...m, [groupId]: opts }));

      setAddingFor(null);
      setNewOptName("");
      setNewOptPrice(0);
      setNewOptStatus("active");

      messageApi.open({ key, type: "success", content: "Option added", duration: 1.1 });
    } catch (e: any) {
      messageApi.open({ key, type: "error", content: getServerMsg(e, "Create option failed") });
    }
  }

  async function patchOption(
    groupId: string,
    optionId: string,
    patch: Partial<ModifierOption>
  ) {
    const key = `patch_${optionId}`;
    messageApi.open({ key, type: "loading", content: "Saving..." });

    try {
      await updateModifierOption(optionId, patch as any);
      const opts = await getModifierOptions(groupId, "all");
      setOptionsMap((m) => ({ ...m, [groupId]: opts }));
      messageApi.open({ key, type: "success", content: "Saved", duration: 0.8 });
    } catch (e: any) {
      messageApi.open({ key, type: "error", content: getServerMsg(e, "Update failed") });
    }
  }

  function removeGroup(groupId: string) {
    const g = groups.find((x) => x._id === groupId);
    setConfirmState({
      type: "group",
      groupId,
      title: "Delete modifier group?",
      desc: `This will remove "${g?.name ?? "this group"}" and its options. This action can't be undone.`,
    });
  }

  function removeOption(groupId: string, optionId: string) {
    const opt = (optionsMap[groupId] ?? []).find((x) => x._id === optionId);
    setConfirmState({
      type: "option",
      groupId,
      optionId,
      title: "Delete option?",
      desc: `Delete "${opt?.name ?? "this option"}"? This action can't be undone.`,
    });
  }

  async function handleConfirmDelete() {
    if (!confirmState) return;

    setConfirming(true);
    const key = "delete";
    messageApi.open({ key, type: "loading", content: "Deleting..." });

    try {
      if (confirmState.type === "group") {
        const groupId = confirmState.groupId;

        if (itemId && attached.includes(groupId)) {
          const next = attached.filter((id) => id !== groupId);
          const res = await setItemModifierGroups(itemId, next);
          setAttached(res.modifierGroupIds ?? next);
        }

        await deleteModifierGroup(groupId);
        await refresh();
      } else {
        await deleteModifierOption(confirmState.optionId);
        const opts = await getModifierOptions(confirmState.groupId, "all");
        setOptionsMap((m) => ({ ...m, [confirmState.groupId]: opts }));
      }

      setConfirmState(null);
      messageApi.open({ key, type: "success", content: "Deleted", duration: 1.1 });
    } catch (e: any) {
      messageApi.open({ key, type: "error", content: getServerMsg(e, "Delete failed") });
    } finally {
      setConfirming(false);
    }
  }

  /** ---------- render ---------- */

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [groups]);

  return (
    <Modal open={open} title="Manage Modifiers" onClose={onClose as any}>
      {contextHolder}

      <div className="flex flex-col h-full max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-gray-50/50 border-b space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Settings2 size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-gray-900 truncate">
                  Modifier Groups
                </h3>
                <p className="text-[11px] text-gray-500 font-medium truncate">
                  Link groups or create options
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCreate((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 text-xs bg-[#1A2F2F] hover:bg-[#E2B13C] hover:text-[#1A2F2F] rounded-xl font-bold text-white transition-all shadow-md active:scale-95"
            >
              <Plus size={16} />
              New Group
            </button>
          </div>

          {/* Create panel */}
          <div
            className={cx(
              "overflow-hidden transition-all duration-300 ease-out",
              showCreate ? "max-h-[560px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-2"
            )}
          >
            <div className="pt-3">
              <form
                onSubmit={form.handleSubmit(handleCreateGroup)}
                className="rounded-3xl border-2 border-indigo-100 bg-indigo-50/30 p-5 space-y-4"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 ml-1">
                      Group Name
                    </label>
                    <input
                      {...form.register("name", { required: true })}
                      placeholder="e.g. Choose your Protein"
                      className="w-full rounded-2xl border-none bg-white px-4 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-slate-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 ml-1">
                      Selection Type
                    </label>
                    <div className="flex p-1 bg-white rounded-2xl shadow-sm">
                      {["single", "multiple"].map((type) => (
                        <label key={type} className="flex-1">
                          <input
                            type="radio"
                            value={type}
                            {...form.register("selectionType")}
                            className="sr-only peer"
                          />
                          <span className="flex items-center justify-center py-1.5 text-xs font-bold rounded-xl cursor-pointer transition-all peer-checked:bg-indigo-600 peer-checked:text-white text-gray-400">
                            {type}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* required */}
                <div className="flex items-center justify-between bg-white/50 p-3 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div
                      className={cx(
                        "p-2 rounded-xl",
                        isRequired ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-400"
                      )}
                    >
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">Is Required?</p>
                      <p className="text-[10px] text-gray-500 font-medium">
                        Customer must pick an option
                      </p>
                    </div>
                  </div>

                  <Controller
                    control={form.control}
                    name="isRequired"
                    render={({ field }) => (
                      <Toggle value={!!field.value} onChange={field.onChange} />
                    )}
                  />
                </div>

                {/* multiple constraints */}
                {selectionType === "multiple" ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 ml-1">
                        Min
                      </label>
                      <input
                        type="number"
                        {...form.register("minSelections", { valueAsNumber: true })}
                        className="w-full rounded-2xl border-none bg-white px-4 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-slate-500"
                        min={0}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 ml-1">
                        Max
                      </label>
                      <input
                        type="number"
                        {...form.register("maxSelections", { valueAsNumber: true })}
                        className="w-full rounded-2xl border-none bg-white px-4 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-slate-500"
                        min={0}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 ml-1">
                        Display order
                      </label>
                      <input
                        type="number"
                        {...form.register("displayOrder", { valueAsNumber: true })}
                        className="w-full rounded-2xl border-none bg-white px-4 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-slate-500"
                        min={0}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 ml-1">
                        Display order
                      </label>
                      <input
                        type="number"
                        {...form.register("displayOrder", { valueAsNumber: true })}
                        className="w-full rounded-2xl border-none bg-white px-4 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-slate-500"
                        min={0}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 ml-1">
                        Status
                      </label>
                      <select
                        {...form.register("status")}
                        className="w-full rounded-2xl border-none bg-white px-4 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-slate-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 px-6 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-200 active:scale-95"
                  >
                    Create Group
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Body */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-0"
        >
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="animate-spin mb-2" />
              <p className="text-sm font-medium">Syncing modifiers...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedGroups.map((g) => {
                const isAttached = attachedSet.has(g._id);
                const opts = optionsMap[g._id] ?? [];

                return (
                  <div
                    key={g._id}
                    className={cx(
                      "group rounded-3xl border transition-all duration-200",
                      isAttached
                        ? "border-indigo-200 bg-white shadow-md"
                        : "border-gray-100 bg-gray-50/30"
                    )}
                  >
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate">
                            {g.name}
                          </h4>
                          <span
                            className={cx(
                              "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter shrink-0",
                              g.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-200 text-gray-500"
                            )}
                          >
                            {g.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5 truncate">
                          {g.selectionType.toUpperCase()} •{" "}
                          {g.isRequired ? "REQUIRED" : "OPTIONAL"} • MIN:{" "}
                          {g.minSelections}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => toggleAttach(g._id)}
                          disabled={savingAttach === g._id}
                          className={cx(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                            isAttached
                              ? "bg-indigo-600 text-white shadow-indigo-100"
                              : "bg-white border text-gray-600 hover:bg-gray-50",
                            savingAttach === g._id && "opacity-70 cursor-not-allowed"
                          )}
                        >
                          {savingAttach === g._id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : isAttached ? (
                            <Unlink size={14} />
                          ) : (
                            <Link size={14} />
                          )}
                          {isAttached ? "Detach" : "Attach"}
                        </button>

                        <button
                          onClick={() => openAddOption(g._id)}
                          className="p-2 rounded-xl bg-white border text-gray-400 hover:text-[#E2B13C] hover:border-[#E2B13C] transition-all active:scale-95"
                        >
                          <Plus size={18} />
                        </button>

                        <button
                          onClick={() => removeGroup(g._id)}
                          className="p-2 rounded-xl bg-white border text-gray-400 hover:text-red-500 hover:border-red-100 transition-all active:scale-95"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="px-4 pb-4">
                      {/* responsive grid: mobile stacks, md = 4 columns */}
                      <div className="rounded-2xl border border-gray-100 bg-gray-50/50 overflow-hidden">
                        <div className="hidden md:grid md:grid-cols-[1fr_90px_110px_40px] gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                          <span>Option Name</span>
                          <span>Price</span>
                          <span>Status</span>
                          <span />
                        </div>

                        <div className="divide-y divide-gray-100 bg-white">
                          {addingFor === g._id && (
                            <div className="p-3 bg-indigo-50/50">
                              <div className="grid gap-2 md:grid-cols-[1fr_90px_110px_140px] md:items-center">
                                <input
                                  autoFocus
                                  value={newOptName}
                                  onChange={(e) => setNewOptName(e.target.value)}
                                  className="w-full bg-white border-none rounded-lg text-xs font-bold px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                  placeholder="Name..."
                                />

                                <input
                                  type="number"
                                  value={newOptPrice}
                                  onChange={(e) => setNewOptPrice(Number(e.target.value))}
                                  className="w-full bg-white border-none rounded-lg text-xs font-bold px-3 py-2"
                                />

                                <select
                                  value={newOptStatus}
                                  onChange={(e) => setNewOptStatus(e.target.value as ModifierStatus)}
                                  className="w-full text-xs font-bold border-none bg-white rounded-lg px-3 py-2"
                                >
                                  <option value="active">Active</option>
                                  <option value="inactive">Inactive</option>
                                </select>

                                <div className="flex gap-2 md:justify-end">
                                  <button
                                    type="button"
                                    onClick={() => submitAddOption(g._id)}
                                    className="flex-1 md:flex-none md:px-4 bg-indigo-600 text-white rounded-lg text-xs font-bold py-2 active:scale-95"
                                  >
                                    Add
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setAddingFor(null)}
                                    className="flex-1 md:flex-none md:px-4 bg-white border rounded-lg text-xs font-bold py-2 active:scale-95"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {opts.length === 0 && addingFor !== g._id ? (
                            <div className="p-4 text-center text-xs text-gray-400 italic">
                              No options defined yet
                            </div>
                          ) : (
                            opts.map((o) => (
                              <div
                                key={o._id}
                                className={cx(
                                  "p-3 md:px-3 md:py-2 hover:bg-gray-50 transition-colors",
                                  "md:grid md:grid-cols-[1fr_90px_110px_40px] md:gap-2 md:items-center"
                                )}
                              >
                                {/* name */}
                                <div className="min-w-0">
                                  <div className="md:hidden text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                                    Option Name
                                  </div>
                                  <input
                                    defaultValue={o.name}
                                    className="w-full text-xs font-bold border-none bg-transparent focus:bg-white focus:ring-1 focus:ring-gray-200 rounded-md py-2 md:py-1 px-2"
                                    onBlur={(e) => {
                                      const v = e.target.value.trim();
                                      if (v && v !== o.name) patchOption(g._id, o._id, { name: v });
                                    }}
                                  />
                                </div>

                                {/* price */}
                                <div>
                                  <div className="md:hidden text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 mt-2">
                                    Price
                                  </div>
                                  <div className="flex items-center text-xs font-bold text-gray-500">
                                    <span className="mr-1">$</span>
                                    <input
                                      type="number"
                                      defaultValue={o.priceAdjustment}
                                      className="w-full border-none bg-transparent focus:bg-white rounded-md py-2 md:py-1 px-2 focus:ring-1 focus:ring-gray-200"
                                      onBlur={(e) =>
                                        patchOption(g._id, o._id, {
                                          priceAdjustment: Number(e.target.value),
                                        })
                                      }
                                    />
                                  </div>
                                </div>

                                {/* status */}
                                <div>
                                  <div className="md:hidden text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 mt-2">
                                    Status
                                  </div>
                                  <select
                                    defaultValue={o.status}
                                    className="w-full md:w-auto text-xs font-bold border-none bg-gray-100 rounded-lg py-2 md:py-1 px-2"
                                    onChange={(e) =>
                                      patchOption(g._id, o._id, {
                                        status: e.target.value as ModifierStatus,
                                      })
                                    }
                                  >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                  </select>
                                </div>

                                {/* delete */}
                                <div className="mt-3 md:mt-0 flex justify-end">
                                  <button
                                    onClick={() => removeOption(g._id, o._id)}
                                    className="text-gray-300 hover:text-red-500 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white rounded-b-3xl">
          <button
            onClick={() => onClose()}
            className="w-full py-3.5 rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none"
          >
            Finished Configuration
          </button>
        </div>
      </div>

      {/* Confirm modal */}
      <Modal
        open={!!confirmState}
        title={confirmState?.title ?? "Confirm"}
        onClose={() => (!confirming ? setConfirmState(null) : null)}
      >
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-3">
            <div className="mt-0.5 text-red-600">
              <AlertCircle size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-red-700">{confirmState?.title}</p>
              {confirmState?.desc ? (
                <p className="mt-1 text-xs font-medium text-red-600/90">
                  {confirmState.desc}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={confirming}
              onClick={() => setConfirmState(null)}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={confirming}
              onClick={handleConfirmDelete}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-red-200 hover:bg-red-700 active:scale-95 disabled:opacity-70"
            >
              {confirming ? <Loader2 size={14} className="animate-spin" /> : null}
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
}
