import { UserProfile } from "@/src/types";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { motion } from "motion/react";
import { 
  BarChart, LineChart, PieChart, MousePointer, 
  Scroll, Globe, Zap, Download, RefreshCw, Sparkles 
} from "lucide-react";
import { useState } from "react";

interface AnalyticsDashboardProps {
  user: UserProfile | null;
}

export default function AnalyticsDashboard({ user }: AnalyticsDashboardProps) {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  const generateAIReport = async () => {
    setIsGeneratingAI(true);
    try {
      const mockData = {
        visitors: 12450,
        avgScroll: "72%",
        topPage: "Student Hub",
        volunteerGrowth: "+12%"
      };
      
      const response = await fetch("/api/admin/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analyticsData: mockData, reportType: "Weekly Summary" })
      });
      const data = await response.json();
      setAiReport(data.report);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <AdminLayout user={user} title="Analytics Hub">
      <div className="space-y-8">
        {/* Header Actions */}
        <div className="card-minimal !py-4 !px-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6 w-full sm:w-auto">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Status</span>
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-tight">Real-time Active</span>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>
            <div className="hidden sm:flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Live Visitors</span>
              <span className="text-xl font-black text-slate-900 leading-none tracking-tighter">124</span>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             <button 
                onClick={generateAIReport} 
                disabled={isGeneratingAI} 
                className="btn-primary !py-2 !px-4 flex items-center gap-2 shadow-xl shadow-blue-700/10 disabled:opacity-50"
             >
                <Sparkles size={14} className={isGeneratingAI ? "animate-spin" : ""} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{isGeneratingAI ? "Processing..." : "AI Report"}</span>
             </button>
             <button className="px-3 py-2 bg-white border border-slate-200 rounded text-slate-400 hover:bg-slate-50 transition-all">
                <Download size={14} />
             </button>
          </div>
        </div>

        {/* AI Report Section */}
        {aiReport && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 rounded-2xl p-6 sm:p-10 text-white relative overflow-hidden"
          >
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 rounded border border-white/10"><Sparkles size={18} className="text-blue-400" /></div>
                <h3 className="text-lg font-bold tracking-tight uppercase">AI Strategic Analysis</h3>
              </div>
              <div className="prose prose-invert prose-xs max-w-none text-slate-300 leading-relaxed font-medium">
                {aiReport}
              </div>
              <div className="pt-6 flex gap-4">
                 <button className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded text-[10px] font-bold uppercase tracking-widest transition-all">Export</button>
                 <button onClick={() => setAiReport(null)} className="px-4 py-2 text-slate-500 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest">Dismiss</button>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-bl-full" />
          </motion.div>
        )}

        {/* Main Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
           <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              <div className="card-minimal !p-6 sm:!p-8 min-h-[400px]">
                 <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-2">
                       <span className="w-1.5 h-6 bg-blue-700 rounded-full" />
                       <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Traffic & Retention</h3>
                    </div>
                    <div className="flex gap-2">
                       <span className="px-2 py-1 bg-slate-50 text-[9px] font-bold text-slate-400 rounded border border-slate-100 uppercase tracking-widest">Sessions</span>
                       <span className="px-2 py-1 bg-blue-50 text-[9px] font-bold text-blue-700 rounded border border-blue-100 uppercase tracking-widest">Unique</span>
                    </div>
                 </div>
                 <div className="h-64 flex items-end gap-1.5 px-2">
                    {[40, 60, 45, 90, 65, 85, 100, 70, 50, 80, 95, 60, 40, 60, 45, 90].map((h, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: i * 0.05, duration: 1 }}
                        className="flex-grow bg-slate-50 rounded-sm relative group transition-all"
                      >
                         <div className="absolute inset-0 bg-blue-700 rounded-sm opacity-0 group-hover:opacity-100 transition-all cursor-pointer" />
                         <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10">
                            {h*124}
                         </div>
                      </motion.div>
                    ))}
                 </div>
                 <div className="flex justify-between mt-6 px-2 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                 <div className="card-minimal !p-6 sm:!p-8">
                    <div className="flex items-center gap-2 mb-8">
                      <span className="w-1.5 h-5 bg-green-600 rounded-full" />
                      <h4 className="text-base font-bold text-slate-800 uppercase tracking-tight">Scroll Depth</h4>
                    </div>
                    <div className="space-y-6">
                       {[
                         { l: "25% Depth", v: "92%", c: "green-600" },
                         { l: "50% Depth", v: "74%", c: "green-600" },
                         { l: "75% Depth", v: "42%", c: "amber-500" },
                         { l: "90% Depth", v: "18%", c: "red-500" }
                       ].map(s => (
                         <div key={s.l} className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                               <span className="text-slate-400">{s.l}</span>
                               <span className={`text-${s.c}`}>{s.v}</span>
                            </div>
                            <div className="h-1 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                               <div className={`h-full bg-${s.c} transition-all duration-1000`} style={{ width: s.v }}></div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
                 
                 <div className="card-minimal !p-6 sm:!p-8">
                    <div className="flex items-center gap-2 mb-8">
                      <span className="w-1.5 h-5 bg-blue-700 rounded-full" />
                      <h4 className="text-base font-bold text-slate-800 uppercase tracking-tight">Interaction</h4>
                    </div>
                    <div className="flex items-center justify-center py-4">
                       <div className="relative w-24 h-24 flex items-center justify-center">
                          <svg className="w-full h-full -rotate-90">
                             <circle cx="48" cy="48" r="44" fill="none" stroke="#f8fafc" strokeWidth="6" />
                             <circle cx="48" cy="48" r="44" fill="none" stroke="#1d4ed8" strokeWidth="6" strokeDasharray="276" strokeDashoffset="55" strokeLinecap="round" />
                          </svg>
                          <div className="absolute text-center">
                             <span className="text-2xl font-black text-slate-800 tracking-tighter leading-none">82</span>
                             <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-widest mt-0.5">Active</span>
                          </div>
                       </div>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center mt-6 font-bold uppercase tracking-tight">Engagement +12% vs Average</p>
                 </div>
              </div>
           </div>

           <div className="space-y-6 sm:space-y-8">
              <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-bl-full" />
                 <div className="flex items-center gap-2 mb-8">
                   <span className="w-1.5 h-6 bg-green-600 rounded-full" />
                   <h4 className="text-base font-bold uppercase tracking-tight">Geo Engagement</h4>
                 </div>
                 <div className="space-y-6">
                    {[
                      { city: "Mandapeta", users: "2,450", trend: "+12%" },
                      { city: "Ramachandrapuram", users: "1,820", trend: "+8%" },
                      { city: "Kakinada", users: "5,600", trend: "+15%" },
                      { city: "Rajahmundry", users: "4,100", trend: "+5%" }
                    ].map(geo => (
                      <div key={geo.city} className="flex items-center justify-between group cursor-pointer">
                         <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="font-bold text-xs text-slate-400 group-hover:text-white transition-colors uppercase tracking-tight">{geo.city}</span>
                         </div>
                         <div className="text-right">
                            <p className="text-sm font-black leading-none mb-1 text-white tracking-tight">{geo.users}</p>
                            <p className="text-[9px] font-bold text-green-500 uppercase tracking-widest">{geo.trend}</p>
                         </div>
                      </div>
                    ))}
                 </div>
                 <button className="w-full mt-10 py-3 bg-white/5 border border-white/10 hover:bg-white/10 transition-all rounded text-[10px] font-bold uppercase tracking-widest">District Heatmap</button>
              </div>

              <div className="card-minimal !p-6 sm:!p-8">
                 <div className="flex items-center gap-2 mb-8">
                   <span className="w-1.5 h-6 bg-amber-500 rounded-full" />
                   <h4 className="text-base font-bold text-slate-800 uppercase tracking-tight">System Actions</h4>
                 </div>
                 <div className="space-y-3">
                    <button className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded hover:bg-slate-100 transition-all group">
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-800 transition-colors">Sync Data Stream</span>
                       <RefreshCw size={14} className="text-slate-300 group-hover:text-blue-700 transition-colors" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded hover:bg-slate-100 transition-all group">
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-800 transition-colors">Export Datasets</span>
                       <Download size={14} className="text-slate-300 group-hover:text-blue-700 transition-colors" />
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </AdminLayout>
  );
}
