import PublicLayout from "@/src/components/layout/PublicLayout";
import { motion } from "motion/react";
import { Play, Image as ImageIcon, FileText, Share2, Search, Activity, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function MediaCenter() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("ALL MEDIA");
  const [searchQuery, setSearchQuery] = useState("");

  const CATEGORIES = ["ALL MEDIA", "PRESS RELEASES", "VIDEO GALLERY", "PHOTO ARCHIVE", "REPORTS"];

  useEffect(() => {
    fetch("/api/public/media")
      .then(res => {
        if (!res.ok) throw new Error("Failed to load media data");
        return res.json();
      })
      .then(json => {
        setData(json.data || json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching media:", err);
        setError("Failed to load media center content.");
        setLoading(false);
      });
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
        <div className="py-32 text-center text-red-500 bg-slate-900 min-h-[60vh]">
          <AlertCircle size={48} className="mx-auto mb-4" />
          <p className="font-black uppercase text-xs tracking-widest">{error}</p>
        </div>
      </PublicLayout>
    );
  }

  const content = data?.data || data || {};
  const items = content.items || [
    { type: "VIDEO", title: "Quarterly Townhall Highlights", date: "June 10, 2026", img: "https://images.unsplash.com/photo-1475721027785-f74dea9f2672?auto=format&fit=crop&q=80&w=1200", category: "VIDEO GALLERY" },
    { type: "PRESS", title: "New Health Initiative Launch", date: "June 08, 2026", img: "https://images.unsplash.com/photo-1576085898323-218337e3e43c?auto=format&fit=crop&q=80&w=1200", category: "PRESS RELEASES" },
    { type: "PHOTO", title: "District Sports Meet 2026", date: "June 05, 2026", img: "https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&q=80&w=1200", category: "PHOTO ARCHIVE" },
  ];

  const filteredItems = items.filter((item: any) => {
    const matchesCategory = activeCategory === "ALL MEDIA" || (item.category && item.category.toUpperCase() === activeCategory);
    const matchesSearch = !searchQuery || item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || item.type?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getIconForType = (type: string) => {
    switch (type?.toUpperCase()) {
      case "VIDEO": return Play;
      case "PRESS": case "DOCUMENT": case "REPORT": return FileText;
      default: return ImageIcon;
    }
  };

  return (
    <PublicLayout>
      <section className="bg-slate-900 py-24 text-white">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
            <div className="max-w-2xl">
              <span className="text-blue-500 font-black uppercase tracking-[0.4em] text-[10px] mb-6 block">Communication Hub</span>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-4"
              >
                {content.pageTitle || "Media Center"}
              </motion.h1>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                {content.pageSubtitle || "Press releases, official announcements, photo archives, and video highlights."}
              </p>
            </div>
            
            <div className="relative w-full md:w-80 h-fit">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-6 text-sm font-bold outline-none focus:bg-white/10 transition-all text-white" 
                placeholder="Search archive..." 
              />
            </div>
          </div>

          <div className="flex gap-4 mt-16 overflow-x-auto no-scrollbar pb-4 border-b border-white/5">
             {CATEGORIES.map((cat, i) => (
               <button 
                key={i}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? "bg-blue-600 text-white shadow-lg" : "bg-white/5 text-slate-400 hover:text-white"}`}
               >
                 {cat}
               </button>
             ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-bold uppercase text-xs tracking-widest">
              No media items found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
               {filteredItems.map((item: any, i: number) => {
                 const IconComponent = getIconForType(item.type);
                 return (
                   <motion.div 
                    key={item.id || i}
                    whileHover={{ y: -10 }}
                    className="group cursor-pointer"
                   >
                     <div className="aspect-video bg-slate-100 rounded-[2rem] overflow-hidden mb-6 relative">
                        <img src={item.img || "https://images.unsplash.com/photo-1475721027785-f74dea9f2672?auto=format&fit=crop&q=80&w=1200"} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt={item.title} />
                        <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-900 shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                              <IconComponent size={24} />
                           </div>
                        </div>
                        <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur rounded text-[9px] font-black uppercase tracking-widest text-slate-900">
                           {item.type || "MEDIA"}
                        </div>
                     </div>
                     <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2">{item.date}</p>
                     <h4 className="text-xl font-black uppercase tracking-tight text-slate-900 flex justify-between items-start group-hover:text-blue-800 transition-colors">
                        <span>{item.title}</span>
                        <Share2 size={16} className="text-slate-300 hover:text-slate-900 transition-colors mt-1 shrink-0 ml-2" />
                     </h4>
                   </motion.div>
                 );
               })}
            </div>
          )}
          
          <div className="mt-24 text-center">
             <button className="px-12 py-5 border-2 border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 hover:border-slate-900 hover:text-slate-900 transition-all">
                Load More Content
             </button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
