/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import PublicLayout from "@/src/components/layout/PublicLayout";
import { motion } from "motion/react";
import { Play, Image as ImageIcon, FileText, Share2, Search, Activity, AlertCircle, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";

export default function MediaCenter() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const CATEGORIES = ["ALL", "PHOTO_GALLERY", "VIDEO_GALLERY", "PRESS_RELEASES", "NEWS_COVERAGE", "INTERVIEWS"];

  const fetchMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/public/media/items?limit=100");
      if (res.status === 503) {
        throw new Error("Authoritative Google Sheets service is currently unavailable (HTTP 503).");
      }
      if (!res.ok) {
        throw new Error(`Failed to load media center: HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error("Error fetching public media:", err);
      setError(err.message || "Failed to load media center content.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  if (loading) {
    return (
      <PublicLayout>
        <div className="py-32 flex justify-center items-center bg-slate-900 text-white min-h-[60vh]">
          <Activity className="animate-spin text-blue-500" size={48} />
        </div>
      </PublicLayout>
    );
  }

  if (error) {
    return (
      <PublicLayout>
        <div className="py-32 text-center text-red-400 bg-slate-900 min-h-[60vh] px-6">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <p className="font-black uppercase text-xs tracking-widest mb-6">{error}</p>
          <button
            onClick={fetchMedia}
            className="px-8 py-3 bg-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl"
          >
            Retry Connection
          </button>
        </div>
      </PublicLayout>
    );
  }

  const content = data?.data || data || {};
  const items: any[] = Array.isArray(data?.items) ? data.items : (Array.isArray(content.items) ? content.items : []);

  const filteredItems = items.filter((item: any) => {
    const matchesCategory = activeCategory === "ALL" || (item.category && item.category.toUpperCase() === activeCategory);
    const matchesSearch = !searchQuery || item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getIconForType = (type: string) => {
    switch (type?.toUpperCase()) {
      case "VIDEO": return Play;
      case "PRESS": case "REPORT": case "DOCUMENT": return FileText;
      default: return ImageIcon;
    }
  };

  return (
    <PublicLayout>
      <section className="bg-slate-900 py-24 text-white">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
            <div className="max-w-2xl">
              <span className="text-blue-500 font-black uppercase tracking-[0.4em] text-[10px] mb-6 block">Authoritative Media Hub</span>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-4"
              >
                {content.pageTitle || "Media Center"}
              </motion.h1>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                {content.pageSubtitle || "Press releases, official announcements, photo archives, and video highlights backed by Google Sheets."}
              </p>
            </div>
            
            <div className="relative w-full md:w-80 h-fit">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-6 text-sm font-bold outline-none focus:bg-white/10 transition-all text-white" 
                placeholder="Search published archive..." 
              />
            </div>
          </div>

          <div className="flex gap-4 mt-16 overflow-x-auto no-scrollbar pb-4 border-b border-white/5">
             {CATEGORIES.map((cat) => (
               <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeCategory === cat ? "bg-blue-600 text-white shadow-lg" : "bg-white/5 text-slate-400 hover:text-white"
                }`}
               >
                 {cat.replace("_", " ")}
               </button>
             ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-bold uppercase text-xs tracking-widest">
              No published media items found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
               {filteredItems.map((item: any, i: number) => {
                 const IconComponent = getIconForType(item.mediaType || item.type);
                 const streamUrl = item.publicMediaUrl || `/api/public/media/stream/${item.mediaId || item.id}`;
                 return (
                   <motion.div 
                    key={item.mediaId || item.id || i}
                    whileHover={{ y: -10 }}
                    className="group cursor-pointer bg-slate-50 border border-slate-200 rounded-[2.5rem] p-6 shadow-sm flex flex-col justify-between"
                   >
                     <div>
                       <div className="aspect-video bg-slate-200 rounded-[2rem] overflow-hidden mb-6 relative">
                          <img 
                            src={item.thumbnailUrl || item.img || "https://images.unsplash.com/photo-1475721027785-f74dea9f2672?auto=format&fit=crop&q=80&w=1200"} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                            alt={item.title} 
                          />
                          <div className="absolute inset-0 bg-blue-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <a 
                              href={streamUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-900 shadow-2xl scale-75 group-hover:scale-100 transition-transform"
                            >
                               <IconComponent size={24} />
                            </a>
                          </div>
                          <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur rounded-full text-[9px] font-black uppercase tracking-widest text-slate-900 shadow-sm">
                             {item.category?.replace("_", " ") || "MEDIA"}
                          </div>
                       </div>
                       <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2">
                         {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recent"}
                       </p>
                       <h4 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-3 group-hover:text-blue-800 transition-colors">
                          {item.title}
                       </h4>
                       <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-6">
                         {item.description}
                       </p>
                     </div>

                     <a
                       href={streamUrl}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="w-full py-3 bg-white border-2 border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                     >
                       <span>Access Media Asset</span>
                       <ExternalLink size={14} />
                     </a>
                   </motion.div>
                 );
               })}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
