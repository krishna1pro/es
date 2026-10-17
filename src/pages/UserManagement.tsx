/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { useAuth } from "@/src/context/AuthContext";
import { UserProfile, UserStatus, UserRole, AuditLogDocument } from "@/src/types";
import { ALL_HOMEPAGE_SECTION_IDS, SectionType } from "@/src/types/homeCms";
import {
  Users,
  UserCheck,
  Shield,
  ShieldAlert,
  Trash2,
  Search,
  Filter,
  Check,
  X,
  Edit2,
  Lock,
  Layers,
  History,
  AlertCircle,
  RefreshCw,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const ALL_ROLES: { role: UserRole; label: string }[] = [
  { role: UserRole.SUPER_ADMIN, label: "Super Admin (Full Authority)" },
  { role: UserRole.ADMIN, label: "General Administrator" },
  { role: UserRole.CONTENT_MANAGER, label: "Content Manager" },
  { role: UserRole.MEDIA_MANAGER, label: "Media Publisher" },
  { role: UserRole.EVENT_MANAGER, label: "Event Coordinator" },
  { role: UserRole.VOLUNTEER_MANAGER, label: "Volunteer Lead" },
  { role: UserRole.CADRE_MANAGER, label: "Cadre Corner Manager" },
  { role: UserRole.RESEARCH_MANAGER, label: "Policy & Research Analyst" },
  { role: UserRole.OFFICE_MANAGER, label: "Office Staff" },
  { role: UserRole.ANALYTICS_MANAGER, label: "Analytics Manager" },
  { role: UserRole.PUBLIC_RELATIONS_MANAGER, label: "Public Relations Manager" },
  { role: UserRole.VIEWER, label: "Observer (Read Only)" }
];

const SECTION_LABELS: Record<SectionType, string> = {
  hero: "Hero Banner & Portrait",
  stats: "Impact Statistics",
  about_leader: "Leader Profile",
  our_vision: "Strategic Vision",
  leadership_journey: "Leadership Journey",
  daily_activities: "Daily Schedule",
  monthly_activities: "Monthly Activities",
  yearly_report: "Yearly Impact Report",
  development_projects: "Constituency Projects",
  peoples_voice: "Democracy & Dialogue",
  cadre_corner: "Cadre Corner & Wings",
  media_center: "Media Center & Press",
  social_hub: "Social Media Hub",
  upcoming_events: "Upcoming Events",
  volunteer_contact: "Volunteer & Office Contact",
  about_page: "About Page CMS",
  vision_page: "Vision Page CMS",
  activities_page: "Activities Page CMS",
  development_page: "Development Page CMS",
  media_page: "Media Center Page CMS"
};

export default function UserManagement() {
  const { user: currentAuthUser, isSuperAdmin, authFetch } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal / Drawer state for section permissions
  const [editingPermissionsUser, setEditingPermissionsUser] = useState<UserProfile | null>(null);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Audit Logs view
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogDocument[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authFetch("/api/admin/users");
      if (!res.ok) {
        throw new Error(`Failed to load users: HTTP ${res.status}`);
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      console.error("[UserManagement] Error loading users:", err);
      setError(err.message || "Failed to load users from database");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoadingAuditLogs(true);
      const res = await authFetch("/api/admin/audit-logs?limit=50");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error("[UserManagement] Failed to fetch audit logs:", err);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  // Update user role or status
  const handleUpdateUser = async (uid: string, updates: Partial<UserProfile>) => {
    try {
      setError(null);
      const res = await authFetch(`/api/admin/users/${uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Update failed: HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.user) {
        setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, ...data.user } : u)));
        showNotification("User permissions successfully updated.");
      }
    } catch (err: any) {
      console.error("[UserManagement] Error updating user:", err);
      setError(err.message || "Failed to update user");
    }
  };

  // Delete user
  const handleDeleteUser = async (uid: string, email: string) => {
    if (!window.confirm(`Are you sure you want to permanently remove '${email}' from the team?`)) {
      return;
    }

    try {
      setError(null);
      const res = await authFetch(`/api/admin/users/${uid}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Deletion failed: HTTP ${res.status}`);
      }

      setUsers((prev) => prev.filter((u) => u.uid !== uid));
      showNotification(`User '${email}' has been removed.`);
    } catch (err: any) {
      console.error("[UserManagement] Error deleting user:", err);
      setError(err.message || "Failed to delete user");
    }
  };

  // Open Section Permissions Editor
  const openPermissionsModal = (targetUser: UserProfile) => {
    setEditingPermissionsUser(targetUser);
    setSelectedSections(targetUser.assignedSections || []);
  };

  // Save granular section permissions
  const handleSavePermissions = async () => {
    if (!editingPermissionsUser) return;
    setSavingPermissions(true);
    try {
      await handleUpdateUser(editingPermissionsUser.uid, {
        assignedSections: selectedSections
      });
      setEditingPermissionsUser(null);
    } finally {
      setSavingPermissions(false);
    }
  };

  const isUserProtectedSuperAdmin = (u: UserProfile) => {
    return u.email.toLowerCase() === "krishnapro216@gmail.com" || u.role === UserRole.SUPER_ADMIN;
  };

  const pendingCount = users.filter((u) => u.status === UserStatus.PENDING).length;

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    const matchesSearch =
      u.displayName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term);

    if (filter === "ALL") return matchesSearch;
    if (filter === "PENDING") return matchesSearch && u.status === UserStatus.PENDING;
    if (filter === "APPROVED") return matchesSearch && u.status === UserStatus.APPROVED;
    if (filter === "REJECTED") return matchesSearch && u.status === UserStatus.REJECTED;
    if (filter === "SUPER_ADMIN") return matchesSearch && u.role === UserRole.SUPER_ADMIN;
    return matchesSearch;
  });

  return (
    <AdminLayout user={currentAuthUser} title="Team Access & Permissions">
      <div className="space-y-8">
        {/* Top Banner */}
        <div className="bg-[#001D3D] text-white p-8 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl border border-blue-900/40">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 text-[9px] font-black uppercase tracking-widest rounded-full border border-blue-400/20">
                Security Module
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                MongoDB Atlas • RBAC Enforced
              </span>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight">
              Administrative Access Control
            </h2>
            <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed">
              Super Admin can review pending registrations, assign functional roles, and grant granular editing authority for specific Home Page sections.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowAuditLogs(!showAuditLogs);
                if (!showAuditLogs) fetchAuditLogs();
              }}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-white/10"
            >
              <History size={14} />
              {showAuditLogs ? "Close Audit Logs" : "View Audit Logs"}
            </button>
            <button
              onClick={fetchUsers}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* Notifications */}
        {actionSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
            <Check size={16} className="text-emerald-600" />
            {actionSuccess}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600" />
            {error}
          </div>
        )}

        {/* Audit Logs Drawer */}
        <AnimatePresence>
          {showAuditLogs && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xl space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <History size={18} className="text-blue-900" />
                  <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">
                    Administrative Audit Trail (MongoDB: audit_logs)
                  </h3>
                </div>
                <button
                  onClick={fetchAuditLogs}
                  className="text-[10px] font-black text-blue-700 uppercase tracking-widest hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={12} className={loadingAuditLogs ? "animate-spin" : ""} /> Refresh Logs
                </button>
              </div>

              {loadingAuditLogs ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading audit history...</div>
              ) : auditLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No audit log records recorded yet.</div>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                  {auditLogs.map((log, idx) => (
                    <div
                      key={log._id || idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center text-xs gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded text-[9px] font-black uppercase">
                            {log.action}
                          </span>
                          <span className="font-bold text-slate-800">{log.actorEmail}</span>
                          <span className="text-[10px] text-slate-400">({log.actorRole})</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Target: <span className="font-semibold">{log.targetEntity}</span> &bull; {log.targetId}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            {[
              { id: "ALL", label: "All Users" },
              { id: "PENDING", label: `Pending (${pendingCount})` },
              { id: "APPROVED", label: "Approved" },
              { id: "REJECTED", label: "Rejected" },
              { id: "SUPER_ADMIN", label: "Super Admins" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === tab.id
                    ? "bg-[#001D3D] text-white shadow-md"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input
              type="text"
              placeholder="Filter by name, email, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-11 pr-4 text-xs font-bold outline-none focus:border-blue-900 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* User Card Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredUsers.map((u) => {
              const isSA = isUserProtectedSuperAdmin(u);
              const isPending = u.status === UserStatus.PENDING;
              const isApproved = u.status === UserStatus.APPROVED;

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={u.uid}
                  className={`bg-white rounded-[2rem] border-2 p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all space-y-6 ${
                    isPending
                      ? "border-amber-300 bg-amber-50/10"
                      : isSA
                      ? "border-blue-300"
                      : "border-slate-100"
                  }`}
                >
                  {/* User Profile Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={
                            u.photoURL ||
                            `https://ui-avatars.com/api/?name=${u.displayName || "User"}&background=001D3D&color=fff`
                          }
                          alt={u.displayName}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-inner"
                        />
                        <div
                          className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center border-2 border-white shadow-md ${
                            isApproved
                              ? "bg-emerald-500"
                              : isPending
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                        >
                          {isApproved ? (
                            <UserCheck size={12} className="text-white" />
                          ) : (
                            <Clock size={12} className="text-white" />
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">
                            {u.displayName}
                          </h4>
                          {isSA && (
                            <span className="px-2 py-0.5 bg-blue-900 text-white text-[8px] font-black uppercase tracking-widest rounded-md shadow-xs">
                              Super Admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-slate-400 mt-0.5">{u.email}</p>
                        <p className="text-[9px] font-mono text-slate-300 mt-1">
                          Joined: {new Date(u.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        isApproved
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : isPending
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {u.status}
                    </span>
                  </div>

                  {/* Notes & Requested Role info for pending applications */}
                  {u.requestNotes && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">
                        Applicant Justification / Role Request:
                      </span>
                      <p className="text-slate-700 font-medium italic">"{u.requestNotes}"</p>
                    </div>
                  )}

                  {/* Role Selector & Section Permissions summary */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                        Assigned Administrative Role
                      </label>
                      {isSA ? (
                        <div className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                          <Lock size={12} /> SUPER_ADMIN (Allowlist Enforced)
                        </div>
                      ) : (
                        <select
                          value={u.role}
                          disabled={!isSuperAdmin}
                          onChange={(e) => handleUpdateUser(u.uid, { role: e.target.value as UserRole })}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-900 transition-colors cursor-pointer"
                        >
                          {ALL_ROLES.map((r) => (
                            <option key={r.role} value={r.role}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Granular section edit button */}
                    {!isSA && (
                      <button
                        onClick={() => openPermissionsModal(u)}
                        className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-2 shadow-xs transition-all active:scale-95"
                      >
                        <Layers size={14} className="text-blue-900" />
                        Sections ({u.assignedSections?.length || 0}/14)
                      </button>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {isPending && isSuperAdmin && (
                        <>
                          <button
                            onClick={() => handleUpdateUser(u.uid, { status: UserStatus.APPROVED })}
                            className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                          >
                            <Check size={14} /> Approve Access
                          </button>
                          <button
                            onClick={() => handleUpdateUser(u.uid, { status: UserStatus.REJECTED })}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
                          >
                            <X size={14} /> Reject
                          </button>
                        </>
                      )}

                      {isApproved && !isSA && isSuperAdmin && (
                        <button
                          onClick={() => handleUpdateUser(u.uid, { status: UserStatus.REJECTED })}
                          className="px-4 py-2 bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-900 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                          Revoke Access
                        </button>
                      )}
                    </div>

                    {!isSA && isSuperAdmin && (
                      <button
                        onClick={() => handleDeleteUser(u.uid, u.email)}
                        className="p-2 text-slate-300 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                        title="Delete user"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredUsers.length === 0 && !loading && (
          <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <Users size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              No team members match the filter criteria.
            </p>
          </div>
        )}

        {/* Section Permissions Modal */}
        <AnimatePresence>
          {editingPermissionsUser && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">
                      Granular Section Editing Permissions
                    </h3>
                    <p className="text-xs font-medium text-slate-400">
                      Target User: <span className="font-bold text-slate-700">{editingPermissionsUser.email}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingPermissionsUser(null)}
                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <p className="text-slate-500 font-medium">
                    Select which Home Page sections this team member is permitted to edit:
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedSections([...ALL_HOMEPAGE_SECTION_IDS])}
                      className="text-[10px] font-black uppercase tracking-widest text-blue-700 hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={() => setSelectedSections([])}
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Section Checkboxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ALL_HOMEPAGE_SECTION_IDS.map((secId) => {
                    const isChecked = selectedSections.includes(secId);
                    return (
                      <label
                        key={secId}
                        onClick={() => {
                          setSelectedSections((prev) =>
                            isChecked ? prev.filter((id) => id !== secId) : [...prev, secId]
                          );
                        }}
                        className={`p-3 rounded-xl border-2 cursor-pointer flex items-center justify-between text-xs font-bold transition-all ${
                          isChecked
                            ? "bg-blue-50 border-blue-900 text-blue-950"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <span className="truncate pr-2">{SECTION_LABELS[secId]}</span>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            isChecked
                              ? "bg-blue-900 border-blue-900 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isChecked && <Check size={14} />}
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setEditingPermissionsUser(null)}
                    className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePermissions}
                    disabled={savingPermissions}
                    className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md flex items-center gap-2"
                  >
                    <Check size={14} />
                    {savingPermissions ? "Saving..." : "Save Permissions"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
