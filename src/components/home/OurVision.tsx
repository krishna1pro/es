import React from "react";
import { motion } from "motion/react";
import { GraduationCap, Sprout, Briefcase, Venus, Heart, Zap, Waves, ShieldCheck } from "lucide-react";

export default function OurVision() {
  const visions = [
    { title: "Education For All", icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Agriculture & Farmers", icon: Sprout, color: "text-green-600", bg: "bg-green-50" },
    { title: "Youth Employment", icon: Briefcase, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Women Empowerment", icon: Venus, color: "text-pink-600", bg: "bg-pink-50" },
    { title: "Healthcare For All", icon: Heart, color: "text-red-600", bg: "bg-red-50" },
    { title: "Infrastructure Dev", icon: Zap, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Clean Water For All", icon: Waves, color: "text-cyan-600", bg: "bg-cyan-50" },
    { title: "Transparent Governance", icon: ShieldCheck, color: "text-slate-800", bg: "bg-slate-100" },
  ];

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm h-full flex flex-col">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-50 pb-3">Our Vision</h3>
      <div className="grid grid-cols-3 gap-2 sm:gap-3 flex-grow">
        {visions.map((v, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="flex flex-col items-center justify-center text-center p-4 rounded-xl bg-slate-50/50 border border-transparent hover:border-blue-200 hover:bg-white hover:shadow-sm transition-all group"
          >
            <div className={`w-14 h-14 rounded-2xl ${v.bg} ${v.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shrink-0 shadow-sm`}>
              <v.icon size={28} />
            </div>
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-900 leading-tight">
              {v.title}
            </p>
          </motion.div>
        ))}
      </div>
      <button className="w-full mt-6 py-2.5 text-[8px] font-black uppercase tracking-widest text-blue-800 border border-blue-100 rounded-lg hover:bg-blue-50 transition-all">
        View Full Manifesto
      </button>
    </div>
  );
}
