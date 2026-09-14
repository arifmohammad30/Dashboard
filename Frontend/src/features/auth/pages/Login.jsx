import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import finalLogoSvg from '../../../assets/final-logo.svg';
import evIllustration from '../../../assets/ev_login_illustration.jpg';

const Login = () => {
  const { sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Step state: 1 = Email Input, 2 = OTP Verification
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [authError, setAuthError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Focus and styling states
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  // Cooldown timer for resending OTP
  const [resendCooldown, setResendCooldown] = useState(0);
  const timerRef = useRef(null);

  // Refs for the 6 OTP input boxes
  const otpInputRefs = useRef([]);

  const from = location.state?.from?.pathname || '/';

  // Manage resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      timerRef.current = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [resendCooldown]);

  // Auto-focus first OTP box when entering Step 2
  useEffect(() => {
    if (step === 2 && otpInputRefs.current[0]) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // Step 1 Handler: Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setAuthError('');
    setInfoMessage('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setAuthError('Please enter your email address');
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setAuthError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendOtp(trimmedEmail);
      setInfoMessage(res?.message || `OTP sent to ${trimmedEmail}`);
      setOtpDigits(['', '', '', '', '', '']);
      setStep(2);
      setResendCooldown(30); // 30-second cooldown
    } catch (err) {
      setAuthError(err.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2 Handler: Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setAuthError('');
    setInfoMessage('');

    const combinedOtp = otpDigits.join('');
    if (combinedOtp.length < 6) {
      setAuthError('Please enter all 6 digits of the OTP code');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyOtp(email.trim(), combinedOtp);
      navigate(from, { replace: true });
    } catch (err) {
      setAuthError(err.message || 'Invalid or expired verification code');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle individual OTP box change
  const handleOtpBoxChange = (index, value) => {
    const numericChar = value.replace(/\D/g, '').slice(-1); // Only take latest numeric digit

    const newDigits = [...otpDigits];
    newDigits[index] = numericChar;
    setOtpDigits(newDigits);
    if (authError) setAuthError('');

    // Advance focus to next input if digit entered
    if (numericChar && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Backspace and arrow navigation
  const handleOtpBoxKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        // Current box empty, clear & focus previous box
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        otpInputRefs.current[index - 1]?.focus();
      } else {
        // Clear current box
        const newDigits = [...otpDigits];
        newDigits[index] = '';
        setOtpDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle pasting full 6-digit OTP
  const handleOtpBoxPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setOtpDigits(newDigits);
    if (authError) setAuthError('');

    // Focus the box following the last pasted digit
    const nextIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  // Resend OTP Action
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    setAuthError('');
    setInfoMessage('');
    setIsSubmitting(true);

    try {
      const res = await sendOtp(email.trim());
      setInfoMessage(res?.message || `OTP sent to ${email.trim()}`);
      setOtpDigits(['', '', '', '', '', '']);
      setResendCooldown(30);
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      setAuthError(err.message || 'Failed to resend code');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Back to Email Step
  const handleBackToEmail = () => {
    setStep(1);
    setOtpDigits(['', '', '', '', '', '']);
    setAuthError('');
    setInfoMessage('');
  };

  const isEmailActive = isEmailFocused || Boolean(email);
  const isOtpComplete = otpDigits.every((d) => d !== '');

  return (
    <div className="min-h-screen lg:h-screen w-full bg-[#f6f8fa] flex items-center justify-center p-3 sm:p-4 lg:p-6 text-slate-800 font-sans overflow-y-auto lg:overflow-hidden relative">
      {/* Decorative ambient background accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#4DA944]/5 rounded-full blur-3xl pointer-events-none -z-0"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none -z-0"></div>

      {/* Unified Floating Card */}
      <div className="w-full max-w-[1140px] xl:max-w-[1200px] lg:h-[88vh] lg:max-h-[630px] xl:max-h-[660px] lg:min-h-[480px] bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07),0_1px_3px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row overflow-hidden relative z-10 my-auto">

        {/* Left Panel - Illustration & Hero Section (~54%) */}
        <div className="lg:w-[54%] bg-gradient-to-br from-slate-50/90 via-white to-emerald-50/25 p-5 sm:p-7 lg:p-8 xl:p-10 flex flex-col justify-between relative min-h-[280px] sm:min-h-[340px] lg:min-h-0 lg:h-full border-b lg:border-b-0 lg:border-r border-slate-100 overflow-hidden">
          {/* Top Spacer */}
          <div className="w-full h-1 shrink-0 relative z-10"></div>
          
          {/* Hero Copywriting */}
          <div className="max-w-md w-full relative z-10 mb-auto pt-5 sm:pt-7 lg:pt-9 xl:pt-11 pl-4 sm:pl-8 lg:pl-12 xl:pl-14">
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] xl:text-[38px] font-extrabold text-slate-900 leading-[1.14] tracking-tight">
              Welcome to
            </h1>

            <div className="mt-2 sm:mt-2.5 flex items-center">
              <img
                src={finalLogoSvg}
                alt="openev.io"
                className="h-10 sm:h-12 lg:h-13.5 w-auto max-w-[220px] sm:max-w-[260px] object-contain object-left"
              />
            </div>

            <p className="mt-3 text-slate-600 font-medium text-xs sm:text-sm lg:text-[14px] leading-relaxed max-w-xs">
              Smart charging solutions & intelligent station management for a sustainable future.
            </p>

            <div className="w-10 h-1.5 bg-[#4DA944] rounded-full mt-3.5"></div>
          </div>

          {/* Hero Illustration Layer */}
          <div className="absolute inset-0 flex items-end justify-center lg:justify-end xl:justify-center pointer-events-none z-0 pb-4 sm:pb-6 lg:pb-8 px-2 sm:px-4 lg:px-6" style={{ marginLeft: '40px' }}>
            <img
              src={evIllustration}
              alt="EV Charging Illustration"
              className="w-full max-w-[420px] sm:max-w-[560px] lg:max-w-[720px] xl:max-w-[800px] max-h-[38vh] sm:max-h-[50vh] lg:max-h-[72vh] xl:max-h-[78vh] object-contain object-bottom transform -translate-y-3 sm:-translate-y-5 lg:-translate-y-7"
            />
          </div>

          {/* Bottom spacer */}
          <div className="h-1 shrink-0 relative z-10"></div>
        </div>

        {/* Right Panel - Auth Form Section (~46%) */}
        <div className="lg:w-[46%] bg-white flex flex-col justify-center items-center p-5 sm:p-7 lg:p-8 xl:p-10 lg:h-full overflow-y-auto">
          <div className="w-full max-w-[360px] my-auto py-1">
            
            {/* STEP 1: EMAIL ENTRY */}
            {step === 1 && (
              <div className="animate-in fade-in duration-200">
                {/* Header */}
                <div className="text-center space-y-1.5 -mt-3 sm:-mt-5 lg:-mt-8 mb-6 sm:mb-7 lg:mb-8">
                  <h2 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-slate-900">
                    Sign in to your account
                  </h2>
                  <p className="text-xs sm:text-[13px] font-medium text-slate-500">
                    Enter your email address to receive a verification code
                  </p>
                </div>

                {/* Email Form */}
                <form className="space-y-4" onSubmit={handleSendOtp}>
                  {/* Email Field */}
                  <div className="space-y-1">
                    <div className="relative group">
                      <label
                        htmlFor="email"
                        className={`absolute transition-all duration-200 pointer-events-none z-10 rounded-md ${
                          isEmailActive
                            ? '-top-2.5 translate-y-0 left-3.5 px-1.5 bg-white text-[11px] font-bold ' +
                              (authError ? 'text-rose-500' : 'text-[#4DA944]')
                            : 'top-1/2 -translate-y-1/2 left-10.5 text-xs sm:text-sm font-medium text-slate-400'
                        }`}
                      >
                        Email address
                      </label>
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 z-10">
                        <Mail
                          className={`h-4.5 w-4.5 transition-colors ${
                            authError ? 'text-rose-500' : isEmailActive ? 'text-[#4DA944]' : 'text-slate-400'
                          }`}
                        />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (authError) setAuthError('');
                        }}
                        onFocus={() => setIsEmailFocused(true)}
                        onBlur={() => setIsEmailFocused(false)}
                        className={`block w-full rounded-xl border ${
                          authError
                            ? 'border-rose-300 bg-rose-50/30 text-rose-900'
                            : isEmailActive
                              ? 'border-[#4DA944] bg-white text-slate-800'
                              : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                        } pl-10.5 pr-3.5 py-3 text-xs sm:text-sm font-medium transition-all duration-200 outline-none`}
                        placeholder=""
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Error Alert */}
                  {authError && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs font-semibold text-rose-600 text-center animate-in fade-in">
                      {authError}
                    </div>
                  )}

                  {/* Submit Button: Send OTP */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={isSubmitting || !email.trim()}
                      className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#4DA944] hover:bg-[#43953b] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs hover:shadow-sm transition-all duration-200 flex items-center justify-center cursor-pointer"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Sending code...</span>
                        </div>
                      ) : (
                        <span>Send OTP</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {step === 2 && (
              <div className="animate-in fade-in duration-200">
                {/* Header with Small Back Button */}
                <div className="relative text-center space-y-1.5 -mt-3 sm:-mt-5 lg:-mt-8 mb-6">
                  {/* Small Back Button with Arrow */}
                  <button
                    type="button"
                    onClick={handleBackToEmail}
                    className="absolute -top-1 left-0 p-2 rounded-xl text-slate-500 hover:text-slate-900 bg-slate-100/90 hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200/80"
                    title="Back to email"
                    aria-label="Back to email"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <h2 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-slate-900">
                    Verification Code
                  </h2>
                  <p className="text-xs sm:text-[13px] font-medium text-slate-500 pt-0.5">
                    Please enter the 6-digit code sent to{' '}
                    <span className="font-semibold text-slate-800">{email}</span>
                  </p>
                </div>



                {/* OTP Form */}
                <form className="space-y-4" onSubmit={handleVerifyOtp}>
                  {/* 6 Small Boxes for OTP */}
                  <div className="space-y-1.5">
                    <div
                      className="flex items-center justify-between gap-1.5 sm:gap-2"
                      onPaste={handleOtpBoxPaste}
                    >
                      {otpDigits.map((digit, index) => (
                        <input
                          key={index}
                          id={`otp-digit-${index}`}
                          name={`otp_digit_${index}`}
                          autoComplete={index === 0 ? 'one-time-code' : 'off'}
                          aria-label={`Digit ${index + 1} of verification code`}
                          ref={(el) => (otpInputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpBoxChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpBoxKeyDown(index, e)}
                          className={`w-11 h-12 sm:w-12 sm:h-13 rounded-xl text-center text-lg sm:text-xl font-extrabold border transition-all duration-200 outline-none ${
                            authError
                              ? 'border-rose-300 bg-rose-50/40 text-rose-900 focus:border-rose-500'
                              : digit
                                ? 'border-[#4DA944] bg-white text-slate-900 shadow-2xs'
                                : 'border-slate-200 bg-slate-50/50 text-slate-800 hover:border-slate-300 focus:border-[#4DA944] focus:bg-white'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Resend OTP Action */}
                  <div className="flex items-center justify-between text-xs px-0.5 pt-0.5">
                    <span className="text-slate-400">Didn't receive code?</span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || isSubmitting}
                      className={`flex items-center gap-1 font-semibold transition-colors ${
                        resendCooldown > 0
                          ? 'text-slate-400 cursor-not-allowed'
                          : 'text-[#4DA944] hover:text-[#3f8b37] cursor-pointer'
                      }`}
                    >
                      <RefreshCw className={`w-3 h-3 ${isSubmitting ? 'animate-spin' : ''}`} />
                      <span>
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                      </span>
                    </button>
                  </div>

                  {/* Error Alert */}
                  {authError && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs font-semibold text-rose-600 text-center animate-in fade-in">
                      {authError}
                    </div>
                  )}

                  {/* Submit Button: Verify OTP */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={isSubmitting || !isOtpComplete}
                      className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#4DA944] hover:bg-[#43953b] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs hover:shadow-sm transition-all duration-200 flex items-center justify-center cursor-pointer"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Verifying...</span>
                        </div>
                      ) : (
                        <span>Verify & Sign In</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
