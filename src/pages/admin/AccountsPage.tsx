import React, { useEffect, useMemo, useState } from "react";
import { message } from "antd";
import { useForm } from "react-hook-form";
import {
  createAccount,
  disableAccount,
  enableAccount,
  listAccounts,
  updateAccount,
} from "../../api/admin/accounts";
import type { Account, Role } from "../../api/admin/accounts";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type TabKey = Exclude<Role, "SUPER_ADMIN">;

type FormMode = "create" | "edit";

const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  WAITER: "Waiter",
  KDS: "KDS",
};

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="text-base font-semibold text-slate-900">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function Section({
  role,
  rows,
  loading,
  onCreate,
  onEdit,
  onToggleStatus,
  canCreate,
  canEditDelete,
}: {
  role: TabKey;
  rows: Account[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (acc: Account) => void;
  onToggleStatus: (acc: Account) => void;
  canCreate: boolean;
  canEditDelete: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <div className="text-lg font-semibold text-slate-900">{ROLE_LABEL[role]}</div>
          <div className="text-sm text-slate-500">
            List of {ROLE_LABEL[role].toLowerCase()} accounts
          </div>
        </div>

        <div className="flex gap-2">
          {canCreate && (
            <button
              type="button"
              onClick={onCreate}
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              + Add {ROLE_LABEL[role]}
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Loading...
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No account.
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((acc) => (
              <div
                key={acc._id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900">{acc.username}</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    Role: {acc.role}
                    {acc.status ? ` • Status: ${acc.status}` : ""}
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  {canEditDelete && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEdit(acc)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleStatus(acc)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-sm font-semibold text-white",
                          acc.status === "DISABLED"
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : "bg-rose-600 hover:bg-rose-700"
                        )}
                      >
                        {acc.status === "DISABLED" ? "Enable" : "Disable"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getMyRoleFromAccessToken(): string | null {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json?.role === "string" ? json.role : null;
  } catch {
    return null;
  }
}

type AccountFormValues = {
  username: string;
  password: string;
  confirmPassword: string;
};

function serverMsg(e: any) {
  return e?.response?.data?.message || e?.message || "Request failed";
}

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("ADMIN");

  const [admins, setAdmins] = useState<Account[]>([]);
  const [waiters, setWaiters] = useState<Account[]>([]);
  const [kds, setKds] = useState<Account[]>([]);
  const [myRole, setMyRole] = useState<string | null>(null);

  const [loading, setLoading] = useState<Record<TabKey, boolean>>({
    ADMIN: false,
    WAITER: false,
    KDS: false,
  });

  const [formState, setFormState] = useState<{
    open: boolean;
    mode: FormMode;
    role: TabKey;
    editing: Account | null;
    submitting: boolean;
  }>({
    open: false,
    mode: "create",
    role: "ADMIN",
    editing: null,
    submitting: false,
  });

  const [disableConfirm, setDisableConfirm] = useState<{
    open: boolean;
    acc: Account | null;
    submitting: boolean;
  }>({ open: false, acc: null, submitting: false });

  const canManageAdmin = myRole === "SUPER_ADMIN";
  const canManageThisTab = activeTab !== "ADMIN" || canManageAdmin;

  const currentRows = useMemo(() => {
    if (activeTab === "ADMIN") return admins;
    if (activeTab === "WAITER") return waiters;
    return kds;
  }, [activeTab, admins, waiters, kds]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<AccountFormValues>({
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onSubmit",
  });

  const watchedPassword = watch("password");

  async function loadRole(role: TabKey) {
    setLoading((s) => ({ ...s, [role]: true }));
    try {
      const res = await listAccounts({ role, page: 1, limit: 200 });
      const items = res?.items ?? [];
      if (role === "ADMIN") setAdmins(items);
      if (role === "WAITER") setWaiters(items);
      if (role === "KDS") setKds(items);
    } catch (e: any) {
      message.error(serverMsg(e));
    } finally {
      setLoading((s) => ({ ...s, [role]: false }));
    }
  }

  async function loadAll() {
    await Promise.all([loadRole("ADMIN"), loadRole("WAITER"), loadRole("KDS")]);
  }

  useEffect(() => {
    setMyRole(getMyRoleFromAccessToken());
  }, []);

  useEffect(() => {
    loadAll();
  }, []);

  function openCreate(role: TabKey) {
    if (role === "ADMIN" && !canManageAdmin) return;

    setFormState({
      open: true,
      mode: "create",
      role,
      editing: null,
      submitting: false,
    });

    reset({
      username: "",
      password: "",
      confirmPassword: "",
    });
    clearErrors();
  }

  function openEdit(acc: Account) {
    if (acc.role === "ADMIN" && !canManageAdmin) return;

    setFormState({
      open: true,
      mode: "edit",
      role: acc.role as TabKey,
      editing: acc,
      submitting: false,
    });

    reset({
      username: acc.username ?? "",
      password: "",
      confirmPassword: "",
    });
    clearErrors();
  }

  async function onToggleStatus(acc: Account) {
    if (acc.role === "ADMIN" && !canManageAdmin) return;

    if (acc.status === "DISABLED") {
      try {
        await enableAccount(acc._id);
        message.success("Enabled");
        await loadRole(acc.role as TabKey);
      } catch (e: any) {
        message.error(serverMsg(e));
      }
      return;
    }

    setDisableConfirm({ open: true, acc, submitting: false });
  }

  async function submitDisable() {
    const acc = disableConfirm.acc;
    if (!acc) return;
    if (acc.role === "ADMIN" && !canManageAdmin) return;

    setDisableConfirm((s) => ({ ...s, submitting: true }));
    try {
      await disableAccount(acc._id);
      message.success("Disabled");
      setDisableConfirm({ open: false, acc: null, submitting: false });
      await loadRole(acc.role as TabKey);
    } catch (e: any) {
      message.error(serverMsg(e));
      setDisableConfirm((s) => ({ ...s, submitting: false }));
    }
  }

  const onSubmit = handleSubmit(async (vals) => {
    const username = vals.username.trim();
    const password = vals.password;
    const confirmPassword = vals.confirmPassword;

    const MIN_PW = 6;

    if (!username) {
      setError("username", { type: "manual", message: "Username không được trống" });
      return;
    }

    if (formState.mode === "create") {
      if (!password) {
        setError("password", { type: "manual", message: "Password không được trống" });
        return;
      }
      if (password.length < MIN_PW) {
        setError("password", { type: "manual", message: `Password phải có ít nhất ${MIN_PW} ký tự` });
        return;
      }
      if (!confirmPassword) {
        setError("confirmPassword", { type: "manual", message: "Confirm password không được trống" });
        return;
      }
      if (confirmPassword !== password) {
        setError("confirmPassword", { type: "manual", message: "Confirm password không khớp" });
        return;
      }
    }

    if (formState.mode === "edit" && password) {
      if (password.length < MIN_PW) {
        setError("password", { type: "manual", message: `Password phải có ít nhất ${MIN_PW} ký tự` });
        return;
      }
      if (!confirmPassword) {
        setError("confirmPassword", { type: "manual", message: "Confirm password không được trống" });
        return;
      }
      if (confirmPassword !== password) {
        setError("confirmPassword", { type: "manual", message: "Confirm password không khớp" });
        return;
      }
    }

    try {
      setFormState((s) => ({ ...s, submitting: true }));

      if (formState.mode === "create") {
        await createAccount({ username, password, role: formState.role });
        message.success("Created account");
        setFormState((s) => ({ ...s, open: false, submitting: false }));
        await loadRole(formState.role);
      } else {
        const id = formState.editing?._id;
        if (!id) return;

        await updateAccount(id, {
          username,
          ...(password ? { password } : {}),
        });

        message.success("Updated account");
        setFormState((s) => ({ ...s, open: false, submitting: false }));
        await loadRole(formState.role);
      }
    } catch (e: any) {
      message.error(serverMsg(e));
      setFormState((s) => ({ ...s, submitting: false }));
    }
  });

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">Accounts Management</div>
          <div className="mt-1 text-sm text-slate-600">Manage Admin / Waiter / KDS</div>
        </div>

        <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-1">
          {(["ADMIN", "WAITER", "KDS"] as TabKey[]).map((r) => {
            const active = activeTab === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setActiveTab(r)}
                className={cn(
                  "rounded-2xl px-4 py-2 text-sm font-semibold transition",
                  active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                )}
              >
                {ROLE_LABEL[r]}
              </button>
            );
          })}
        </div>
      </div>

      <Section
        role={activeTab}
        rows={currentRows}
        loading={loading[activeTab]}
        onCreate={() => openCreate(activeTab)}
        onEdit={openEdit}
        onToggleStatus={onToggleStatus}
        canCreate={canManageThisTab}
        canEditDelete={canManageThisTab}
      />

      {/* Create/Edit Modal */}
      <Modal
        open={formState.open}
        title={
          formState.mode === "create"
            ? `Add new account ${ROLE_LABEL[formState.role]}`
            : `Edit account ${ROLE_LABEL[formState.role]}`
        }
        onClose={() => {
          if (formState.submitting) return;
          setFormState((s) => ({ ...s, open: false }));
          reset({ username: "", password: "", confirmPassword: "" });
          clearErrors();
        }}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
            <input
              {...register("username", {
                required: "Username is required",
                setValueAs: (v) => (typeof v === "string" ? v.trimStart() : v),
              })}
              onChange={(e) => {
                register("username").onChange(e);
                if (errors.username) clearErrors("username");
              }}
              className={cn(
                "w-full rounded-xl border bg-slate-50/50 px-4 py-2.5 text-sm outline-none",
                errors.username ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-slate-400"
              )}
              placeholder="Enter username"
              disabled={formState.submitting}
            />
            {errors.username?.message && <p className="mt-1 text-xs text-rose-600">{errors.username.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password {formState.mode === "edit" ? "(Leave blank if no change)" : ""}
            </label>
            <input
              type="password"
              {...register("password", {
                validate: (v) => {
                  const MIN_PW = 6;
                  if (formState.mode === "create") {
                    if (!v) return "Password is required";
                    if (v.length < MIN_PW) return `Password must have at least ${MIN_PW} characters.`;
                  }
                  if (formState.mode === "edit" && v && v.length < MIN_PW) {
                    return `Password must have at least ${MIN_PW} characters.`;
                  }
                  return true;
                },
              })}
              onChange={(e) => {
                register("password").onChange(e);
                if (errors.password) clearErrors("password");
              }}
              className={cn(
                "w-full rounded-xl border bg-slate-50/50 px-4 py-2.5 text-sm outline-none",
                errors.password ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-slate-400"
              )}
              placeholder={formState.mode === "create" ? "Enter password" : "••••••"}
              disabled={formState.submitting}
            />
            {errors.password?.message && <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Confirm password</label>
            <input
              type="password"
              {...register("confirmPassword", {
                validate: (v) => {
                  const pw = watchedPassword ?? "";
                  if (formState.mode === "create") {
                    if (!v) return "Confirm password is required";
                    if (v !== pw) return "Confirm password and password are not matched.";
                  }
                  if (formState.mode === "edit" && pw) {
                    if (!v) return "Confirm password is required";
                    if (v !== pw) return "Confirm password and password are not matched.";
                  }
                  return true;
                },
              })}
              onChange={(e) => {
                register("confirmPassword").onChange(e);
                if (errors.confirmPassword) clearErrors("confirmPassword");
              }}
              className={cn(
                "w-full rounded-xl border bg-slate-50/50 px-4 py-2.5 text-sm outline-none",
                errors.confirmPassword
                  ? "border-rose-500 focus:border-rose-500"
                  : "border-slate-200 focus:border-slate-400"
              )}
              placeholder="Confirm password"
              disabled={formState.submitting}
            />
            {errors.confirmPassword?.message && (
              <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={formState.submitting}
              onClick={() => {
                setFormState((s) => ({ ...s, open: false }));
                reset({ username: "", password: "", confirmPassword: "" });
                clearErrors();
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formState.submitting}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {formState.submitting ? "Saving..." : formState.mode === "create" ? "Create" : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Disable confirm Modal */}
      <Modal
        open={disableConfirm.open}
        title="Confirm disable account"
        onClose={() => {
          if (disableConfirm.submitting) return;
          setDisableConfirm({ open: false, acc: null, submitting: false });
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitDisable();
          }}
          className="space-y-4"
        >
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            Disable account <span className="font-semibold">{disableConfirm.acc?.username}</span>?
            <div className="mt-1 text-xs text-slate-500">
              Account will not be able to login until enabled.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={disableConfirm.submitting}
              onClick={() => setDisableConfirm({ open: false, acc: null, submitting: false })}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={disableConfirm.submitting}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
            >
              {disableConfirm.submitting ? "Disabling..." : "Disable"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
