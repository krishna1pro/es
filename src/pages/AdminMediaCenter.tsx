import { useState, useEffect } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { useAuth } from "@/src/context/AuthContext";
import { Upload, Image as ImageIcon, FileText, Play, X, Plus, Save, Activity, AlertCircle, Trash2 } from "lucide-react";
import { motion } from "motion/react";

export default function AdminMediaCenter() {
  const { user, authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState("ALL");
  const [sectionData, setSectionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New item form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    title: "",
    type: "PRESS",
    date: new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" }),
    img: "https://images.unsplash.com/photo-1475721027785-f74dea9f2672?auto=format&fit=crop&q=80&w=1200",
    category: "PRESS RELEASES"
  });

  const fetchMediaSection = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authFetch("/api/admin/home/sections/media_page");
      if (!res.ok) {
        throw new Error(`Failed to load media section: HTTP ${res.status}`);
      }
      const data = await res.json();
      setSectionData(data);
    } catch (err: any) {
      console.error("Error fetching admin media section:", err);
      setError(err.message || "Failed to load media section");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMediaSection();
  }, []);

  const handleSaveSection = async (updatedData: any) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const res = await authFetch("/api/admin/home/sections/media_page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: updatedData })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to update media center section");
      }

      const json = await res.json();
      setSectionData(json.section);
      setSuccessMessage("Media Center configuration successfully updated and audit-logged!");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error("Error saving media section:", err);
      setError(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title) return;

    const currentData = sectionData?.data || {};
    const existingItems = currentData.items || [];
    const createdItem = {
      id: "m_" + Date.now(),
      ...newItem
    };

    const updatedData = {
      ...currentData,
      items: [createdItem, ...existingItems]
    };

    handleSaveSection(updatedData);
    setShowAddModal(false);
    setNewItem({
      title: "",
      type: "PRESS",
      date: new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" }),
      img: "https://images.unsplash.com/photo-1475721027785-f74dea9f2672?auto=format&fit=crop&q=80&w=1200",
      category: "PRESS RELEASES"
    });
  };

  const handleDeleteItem = (itemId: string) => {
    if (!confirm("Are you sure you want to delete this media item?")) return;

    const currentData = sectionData?.data || {};
    const existingItems = currentData.items || [];
    const updatedItems = existingItems.filter((item: any) => item.id !== itemId);

    const updatedData = {
      ...currentData,
      items: updatedItems
    };

    handleSaveSection(updatedData);
  };

  if (loading) {
    return (
      <AdminLayout user={user} title="Media Assets & Press Kit">
        <div className="flex justify-center items-center py-32">
          <Activity className="animate-spin text-blue-600" size={48} />
        </div>
      </AdminLayout>
    );
  }

  const content = sectionData?.data || {};
  const items = content.items || [];

  const filteredItems = items.filter((item: any) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "IMAGES" && item.type === "PHOTO") return true;
    if (activeTab === "VIDEOS" && item.type === "VIDEO") return true;
    if (activeTab === "DOCS" && (item.type === "PRESS" || item.type === "REPORT")) return true;
    return true;
  });

  return (
    <AdminLayout user={user} title="Media Assets & Press Kit">
      <div className="space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3 text-red-900 text-xs font-bold">
            <AlertCircle size={20} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-green-50 border-2 border-green-200 rounded-2xl flex items-center gap-3 text-green-900 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-1">
              {content.pageTitle || "Media Center CMS"}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {content.pageSubtitle || "Manage press releases, video clips, and photo gallery items."}
            </p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2 shrink-0"
          >
            <Upload size={16} />
            Upload New Asset
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
            {["ALL", "IMAGES", "VIDEOS", "DOCS"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                  activeTab === tab ? "bg-white text-blue-700 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="text-xs font-black uppercase text-slate-400 tracking-wider">
            Total Assets: {items.length}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Upload Placeholder Card */}
          <div 
            onClick={() => setShowAddModal(true)}
            className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 hover:border-blue-300 hover:text-blue-600 transition-all cursor-pointer group"
          >
             <div className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
               <Plus size={32} />
             </div>
             <p className="text-[10px] font-bold uppercase tracking-widest">Add Media Asset</p>
          </div>

          {filteredItems.map((asset: any, i: number) => (
            <motion.div
              key={asset.id || i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all"
            >
              <div className="aspect-square bg-slate-100 relative overflow-hidden flex items-center justify-center">
                {asset.type === "PHOTO" || asset.type === "IMAGE" ? (
                  <img src={asset.img || `https://picsum.photos/seed/${asset.id}/400/400`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={asset.title} />
                ) : asset.type === "VIDEO" ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-slate-900">
                    <img src={asset.img} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                    <Play size={48} className="text-white relative z-10" />
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50 text-blue-700">
                    <FileText size={48} />
                    <span className="text-[9px] font-black uppercase mt-2">Press Release</span>
                  </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDeleteItem(asset.id)}
                    className="p-2 bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600 transition-colors"
                    title="Delete item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur rounded text-[9px] font-black uppercase tracking-widest text-slate-900">
                  {asset.type}
                </div>
              </div>
              <div className="p-6">
                <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate mb-1">{asset.title}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">{asset.category || "GENERAL"}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{asset.date}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Add Media Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl border border-slate-100"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Add New Media Asset</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Title / Headline</label>
                  <input 
                    type="text" 
                    required
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-600 transition-all"
                    placeholder="e.g. District Sports Meet Highlights"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Media Type</label>
                    <select 
                      value={newItem.type}
                      onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-600 transition-all"
                    >
                      <option value="PRESS">Press Release</option>
                      <option value="VIDEO">Video Gallery</option>
                      <option value="PHOTO">Photo Archive</option>
                      <option value="REPORT">Official Report</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                    <select 
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-600 transition-all"
                    >
                      <option value="PRESS RELEASES">Press Releases</option>
                      <option value="VIDEO GALLERY">Video Gallery</option>
                      <option value="PHOTO ARCHIVE">Photo Archive</option>
                      <option value="REPORTS">Reports</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Image / Cover URL</label>
                  <input 
                    type="url" 
                    required
                    value={newItem.img}
                    onChange={(e) => setNewItem({ ...newItem, img: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-600 transition-all"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</label>
                  <input 
                    type="text" 
                    required
                    value={newItem.date}
                    onChange={(e) => setNewItem({ ...newItem, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-600 transition-all"
                    placeholder="June 15, 2026"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-500 transition-all disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Add Asset"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
