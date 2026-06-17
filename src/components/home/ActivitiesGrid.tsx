import React from "react";
import { motion } from "motion/react";
import { Calendar, Clock, MapPin, Users, Heart, Zap, Download } from "lucide-react";

export function DailyActivities() {
  const times = [
    { time: "Morning", activity: "Village Visits", icon: MapPin },
    { time: "Afternoon", activity: "Public Interactions", icon: Heart },
    { time: "Evening", activity: "Meetings", icon: Users },
    { time: "Night", activity: "Review & Planning", icon: Zap },
  ];
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-8 flex items-center gap-2">
        <Clock size={16} className="text-blue-600" /> Daily Activities
      </h3>
      <div className="flex justify-between items-center relative mb-12">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -z-10" />
        {times.map((t, i) => (
          <div key={i} className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center text-blue-600 shadow-sm">
              <t.icon size={18} />
            </div>
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t.time}</p>
              <p className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">{t.activity}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map((i) => (
          <div key={i} className="aspect-square bg-slate-100 rounded-2xl overflow-hidden grayscale hover:grayscale-0 transition-all">
            <img src={`https://picsum.photos/seed/act${i}/400/400`} alt="Activity" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
      <button className="w-full mt-6 py-3 border-2 border-blue-50 text-[9px] font-black uppercase tracking-widest text-blue-800 rounded-xl hover:bg-blue-50">
        View Today's Full Activities
      </button>
    </div>
  );
}

export function MonthlyActivities() {
  const stats = [
    { label: "Village Visits", count: 48, icon: MapPin },
    { label: "Public Meetings", count: 16, icon: Users },
    { label: "Welfare Programs", count: 12, icon: Heart },
    { label: "Youth Programs", count: 8, icon: Zap },
    { label: "Party Strengthening", count: 20, icon: Users },
  ];
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
       <div className="flex justify-between items-center mb-8">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
            <Calendar size={16} className="text-blue-600" /> Monthly Activities
          </h3>
          <span className="text-[9px] font-bold bg-slate-100 px-3 py-1 rounded text-slate-500 uppercase">May 2024</span>
       </div>
       <div className="space-y-6">
         {stats.map((s, i) => (
           <div key={i} className="flex items-center justify-between group cursor-pointer">
             <div className="flex items-center gap-4">
               <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                 <s.icon size={16} />
               </div>
               <span className="text-[11px] font-black uppercase tracking-tight text-slate-700">{s.label}</span>
             </div>
             <span className="text-xl font-black text-slate-900 tracking-tighter">{s.count}</span>
           </div>
         ))}
       </div>
       <button className="w-full mt-10 py-3 border-2 border-blue-50 text-[9px] font-black uppercase tracking-widest text-blue-800 rounded-xl hover:bg-blue-50">
        View Monthly Report
      </button>
    </div>
  );
}

export function YearlyReport() {
  const stats = [
    { label: "Villages Covered", value: "320+", icon: MapPin },
    { label: "People Benefited", value: "3,25,000+", icon: Heart },
    { label: "Issues Resolved", value: "2,000+", icon: CheckCircle },
    { label: "Programs Conducted", value: "150+", icon: Calendar },
    { label: "Youth Engaged", value: "10,000+", icon: Users },
  ];
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
       <div className="flex justify-between items-center mb-8">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
            <Calendar size={16} className="text-blue-600" /> Yearly Impact Report
          </h3>
          <span className="text-[9px] font-bold bg-slate-100 px-3 py-1 rounded text-slate-500 uppercase">2023 - 2024</span>
       </div>
       <div className="space-y-6">
         {stats.map((s, i) => (
           <div key={i} className="flex items-center justify-between">
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-full border border-slate-100 text-green-600 flex items-center justify-center">
                 <MapPin size={18} />
               </div>
               <span className="text-[11px] font-black uppercase tracking-tight text-slate-700">{s.label}</span>
             </div>
             <span className="text-xl font-black text-slate-900 tracking-tighter">{s.value}</span>
           </div>
         ))}
       </div>
       <button className="w-full mt-10 py-3 bg-blue-900 border-2 border-blue-900 text-[9px] font-black uppercase tracking-widest text-white rounded-xl hover:bg-blue-800 flex items-center justify-center gap-2">
        <Download size={14} /> Download Annual Report
      </button>
    </div>
  );
}

import { CheckCircle } from "lucide-react";
