import React from "react";
import { motion } from "motion/react";

export default function LeadershipJourney() {
  const steps = [
    { title: "Student Leader", icon: "🎓" },
    { title: "Social Activist", icon: "🤝" },
    { title: "Party Organizer", icon: "📢" },
    { title: "Constituency In-charge", icon: "🗺️" },
    { title: "MLA Candidate", icon: "🚩" },
  ];

  return (
    <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm h-full">
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-10 border-b border-slate-100 pb-4">Leadership Journey</h3>
      <div className="relative space-y-12">
        {/* Connection Line */}
        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-dashed border-l-2 border-dashed border-slate-200 -z-10" />
        
        {steps.map((step, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-6"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md border-2 ${i === steps.length -1 ? 'bg-green-100 border-green-500' : 'bg-white border-slate-100'}`}>
              {step.icon}
            </div>
            <div>
              <p className={`text-[11px] font-black uppercase tracking-widest ${i === steps.length -1 ? 'text-green-600' : 'text-slate-700'}`}>
                {step.title}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
