/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { useAuth } from "@/src/context/AuthContext";
import { 
  Upload, Image as ImageIcon, FileText, Play, X, Plus, Save, Activity, 
  AlertCircle, Trash2, Edit2, CheckCircle, Globe, Shield, Eye, Lock, RefreshCw, Check
} from "lucide-react";
import { motion } from "motion/react";

interface MediaItem {
  mediaId: string;
  id?: string;
  category: string;
  mediaType: string;
  type?: string;
  title: string;
  description: string;
  driveFileId: string;
  driveFileName: string;
  publicMediaUrl: string;
  showOnHome: boolean;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "DELETED";
  createdByEmail: string;
  createdAt: string;
  updatedByEmail?: string;
  updatedAt?: string;
}

export default function AdminMediaCenter() {
  const { user, authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<"ITEMS" | "PERMISSIONS" | "ACTIVITY">("ITEMS");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [permissionsData, setPermissionsData] = useState<{ matrix: any[]; grants: any[] }>({ matrix: [], grants: [] });
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Upload / Add Modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStep, setUploadStep] = useState<"FORM" | "UPLOADING" | "COMPLETING">("FORM");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    category: "PHOTO_GALLERY",
    description: "",
    mimeType: "image/jpeg",
    showOnHome: false,
    file: null as File | null
  });

  // Edit Modal state
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "PHOTO_GALLERY",
    status: "DRAFT" as any,
    showOnHome: false
  });

  // Grant Permission Modal state
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantForm, setGrantForm] = useState({
    userEmail: "",
    segment: "PHOTO_GALLERY",
    canRead: true,
    canCreate: false,
    canEdit: false,
    canDelete: false
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch items
      const resItems = await authFetch("/api/admin/media/items?includeDeleted=true");
      if (!resItems.ok) throw new Error("Failed to load media items");
      const jsonItems = await resItems.json();
      setItems(jsonItems.items || jsonItems || []);

      // Fetch permissions
      const resPerms = await authFetch("/api/admin/media/permissions");
      if (resPerms.ok) {
        const jsonPerms = await resPerms.json();
        setPermissionsData(jsonPerms);
      }

      // Fetch activity
      const resAct = await authFetch("/api/admin/media/activity");
      if (resAct.ok) {
        const jsonAct = await resAct.json();
        setActivityLogs(jsonAct.logs || jsonAct || []);
      }
    } catch (err: any) {
      console.error("Error loading Admin Media Center:", err);
      setError(err.message || "Failed to load management data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.title) {
      setError("Please provide a title and select a file to upload.");
      return;
    }

    try {
      setUploadStep("UPLOADING");
      setError(null);
      setUploadProgress(10);

      // 1. Initiate resumable upload session
      const initRes = await authFetch("/api/admin/media/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: uploadForm.category,
          title: uploadForm.title,
          description: uploadForm.description,
          filename: uploadForm.file.name,
          mimeType: uploadForm.file.type || "image/jpeg",
          fileSize: uploadForm.file.size,
          showOnHome: uploadForm.showOnHome
        })
      });

      if (!initRes.ok) {
        const errJson = await initRes.json().catch(() => ({}));
        throw new Error(errJson.message || errJson.error || "Failed to initiate upload session");
      }

      const initData = await initRes.json();
      const { mediaId, uploadUrl } = initData;
      setUploadProgress(35);

      // 2. Upload binary directly to Google's resumable session URL over HTTPS
      const uploadStreamRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": uploadForm.file.type || "image/jpeg"
        },
        body: uploadForm.file
      });

      if (!uploadStreamRes.ok) {
        // Cancel session on failure
        await authFetch(`/api/admin/media/upload/${mediaId}/cancel`, { method: "POST" });
        throw new Error(`Direct Google Drive upload failed: HTTP ${uploadStreamRes.status}`);
      }

      setUploadProgress(80);
      setUploadStep("COMPLETING");

      // 3. Finalize upload
      const completeRes = await authFetch(`/api/admin/media/upload/${mediaId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!completeRes.ok) {
        const errJson = await completeRes.json().catch(() => ({}));
        throw new Error(errJson.message || errJson.error || "Failed to finalize upload");
      }

      setUploadProgress(100);
      setSuccess("Media asset successfully uploaded, verified in Drive, and saved in DRAFT status.");
      setShowUploadModal(false);
      setUploadForm({ title: "", category: "PHOTO_GALLERY", description: "", mimeType: "image/jpeg", showOnHome: false, file: null });
      setUploadStep("FORM");
      fetchData();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Upload process failed");
      setUploadStep("FORM");
    }
  };

  const handleUpdateStatus = async (mediaId: string, newStatus: string) => {
    try {
      setError(null);
      const res = await authFetch(`/api/admin/media/items/${mediaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || errJson.error || "Failed to update status");
      }
      setSuccess(`Media status updated to ${newStatus}.`);
      fetchData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error("Error updating status:", err);
      setError(err.message || "Failed to update item status");
    }
  };

  const handleToggleHome = async (mediaId: string, currentVal: boolean) => {
    try {
      setError(null);
      const res = await authFetch(`/api/admin/media/items/${mediaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showOnHome: !currentVal })
      });
      if (!res.ok) throw new Error("Failed to update homepage visibility");
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to toggle homepage display");
    }
  };

  const handleDeleteItem = async (mediaId: string) => {
    if (!confirm("Are you sure you want to soft-delete this media item?")) return;
    try {
      setError(null);
      const res = await authFetch(`/api/admin/media/items/${mediaId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete media item");
      setSuccess("Media item soft-deleted successfully.");
      fetchData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to delete item");
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      setError(null);
      const res = await authFetch(`/api/admin/media/items/${editingItem.mediaId || editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) throw new Error("Failed to save edits");
      setSuccess("Media item updated successfully.");
      setEditingItem(null);
      fetchData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to update media item");
    }
  };

  const handleGrantPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const res = await authFetch("/api/admin/media/permissions/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(grantForm)
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || errJson.error || "Failed to grant permission");
      }
      setSuccess("Segment permission successfully granted.");
      setShowGrantModal(false);
      fetchData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to grant permission");
    }
  };

  const handleRevokePermission = async (permId: string) => {
    if (!confirm("Revoke this segment permission?")) return;
    try {
      setError(null);
      const res = await authFetch(`/api/admin/media/permissions/${permId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to revoke permission");
      setSuccess("Permission grant revoked.");
      fetchData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to revoke permission");
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = !searchQuery || item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || (item.category && item.category.toUpperCase() === categoryFilter);
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <AdminLayout user={user} title="Broadcast Media Center & Permissions">
      <div className="space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3 text-red-900 text-xs font-bold">
            <AlertCircle size={20} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border-2 border-green-200 rounded-2xl flex items-center gap-3 text-green-900 text-xs font-bold">
            <CheckCircle size={20} className="shrink-0 text-green-600" />
            <span>{success}</span>
          </div>
        )}

        {/* Header Banner */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-1">
              Google Sheets Authoritative Media CMS
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Manage broadcast media assets, resumable Google Drive uploads, segment-specific permissions, and activity history.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={fetchData}
              className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-700 transition-all"
              title="Refresh Data"
            >
              <RefreshCw size={18} />
            </button>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Upload size={16} />
              Upload New Asset
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
          {[
            { id: "ITEMS", label: "Media Assets" },
            { id: "PERMISSIONS", label: "Segment Permissions" },
            { id: "ACTIVITY", label: "Activity History" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id ? "bg-white text-blue-700 shadow-md" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-24 flex justify-center items-center">
            <Activity className="animate-spin text-blue-600" size={48} />
          </div>
        ) : activeTab === "ITEMS" ? (
          /* Media Assets Table View */
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-96">
                <input
                  type="text"
                  placeholder="Search by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-600"
                >
                  <option value="ALL">All Categories</option>
                  <option value="PHOTO_GALLERY">Photo Gallery</option>
                  <option value="VIDEO_GALLERY">Video Gallery</option>
                  <option value="PRESS_RELEASES">Press Releases</option>
                  <option value="NEWS_COVERAGE">News Coverage</option>
                  <option value="INTERVIEWS">Interviews</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-600"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                  <option value="DELETED">Deleted</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <th className="p-6">Asset & Title</th>
                      <th className="p-6">Category</th>
                      <th className="p-6">Status</th>
                      <th className="p-6">Homepage</th>
                      <th className="p-6">Attribution & Dates</th>
                      <th className="p-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-16 text-slate-400 font-bold uppercase tracking-widest text-xs">
                          No media items found matching filters.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => (
                        <tr key={item.mediaId || item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                <img
                                  src={item.publicMediaUrl || "https://images.unsplash.com/photo-1475721027785-f74dea9f2672?auto=format&fit=crop&q=80&w=1200"}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-black uppercase tracking-tight text-slate-900 mb-0.5">{item.title}</p>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.mediaType}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-6">
                            <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-[9px] font-black uppercase tracking-widest">
                              {item.category?.replace("_", " ")}
                            </span>
                          </td>
                          <td className="p-6">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              item.status === "PUBLISHED" ? "bg-green-100 text-green-800" :
                              item.status === "DRAFT" ? "bg-amber-100 text-amber-800" :
                              item.status === "DELETED" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-800"
                            }`}>
                              {item.status || "DRAFT"}
                            </span>
                          </td>
                          <td className="p-6">
                            <button
                              onClick={() => handleToggleHome(item.mediaId || item.id!, item.showOnHome)}
                              className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                                item.showOnHome ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-400 hover:text-slate-600"
                              }`}
                            >
                              {item.showOnHome ? "Shown on Home" : "Hidden"}
                            </button>
                          </td>
                          <td className="p-6 text-[11px] text-slate-500">
                            <p className="font-bold text-slate-800">{item.createdByEmail || "System"}</p>
                            <p className="text-[10px] text-slate-400">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}</p>
                          </td>
                          <td className="p-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {item.status === "DRAFT" ? (
                                <button
                                  onClick={() => handleUpdateStatus(item.mediaId || item.id!, "PUBLISHED")}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm"
                                >
                                  Publish
                                </button>
                              ) : item.status === "PUBLISHED" ? (
                                <button
                                  onClick={() => handleUpdateStatus(item.mediaId || item.id!, "ARCHIVED")}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm"
                                >
                                  Archive
                                </button>
                              ) : null}

                              <button
                                onClick={() => {
                                  setEditingItem(item);
                                  setEditForm({
                                    title: item.title,
                                    description: item.description,
                                    category: item.category,
                                    status: item.status,
                                    showOnHome: item.showOnHome
                                  });
                                }}
                                className="p-2 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-xl transition-all text-slate-600"
                                title="Edit Item"
                              >
                                <Edit2 size={16} />
                              </button>

                              {item.status !== "DELETED" && (
                                <button
                                  onClick={() => handleDeleteItem(item.mediaId || item.id!)}
                                  className="p-2 bg-slate-100 hover:bg-red-600 hover:text-white rounded-xl transition-all text-slate-600"
                                  title="Delete Item"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === "PERMISSIONS" ? (
          /* Segment Permissions Matrix */
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-1">
                  Segment Permissions & Grants (`MediaPermissions`)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Enforce strict independent role-based permissions (`canRead`, `canCreate`, `canEdit`, `canDelete`) per media segment.
                </p>
              </div>
              <button onClick={() => setShowGrantModal(true)} className="btn-primary flex items-center gap-2 shrink-0">
                <Plus size={16} />
                Grant Segment Permission
              </button>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <th className="p-6">User Account</th>
                      <th className="p-6">Segment</th>
                      <th className="p-6 text-center">Read</th>
                      <th className="p-6 text-center">Create</th>
                      <th className="p-6 text-center">Edit</th>
                      <th className="p-6 text-center">Delete</th>
                      <th className="p-6 text-right">Revoke</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {permissionsData.grants.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-16 text-slate-400 font-bold uppercase tracking-widest text-xs">
                          No active segment permission grants found.
                        </td>
                      </tr>
                    ) : (
                      permissionsData.grants.map((g: any) => (
                        <tr key={g.permissionId} className="hover:bg-slate-50/80">
                          <td className="p-6 font-bold text-slate-900">{g.userEmail}</td>
                          <td className="p-6">
                            <span className="px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-[9px] font-black uppercase tracking-widest">
                              {g.segment}
                            </span>
                          </td>
                          <td className="p-6 text-center">{g.canRead ? <Check size={16} className="mx-auto text-green-600" /> : "-"}</td>
                          <td className="p-6 text-center">{g.canCreate ? <Check size={16} className="mx-auto text-green-600" /> : "-"}</td>
                          <td className="p-6 text-center">{g.canEdit ? <Check size={16} className="mx-auto text-green-600" /> : "-"}</td>
                          <td className="p-6 text-center">{g.canDelete ? <Check size={16} className="mx-auto text-green-600" /> : "-"}</td>
                          <td className="p-6 text-right">
                            <button
                              onClick={() => handleRevokePermission(g.permissionId)}
                              className="px-4 py-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              Revoke
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
        ) : (
          /* Activity History Tab */
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-1">
                Audit Trail & Activity Log (`ActivityLog`)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Immutable activity history for all media uploads, updates, permission grants, and deletions.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="p-6">Timestamp</th>
                    <th className="p-6">Actor</th>
                    <th className="p-6">Action & Module</th>
                    <th className="p-6">Segment</th>
                    <th className="p-6">Summary / Changes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {activityLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-slate-400 font-bold uppercase tracking-widest text-xs">
                        No activity logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    activityLogs.map((log: any, i: number) => (
                      <tr key={log.activityId || i} className="hover:bg-slate-50/80">
                        <td className="p-6 text-[11px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="p-6 font-bold text-slate-900">{log.actorEmail}</td>
                        <td className="p-6">
                          <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-800">
                            {log.action} ({log.module})
                          </span>
                        </td>
                        <td className="p-6 font-bold text-blue-600">{log.segment || "-"}</td>
                        <td className="p-6 text-xs text-slate-600 max-w-md truncate">{log.changesSummary || log.recordTitle || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Upload Modal with Resumable Flow */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-xl w-full shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
                  Resumable Google Drive Asset Upload
                </h3>
                <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              {uploadStep === "UPLOADING" || uploadStep === "COMPLETING" ? (
                <div className="py-16 text-center space-y-6">
                  <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Upload size={36} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-2">
                      {uploadStep === "UPLOADING" ? "Uploading to Google Drive..." : "Verifying & Finalizing..."}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Uploading file bytes directly to Google Drive resumable session and recording authoritative metadata in Sheets.
                    </p>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : (
                <form onSubmit={handleStartUpload} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Asset Title</label>
                    <input
                      type="text"
                      required
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-600"
                      placeholder="e.g. Village Development Inauguration"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Media Segment</label>
                      <select
                        value={uploadForm.category}
                        onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-600"
                      >
                        <option value="PHOTO_GALLERY">Photo Gallery</option>
                        <option value="VIDEO_GALLERY">Video Gallery</option>
                        <option value="PRESS_RELEASES">Press Releases</option>
                        <option value="NEWS_COVERAGE">News Coverage</option>
                        <option value="INTERVIEWS">Interviews</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Media File</label>
                      <input
                        type="file"
                        required
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          if (file) {
                            setUploadForm({ ...uploadForm, file, mimeType: file.type || "image/jpeg" });
                          }
                        }}
                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Description</label>
                    <textarea
                      rows={3}
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-600 resize-none"
                      placeholder="Optional asset summary..."
                    />
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={uploadForm.showOnHome}
                      onChange={(e) => setUploadForm({ ...uploadForm, showOnHome: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-slate-700 uppercase">Feature on Homepage (`showOnHome`)</span>
                  </label>

                  <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-all"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Initiate & Upload Asset
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl border border-slate-200">
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-6">
                Edit Media Asset Metadata
              </h3>
              <form onSubmit={handleSaveEdit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Title</label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Category</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-600"
                    >
                      <option value="PHOTO_GALLERY">Photo Gallery</option>
                      <option value="VIDEO_GALLERY">Video Gallery</option>
                      <option value="PRESS_RELEASES">Press Releases</option>
                      <option value="NEWS_COVERAGE">News Coverage</option>
                      <option value="INTERVIEWS">Interviews</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-600"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Description</label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-600 resize-none"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={editForm.showOnHome}
                    onChange={(e) => setEditForm({ ...editForm, showOnHome: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-slate-700 uppercase">Feature on Homepage</span>
                </label>

                <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Grant Permission Modal */}
        {showGrantModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-slate-200">
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-6">
                Grant Segment Permission
              </h3>
              <form onSubmit={handleGrantPermission} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">User Email</label>
                  <input
                    type="email"
                    required
                    value={grantForm.userEmail}
                    onChange={(e) => setGrantForm({ ...grantForm, userEmail: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-600"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Segment</label>
                  <select
                    value={grantForm.segment}
                    onChange={(e) => setGrantForm({ ...grantForm, segment: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-600"
                  >
                    <option value="PHOTO_GALLERY">Photo Gallery</option>
                    <option value="VIDEO_GALLERY">Video Gallery</option>
                    <option value="PRESS_RELEASES">Press Releases</option>
                    <option value="NEWS_COVERAGE">News Coverage</option>
                    <option value="INTERVIEWS">Interviews</option>
                    <option value="SOCIAL_HUB">Social Hub</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantForm.canRead}
                      onChange={(e) => setGrantForm({ ...grantForm, canRead: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span className="text-xs font-bold uppercase text-slate-700">Can Read</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantForm.canCreate}
                      onChange={(e) => setGrantForm({ ...grantForm, canCreate: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span className="text-xs font-bold uppercase text-slate-700">Can Create</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantForm.canEdit}
                      onChange={(e) => setGrantForm({ ...grantForm, canEdit: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span className="text-xs font-bold uppercase text-slate-700">Can Edit</span>
                  </label>
                  <label className="flex items-center gap-3 icon-checkbox cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantForm.canDelete}
                      onChange={(e) => setGrantForm({ ...grantForm, canDelete: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span className="text-xs font-bold uppercase text-slate-700">Can Delete</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowGrantModal(false)}
                    className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save Grant
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
