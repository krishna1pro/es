import React from "react";
import { motion } from "motion/react";
import { Users, UserCheck, GraduationCap, Briefcase, Venus, ShieldAlert, Heart, Building2 } from "lucide-react";

export function CadreCorner() {
  const wings = [
    { label: "Youth Wing", icon: Users, color: "text-orange-600" },
    { label: "Women Wing", icon: Venus, color: "text-pink-600" },
    { label: "Student Wing", icon: GraduationCap, color: "text-blue-600" },
    { label: "BC Wing", icon: Briefcase, color: "text-amber-600" },
    { label: "SC/ST Wing", icon: ShieldAlert, color: "text-red-600" },
    { label: "Minority Wing", icon: Heart, color: "text-purple-600" },
    { label: "Booth Committees", icon: Building2, color: "text-slate-800" },
    { label: "Mandal Teams", icon: UserCheck, color: "text-green-600" },
  ];

  return (
    <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm h-full">
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-10 border-b border-slate-100 pb-4 flex items-center gap-2">
        <Users size={18} className="text-orange-600" /> Cadre Corner
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {wings.map((w, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="flex flex-col items-center text-center p-6 bg-slate-50 border border-transparent hover:border-orange-200 hover:bg-white hover:shadow-lg transition-all rounded-2xl group"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${w.color} bg-white shadow-sm group-hover:scale-110 transition-transform`}>
              <w.icon size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 leading-tight">{w.label}</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <button className="px-10 py-3 border-2 border-orange-100 text-[10px] font-black uppercase tracking-widest text-orange-600 rounded-xl hover:bg-orange-50 transition-all shadow-sm">
          Join the Cadre
        </button>
      </div>
    </div>
  );
}

export function PeopleVoiceGrid() {
  return (
    <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm h-full">
       <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-10 border-b border-slate-100 pb-4 flex items-center gap-2">
        <Heart size={18} className="text-purple-600" /> People's Voice
      </h3>
      <div className="space-y-6">
        {[
          { icon: ShieldAlert, label: "Submit Grievance", sub: "We are here to listen & help" },
          { icon: Activity, label: "Give Suggestions", sub: "Your ideas, Our Future" },
          { icon: UserCheck, label: "Success Stories", sub: "Real Stories, Real Change" },
          { icon: Search, label: "Track Your Request", sub: "Know the status of your request" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-purple-200 hover:bg-white hover:shadow-lg transition-all cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-white text-purple-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <item.icon size={20} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-800 mb-0.5">{item.label}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-10 py-3 bg-blue-900 border-2 border-blue-900 text-[10px] font-black uppercase tracking-widest text-white rounded-xl shadow-lg hover:bg-blue-800 active:scale-95 transition-all">
        Submit Your Request
      </button>
    </div>
  );
}

import { ShieldAlert as ShieldAlertIcon, Activity, UserCheck as UserCheckIcon, Search } from "lucide-react";
