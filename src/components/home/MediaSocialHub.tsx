import React from "react";
import { motion } from "motion/react";
import { Image as ImageIcon, Video, FileText, Newspaper, Mic2, PlayCircle, ExternalLink } from "lucide-react";

export function MediaCenterRevamp() {
  const tabs = ["Photo Gallery", "Video Gallery", "Press Releases", "News Coverage", "Interviews"];
  const [active, setActive] = React.useState("Photo Gallery");

  return (
    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
       <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <h2 className="text-xl font-black uppercase tracking-tighter text-blue-900 flex items-center gap-3">
             <ImageIcon size={24} className="text-blue-600" /> Media Center
          </h2>
          <div className="flex flex-wrap gap-2 p-1 bg-slate-50 rounded-xl overflow-x-auto no-scrollbar">
            {tabs.map(t => (
              <button 
                key={t}
                onClick={() => setActive(t)}
                className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${active === t ? "bg-blue-800 text-white shadow-xl" : "text-slate-400 hover:text-slate-600"}`}
              >
                {t}
              </button>
            ))}
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="aspect-[16/10] bg-slate-100 rounded-3xl overflow-hidden relative mb-4">
                 <img src={`https://picsum.photos/seed/med${i}/600/400`} alt="Media" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">View Gallery &rarr;</p>
                 </div>
              </div>
            </motion.div>
          ))}
       </div>

       <div className="mt-12 flex justify-center">
          <button className="px-12 py-4 bg-white border-2 border-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-50 transition-all active:scale-95">
            View All Media
          </button>
       </div>
    </div>
  );
}

export function SocialMediaHub() {
  const social = [
    { name: "YouTube", icon: "🔴", color: "text-red-600" },
    { name: "Facebook", icon: "🔵", color: "text-blue-600" },
    { name: "Instagram", icon: "🟣", color: "text-pink-600" },
    { name: "Twitter / X", icon: "⬛", color: "text-slate-900" },
  ];

  return (
    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
       <h2 className="text-xl font-black uppercase tracking-tighter text-blue-900 mb-12 flex items-center gap-3">
          <PlayCircle size={24} className="text-blue-600" /> Social Media Hub
       </h2>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {social.map((s, i) => (
            <div key={i} className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl">{s.icon}</span>
                <span className={`text-[11px] font-black uppercase tracking-widest ${s.color}`}>{s.name}</span>
              </div>
              <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden relative border border-slate-100">
                <img src={`https://picsum.photos/seed/soc${i}/400/225`} className="w-full h-full object-cover" alt="Social" />
              </div>
              <button className="w-full py-3 bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-500 rounded-xl hover:bg-blue-800 hover:text-white transition-all flex items-center justify-center gap-2 group">
                Follow <ExternalLink size={12} className="group-hover:scale-125 transition-transform" />
              </button>
            </div>
          ))}
       </div>
    </div>
  );
}
