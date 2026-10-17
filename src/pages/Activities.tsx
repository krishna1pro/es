import PublicLayout from "@/src/components/layout/PublicLayout";
import { DailyActivities, MonthlyActivities, YearlyReport } from "@/src/components/home/ActivitiesGrid";
import { motion } from "motion/react";
import { Calendar, Filter, Activity, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function Activities() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/public/activities")
      .then(res => {
        if (!res.ok) throw new Error("Failed to load activities");
        return res.json();
      })
      .then(json => {
        setData(json.data || json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching activities:", err);
        setError("Failed to load activities page content.");
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
  const recentLogs = content.recentLogs || [
    { date: "June 15, 2026", title: "Review Meeting on Water Projects", desc: "Met with engineers to discuss the pipeline progress in eastern villages." },
    { date: "June 14, 2026", title: "Inauguration of New Community Center", desc: "Gram Panchayat facility opened for public use in Mandal Town." },
    { date: "June 12, 2026", title: "Palle Baata - Village Visit Program", desc: "Walking with people to understand local grievances firsthand." }
  ];

  return (
    <PublicLayout>
      <section className="bg-slate-900 py-24 text-white">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <span className="text-blue-500 font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">Ground Presence</span>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4"
              >
                {content.pageTitle || "Leadership in Action"}
              </motion.h1>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                {content.pageSubtitle || "Ground presence, public meetings, and grassroots interactions across the constituency."}
              </p>
            </div>
            <div className="flex gap-4">
               <button className="px-6 py-3 bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2 hover:bg-white/20 transition-all">
                 <Calendar size={14} /> Filter by Month
               </button>
               <button className="px-6 py-3 bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2 hover:bg-white/20 transition-all">
                 <Filter size={14} /> Type
               </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 space-y-16">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
            <DailyActivities />
            <MonthlyActivities />
            <YearlyReport />
          </div>

          <div className="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100">
             <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-12">Recent Activity Log</h3>
             <div className="space-y-6">
                {recentLogs.map((log: any, i: number) => (
                  <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 items-start md:items-center">
                    <div className="w-40 shrink-0">
                       <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">{log.date}</span>
                    </div>
                    <div className="flex-grow">
                       <h4 className="text-lg font-black uppercase tracking-tight text-slate-800 mb-2">{log.title}</h4>
                       <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">{log.desc}</p>
                    </div>
                    <button className="px-6 py-2 bg-slate-100 text-slate-800 text-[9px] font-black uppercase tracking-widest rounded transition-colors hover:bg-blue-800 hover:text-white">
                      View Details
                    </button>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
