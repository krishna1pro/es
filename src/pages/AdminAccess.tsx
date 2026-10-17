/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Lock,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Info
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { UserProfile, UserStatus } from "@/src/types";
import { sanitizeCurrentUrl } from "@/src/lib/useUrlSanitizer";

interface AdminAccessProps {
  user: UserProfile | null;
}

export default function AdminAccess({ user }: AdminAccessProps) {
  const navigate = useNavigate();
  const { loginWithGoogle, loginWithRedirect } = useAuth();

  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<{ message: string; isConfigError?: boolean } | null>(null);

  // Clean sensitive query parameters (like ?email=...) immediately on mount
  useEffect(() => {
    sanitizeCurrentUrl();
  }, []);

  // Navigate if user is already authenticated
  useEffect(() => {
    if (user) {
      if (user.status === UserStatus.APPROVED) {
        navigate("/admin", { replace: true });
      } else if (user.status === UserStatus.PENDING) {
        navigate("/waiting-room", { replace: true });
      }
    }
  }, [user, navigate]);

  const parseAuthError = (err: any): { message: string; isConfigError?: boolean } => {
    const code = err?.code || "";
    const hostname = typeof window !== "undefined" ? window.location.hostname : "your domain";

    if (code === "auth/unauthorized-domain") {
      return {
        message: `Domain Authorization Required: The current domain (${hostname}) is not authorized in Firebase Authentication. Please add "${hostname}" to Firebase Console > Authentication > Settings > Authorized Domains.`,
        isConfigError: true
      };
    }
    if (code === "auth/popup-blocked") {
      return {
        message: "Sign-in popup was blocked by your browser. Please allow popups, or use the 'Continue with Full Page Redirect' button below."
      };
    }
    if (code === "auth/popup-closed-by-user") {
      return {
        message: "Sign-in window was closed before completing authentication. Please click the button to try again."
      };
    }
    if (code === "auth/cancelled-popup-request") {
      return {
        message: "Another sign-in attempt was initiated. Please try again."
      };
    }
    if (code === "auth/network-request-failed") {
      return {
        message: "Network connectivity error. Please check your internet connection and try again."
      };
    }
    if (code === "auth/operation-not-allowed") {
      return {
        message: "Google Sign-In provider is disabled in Firebase. Enable Google in Firebase Console > Authentication > Sign-in method.",
        isConfigError: true
      };
    }

    return {
      message: err?.message || "Authentication error. Ensure your account is authorized to access the system."
    };
  };

  const handleGoogleSignInPopup = async () => {
    if (loading || redirecting) return;
    setLoading(true);
    setError(null);
    try {
      const loggedInUser = await loginWithGoogle();
      if (!loggedInUser) {
        throw new Error("Unable to establish authenticated session.");
      }

      if (loggedInUser.status === UserStatus.APPROVED) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/waiting-room", { replace: true });
      }
    } catch (err: any) {
      console.error("[AdminAccess] Sign in failed:", err);
      setError(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInRedirect = async () => {
    if (loading || redirecting) return;
    setRedirecting(true);
    setError(null);
    try {
      await loginWithRedirect();
    } catch (err: any) {
      console.error("[AdminAccess] Redirect sign in failed:", err);
      setError(parseAuthError(err));
      setRedirecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
        >
          {/* Header Card */}
          <div className="bg-gradient-to-br from-[#001D3D] via-[#002B5B] to-[#001D3D] p-10 sm:p-12 text-center text-white relative">
            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/20 shadow-xl backdrop-blur-xl">
              <Lock size={36} className="text-white" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-widest mb-3 border border-blue-400/20">
              <ShieldCheck size={12} /> Encrypted Gateway
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              Leadership Control
            </h1>
            <p className="text-blue-300/80 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
              Authorized Personnel & Super Admin
            </p>
          </div>

          <div className="p-8 sm:p-10 space-y-6">
            {error && (
              <div className={`p-4 rounded-2xl flex items-start gap-3 text-xs font-semibold ${
                error.isConfigError
                  ? "bg-amber-50 border border-amber-200 text-amber-800"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}>
                {error.isConfigError ? (
                  <Info size={18} className="shrink-0 mt-0.5 text-amber-600" />
                ) : (
                  <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
                )}
                <span className="leading-relaxed">{error.message}</span>
              </div>
            )}

            {/* Google Authentication Actions */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Identity Verification
              </p>

              {/* Primary: Google Popup */}
              <button
                onClick={handleGoogleSignInPopup}
                disabled={loading || redirecting}
                className="w-full p-4 bg-white border-2 border-slate-200 hover:border-blue-900 rounded-2xl flex items-center justify-between group shadow-sm hover:shadow-xl transition-all disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  {loading ? (
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-900 shrink-0" />
                  ) : (
                    <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
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
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
                      {loading ? "Verifying Credentials..." : "Continue with Google"}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400">
                      Single Sign-On for Authorized Accounts
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={18}
                  className="text-slate-300 group-hover:text-blue-900 group-hover:translate-x-1 transition-all"
                />
              </button>

              {/* Secondary: Full Page Redirect Fallback */}
              <button
                onClick={handleGoogleSignInRedirect}
                disabled={loading || redirecting}
                className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ExternalLink size={12} className="text-slate-400" />
                <span>{redirecting ? "Redirecting to Google..." : "Continue with Full Page Redirect (Mobile / Popup Blocked)"}</span>
              </button>
            </div>

            {/* Information Notice */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-blue-700" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800">
                  Super Admin Policy
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                The designated Super Admin (<span className="font-bold text-slate-800">krishnapro216@gmail.com</span>) is granted unconditional command authority upon Google sign-in. Team members requesting access will enter the clearance waiting room pending approval.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
              <span>Security Tier: High</span>
              <span>MongoDB Atlas RBAC</span>
            </div>
          </div>
        </motion.div>

        <p className="mt-8 text-center text-[9px] text-slate-600 font-bold uppercase tracking-[0.3em]">
          Constituency Digital Operations • Version 4.2
        </p>
      </div>
    </div>
  );
}
