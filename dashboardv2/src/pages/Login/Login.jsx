import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

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
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F8F9FA] p-4 sm:p-8 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-orange-400/20 mix-blend-multiply filter blur-[100px] opacity-70"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-500/20 mix-blend-multiply filter blur-[100px] opacity-70"></div>
      <div className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-rose-400/20 mix-blend-multiply filter blur-[100px] opacity-70"></div>

      <div className="flex w-full max-w-lg items-center justify-center p-8 sm:p-12 relative z-20 bg-white/40 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/60 rounded-[32px]">
        <div className="w-full space-y-8 relative z-10">
          <div className="flex flex-col">
            <h2 className="text-[32px] font-extrabold tracking-tight text-stone-900">
              Welcome back
            </h2>
            <p className="mt-2 text-[15px] font-medium text-stone-500">
              Please enter your details to sign in.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-[13px] font-bold text-stone-800 mb-1.5 transition-colors group-focus-within:text-stone-900">
                  Email address
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Mail className={`h-[18px] w-[18px] transition-colors ${errors.email ? 'text-rose-500' : 'text-stone-400 group-focus-within:text-stone-600'}`} aria-hidden="true" strokeWidth={2} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`block w-full rounded-xl border ${errors.email
                      ? 'border-rose-300/50 text-rose-700 bg-rose-50/50'
                      : 'border-white/60 text-stone-800 bg-white/40 focus:bg-white/60 focus:border-white focus:ring-4 focus:ring-white/20'
                      } pl-11 pr-4 py-3.5 placeholder-stone-500 transition-all duration-300 sm:text-[15px] font-medium outline-none shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)]`}
                    placeholder="Enter your email"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-sm text-red-500 animate-in slide-in-from-top-1 fade-in duration-200">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-[13px] font-bold text-stone-800 mb-1.5 transition-colors group-focus-within:text-stone-900">
                  Password
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Lock className={`h-[18px] w-[18px] transition-colors ${errors.password ? 'text-rose-500' : 'text-stone-400 group-focus-within:text-stone-600'}`} aria-hidden="true" strokeWidth={2} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`block w-full rounded-xl border ${errors.password
                      ? 'border-rose-300/50 text-rose-700 bg-rose-50/50'
                      : 'border-white/60 text-stone-800 bg-white/40 focus:bg-white/60 focus:border-white focus:ring-4 focus:ring-white/20'
                      } pl-11 pr-12 py-3.5 placeholder-stone-500 transition-all duration-300 sm:text-[15px] font-medium outline-none shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)]`}
                    placeholder="Enter your password"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-stone-400 hover:text-stone-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" strokeWidth={2} />
                    ) : (
                      <Eye className="h-[18px] w-[18px]" aria-hidden="true" strokeWidth={2} />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-sm text-red-500 animate-in slide-in-from-top-1 fade-in duration-200">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center group">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  disabled={!areCredentialsFilled}
                  className={`h-[18px] w-[18px] rounded-[4px] border border-stone-200 bg-white text-[#E35D30] focus:ring-[#E35D30] transition-colors ${!areCredentialsFilled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                />
                <label htmlFor="remember-me" className={`ml-2 block text-sm font-medium transition-colors ${!areCredentialsFilled ? 'text-stone-300 cursor-not-allowed' : 'text-stone-400 group-hover:text-stone-500 cursor-pointer'
                  }`}>
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-bold text-[#E35D30] hover:text-[#c44f28] transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>

            {authError && (
              <div className="rounded-xl neo-form-error p-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-bold text-rose-600">{authError}</h3>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative flex w-full justify-center rounded-[14px] bg-black/80 backdrop-blur-md border border-white/20 hover:bg-black shadow-[0_4px_15px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] py-4 px-4 text-[15px] font-bold text-white hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300"
              >

                {isSubmitting ? (
                  <div className="flex items-center relative z-10">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-stone-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  <span className="relative z-10 flex items-center">
                    Sign in
                  </span>
                )}
              </button>
            </div>

            <p className="text-center text-sm font-medium text-stone-400 mt-6">
              Don't have an account?{' '}
              <a href="#" className="font-bold text-[#E35D30] hover:text-[#c44f28] transition-colors">
                Contact support
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
