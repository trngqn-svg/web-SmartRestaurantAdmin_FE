import { UtensilsCrossed } from "lucide-react";
import { useNavigate } from 'react-router-dom';

export default function CustomRegister() {
  const nav = useNavigate();

  return (
    <div className="min-h-[100svh] bg-[#EEF1F5] flex flex-col font-sans">
      {/* Main Canvas */}
      <div className="mx-auto w-full max-w-[400px] pt-4 flex flex-col min-h-[100svh]">
        
        {/* Header Section */}
        <div className="rounded-t-[28px] bg-slate-900 px-6 pt-12 pb-14 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner">
            <UtensilsCrossed className="text-[#E2B13C] h-8 w-8" />
          </div>
          <h1 className="text-[#E2B13C] text-3xl font-bold tracking-tight">Create Account</h1>
          <p className="text-[#E2B13C] text-sm mt-1">Join the Smart Restaurant community</p>
        </div>

        {/* Form Card Panel */}
        <div className="-mt-8 rounded-t-[32px] bg-white px-6 pt-8 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex-1 z-10">
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                className= "w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-5 text-[15px] outline-none transition-all focus:bg-white focus:ring-4 focus:ring-[#E64B3C]/10 focus:border-[#E2B13C]"
              />
            </div>

            {/* Email with Validation Hint */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-5 text-[15px] outline-none transition-all focus:bg-white focus:ring-4 focus:ring-[#E64B3C]/10 focus:border-[#E2B13C]"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-5 text-[15px] outline-none transition-all focus:bg-white focus:ring-4 focus:ring-[#E64B3C]/10 focus:border-[#E2B13C]"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-5 text-[15px] outline-none transition-all focus:bg-white focus:ring-4 focus:ring-[#E64B3C]/10 focus:border-[#E2B13C]"
              />
            </div>

            {/* Terms & Conditions */}
            <label className="flex items-start gap-3 pt-2 cursor-pointer group">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  className="peer h-5 w-5 rounded-md border-slate-300 text-[#E2B13C] focus:ring-[#E2B13C]/20 transition-all cursor-pointer" 
                />
              </div>
              <span className="text-[13px] text-slate-500 leading-snug">
                I agree to the{" "}
                <button type="button" className="text-[#E2B13C] font-bold hover:underline">Terms of Service</button>
                {" "}and{" "}
                <button type="button" className="text-[#E2B13C] font-bold hover:underline">Privacy Policy</button>.
              </span>
            </label>

            {/* Primary CTA */}
            <button
              onClick={() => nav('/customer/login')}
              type="submit"
              className="mt-4 w-full h-14 rounded-2xl bg-slate-900 text-[#E2B13C] text-[16px] cursor-pointer font-bold shadow-lg shadow-[#E64B3C]/20 hover:bg-slate-700 active:scale-[0.98] transition-transform duration-100"
            >
              Create Account
            </button>

            {/* Footer */}
            <div className="pt-2 text-center text-[14px] text-slate-500 font-medium">
              Already have an account?{" "}
              <button 
                onClick={() => nav('/customer/login')}
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