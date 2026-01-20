import { useEffect, useMemo, useRef, useState } from "react";
import { message } from "antd";
import { Save } from "lucide-react";
import { cn } from "../../utils/cn";
import { getMyProfileApi, updateMyProfileApi, type MyProfile } from "../../api/admin/me.profile";

function safeTrim(s: string) {
  return (s ?? "").trim();
}

function isPhoneLoose(s: string) {
  const v = safeTrim(s);
  if (!v) return true;
  const compact = v.replace(/[()\s-]/g, "");
  return /^\+?\d{9,15}$/.test(compact);
}

export default function ProfileAdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<MyProfile | null>(null);

  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const fullNameRef = useRef<HTMLInputElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);

  const canSave = useMemo(() => {
    if (!profile) return false;
    if (!safeTrim(fullName)) return false;
    if (!isPhoneLoose(phoneNumber)) return false;
    return true;
  }, [profile, fullName, phoneNumber]);

  async function load() {
    try {
      setLoading(true);
      const res = await getMyProfileApi();
      setProfile(res.profile);
      setFullName(res.profile.fullName ?? "");
      setAddress(res.profile.address ?? "");
      setPhoneNumber(res.profile.phoneNumber ?? "");
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Load profile failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onSave() {
    const name = safeTrim(fullName);
    const phone = safeTrim(phoneNumber);

    if (!name) {
      message.error("Full name is required");
      fullNameRef.current?.focus();
      return;
    }
    if (!isPhoneLoose(phone)) {
      message.error("Phone number is invalid");
      phoneRef.current?.focus();
      return;
    }

    try {
      setSaving(true);
      const res = await updateMyProfileApi({
        fullName: name,
        address: safeTrim(address),
        phoneNumber: phone,
      });
      setProfile(res.profile);
      message.success("Profile updated");
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Update profile failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 max-w-[720px] mx-auto">
      <div className="rounded-2xl border bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-extrabold text-slate-900">Admin Profile</div>
            <div className="text-sm text-slate-500">
              {loading ? "Loading..." : `@${profile?.username ?? ""}`}
            </div>
          </div>

          <button
            disabled={!canSave || saving || loading}
            onClick={onSave}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold border transition",
              !canSave || saving || loading
                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                : "bg-slate-900 text-white border-slate-900 hover:opacity-90"
            )}
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-bold text-slate-700">Full name *</span>
            <input
              ref={fullNameRef}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your name"
              className="h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-bold text-slate-700">Phone number</span>
            <input
              ref={phoneRef}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
              className={cn(
                "h-11 rounded-xl border px-3 outline-none focus:ring-2 focus:ring-slate-900/10",
                phoneNumber && !isPhoneLoose(phoneNumber) && "border-red-400"
              )}
            />
            {phoneNumber && !isPhoneLoose(phoneNumber) && (
              <span className="text-xs font-semibold text-red-500">
                Phone should be 9–15 digits (you can include +, space, -, parentheses).
              </span>
            )}
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-bold text-slate-700">Address</span>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your address"
              rows={3}
              className="rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
