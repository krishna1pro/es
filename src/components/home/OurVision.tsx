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
    <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm h-full">
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-10 border-b border-slate-100 pb-4">Our Vision</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {visions.map((v, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all group"
          >
            <div className={`w-12 h-12 rounded-xl ${v.bg} ${v.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <v.icon size={24} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-800 leading-tight">
              {v.title}
            </p>
          </motion.div>
        ))}
      </div>
      <button className="w-full mt-10 py-3 text-[10px] font-black uppercase tracking-widest text-blue-800 border-2 border-blue-100 rounded-xl hover:bg-blue-50 transition-all">
        View Detailed Vision
      </button>
    </div>
  );
}
