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
  User as UserIcon,
} from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

export const AuthModal: React.FC = () => {
  const { user, loginWithGoogle, continueAsGuest, logout, isAuthModalOpen, closeAuthModal, googleClientId } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gisRendered, setGisRendered] = useState(false);
  const DEFAULT_GOOGLE_CLIENT_ID = '340953449815-qatnff0fgk0ee9jel8nk8o7tk1mlj4dp.apps.googleusercontent.com';
  const clientId = googleClientId || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // Clear messages on modal open
  useEffect(() => {
    if (isAuthModalOpen) {
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isAuthModalOpen]);

  // Load Google Identity Services (GIS) script
  useEffect(() => {
    if (!isAuthModalOpen || user) return;

    const renderGis = () => {
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
          setGisRendered(true);
        } catch (e) {
          console.warn('Google Identity initialization error:', e);
          setGisRendered(false);
        }
      }
    };

    if (!window.google?.accounts) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        renderGis();
      };
      document.body.appendChild(script);
    } else {
      renderGis();
    }
  }, [isAuthModalOpen, user, clientId]);

  if (!isAuthModalOpen) return null;

  function formatAuthError(err?: string): string {
    if (!err) return 'Authentication failed. Please try again.';
    if (
      err.includes('buffering timed out') ||
      err.includes('buffering') ||
      err.includes('ECONNREFUSED') ||
      err.includes('Server selection timed out')
    ) {
      return 'Connection timed out. Please check your network connection and try again.';
    }
    return err;
  }

  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response?.credential) return;
    setIsSubmitting(true);
    setErrorMsg('');
    const res = await loginWithGoogle(response.credential);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(formatAuthError(res.error));
    } else {
      setSuccessMsg('Successfully signed in with Google!');
      setTimeout(() => closeAuthModal(), 600);
    }
  };

  // Fallback single Google Sign In handler (used only if GIS button doesn't mount)
  const handleContinueWithGoogle = async () => {
    const activeId = clientId || DEFAULT_GOOGLE_CLIENT_ID;
    if (!activeId) {
      setErrorMsg('Google OAuth Client ID is not configured.');
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      setErrorMsg('Google services are still initializing. Please wait a moment and try again.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: activeId,
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (tokenResponse: any) => {
          if (tokenResponse?.error) {
            setIsSubmitting(false);
            const err = tokenResponse.error;
            if (err === 'origin_mismatch' || err === 'idpiframe_initialization_failed') {
              const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://stocks-portfolio-kappa.vercel.app';
              setErrorMsg(`Google Origin Mismatch: Please ensure "${currentOrigin}" is added under "Authorized JavaScript origins" in Google Cloud Console.`);
            } else if (err === 'access_denied') {
              setErrorMsg('Google 403 (Access Denied): Your Google Cloud OAuth Consent Screen is in "Testing" status. To allow other Google accounts to sign in: Go to Google Cloud Console > APIs & Services > OAuth consent screen, and either click "PUBLISH APP", or add this email to "Test users".');
            } else if (err !== 'popup_closed_by_user') {
              setErrorMsg(`Google sign-in error: ${tokenResponse.error_description || err}`);
            }
            return;
          }
          if (tokenResponse?.access_token) {
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const gProfile = await res.json();
              if (gProfile?.email) {
                const loginRes = await loginWithGoogle({
                  email: gProfile.email,
                  name: gProfile.name || gProfile.given_name || 'Google User',
                  avatar: gProfile.picture,
                  googleId: gProfile.sub,
                });
                setIsSubmitting(false);
                if (loginRes.success) {
                  setSuccessMsg('Successfully connected via Google!');
                  setTimeout(() => closeAuthModal(), 600);
                } else {
                  setErrorMsg(formatAuthError(loginRes.error));
                }
                return;
              }
            } catch (e: any) {
              setIsSubmitting(false);
              setErrorMsg('Failed to load Google profile data.');
              return;
            }
          }
          setIsSubmitting(false);
        },
      });
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (e: any) {
      console.warn('OAuth popup launch error:', e);
      setIsSubmitting(false);
      setErrorMsg(e?.message || 'Failed to open Google authentication window.');
    }
  };

  const isGuestUser = user?.isGuest;

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
            {isGuestUser ? (
              <UserIcon className="h-7 w-7 text-[#38BDF8]" />
            ) : (
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
            )}
            <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#0D1218] ${isGuestUser ? 'bg-amber-400' : 'bg-emerald-500'}`} />
          </div>
          <h2 className="text-xl font-extrabold text-[#F4F7FA] tracking-tight">
            {user
              ? isGuestUser
                ? 'Guest Mode Active'
                : 'Google Account Connected'
              : 'Sign In with Google'}
          </h2>
          <p className="text-xs text-[#8D99A8] max-w-xs mx-auto">
            {user
              ? isGuestUser
                ? 'Session data is active for this browser tab.'
                : 'Signed in with your verified Google account.'
              : 'Sign in to access your portfolio holdings, live watchlist, and SEBI tax calculations.'}
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
          /* ACTIVE USER / GUEST PROFILE CARD */
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
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0E1522] border border-[#38BDF8]/40 text-[#38BDF8] font-bold text-black text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="overflow-hidden flex-1">
                  <div className="font-bold text-white text-sm truncate flex items-center gap-2">
                    {user.name}
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isGuestUser
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : user.role === 'ADMIN'
                          ? 'bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/40'
                          : 'bg-[#22C55E]/20 text-[#4ADE80] border border-[#22C55E]/40'
                      }`}
                    >
                      {isGuestUser ? 'GUEST' : user.role}
                    </span>
                  </div>
                  <div className="text-xs text-[#8D99A8] truncate flex items-center gap-1.5 mt-0.5">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span>{user.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 py-2.5 text-xs font-semibold text-rose-300 transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>{isGuestUser ? 'Exit Guest Session' : 'Sign Out Session'}</span>
            </button>
          </div>
        ) : (
          /* NOT LOGGED IN: ONLY ONE GOOGLE BUTTON + GUEST BUTTON */
          <div className="space-y-4 pt-1">
            {/* SINGLE GOOGLE SIGN IN BUTTON */}
            <div className="flex flex-col items-center justify-center w-full min-h-[44px]">
              <div
                ref={googleBtnContainerRef}
                className={`flex justify-center w-full ${!gisRendered ? 'hidden' : ''}`}
              />
              {!gisRendered && (
                <button
                  type="button"
                  onClick={handleContinueWithGoogle}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-3 rounded-full bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-900 py-3 px-4 font-semibold text-xs shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50"
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
              )}
            </div>

            {/* OR DIVIDER */}
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-[#202A35] w-full" />
              <span className="bg-[#0D1218] px-3 text-[10px] font-bold uppercase tracking-wider text-[#596574]">
                OR
              </span>
              <div className="border-t border-[#202A35] w-full" />
            </div>

            {/* GUEST OPTION */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={continueAsGuest}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#111820] hover:bg-[#151D26] border border-[#202A35] hover:border-[#38BDF8]/40 text-[#F4F7FA] py-3 px-4 font-semibold text-xs shadow-md transition-all duration-200 cursor-pointer group"
              >
                <UserIcon className="h-4 w-4 text-[#38BDF8] group-hover:scale-110 transition-transform" />
                <span>Continue as Guest</span>
              </button>
              <p className="text-[11px] text-[#596574] text-center leading-relaxed">
                Temporary session • Stored in tab cache only and discarded once app is closed.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
