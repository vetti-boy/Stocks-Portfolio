'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  LogIn,
  Lock,
  ShieldCheck,
  LogOut,
  Mail,
  User as UserIcon,
  AlertCircle,
  UserPlus,
  CheckCircle2,
  KeyRound,
  Send,
  Loader2,
  Key,
  Eye,
  EyeOff,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { user, login, register, loginAsAdmin, logout, isAuthModalOpen, closeAuthModal, updateUser } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mandatory First-Time Password Change Mode
  const [isMustChangePasswordMode, setIsMustChangePasswordMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Voluntary OTP Password Change Mode
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Reset messages & modes on open
  React.useEffect(() => {
    if (isAuthModalOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      setIsOtpMode(false);
      setIsMustChangePasswordMode(!!user?.mustChangePassword);
    }
  }, [isAuthModalOpen, user]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!email || !password) return;

    setIsSubmitting(true);
    if (authMode === 'login') {
      const res = await login(email, password);
      setIsSubmitting(false);

      if (!res.success) {
        setErrorMsg(res.error || 'Authentication failed. Invalid email or password.');
      } else if (res.mustChangePassword) {
        // First time login -> Require password update
        setIsMustChangePasswordMode(true);
        setSuccessMsg('First-time login detected. You must update your password to proceed.');
      }
    } else {
      if (!name) {
        setIsSubmitting(false);
        setErrorMsg('Please enter your full name');
        return;
      }
      const res = await register(name, email, password);
      setIsSubmitting(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Registration failed.');
      } else {
        setSuccessMsg('Account created successfully!');
      }
    }
  };

  // Mandatory First-Time Password Change Handler
  const handleFirstTimePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setErrorMsg('New password must be at least 4 characters long');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.email || email,
          newPassword,
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Failed to update password');
      } else {
        setSuccessMsg('Password updated successfully! Your account is now fully active.');
        setIsMustChangePasswordMode(false);
        setNewPassword('');
        updateUser({ mustChangePassword: false });
        setTimeout(() => closeAuthModal(), 1200);
      }
    } catch {
      setIsSubmitting(false);
      setErrorMsg('Failed to update password due to network error');
    }
  };

  // Step 1: Send OTP to User's Email from Server Mail
  const handleRequestOtp = async () => {
    if (!user && !email) {
      setErrorMsg('Email address required to send OTP');
      return;
    }
    setIsSendingOtp(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.email || email,
        }),
      });

      const data = await res.json();
      setIsSendingOtp(false);

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Failed to send OTP code');
      } else {
        setOtpSent(true);
        setSuccessMsg(data.message || `A 6-digit OTP code has been sent to ${data.email || 'your email'}`);
      }
    } catch {
      setIsSendingOtp(false);
      setErrorMsg('Failed to dispatch OTP code');
    }
  };

  // Step 2: Verify OTP and Set New Password
  const handleVerifyOtpAndPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 5) {
      setErrorMsg('Please enter the 6-digit OTP code received in your email');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setErrorMsg('New password must be at least 4 characters long');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/verify-otp-change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.email || email,
          otpCode,
          newPassword,
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'OTP verification failed');
      } else {
        setSuccessMsg('Password verified & updated successfully via OTP!');
        setIsOtpMode(false);
        setOtpSent(false);
        setOtpCode('');
        setNewPassword('');
        if (data.user) updateUser(data.user);
        setTimeout(() => closeAuthModal(), 1200);
      }
    } catch {
      setIsSubmitting(false);
      setErrorMsg('OTP verification failed due to network error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="bg-[#0D1218] rounded-2xl w-full max-w-md p-6 space-y-5 relative border border-[#202A35] shadow-2xl">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute right-4 top-4 text-[#8D99A8] hover:text-[#F4F7FA] transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#111820] border border-[#202A35] shadow-md">
            <ShieldCheck className="h-6 w-6 text-[#38BDF8]" />
          </div>
          <h2 className="text-xl font-extrabold text-[#F4F7FA] tracking-tight font-mono">
            {isMustChangePasswordMode
              ? 'First-Time Login: Set New Password'
              : isOtpMode
              ? 'Change Password (Email OTP)'
              : user
              ? 'Account Session & Security'
              : authMode === 'login'
              ? 'Secure Cloud Sign In'
              : 'Create Investor Account'}
          </h2>
          <p className="text-xs text-[#8D99A8]">
            {isMustChangePasswordMode
              ? 'You are logging in with a default password. Update it now to activate your account.'
              : isOtpMode
              ? 'Enter the 6-digit OTP code sent to your email to update your password.'
              : user
              ? `Logged in as ${user.name} (${user.role})`
              : 'Access your stock portfolio & live watchlist synced to MongoDB Atlas Cloud.'}
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-500/20 p-3 text-xs text-rose-300 border border-rose-500/30">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/20 p-3 text-xs text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. FIRST-TIME MANDATORY PASSWORD CHANGE MODE */}
        {isMustChangePasswordMode ? (
          <form onSubmit={handleFirstTimePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Enter Your New Personal Password *
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400 z-10 pointer-events-none" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={4}
                  placeholder="Enter new strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full glass-input !pl-10 !pr-10 text-xs font-mono text-emerald-300 font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition focus:outline-none z-10"
                  title={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs font-bold text-white shadow-lg hover:from-emerald-500 hover:to-teal-500 transition disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Save & Activate Account</span>
            </button>
          </form>
        ) : isOtpMode ? (
          /* 2. VOLUNTARY USER PASSWORD CHANGE VIA EMAIL OTP */
          <form onSubmit={handleVerifyOtpAndPasswordChange} className="space-y-4">
            {!otpSent ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/30 p-3 text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-cyan-400" /> Send OTP to {user?.email || email}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    A 6-digit verification code will be dispatched to your registered email address.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={isSendingOtp}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-bold text-white shadow transition"
                >
                  {isSendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>Request 6-Digit Email OTP</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Enter 6-Digit OTP Received in Email *
                  </label>
                  <div className="relative flex items-center">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400 z-10 pointer-events-none" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="e.g. 849201"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full glass-input !pl-10 text-sm font-mono tracking-widest text-amber-300 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    New Password *
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400 z-10 pointer-events-none" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={4}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full glass-input !pl-10 !pr-10 text-xs font-mono text-emerald-300 font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition focus:outline-none z-10"
                      title={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOtpMode(false)}
                    className="w-1/3 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-2/3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs font-bold text-white shadow-lg hover:from-emerald-500 hover:to-teal-500 transition disabled:opacity-50"
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>Verify OTP & Change Password</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        ) : user ? (
          /* 3. LOGGED IN USER PROFILE CARD & OPTIONS */
          <div className="rounded-xl bg-slate-900/90 border border-white/10 p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 font-bold text-white text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-white text-sm truncate flex items-center gap-2">
                  {user.name}
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      user.role === 'ADMIN'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <div className="text-xs text-slate-400 truncate">{user.email}</div>
              </div>
            </div>

            <div className="space-y-2 pt-1 border-t border-white/10">
              <button
                onClick={() => {
                  setIsOtpMode(true);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 py-2 text-xs font-semibold text-cyan-300 transition"
              >
                <KeyRound className="h-3.5 w-3.5" /> Change Password (Email OTP Verification)
              </button>

              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 py-2 text-xs font-semibold text-rose-300 transition"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out Session
              </button>
            </div>
          </div>
        ) : (
          /* 4. STANDARD LOGIN / REGISTER FORM */
          <>
            {/* Mode Switcher Tabs */}
            <div className="flex bg-slate-950/80 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMsg('');
                }}
                className={`w-1/2 py-2 text-xs font-bold rounded-lg transition ${
                  authMode === 'login'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMsg('');
                }}
                className={`w-1/2 py-2 text-xs font-bold rounded-lg transition ${
                  authMode === 'register'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <div className="relative flex items-center">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Manoj Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full glass-input !pl-10 text-xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address *
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full glass-input !pl-10 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full glass-input !pl-10 !pr-10 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition focus:outline-none z-10"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 py-2.5 text-xs font-bold text-white shadow-lg hover:from-indigo-500 hover:to-cyan-500 transition disabled:opacity-50"
              >
                {authMode === 'login' ? (
                  <>
                    <LogIn className="h-4 w-4" /> Log In
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" /> Create Account & Sync Cloud DB
                  </>
                )}
              </button>
            </form>

            {/* Admin Login Shortcut */}
            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setEmail('mailfortempusage@gmail.com');
                  setPassword('');
                  setErrorMsg('');
                  setSuccessMsg('Enter admin password to log in as Administrator.');
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 transition"
              >
                <ShieldCheck className="h-4 w-4 text-indigo-400" /> Log In as Administrator
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

