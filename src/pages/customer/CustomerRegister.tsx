import { useMemo, useState } from "react";
import { UtensilsCrossed, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

function safeTrim(s: string) {
  return (s ?? "").trim();
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function passwordStrength(pw: string) {
  const s = safeTrim(pw);
  let score = 0;
  if (s.length >= 8) score++;
  if (/[A-Z]/.test(s)) score++;
  if (/[a-z]/.test(s)) score++;
  if (/\d/.test(s)) score++;
  if (/[^A-Za-z0-9]/.test(s)) score++;

  if (s.length === 0) return { score: 0, label: "" as const };
  if (score <= 2) return { score, label: "Weak" as const };
  if (score <= 4) return { score, label: "Good" as const };
  return { score, label: "Strong" as const };
}

type FieldKey = "fullName" | "email" | "password" | "confirmPassword" | "terms";

export default function CustomRegister() {
  const nav = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [terms, setTerms] = useState(false);

  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [touched, setTouched] = useState<Record<FieldKey, boolean>>({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
    terms: false,
  });

  const strength = useMemo(() => passwordStrength(password), [password]);

  const errors = useMemo(() => {
    const e: Partial<Record<FieldKey, string>> = {};

    const fn = safeTrim(fullName);
    const em = safeTrim(email);
    const pw = password;
    const cpw = confirmPassword;

    if (!fn) e.fullName = "Full name is required.";
    else if (fn.length < 2) e.fullName = "Full name is too short.";

    if (!em) e.email = "Email is required.";
    else if (!isEmail(em)) e.email = "Please enter a valid email.";

    if (!pw) e.password = "Password is required.";
    else if (pw.length < 8) e.password = "Password must be at least 8 characters.";

    if (!cpw) e.confirmPassword = "Please confirm your password.";
    else if (pw && cpw !== pw) e.confirmPassword = "Passwords do not match.";

    if (!terms) e.terms = "You must agree to Terms & Privacy.";

    return e;
  }, [fullName, email, password, confirmPassword, terms]);

  const canSubmit = useMemo(() => Object.keys(errors).length === 0, [errors]);

  function markTouched(k: FieldKey) {
    setTouched((t) => ({ ...t, [k]: true }));
  }

  function scrollToField(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    (el as HTMLElement).focus?.();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
      terms: true,
    });

    const first = (["fullName", "email", "password", "confirmPassword", "terms"] as FieldKey[]).find(
      (k) => !!errors[k]
    );

    if (first) {
      scrollToField(first === "terms" ? "terms" : first);
      return;
    }

    nav("/customer/login");
  }

  const inputBase =
    "w-full h-12 rounded-2xl border bg-slate-50 px-5 text-[15px] outline-none transition-all " +
    "focus:bg-white focus:ring-4 focus:ring-[#E2B13C]/10 focus:border-[#E2B13C]";

  function inputCls(hasErr: boolean) {
    return `${inputBase} ${hasErr ? "border-red-300 focus:ring-red-500/10 focus:border-red-500" : "border-slate-100"}`;
  }

  return (
    <div className="min-h-[100svh] bg-[#EEF1F5] flex flex-col font-sans">
      <div className="mx-auto w-full max-w-[400px] pt-4 flex flex-col min-h-[100svh]">
        {/* Header */}
        <div className="rounded-t-[28px] bg-slate-900 px-6 pt-12 pb-14 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner">
            <UtensilsCrossed className="text-[#E2B13C] h-8 w-8" />
          </div>
          <h1 className="text-[#E2B13C] text-3xl font-bold tracking-tight">Create Account</h1>
          <p className="text-[#E2B13C] text-sm mt-1">Join the Smart Restaurant community</p>
        </div>

        {/* Form */}
        <div className="-mt-8 rounded-t-[32px] bg-white px-6 pt-8 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex-1 z-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Full Name</label>
              <input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => markTouched("fullName")}
                type="text"
                placeholder="Enter your full name"
                className={inputCls(!!touched.fullName && !!errors.fullName)}
              />
              {!!touched.fullName && !!errors.fullName && (
                <div className="flex items-center gap-2 text-[12px] text-red-600 pl-1">
                  <XCircle size={16} />
                  <span>{errors.fullName}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Email</label>
              <input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => markTouched("email")}
                type="email"
                placeholder="Enter your email"
                className={inputCls(!!touched.email && !!errors.email)}
                inputMode="email"
                autoComplete="email"
              />
              {!!touched.email && !!errors.email && (
                <div className="flex items-center gap-2 text-[12px] text-red-600 pl-1">
                  <XCircle size={16} />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>

            {/* Password (toggle + strength) */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Password</label>
              <div className="relative">
                <input
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => markTouched("password")}
                  type={showPwd ? "text" : "password"}
                  placeholder="Enter your password"
                  className={inputCls(!!touched.password && !!errors.password) + " pr-12"}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#E2B13C]"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* strength row */}
              {safeTrim(password).length > 0 && (
                <div className="flex items-center justify-between px-1 pt-1">
                  <div className="flex items-center gap-2 text-[12px] text-slate-500">
                    {strength.label ? (
                      <>
                        <span className="font-semibold">Strength:</span>
                        <span
                          className={
                            strength.label === "Weak"
                              ? "text-red-600 font-bold"
                              : strength.label === "Good"
                              ? "text-amber-600 font-bold"
                              : "text-emerald-600 font-bold"
                          }
                        >
                          {strength.label}
                        </span>
                      </>
                    ) : (
                      <span />
                    )}
                  </div>

                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={
                          "h-1.5 w-6 rounded-full " +
                          (i < strength.score
                            ? strength.label === "Weak"
                              ? "bg-red-400"
                              : strength.label === "Good"
                              ? "bg-amber-400"
                              : "bg-emerald-500"
                            : "bg-slate-200")
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {!!touched.password && !!errors.password && (
                <div className="flex items-center gap-2 text-[12px] text-red-600 pl-1">
                  <XCircle size={16} />
                  <span>{errors.password}</span>
                </div>
              )}
            </div>

            {/* Confirm Password (toggle) */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Confirm Password</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => markTouched("confirmPassword")}
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm your password"
                  className={inputCls(!!touched.confirmPassword && !!errors.confirmPassword) + " pr-12"}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#E2B13C]"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {!!safeTrim(confirmPassword) && safeTrim(confirmPassword) === safeTrim(password) && (
                <div className="flex items-center gap-2 text-[12px] text-emerald-600 pl-1 pt-1">
                  <CheckCircle2 size={16} />
                  <span>Passwords match</span>
                </div>
              )}

              {!!touched.confirmPassword && !!errors.confirmPassword && (
                <div className="flex items-center gap-2 text-[12px] text-red-600 pl-1">
                  <XCircle size={16} />
                  <span>{errors.confirmPassword}</span>
                </div>
              )}
            </div>

            {/* Terms */}
            <label
              id="terms"
              className="flex items-start gap-3 pt-2 cursor-pointer group"
              onBlur={() => markTouched("terms")}
            >
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="peer h-5 w-5 rounded-md border-slate-300 text-[#E2B13C] focus:ring-[#E2B13C]/20 transition-all cursor-pointer"
                />
              </div>

              <span className="text-[13px] text-slate-500 leading-snug">
                I agree to the{" "}
                <button type="button" className="text-[#E2B13C] font-bold hover:underline">
                  Terms of Service
                </button>{" "}
                and{" "}
                <button type="button" className="text-[#E2B13C] font-bold hover:underline">
                  Privacy Policy
                </button>
                .
              </span>
            </label>
            {!!touched.terms && !!errors.terms && (
              <div className="flex items-center gap-2 text-[12px] text-red-600 pl-1 -mt-2">
                <XCircle size={16} />
                <span>{errors.terms}</span>
              </div>
            )}

            {/* Primary CTA */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={[
                "mt-4 w-full h-14 rounded-2xl text-[16px] font-bold shadow-lg transition-transform duration-100",
                "active:scale-[0.98]",
                canSubmit
                  ? "bg-slate-900 text-[#E2B13C] cursor-pointer hover:bg-slate-700 shadow-[#E2B13C]/10"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-transparent",
              ].join(" ")}
            >
              Create Account
            </button>

            {/* Divider */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200" />
              <span className="flex-shrink mx-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                or
              </span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            {/* Google Button */}
            <button
              onClick={() => nav("/customer/menu")}
              type="button"
              className="w-full rounded-full border border-slate-200 bg-white py-3.5 text-[15px] font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign up with Google
            </button>

            {/* Footer */}
            <div className="pt-2 text-center text-[14px] text-slate-500 font-medium">
              Already have an account?{" "}
              <button
                onClick={() => nav("/customer/login")}
                type="button"
                className="font-bold text-[#E2B13C] cursor-pointer hover:underline"
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
