import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
});

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const emailValue = watch('email');
  const passwordValue = watch('password');
  const areCredentialsFilled = Boolean(emailValue && passwordValue);

  const isEmailActive = isEmailFocused || Boolean(emailValue);
  const isPasswordActive = isPasswordFocused || Boolean(passwordValue);

  const emailReg = register('email');
  const passwordReg = register('password');

  const from = location.state?.from?.pathname || '/';

  const onSubmit = async (data) => {
    try {
      setAuthError('');
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen lg:h-screen w-full bg-[#f6f8fa] flex items-center justify-center p-3 sm:p-4 lg:p-6 text-slate-800 font-sans overflow-y-auto lg:overflow-hidden relative">
      {/* Decorative ambient background accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#4DA944]/5 rounded-full blur-3xl pointer-events-none -z-0"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none -z-0"></div>

      {/* Unified Floating Card - Perfectly fitted in frame */}
      <div className="w-full max-w-[1140px] xl:max-w-[1200px] lg:h-[88vh] lg:max-h-[630px] xl:max-h-[660px] lg:min-h-[480px] bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07),0_1px_3px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row overflow-hidden relative z-10 my-auto">
        
        {/* Left Panel - Illustration & Hero Section (~54%) */}
        <div className="lg:w-[54%] bg-gradient-to-br from-slate-50/90 via-white to-emerald-50/25 p-5 sm:p-7 lg:p-8 xl:p-10 flex flex-col justify-between relative min-h-[280px] sm:min-h-[340px] lg:min-h-0 lg:h-full border-b lg:border-b-0 lg:border-r border-slate-100 overflow-hidden">
          {/* Top Spacer */}
          <div className="w-full h-1 shrink-0 relative z-10"></div>

          {/* Hero Copywriting - Aligned a bit more rightside */}
          <div className="max-w-md w-full relative z-10 mb-auto pt-2 sm:pt-3 lg:pt-4 pl-4 sm:pl-8 lg:pl-12 xl:pl-14">
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] xl:text-[38px] font-extrabold text-slate-900 leading-[1.14] tracking-tight">
              Powering<br />
              a cleaner<br />
              <span className="text-[#4DA944]">tomorrow.</span>
            </h1>

            <p className="mt-2.5 text-slate-600 font-medium text-xs sm:text-sm lg:text-[14px] leading-relaxed max-w-xs">
              Smart charging solutions & intelligent station management for a sustainable future.
            </p>

            <div className="w-10 h-1.5 bg-[#4DA944] rounded-full mt-3.5"></div>
          </div>

          {/* Hero Illustration Layer - Enlarged size */}
          <div className="absolute inset-0 flex items-end justify-center lg:justify-end xl:justify-center pointer-events-none z-0 pb-1 sm:pb-2 lg:pb-3 px-2 sm:px-4 lg:px-6">
            <img
              src="/ev_login_illustration.jpg"
              alt="EV Charging Illustration"
              className="w-full max-w-[380px] sm:max-w-[500px] lg:max-w-[660px] xl:max-w-[720px] max-h-[34vh] sm:max-h-[44vh] lg:max-h-[66vh] xl:max-h-[70vh] object-contain object-bottom"
            />
          </div>

          {/* Bottom spacer */}
          <div className="h-1 shrink-0 relative z-10"></div>
        </div>

        {/* Right Panel - Form Section (~46%) */}
        <div className="lg:w-[46%] bg-white flex flex-col justify-center items-center p-5 sm:p-7 lg:p-8 xl:p-10 lg:h-full overflow-y-auto">
          <div className="w-full max-w-[360px] space-y-3.5 my-auto py-1">
            {/* Brand Logo Centered Above Form */}
            <div className="flex justify-center -mt-1 sm:-mt-2 mb-1">
              <img
                src="/logo-2.jpeg"
                alt="openev.io"
                className="h-9 sm:h-10 lg:h-11 w-auto max-w-[180px] object-contain"
              />
            </div>

            {/* Header */}
            <div className="text-center space-y-0.5">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                Welcome back
              </h2>
              <p className="text-xs font-medium text-slate-500">
                Sign in to your openEV.io management portal
              </p>
            </div>

            {/* Form */}
            <form className="space-y-3 pt-0.5" onSubmit={handleSubmit(onSubmit)}>
              {/* Email Field */}
              <div className="space-y-1">
                <div className="relative group">
                  <label
                    htmlFor="email"
                    className={`absolute transition-all duration-200 pointer-events-none z-10 rounded-md ${isEmailActive
                        ? '-top-2.5 translate-y-0 left-3.5 px-1.5 bg-white text-[11px] font-bold ' +
                        (errors.email ? 'text-rose-500' : isEmailFocused ? 'text-[#4DA944]' : 'text-slate-600')
                        : 'top-1/2 -translate-y-1/2 left-10.5 text-xs sm:text-sm font-medium text-slate-400'
                      }`}
                  >
                    Email address
                  </label>
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 z-10">
                    <Mail className={`h-4.5 w-4.5 transition-colors ${errors.email ? 'text-rose-500' : isEmailFocused ? 'text-[#4DA944]' : 'text-slate-400'}`} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...emailReg}
                    onFocus={(e) => {
                      setIsEmailFocused(true);
                      emailReg.onFocus?.(e);
                    }}
                    onBlur={(e) => {
                      setIsEmailFocused(false);
                      emailReg.onBlur(e);
                    }}
                    className={`block w-full rounded-xl border ${errors.email
                        ? 'border-rose-300 bg-rose-50/30 text-rose-900'
                        : isEmailFocused
                          ? 'border-[#4DA944] bg-white text-slate-800 ring-4 ring-[#4DA944]/15'
                          : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                      } pl-10.5 pr-3.5 py-3 text-xs sm:text-sm font-medium transition-all duration-200 outline-none`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-500 font-medium pl-1 animate-in fade-in">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <div className="relative group">
                  <label
                    htmlFor="password"
                    className={`absolute transition-all duration-200 pointer-events-none z-10 rounded-md ${isPasswordActive
                        ? '-top-2.5 translate-y-0 left-3.5 px-1.5 bg-white text-[11px] font-bold ' +
                        (errors.password ? 'text-rose-500' : isPasswordFocused ? 'text-[#4DA944]' : 'text-slate-600')
                        : 'top-1/2 -translate-y-1/2 left-10.5 text-xs sm:text-sm font-medium text-slate-400'
                      }`}
                  >
                    Password
                  </label>
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 z-10">
                    <Lock className={`h-4.5 w-4.5 transition-colors ${errors.password ? 'text-rose-500' : isPasswordFocused ? 'text-[#4DA944]' : 'text-slate-400'}`} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...passwordReg}
                    onFocus={(e) => {
                      setIsPasswordFocused(true);
                      passwordReg.onFocus?.(e);
                    }}
                    onBlur={(e) => {
                      setIsPasswordFocused(false);
                      passwordReg.onBlur(e);
                    }}
                    className={`block w-full rounded-xl border ${errors.password
                        ? 'border-rose-300 bg-rose-50/30 text-rose-900'
                        : isPasswordFocused
                          ? 'border-[#4DA944] bg-white text-slate-800 ring-4 ring-[#4DA944]/15'
                          : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                      } pl-10.5 pr-10 py-3 text-xs sm:text-sm font-medium transition-all duration-200 outline-none`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors z-20 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-500 font-medium pl-1 animate-in fade-in">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-0.5">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    disabled={!areCredentialsFilled}
                    className={`h-4 w-4 rounded border-slate-300 text-[#4DA944] focus:ring-[#4DA944] transition-colors ${!areCredentialsFilled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                  />
                  <label
                    htmlFor="remember-me"
                    className={`ml-2 block text-xs font-medium ${!areCredentialsFilled ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 cursor-pointer'
                      }`}
                  >
                    Remember me
                  </label>
                </div>

                <a href="#" className="text-xs font-semibold text-[#4DA944] hover:text-[#3f8b37] transition-colors">
                  Forgot password?
                </a>
              </div>

              {/* Auth Error Banner */}
              {authError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs font-semibold text-rose-600 text-center animate-in fade-in">
                  {authError}
                </div>
              )}

              {/* Primary Sign In Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#4DA944] hover:bg-[#43953b] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed shadow-2xs hover:shadow-sm transition-all duration-200 flex items-center justify-center cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-200 w-full"></div>
              <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider absolute">
                or
              </span>
            </div>

            {/* Secondary SSO Button */}
            <button
              type="button"
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-slate-700 bg-slate-50/80 hover:bg-slate-100 border border-slate-200/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              <span>Sign in with SSO</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
