import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { loginApi } from "../../api/admin/auth";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { useState } from "react";
import { Eye, EyeOff, Loader2, UtensilsCrossed } from "lucide-react";
import { message } from "antd";

type LoginForm = {
  username: string;
  password: string;
};

type ServerError = {
  message: string;
};

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [msgApi, msgCtx] = message.useMessage();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    mode: "onSubmit",
  });

  const mutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (res) => {
      localStorage.setItem("accessToken", res.data.accessToken);
      msgApi.success("Login successful");
      navigate("/dashboard");
    },
    onError: (error: AxiosError<ServerError>) => {
      const m =
        error.response?.data?.message ||
        "Invalid credentials. Please try again.";
      msgApi.error(m);
    },
  });

  const onSubmit = (data: LoginForm) => {
    msgApi.destroy();
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-4 font-sans">
      {msgCtx}

      {/* Main Card */}
      <div className="flex w-full max-w-[1000px] bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[600px]">
        {/* Left Side: Branding/Illustration (Hidden on Mobile) */}
        <div className="hidden md:flex md:w-1/2 bg-slate-900 p-12 flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-[#E2B13C]">
              <UtensilsCrossed size={32} />
              <span className="text-2xl font-bold tracking-tight text-white">
                Smart Restaurant
              </span>
            </div>
            <h1 className="mt-20 text-4xl font-light text-white leading-tight">
              Control your{" "}
              <span className="font-semibold text-[#E2B13C]">Restaurant</span>{" "}
              <br />
              from anywhere.
            </h1>
          </div>

          <div className="relative z-10 text-gray-400 text-sm">
            © 2024 Smart Restaurant OS. All rights reserved.
          </div>

          {/* Decorative Tech-Circles */}
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#E2B13C] opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-0 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-[#1A2F2F]">Admin Login</h2>
            <p className="text-gray-500 mt-2">
              Manage your restaurant efficiently
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-semibold text-[#1A2F2F] mb-2">
                Username / Email
              </label>
              <input
                placeholder="e.g. admin@restaurant.com"
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 outline-none
                  ${
                    errors.username
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 focus:border-[#1A2F2F] focus:ring-4 focus:ring-[#1A2F2F]/5"
                  }`}
                {...register("username", { required: "Username is required" })}
              />
              {errors.username && (
                <p className="text-red-500 text-xs mt-1 font-medium">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold text-[#1A2F2F]">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 outline-none
                    ${
                      errors.password
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 focus:border-[#1A2F2F] focus:ring-4 focus:ring-[#1A2F2F]/5"
                    }`}
                  {...register("password", { required: "Password is required" })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-[#1A2F2F] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#243f3f] 
                transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed
                flex items-center justify-center gap-2 shadow-lg shadow-[#1A2F2F]/20"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
