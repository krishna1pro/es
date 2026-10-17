/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { useAuth } from "@/src/context/AuthContext";
import {
  Inbox,
  UserCheck,
  Shield,
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  RefreshCw,
  Send,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  User
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type SubmissionTab = "contact" | "volunteer" | "cadre";

interface SubmissionItem {
  _id?: string;
  trackingNumber: string;
  fullName: string;
  mobile: string;
  status: string;
  createdAt: string;
  assignedTo?: string;
  notes?: Array<{ text: string; author: string; createdAt: string }>;
  // Contact specific
  subject?: string;
  message?: string;
  // Volunteer specific
  email?: string;
  mandal?: string;
  skills?: string[];
  experience?: string;
  // Cadre specific
  workerId?: string;
  position?: string;
}

const STATUS_OPTIONS = [
  "RECEIVED",
  "UNDER_REVIEW",
  "ASSIGNED",
  "RESOLVED",
  "CLOSED",
  "PENDING",
  "APPROVED",
  "REJECTED"
];

export default function SubmissionsManager() {
  const { authFetch, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as SubmissionTab) || "contact";

  const [activeTab, setActiveTab] = useState<SubmissionTab>(
    ["contact", "volunteer", "cadre"].includes(initialTab) ? initialTab : "contact"
  );
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Detail Drawer state
  const [selectedItem, setSelectedItem] = useState<SubmissionItem | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [noteText, setNoteText] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchSubmissions = async (type: SubmissionTab) => {
    try {
      setLoading(true);
      setError(null);
      const res = await authFetch(`/api/admin/submissions/${type}`);
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error(`Access Denied: Your account role (${user?.role}) does not have permission to view ${type} submissions.`);
        }
        throw new Error(`Failed to load ${type} submissions: HTTP ${res.status}`);
      }
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch (err: any) {
      console.error(`[SubmissionsManager] Error loading ${type}:`, err);
      setError(err.message || `Failed to load ${type} submissions`);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(activeTab);
  }, [activeTab]);

  const handleTabChange = (tab: SubmissionTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setSelectedItem(null);
    setSearch("");
    setStatusFilter("ALL");
  };

  const handleOpenDetail = (item: SubmissionItem) => {
    setSelectedItem(item);
    setNewStatus(item.status);
    setAssignedTo(item.assignedTo || "");
    setNoteText("");
    setActionSuccess(null);
  };

  const handleUpdateSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setIsUpdating(true);
      setActionSuccess(null);

      const payload: any = {};
      if (newStatus && newStatus !== selectedItem.status) {
        payload.status = newStatus;
      }
      if (assignedTo !== (selectedItem.assignedTo || "")) {
        payload.assignedTo = assignedTo;
      }
      if (noteText.trim()) {
        payload.note = noteText.trim();
      }

      if (Object.keys(payload).length === 0) {
        setActionSuccess("No changes to save.");
        return;
      }

      const res = await authFetch(`/api/admin/submissions/${activeTab}/${selectedItem.trackingNumber}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to update submission");
      }

      setActionSuccess("Submission updated and audit-logged successfully!");
      setNoteText("");

      // Refresh item and list
      const updatedRes = await authFetch(`/api/admin/submissions/${activeTab}/${selectedItem.trackingNumber}`);
      if (updatedRes.ok) {
        const updatedData = await updatedRes.json();
        setSelectedItem(updatedData.submission);
      }
      fetchSubmissions(activeTab);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      console.error("[SubmissionsManager] Update failed:", err);
      setError(err.message || "Failed to update record");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredSubmissions = submissions.filter((item) => {
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    const query = search.toLowerCase();
    const matchesSearch =
      !query ||
      item.fullName?.toLowerCase().includes(query) ||
      item.mobile?.includes(query) ||
      item.trackingNumber?.toLowerCase().includes(query) ||
      item.workerId?.toLowerCase().includes(query) ||
      item.mandal?.toLowerCase().includes(query) ||
      item.subject?.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  return (
    <AdminLayout user={user} title="Public Submissions Hub">
      <div className="space-y-8">
        {/* Superior Header */}
        <div className="bg-[#001D3D] p-8 sm:p-10 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-blue-400 font-black uppercase tracking-[0.3em] text-[10px] block mb-2">
                Citizen Inbound Pipeline
              </span>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                Public Submissions
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
                Review and process inbound contact inquiries, volunteer applications, and cadre registrations securely stored in MongoDB Atlas.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => fetchSubmissions(activeTab)}
                disabled={loading}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border border-white/10"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-8 border-b border-white/10 pb-0 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleTabChange("contact")}
              className={`px-6 py-3 font-black text-xs uppercase tracking-wider rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "contact"
                  ? "bg-white text-slate-900 border-blue-500 shadow-md"
                  : "text-slate-300 hover:text-white border-transparent hover:bg-white/5"
              }`}
            >
              <Inbox size={16} /> Contact Inquiries
            </button>
            <button
              onClick={() => handleTabChange("volunteer")}
              className={`px-6 py-3 font-black text-xs uppercase tracking-wider rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "volunteer"
                  ? "bg-white text-slate-900 border-blue-500 shadow-md"
                  : "text-slate-300 hover:text-white border-transparent hover:bg-white/5"
              }`}
            >
              <UserCheck size={16} /> Volunteer Applications
            </button>
            <button
              onClick={() => handleTabChange("cadre")}
              className={`px-6 py-3 font-black text-xs uppercase tracking-wider rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "cadre"
                  ? "bg-white text-slate-900 border-blue-500 shadow-md"
                  : "text-slate-300 hover:text-white border-transparent hover:bg-white/5"
              }`}
            >
              <Shield size={16} /> Cadre Registrations
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center justify-between text-red-700 text-xs font-bold">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-900">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={`Search ${activeTab} by name, tracking #, mobile...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="ALL">All Statuses ({submissions.length})</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Tracking Reference</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Citizen / Candidate</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {activeTab === "contact" ? "Subject" : activeTab === "volunteer" ? "Mandal & Skills" : "Wing & Worker ID"}
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Received</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-bold">
                      <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
                      Loading {activeTab} submissions from MongoDB...
                    </td>
                  </tr>
                ) : filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-medium italic">
                      No {activeTab} submissions found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((item) => (
                    <tr key={item.trackingNumber} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-black text-blue-900">
                        {item.trackingNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{item.fullName}</div>
                        <div className="text-slate-400 text-[11px] flex items-center gap-1">
                          <Phone size={10} /> {item.mobile}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {activeTab === "contact" && (
                          <span className="font-medium text-slate-700 line-clamp-1">{item.subject || "General Inquiry"}</span>
                        )}
                        {activeTab === "volunteer" && (
                          <div>
                            <span className="font-bold text-slate-800">{item.mandal || "Constituency"}</span>
                            {item.skills && item.skills.length > 0 && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {item.skills.slice(0, 2).map((sk, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-bold">
                                    {sk}
                                  </span>
                                ))}
                                {item.skills.length > 2 && (
                                  <span className="text-[9px] text-slate-400 font-bold">+{item.skills.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {activeTab === "cadre" && (
                          <div>
                            <span className="font-bold text-slate-900">{item.position || "Member"}</span>
                            <div className="text-slate-400 text-[11px] font-mono">ID: {item.workerId || "N/A"}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                            item.status === "RESOLVED" || item.status === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : item.status === "UNDER_REVIEW" || item.status === "ASSIGNED"
                              ? "bg-blue-100 text-blue-800"
                              : item.status === "REJECTED" || item.status === "CLOSED"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenDetail(item)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-black uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
                        >
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail & Update Drawer */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest block">
                    {activeTab} Submission Record
                  </span>
                  <h3 className="text-xl font-black font-mono mt-0.5">{selectedItem.trackingNumber}</h3>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-grow p-6 overflow-y-auto space-y-6">
                {actionSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} /> {actionSuccess}
                  </div>
                )}

                {/* Citizen Overview Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-800 rounded-xl flex items-center justify-center font-black text-lg">
                      {selectedItem.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-base text-slate-900">{selectedItem.fullName}</h4>
                      <p className="text-slate-500 text-xs flex items-center gap-2 mt-0.5">
                        <Phone size={12} /> {selectedItem.mobile}
                        {selectedItem.email && (
                          <>
                            <span>•</span>
                            <Mail size={12} /> {selectedItem.email}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Submission Date</span>
                      <span className="font-medium text-slate-700">
                        {new Date(selectedItem.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Current Status</span>
                      <span className="font-bold text-slate-900">{selectedItem.status}</span>
                    </div>
                  </div>
                </div>

                {/* Specific Fields Display */}
                {activeTab === "contact" && (
                  <div className="space-y-3">
                    <h5 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Inquiry Content</h5>
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                      <div className="font-bold text-sm text-slate-900">{selectedItem.subject}</div>
                      <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedItem.message}</div>
                    </div>
                  </div>
                )}

                {activeTab === "volunteer" && (
                  <div className="space-y-4">
                    <h5 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Candidate Profile</h5>
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Mandal:</span>
                        <span className="font-bold text-slate-800">{selectedItem.mandal || "Not specified"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Skills:</span>
                        <div className="flex gap-1.5 flex-wrap mt-1">
                          {selectedItem.skills?.map((sk, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg font-bold text-[11px]">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                      {selectedItem.experience && (
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Experience & Background:</span>
                          <p className="mt-1 text-slate-700 whitespace-pre-wrap">{selectedItem.experience}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "cadre" && (
                  <div className="space-y-4">
                    <h5 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Party Worker Details</h5>
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Worker ID:</span>
                          <span className="font-mono font-bold text-slate-800">{selectedItem.workerId || "Pending"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Position / Wing:</span>
                          <span className="font-bold text-slate-800">{selectedItem.position || "Member"}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Mandal:</span>
                        <span className="font-bold text-slate-800">{selectedItem.mandal || "General"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Update & Staff Controls Form */}
                <form onSubmit={handleUpdateSubmission} className="space-y-4 pt-4 border-t border-slate-200">
                  <h5 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Administrative Controls</h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
                        Update Status
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600/20"
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
                        Assign To Staff / Wing
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Camp Office Desk"
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
                      Append Internal Staff Note (Confidential)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Add an administrative note or verification status..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUpdating ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    Commit Changes & Audit Log
                  </button>
                </form>

                {/* Notes History */}
                {selectedItem.notes && selectedItem.notes.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <h5 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Internal Notes Thread</h5>
                    <div className="space-y-2">
                      {selectedItem.notes.map((note, idx) => (
                        <div key={idx} className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs space-y-1">
                          <div className="flex justify-between items-center text-[10px] text-amber-900 font-bold">
                            <span>Author: {note.author}</span>
                            <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-800 text-xs">{note.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
