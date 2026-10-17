/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { useAuth } from "@/src/context/AuthContext";
import { useSiteSettings } from "@/src/context/SiteSettingsContext";
import { HomeSectionDocument, SiteSettingsDocument, SectionType } from "@/src/types/homeCms";
import {
  Layout,
  Globe,
  FileText,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Edit2,
  X,
  Layers,
  Sparkles,
  Sliders,
  ChevronRight,
  Database,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type CMSTab = "homepage" | "settings" | "pages";
type PageSubTab = "about_page" | "vision_page" | "activities_page" | "development_page";

export default function CMSManager() {
  const { authFetch, user, isSuperAdmin } = useAuth();
  const { refreshSettings: refreshGlobalSettings } = useSiteSettings();

  const [activeTab, setActiveTab] = useState<CMSTab>("homepage");
  const [activePageTab, setActivePageTab] = useState<PageSubTab>("about_page");

  // Homepage Sections state
  const [sections, setSections] = useState<HomeSectionDocument[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [editingSection, setEditingSection] = useState<HomeSectionDocument | null>(null);
  const [sectionDataJson, setSectionDataJson] = useState("");
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionSubtitle, setSectionSubtitle] = useState("");
  const [sectionOrder, setSectionOrder] = useState<number>(0);
  const [sectionEnabled, setSectionEnabled] = useState<boolean>(true);

  // Global Site Settings state
  const [settings, setSettings] = useState<SiteSettingsDocument | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Dedicated Page Section state
  const [pageSection, setPageSection] = useState<HomeSectionDocument | null>(null);
  const [loadingPageSection, setLoadingPageSection] = useState(false);
  const [pageSectionDataJson, setPageSectionDataJson] = useState("");

  // Feedback notifications
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Fetch all homepage sections
  const fetchSections = async () => {
    try {
      setLoadingSections(true);
      setErrorMessage(null);
      const res = await authFetch("/api/admin/home/sections");
      if (!res.ok) {
        throw new Error(`Failed to load home sections: HTTP ${res.status}`);
      }
      const data = await res.json();
      setSections(data.sections || []);
    } catch (err: any) {
      console.error("[CMSManager] Error fetching sections:", err);
      setErrorMessage(err.message || "Failed to load sections from MongoDB");
    } finally {
      setLoadingSections(false);
    }
  };

  // Fetch Global Site Settings
  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      setErrorMessage(null);
      const res = await fetch("/api/public/site-settings");
      if (!res.ok) {
        throw new Error(`Failed to load site settings: HTTP ${res.status}`);
      }
      const data = await res.json();
      setSettings(data.settings || data);
    } catch (err: any) {
      console.error("[CMSManager] Error fetching settings:", err);
      setErrorMessage(err.message || "Failed to load settings from MongoDB");
    } finally {
      setLoadingSettings(false);
    }
  };

  // Fetch Dedicated Page Section
  const fetchPageSection = async (pageId: PageSubTab) => {
    try {
      setLoadingPageSection(true);
      setErrorMessage(null);
      const res = await authFetch(`/api/admin/home/sections/${pageId}`);
      if (!res.ok) {
        throw new Error(`Failed to load ${pageId}: HTTP ${res.status}`);
      }
      const data = await res.json();
      setPageSection(data);
      setPageSectionDataJson(JSON.stringify(data.data || {}, null, 2));
    } catch (err: any) {
      console.error(`[CMSManager] Error fetching ${pageId}:`, err);
      setErrorMessage(err.message || `Failed to load ${pageId}`);
    } finally {
      setLoadingPageSection(false);
    }
  };

  useEffect(() => {
    if (activeTab === "homepage") {
      fetchSections();
    } else if (activeTab === "settings") {
      fetchSettings();
    } else if (activeTab === "pages") {
      fetchPageSection(activePageTab);
    }
  }, [activeTab, activePageTab]);

  // Handle Editing Homepage Section
  const handleOpenSectionEdit = (sec: HomeSectionDocument) => {
    setEditingSection(sec);
    setSectionTitle(sec.title);
    setSectionSubtitle(sec.subtitle || "");
    setSectionOrder(sec.order);
    setSectionEnabled(sec.enabled);
    setSectionDataJson(JSON.stringify(sec.data || {}, null, 2));
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;

    try {
      setSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      let parsedData = {};
      try {
        parsedData = JSON.parse(sectionDataJson);
      } catch (jsonErr: any) {
        throw new Error(`Invalid JSON in Data Payload: ${jsonErr.message}`);
      }

      const payload = {
        title: sectionTitle,
        subtitle: sectionSubtitle,
        order: Number(sectionOrder),
        enabled: Boolean(sectionEnabled),
        data: parsedData
      };

      const res = await authFetch(`/api/admin/home/sections/${editingSection.sectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to update section");
      }

      const result = await res.json();
      setSuccessMessage(`Section '${editingSection.sectionId}' updated and audit-logged in MongoDB Atlas!`);
      setEditingSection(null);
      fetchSections();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error("[CMSManager] Save section failed:", err);
      setErrorMessage(err.message || "Failed to save section changes");
    } finally {
      setSaving(false);
    }
  };

  // Toggle Section Visibility Quickly
  const handleToggleSectionEnabled = async (sec: HomeSectionDocument) => {
    try {
      const res = await authFetch(`/api/admin/home/sections/${sec.sectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !sec.enabled })
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to toggle section visibility");
      }
      fetchSections();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update visibility");
    }
  };

  // Handle Save Global Site Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const res = await authFetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to update site settings");
      }

      setSuccessMessage("Global Site Settings updated and audit-logged successfully!");
      await refreshGlobalSettings();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error("[CMSManager] Save settings failed:", err);
      setErrorMessage(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Handle Save Dedicated Page Section
  const handleSavePageSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageSection) return;

    try {
      setSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      let parsedData = {};
      try {
        parsedData = JSON.parse(pageSectionDataJson);
      } catch (jsonErr: any) {
        throw new Error(`Invalid JSON in Data Payload: ${jsonErr.message}`);
      }

      const res = await authFetch(`/api/admin/home/sections/${pageSection.sectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: parsedData })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to update ${pageSection.sectionId}`);
      }

      setSuccessMessage(`Page '${activePageTab}' content saved and audit-logged in MongoDB Atlas!`);
      fetchPageSection(activePageTab);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error("[CMSManager] Save page section failed:", err);
      setErrorMessage(err.message || "Failed to save page changes");
    } finally {
      setSaving(false);
    }
  };

  // Super Admin Baseline Seed
  const handleSeedBaseline = async () => {
    if (!window.confirm("Seed baseline initial home data into MongoDB Atlas? This ensures all standard sections exist.")) return;
    try {
      setSeeding(true);
      const res = await authFetch("/api/admin/home/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: false })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`Seeded successfully: ${data.message}`);
        fetchSections();
      } else {
        throw new Error(data.error || "Seeding failed");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Seeding error");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <AdminLayout user={user} title="Website CMS Manager">
      <div className="space-y-8">
        {/* Header Banner */}
        <div className="bg-[#001D3D] p-8 sm:p-10 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-blue-400 font-black uppercase tracking-[0.3em] text-[10px] block mb-2">
                MongoDB Atlas Unified CMS
              </span>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                Website Manager
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
                Edit homepage sections, global site settings, and dedicated page content with server-side RBAC and automated audit logging.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {isSuperAdmin && (
                <button
                  onClick={handleSeedBaseline}
                  disabled={seeding}
                  className="px-4 py-2.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border border-emerald-500/30"
                >
                  <Database size={14} className={seeding ? "animate-spin" : ""} /> Seed Baseline
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-8 border-b border-white/10 pb-0 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("homepage")}
              className={`px-6 py-3 font-black text-xs uppercase tracking-wider rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "homepage"
                  ? "bg-white text-slate-900 border-blue-500 shadow-md"
                  : "text-slate-300 hover:text-white border-transparent hover:bg-white/5"
              }`}
            >
              <Layout size={16} /> Homepage Sections
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-6 py-3 font-black text-xs uppercase tracking-wider rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "settings"
                  ? "bg-white text-slate-900 border-blue-500 shadow-md"
                  : "text-slate-300 hover:text-white border-transparent hover:bg-white/5"
              }`}
            >
              <Globe size={16} /> Global Site Settings
            </button>
            <button
              onClick={() => setActiveTab("pages")}
              className={`px-6 py-3 font-black text-xs uppercase tracking-wider rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "pages"
                  ? "bg-white text-slate-900 border-blue-500 shadow-md"
                  : "text-slate-300 hover:text-white border-transparent hover:bg-white/5"
              }`}
            >
              <FileText size={16} /> Dedicated Page Editors
            </button>
          </div>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="p-4 bg-green-50 border-2 border-green-200 text-green-800 rounded-2xl flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} /> {successMessage}
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-green-600 hover:text-green-900">
              <X size={16} />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} /> {errorMessage}
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-900">
              <X size={16} />
            </button>
          </div>
        )}

        {/* TAB 1: HOMEPAGE SECTIONS */}
        {activeTab === "homepage" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 uppercase text-sm">Homepage Sections ({sections.length})</h3>
                <p className="text-xs text-slate-500">Enable, disable, order, and customize each section on the public homepage.</p>
              </div>
              <button
                onClick={fetchSections}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <RefreshCw size={12} className={loadingSections ? "animate-spin" : ""} /> Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loadingSections ? (
                <div className="col-span-full py-16 text-center text-slate-400 font-bold">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
                  Loading homepage sections from MongoDB...
                </div>
              ) : sections.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-400 font-medium">
                  No homepage sections found. Click "Seed Baseline" above to initialize default content.
                </div>
              ) : (
                sections.map((sec) => (
                  <div
                    key={sec.sectionId}
                    className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <span className="font-mono text-[10px] font-black uppercase text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg">
                          #{sec.order} • {sec.sectionId}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleSectionEnabled(sec)}
                            className={`p-1.5 rounded-lg text-xs transition-colors ${
                              sec.enabled ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                            }`}
                            title={sec.enabled ? "Section Enabled" : "Section Hidden"}
                          >
                            {sec.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                        </div>
                      </div>

                      <h4 className="font-black text-slate-900 text-base leading-snug">{sec.title}</h4>
                      <p className="text-slate-500 text-xs mt-1 line-clamp-2">{sec.subtitle || "No subtitle configured."}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${(sec as any).canEdit !== false ? "text-blue-600" : "text-slate-400"}`}>
                        {(sec as any).canEdit !== false ? "Authorized" : "Read-only"}
                      </span>
                      <button
                        onClick={() => handleOpenSectionEdit(sec)}
                        className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                      >
                        <Edit2 size={12} /> Edit Section
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: GLOBAL SITE SETTINGS */}
        {activeTab === "settings" && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 sm:p-12">
            {loadingSettings || !settings ? (
              <div className="py-16 text-center text-slate-400 font-bold">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
                Loading global settings from MongoDB...
              </div>
            ) : (
              <form onSubmit={handleSaveSettings} className="space-y-8 max-w-4xl">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase">Global Site Configuration</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage overarching portal identity, contact channels, announcement alerts, and legal footer texts.
                  </p>
                </div>

                {/* Section 1: Identity */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-black uppercase text-blue-800 tracking-wider">Portal Identity</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Site Name</label>
                      <input
                        type="text"
                        value={settings.siteName || ""}
                        onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Leader Full Name</label>
                      <input
                        type="text"
                        value={settings.leaderName || ""}
                        onChange={(e) => setSettings({ ...settings, leaderName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Site Title (HTML Meta)</label>
                      <input
                        type="text"
                        value={settings.siteTitle || ""}
                        onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Tagline</label>
                      <input
                        type="text"
                        value={settings.tagline || ""}
                        onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Contact & Office */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-black uppercase text-blue-800 tracking-wider">Constituency Office Channels</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Official Email</label>
                      <input
                        type="email"
                        value={settings.contactEmail || ""}
                        onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Public Helpline Number</label>
                      <input
                        type="text"
                        value={settings.helpline || ""}
                        onChange={(e) => setSettings({ ...settings, helpline: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">Camp Office Address</label>
                      <input
                        type="text"
                        value={settings.officeAddress || ""}
                        onChange={(e) => setSettings({ ...settings, officeAddress: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Announcement Bar */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-blue-800 tracking-wider">Announcement Alert Banner</h4>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={settings.announcement?.enabled || false}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            announcement: { ...(settings.announcement || { text: "", link: "" }), enabled: e.target.checked }
                          })
                        }
                        className="rounded text-blue-600"
                      />
                      Enable Banner
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Announcement Text</label>
                      <input
                        type="text"
                        value={settings.announcement?.text || ""}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            announcement: { ...(settings.announcement || { enabled: true, link: "" }), text: e.target.value }
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Link Target</label>
                      <input
                        type="text"
                        value={settings.announcement?.link || ""}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            announcement: { ...(settings.announcement || { enabled: true, text: "" }), link: e.target.value }
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Social Media Links */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-black uppercase text-blue-800 tracking-wider">Official Social Media Handles</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Facebook URL</label>
                      <input
                        type="text"
                        value={settings.socialLinks?.facebook || ""}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            socialLinks: { ...settings.socialLinks, facebook: e.target.value }
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Twitter / X URL</label>
                      <input
                        type="text"
                        value={settings.socialLinks?.twitter || ""}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            socialLinks: { ...settings.socialLinks, twitter: e.target.value }
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">YouTube URL</label>
                      <input
                        type="text"
                        value={settings.socialLinks?.youtube || ""}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            socialLinks: { ...settings.socialLinks, youtube: e.target.value }
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Save Site Settings
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: DEDICATED PAGE EDITORS */}
        {activeTab === "pages" && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 sm:p-12 space-y-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase">Dedicated Page Editors</h3>
              <p className="text-xs text-slate-500 mt-1">
                Directly configure page documents stored in MongoDB Atlas for About, Vision, Activities, and Development.
              </p>
            </div>

            {/* Sub-tab pills */}
            <div className="flex gap-2 border-b border-slate-200 pb-3 flex-wrap">
              {[
                { id: "about_page", label: "About Page" },
                { id: "vision_page", label: "Vision Page" },
                { id: "activities_page", label: "Activities Page" },
                { id: "development_page", label: "Development Page" }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePageTab(p.id as PageSubTab)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    activePageTab === p.id
                      ? "bg-blue-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {loadingPageSection || !pageSection ? (
              <div className="py-16 text-center text-slate-400 font-bold">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
                Loading {activePageTab} from MongoDB...
              </div>
            ) : (
              <form onSubmit={handleSavePageSection} className="space-y-6 max-w-4xl">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-700">Section ID: </span>
                    <span className="font-mono text-blue-900 font-bold">{pageSection.sectionId}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">Last Modified: </span>
                    <span className="text-slate-500">{new Date(pageSection.updatedAt).toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-slate-700 tracking-wider block mb-2">
                    Structured Page Payload (JSON Schema)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Edit the canonical fields rendered by the public frontend route. Changes are strictly validated before committing.
                  </p>
                  <textarea
                    rows={16}
                    value={pageSectionDataJson}
                    onChange={(e) => setPageSectionDataJson(e.target.value)}
                    className="w-full font-mono text-xs bg-slate-900 text-slate-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Commit {activePageTab} Updates
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Homepage Section Edit Modal / Drawer */}
      <AnimatePresence>
        {editingSection && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingSection(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden"
            >
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest block">
                    Homepage Section Editor
                  </span>
                  <h3 className="text-xl font-black font-mono mt-0.5">{editingSection.sectionId}</h3>
                </div>
                <button
                  onClick={() => setEditingSection(null)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveSection} className="flex-grow p-6 overflow-y-auto space-y-5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Section Title</label>
                  <input
                    type="text"
                    value={sectionTitle}
                    onChange={(e) => setSectionTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-600/20"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Section Subtitle / Description</label>
                  <input
                    type="text"
                    value={sectionSubtitle}
                    onChange={(e) => setSectionSubtitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Display Order</label>
                    <input
                      type="number"
                      value={sectionOrder}
                      onChange={(e) => setSectionOrder(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Visibility on Homepage</label>
                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sectionEnabled}
                        onChange={(e) => setSectionEnabled(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span className="font-bold text-slate-800">{sectionEnabled ? "Enabled (Visible)" : "Disabled (Hidden)"}</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Section Structured Data (JSON)</label>
                  <textarea
                    rows={14}
                    value={sectionDataJson}
                    onChange={(e) => setSectionDataJson(e.target.value)}
                    className="w-full font-mono text-xs bg-slate-900 text-slate-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingSection(null)}
                    className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-black uppercase tracking-wider flex items-center gap-2 shadow-md disabled:opacity-50"
                  >
                    {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Commit Section Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
