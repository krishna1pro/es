/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { useAuth } from "@/src/context/AuthContext";
import { Plus, Edit2, Trash2, Globe, AlertCircle, CheckCircle, Activity } from "lucide-react";

interface SocialChannel {
  channelId: string;
  platform: string;
  displayName: string;
  url: string;
  enabled: boolean;
  showOnHome: boolean;
  homepagePosition: number;
  sortOrder: number;
  status: string;
  createdByEmail?: string;
  updatedAt?: string;
}

export default function AdminSocialHub() {
  const { user, authFetch } = useAuth();
  const [channels, setChannels] = useState<SocialChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<SocialChannel | null>(null);
  const [formData, setFormData] = useState({
    displayName: "",
    platform: "YOUTUBE",
    url: "",
    enabled: true,
    showOnHome: true,
    homepagePosition: 1,
    sortOrder: 0
  });

  const fetchChannels = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authFetch("/api/admin/social/channels");
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || errJson.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setChannels(data.channels || []);
    } catch (err: any) {
      console.error("Error fetching social channels:", err);
      setError(err.message || "Failed to load social channels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const handleOpenAdd = () => {
    setEditingChannel(null);
    setFormData({
      displayName: "",
      platform: "YOUTUBE",
      url: "",
      enabled: true,
      showOnHome: true,
      homepagePosition: Math.min(channels.length + 1, 4),
      sortOrder: channels.length
    });
    setShowModal(true);
  };

  const handleOpenEdit = (ch: SocialChannel) => {
    setEditingChannel(ch);
    setFormData({
      displayName: ch.displayName,
      platform: ch.platform || "YOUTUBE",
      url: ch.url || "",
      enabled: ch.enabled,
      showOnHome: ch.showOnHome,
      homepagePosition: ch.homepagePosition || 1,
      sortOrder: ch.sortOrder || 0
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);

      const url = editingChannel
        ? `/api/admin/social/channels/${editingChannel.channelId}`
        : "/api/admin/social/channels";
      const method = editingChannel ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || errJson.error || "Failed to save social channel");
      }

      setSuccess(editingChannel ? "Social channel successfully updated." : "Social channel created successfully.");
      setShowModal(false);
      fetchChannels();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error("Error saving social channel:", err);
      setError(err.message || "Failed to save channel");
    }
  };

  const handleDelete = async (channelId: string) => {
    if (!confirm("Are you sure you want to soft-delete this social channel?")) return;
    try {
      setError(null);
      const res = await authFetch(`/api/admin/social/channels/${channelId}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || errJson.error || "Failed to delete channel");
      }
      setSuccess("Social channel soft-deleted successfully.");
      fetchChannels();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error("Error deleting channel:", err);
      setError(err.message || "Failed to delete channel");
    }
  };

  return (
    <AdminLayout user={user} title="Social Media Hub Manager">
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

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-1">
              Authoritative Social Channels
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Manage official YouTube, Facebook, Instagram, and Twitter handles displayed across public hubs and homepage cards.
            </p>
          </div>
          <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-2 shrink-0">
            <Plus size={16} />
            Add Social Channel
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Activity className="animate-spin text-blue-600" size={40} />
          </div>
        ) : channels.length === 0 ? (
          <div className="bg-white p-16 rounded-[2rem] border border-slate-200 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
            No social channels registered in authoritative Sheets.
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="p-6">Platform & Display Name</th>
                    <th className="p-6">URL / Handle</th>
                    <th className="p-6">Status</th>
                    <th className="p-6">Homepage (Pos 1-4)</th>
                    <th className="p-6">Author / Updated</th>
                    <th className="p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {channels.map((ch) => (
                    <tr key={ch.channelId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-6 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-black flex items-center justify-center uppercase shrink-0 text-sm">
                            {ch.platform?.[0] || "S"}
                          </div>
                          <div>
                            <p className="font-black uppercase tracking-tight text-slate-900">{ch.displayName}</p>
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{ch.platform}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 max-w-xs truncate">
                        <a href={ch.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1.5 truncate">
                          <Globe size={14} className="shrink-0" />
                          <span className="truncate">{ch.url}</span>
                        </a>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            ch.enabled ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {ch.enabled ? "Enabled" : "Disabled"}
                          </span>
                          {ch.status === "DELETED" && (
                            <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[9px] font-black uppercase">Deleted</span>
                          )}
                        </div>
                      </td>
                      <td className="p-6">
                        {ch.showOnHome ? (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-[9px] font-black uppercase tracking-widest">
                            Home Position #{ch.homepagePosition || 1}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold text-[10px]">Hidden</span>
                        )}
                      </td>
                      <td className="p-6 text-[11px] text-slate-500">
                        <p>{ch.createdByEmail || "System"}</p>
                        <p className="text-[10px] text-slate-400">{ch.updatedAt ? new Date(ch.updatedAt).toLocaleDateString() : "-"}</p>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(ch)}
                            className="p-2 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-xl transition-all text-slate-600"
                            title="Edit Channel"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(ch.channelId)}
                            className="p-2 bg-slate-100 hover:bg-red-600 hover:text-white rounded-xl transition-all text-slate-600"
                            title="Delete Channel"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl border border-slate-200">
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-6">
                {editingChannel ? "Edit Social Channel" : "Add Social Channel"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Display Name</label>
                  <input
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-600 transition-all"
                    placeholder="e.g. Official YouTube Channel"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Platform</label>
                    <select
                      value={formData.platform}
                      onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-600 transition-all"
                    >
                      <option value="YOUTUBE">YouTube</option>
                      <option value="FACEBOOK">Facebook</option>
                      <option value="INSTAGRAM">Instagram</option>
                      <option value="TWITTER">Twitter / X</option>
                      <option value="LINKEDIN">LinkedIn</option>
                      <option value="OTHER">Other / Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Homepage Pos (1-4)</label>
                    <input
                      type="number"
                      min="1"
                      max="4"
                      value={formData.homepagePosition}
                      onChange={(e) => setFormData({ ...formData, homepagePosition: parseInt(e.target.value, 10) || 1 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-600 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Channel URL</label>
                  <input
                    type="url"
                    required
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-600 transition-all"
                    placeholder="https://youtube.com/@handle"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-slate-700 uppercase">Enabled (Active)</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showOnHome}
                      onChange={(e) => setFormData({ ...formData, showOnHome: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-slate-700 uppercase">Show on Homepage</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Save Channel
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
