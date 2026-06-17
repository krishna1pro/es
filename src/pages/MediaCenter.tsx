import PublicLayout from "@/src/components/layout/PublicLayout";
import { motion } from "motion/react";
import { Play, Image as ImageIcon, FileText, Share2, Search } from "lucide-react";

export default function MediaCenter() {
  const CATEGORIES = ["ALL MEDIA", "PRESS RELEASES", "VIDEO GALLERY", "PHOTO ARCHIVE", "REPORTS"];

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
                className="text-4xl md:text-7xl font-black uppercase tracking-tighter"
              >
                Media Center
              </motion.h1>
            </div>
            
            <div className="relative w-full md:w-80 h-fit">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-6 text-sm font-bold outline-none focus:bg-white/10 transition-all" placeholder="Search archive..." />
            </div>
          </div>

          <div className="flex gap-4 mt-16 overflow-x-auto no-scrollbar pb-4 border-b border-white/5">
             {CATEGORIES.map((cat, i) => (
               <button 
                key={i}
                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${i === 0 ? "bg-blue-600 text-white" : "bg-white/5 text-slate-500 hover:text-white"}`}
               >
                 {cat}
               </button>
             ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
             {[
               { type: "VIDEO", title: "Quarterly Townhall Highlights", date: "June 10, 2026", img: "https://images.unsplash.com/photo-1475721027785-f74dea9f2672?auto=format&fit=crop&q=80&w=1200", icon: Play },
               { type: "PRESS", title: "New Health Initiative Launch", date: "June 08, 2026", img: "https://images.unsplash.com/photo-1576085898323-218337e3e43c?auto=format&fit=crop&q=80&w=1200", icon: FileText },
               { type: "PHOTO", title: "District Sports Meet 2026", date: "June 05, 2026", img: "https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&q=80&w=1200", icon: ImageIcon },
               { type: "VIDEO", title: "Weekly Development Vlog #12", date: "June 01, 2026", img: "https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&q=80&w=1200", icon: Play },
               { type: "PRESS", title: "Bypass Road Contract Signed", date: "May 28, 2026", img: "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80&w=1200", icon: FileText },
               { type: "PHOTO", title: "School Renovation Tour", date: "May 25, 2026", img: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1200", icon: ImageIcon },
             ].map((item, i) => (
               <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="group cursor-pointer"
               >
                 <div className="aspect-video bg-slate-100 rounded-[2rem] overflow-hidden mb-6 relative">
                    <img src={item.img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                    <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-900 shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                          <item.icon size={24} />
                       </div>
                    </div>
                    <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur rounded text-[9px] font-black uppercase tracking-widest text-slate-900">
                       {item.type}
                    </div>
                 </div>
                 <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2">{item.date}</p>
                 <h4 className="text-xl font-black uppercase tracking-tight text-slate-900 flex justify-between items-start group-hover:text-blue-800 transition-colors">
                    {item.title}
                    <Share2 size={16} className="text-slate-300 hover:text-slate-900 transition-colors mt-1" />
                 </h4>
               </motion.div>
             ))}
          </div>
          
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
