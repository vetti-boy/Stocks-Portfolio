'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  LogOut,
  Mail,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

export const AuthModal: React.FC = () => {
  const { user, loginWithGoogle, logout, isAuthModalOpen, closeAuthModal, googleClientId } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomEmailInput, setShowCustomEmailInput] = useState(false);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // Clear messages on modal open
  useEffect(() => {
    if (isAuthModalOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      setShowCustomEmailInput(false);
    }
  }, [isAuthModalOpen]);

  // Load and initialize Google Identity Services (GIS)
  useEffect(() => {
    if (!isAuthModalOpen || user) return;

    const clientId = googleClientId || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    // Load Google script if not already loaded
    if (!window.google?.accounts?.id) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (clientId && window.google?.accounts?.id && googleBtnContainerRef.current) {
          try {
            window.google.accounts.id.initialize({
              client_id: clientId,
              callback: handleGoogleCredentialResponse,
            });
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              theme: 'filled_black',
              size: 'large',
              shape: 'pill',
              width: 320,
              text: 'continue_with',
            });
          } catch (e) {
            console.warn('Google Identity initialization error:', e);
          }
        }
      };
      document.body.appendChild(script);
    } else if (clientId && window.google?.accounts?.id && googleBtnContainerRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
        });
        window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          width: 320,
          text: 'continue_with',
        });
      } catch (e) {
        console.warn('Google Identity render error:', e);
      }
    }
  }, [isAuthModalOpen, user, googleClientId]);

  if (!isAuthModalOpen) return null;

  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response?.credential) return;
    setIsSubmitting(true);
    setErrorMsg('');
    const res = await loginWithGoogle(response.credential);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Google authentication failed.');
    } else {
      setSuccessMsg('Successfully signed in with Google!');
      setTimeout(() => closeAuthModal(), 600);
    }
  };

  const handleDirectGoogleLogin = async (email: string, name?: string) => {
    if (!email) return;
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await loginWithGoogle({
      email,
      name: name || email.split('@')[0],
      googleId: 'g_' + Math.abs(email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)),
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}`,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Google authentication failed.');
    } else {
      setSuccessMsg('Signed in successfully!');
      setTimeout(() => closeAuthModal(), 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0D1218] rounded-2xl w-full max-w-md p-6 space-y-6 relative border border-[#202A35] shadow-2xl">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute right-4 top-4 text-[#8D99A8] hover:text-[#F4F7FA] transition cursor-pointer p-1 rounded-lg hover:bg-[#151D26]"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#111820] border border-[#202A35] shadow-md relative">
            <svg className="h-7 w-7" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-[#0D1218]" />
          </div>
          <h2 className="text-xl font-extrabold text-[#F4F7FA] tracking-tight">
            {user ? 'Google Account Connected' : 'Sign In with Google'}
          </h2>
          <p className="text-xs text-[#8D99A8] max-w-xs mx-auto">
            {user
              ? 'Your stock portfolio & trade data are securely linked to your account.'
              : 'Access your cloud-synced portfolio holdings, live watchlist, and SEBI tax calculations.'}
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-500/15 p-3 text-xs text-rose-300 border border-rose-500/30 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 p-3 text-xs text-emerald-300 border border-emerald-500/30 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {user ? (
          /* ACTIVE USER PROFILE CARD */
          <div className="space-y-4">
            <div className="rounded-xl bg-[#111820] border border-[#202A35] p-4 space-y-3">
              <div className="flex items-center gap-3">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-11 w-11 rounded-full border border-[#38BDF8]/40 object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-[#38BDF8] to-[#8B5CF6] font-bold text-black text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="overflow-hidden flex-1">
                  <div className="font-bold text-white text-sm truncate flex items-center gap-2">
                    {user.name}
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        user.role === 'ADMIN'
                          ? 'bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/40'
                          : 'bg-[#22C55E]/20 text-[#4ADE80] border border-[#22C55E]/40'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                  <div className="text-xs text-[#8D99A8] truncate flex items-center gap-1.5 mt-0.5">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span>{user.email}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#202A35] flex items-center justify-between text-[11px] text-[#8D99A8]">
                <span>Cloud Storage:</span>
                <span className="text-[#38BDF8] font-mono font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
                  MongoDB Atlas Connected
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 py-2.5 text-xs font-semibold text-rose-300 transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out Session</span>
            </button>
          </div>
        ) : (
          /* GOOGLE SIGN IN ACTION AREA */
          <div className="space-y-4">
            {/* GIS Container if configured */}
            <div ref={googleBtnContainerRef} className="flex justify-center min-h-[44px]" />

            {/* Standard One-Click Google Action Button */}
            <button
              onClick={() => {
                if (window.google?.accounts?.id && (googleClientId || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)) {
                  try {
                    window.google.accounts.id.prompt();
                    return;
                  } catch (e) {
                    console.warn(e);
                  }
                }
                setShowCustomEmailInput(true);
              }}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 py-3 px-4 font-semibold text-xs shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-900" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            {/* Quick 1-Click Fast Sign In Accounts for Convenience */}
            <div className="pt-2 border-t border-[#202A35] space-y-2">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#596574] text-center">
                Quick Google Profiles
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDirectGoogleLogin('mailfortempusage@gmail.com', 'System Administrator')}
                  disabled={isSubmitting}
                  className="flex flex-col items-start p-2.5 rounded-xl bg-[#111820] hover:bg-[#151D26] border border-[#202A35] hover:border-[#8B5CF6]/50 transition text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white group-hover:text-[#A78BFA] transition">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#8B5CF6]" />
                    <span>Admin Profile</span>
                  </div>
                  <span className="text-[10px] text-[#8D99A8] truncate w-full mt-0.5">
                    mailfortempusage@...
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDirectGoogleLogin('51manoj2004@gmail.com', 'Manoj S')}
                  disabled={isSubmitting}
                  className="flex flex-col items-start p-2.5 rounded-xl bg-[#111820] hover:bg-[#151D26] border border-[#202A35] hover:border-[#38BDF8]/50 transition text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white group-hover:text-[#38BDF8] transition">
                    <UserIcon className="h-3.5 w-3.5 text-[#38BDF8]" />
                    <span>Manoj S</span>
                  </div>
                  <span className="text-[10px] text-[#8D99A8] truncate w-full mt-0.5">
                    51manoj2004@...
                  </span>
                </button>
              </div>
            </div>

            {/* Custom Google Email Accordion/Form */}
            {showCustomEmailInput ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (customEmail) handleDirectGoogleLogin(customEmail, customName);
                }}
                className="space-y-3 pt-2 border-t border-[#202A35] animate-in fade-in"
              >
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Google Account Email *
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="your.email@gmail.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="w-full bg-[#111820] border border-[#202A35] focus:border-[#38BDF8] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Display Name (Optional)
                  </label>
                  <div className="relative flex items-center">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Your Full Name"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full bg-[#111820] border border-[#202A35] focus:border-[#38BDF8] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomEmailInput(false)}
                    className="w-1/3 py-2 text-xs font-semibold text-[#8D99A8] hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-2/3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#38BDF8] to-[#8B5CF6] py-2 text-xs font-bold text-black shadow-lg hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Sign In</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowCustomEmailInput(true)}
                  className="text-[11px] text-[#38BDF8] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Enter another Google account</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
