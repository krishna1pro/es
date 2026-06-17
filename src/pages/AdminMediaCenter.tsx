import { useState } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { Upload, Image as ImageIcon, FileText, X, Plus, Search, Filter, Camera } from "lucide-react";
import { motion } from "motion/react";

export default function AdminMediaCenter() {
  const [activeTab, setActiveTab] = useState("ALL");

  const ASSETS = [
    { name: "infrastructure_june.jpg", size: "2.4 MB", type: "IMAGE", date: "2026-06-15" },
    { name: "district_policy_manual.pdf", size: "850 KB", type: "DOCUMENT", date: "2026-06-14" },
    { name: "event_highlights.mp4", size: "45 MB", type: "VIDEO", date: "2026-06-12" },
    { name: "profile_collector.png", size: "1.2 MB", type: "IMAGE", date: "2026-06-10" },
  ];

  return (
    <AdminLayout user={null} title="Media Assets & Press Kit">
      <div className="space-y-8">
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
          <button className="btn-primary flex items-center gap-2">
            <Upload size={16} />
            Upload New Asset
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Upload Placeholder Card */}
          <div className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-300 hover:border-blue-300 hover:text-blue-300 transition-all cursor-pointer group">
             <div className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
               <Plus size={32} />
             </div>
             <p className="text-[10px] font-bold uppercase tracking-widest">Add Media</p>
          </div>

          {ASSETS.map((asset, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all"
            >
              <div className="aspect-square bg-slate-100 relative overflow-hidden flex items-center justify-center">
                {asset.type === "IMAGE" ? (
                  <img src={`https://picsum.photos/seed/${asset.name}/400/400`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={asset.name} />
                ) : asset.type === "VIDEO" ? (
                  <div className="text-slate-300"><Camera size={48} /></div>
                ) : (
                  <div className="text-slate-300"><FileText size={48} /></div>
                )}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 bg-white/90 backdrop-blur rounded-lg text-slate-900 shadow-sm"><ImageIcon size={14} /></button>
                  <button className="p-2 bg-red-500 text-white rounded-lg shadow-sm"><X size={14} /></button>
                </div>
              </div>
              <div className="p-6">
                <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate mb-1">{asset.name}</p>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{asset.size}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{asset.date}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
