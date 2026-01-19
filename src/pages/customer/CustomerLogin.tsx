import { UtensilsCrossed } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CustomLogin = () => {
  const nav = useNavigate();

  return (
    <div className="min-h-[100svh] bg-[#EEF1F5] flex justify-center font-sans">
      {/* Mobile Canvas */}
      <div className="relative w-full bg-[#EEF1F5] max-w-[400px] flex flex-col min-h-[100svh] pt-4 shadow-2xl overflow-hidden">
        {/* Hero Section */}
        <div className="rounded-t-[28px] bg-slate-900 px-6 pt-16 pb-20 text-center relative">
          {/* Logo Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[22px] bg-white/20 backdrop-blur-md text-[#E2B13C] mb-4 border border-white/30">
             <UtensilsCrossed size={40} strokeWidth={2.5} />
          </div>

          <h1 className="text-[#E2B13C] text-3xl font-extrabold tracking-tight">
            Smart Restaurant
          </h1>
          <p className="mt-2 text-[#E2B13C] text-sm font-medium tracking-wide">
            Scan. Order. Enjoy.
          </p>
        </div>

        {/* Login Card (Overlapping) */}
        <div className="-mt-10 bg-white rounded-t-[28px] px-8 pt-10 pb-12 flex-1 relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.04)]">
          <h2 className="text-2xl font-bold text-slate-800 mb-8">Welcome Back</h2>

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Username / Email</label>
              <input
                type="email"
                placeholder="Enter your username/email"
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-[15px] outline-none transition-all focus:bg-white focus:ring-4 focus:ring-[#E2B13C]/10 focus:border-[#E2B13C]"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-[15px] outline-none transition-all focus:bg-white focus:ring-4 focus:ring-[#E2B13C]/10 focus:border-[#E2B13C]"
              />
              <div className="flex justify-end pr-1 pt-1">
                <button type="button" className="text-sm font-semibold text-[#E2B13C] hover:text-[#c59a34]">
                  Forgot Password?
                </button>
              </div>
            </div>

            {/* Primary CTA */}
            <button
              onClick={() => nav('/customer/menu')}
              type="submit"
              className="mt-2 w-full rounded-full bg-slate-900 py-4 text-[16px] font-bold text-[#E2B13C] shadow-lg shadow-[#E2B13C]/30 transition-all hover:bg-slate-700 active:scale-[0.98]"
            >
              Sign In
            </button>

            {/* Divider */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">or</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Google Button */}
            <button
              onClick={() => nav('/customer/menu')}
              type="button"
              className="w-full rounded-full border border-slate-200 bg-white py-3.5 text-[15px] font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </form>

          {/* Bottom Navigation */}
          <div className="mt-10 space-y-5 text-center">
            <p className="text-[14px] text-slate-500 font-medium">
              Don&apos;t have an account? 
              <button 
                onClick={() => nav('/customer/register')}
                className="ml-1 font-bold text-[#E2B13C] hover:underline"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomLogin;