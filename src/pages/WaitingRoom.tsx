/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Clock, ShieldAlert, LogOut, RefreshCw, CheckCircle2, User, Send } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { UserProfile, UserStatus, UserRole } from "@/src/types";
import { sanitizeCurrentUrl } from "@/src/lib/useUrlSanitizer";

interface WaitingRoomProps {
  user: UserProfile | null;
}

const ROLES = [
  { role: UserRole.CONTENT_MANAGER, label: "Content Manager" },
  { role: UserRole.MEDIA_MANAGER, label: "Media Publisher" },
  { role: UserRole.EVENT_MANAGER, label: "Event Coordinator" },
  { role: UserRole.VOLUNTEER_MANAGER, label: "Volunteer Lead" },
  { role: UserRole.CADRE_MANAGER, label: "Cadre Corner Manager" },
  { role: UserRole.RESEARCH_MANAGER, label: "Policy & Research Analyst" },
  { role: UserRole.OFFICE_MANAGER, label: "Office Staff" },
  { role: UserRole.VIEWER, label: "General Observer" }
];

export default function WaitingRoom({ user: initialUser }: WaitingRoomProps) {
  const navigate = useNavigate();
  const { user, refreshUser, logout, authFetch, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(false);
  const [updatingNotes, setUpdatingNotes] = useState(false);
  const [role, setRole] = useState<string>(user?.requestedRole || UserRole.CONTENT_MANAGER);
  const [notes, setNotes] = useState<string>(user?.requestNotes || "");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sanitize URL on mount
  useEffect(() => {
    sanitizeCurrentUrl();
  }, []);

  // Redirection checks
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/leadership-control-center", { replace: true });
      return;
    }

    if (user.status === UserStatus.APPROVED) {
      navigate("/admin", { replace: true });
      return;
    }

    // Auto-polling check every 6 seconds
    const interval = setInterval(async () => {
      try {
        const fresh = await refreshUser();
        if (fresh && fresh.status === UserStatus.APPROVED) {
          navigate("/admin", { replace: true });
        }
      } catch (err) {
        // Polling error silently handled
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [user, authLoading, navigate, refreshUser]);

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      const fresh = await refreshUser();
      if (fresh && fresh.status === UserStatus.APPROVED) {
        navigate("/admin", { replace: true });
      }
    } finally {
      setTimeout(() => setChecking(false), 800);
    }
  };

  const handleUpdatePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingNotes(true);
    try {
      const res = await authFetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedRole: role,
          requestNotes: notes
        })
      });
      if (res.ok) {
        setSaveSuccess(true);
        await refreshUser();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to update role request:", err);
    } finally {
      setUpdatingNotes(false);
    }
  };

  const currentUser = user || initialUser;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-2xl border border-slate-100 space-y-8"
      >
        {/* Status Badge */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-center justify-center mx-auto shadow-sm text-amber-600">
            <Clock size={32} />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest border border-amber-200">
            Clearance Pending
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
            Awaiting Super Admin Approval
          </h1>

          <p className="text-sm text-slate-500 leading-relaxed">
            Your Google Account has been registered with the MongoDB security layer. Access to the Leadership Control Center requires approval from the Super Admin.
          </p>
        </div>

        {/* Profile Card */}
        {currentUser && (
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName || 'User'}&background=004B8D&color=fff`}
                alt="Google Profile"
                className="w-12 h-12 rounded-xl object-cover border border-slate-200"
              />
              <div>
                <p className="text-sm font-black text-slate-900">{currentUser.displayName}</p>
                <p className="text-xs font-semibold text-slate-400">{currentUser.email}</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-widest rounded-lg">
              {currentUser.status}
            </span>
          </div>
        )}

        {/* Request Role Form */}
        <form onSubmit={handleUpdatePreferences} className="space-y-4 pt-2 border-t border-slate-100">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              Requested Team Responsibility
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-900 transition-colors"
            >
              {ROLES.map((r) => (
                <option key={r.role} value={r.role}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              Note for Super Admin (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. In-charge of constituency media press releases"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-900 transition-colors"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              type="submit"
              disabled={updatingNotes}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <Send size={12} />
              {updatingNotes ? "Updating..." : "Update Request"}
            </button>
            {saveSuccess && (
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={14} /> Saved for Super Admin review
              </span>
            )}
          </div>
        </form>

        {/* Actions Bar */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={handleManualCheck}
            disabled={checking}
            className="w-full sm:w-auto px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
          >
            <RefreshCw size={14} className={checking ? "animate-spin" : ""} />
            {checking ? "Checking Approval..." : "Check Status"}
          </button>

          <button
            onClick={async () => {
              await logout();
              navigate("/leadership-control-center", { replace: true });
            }}
            className="text-xs font-bold text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1.5"
          >
            <LogOut size={14} /> Switch Google Account
          </button>
        </div>
      </motion.div>
    </div>
  );
}
