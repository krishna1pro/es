import PublicLayout from "@/src/components/layout/PublicLayout";
import { motion } from "motion/react";
import { Activity, Construction, Droplets, HeartPulse, GraduationCap, Tractor, Briefcase, Home as HomeIcon, MapPin, ArrowRight } from "lucide-react";

export default function Development() {
  const SECTORS = [
    { name: "Infrastructure & Roads", icon: Construction, color: "blue", progress: 85, projects: 12 },
    { name: "Water & Sanitation", icon: Droplets, color: "sky", progress: 64, projects: 8 },
    { name: "Healthcare Facilities", icon: HeartPulse, color: "red", progress: 92, projects: 5 },
    { name: "Education & Schools", icon: GraduationCap, color: "indigo", progress: 78, projects: 15 },
    { name: "Agriculture & Allied", icon: Tractor, color: "emerald", progress: 56, projects: 20 },
    { name: "Housing Projects", icon: HomeIcon, color: "orange", progress: 42, projects: 10 },
  ];

  return (
    <PublicLayout>
      <section className="bg-slate-950 py-24 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
            <div className="max-w-3xl">
              <span className="text-blue-500 font-black uppercase tracking-[0.4em] text-[10px] mb-6 block">Real-time Impact Assessment</span>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-[0.9]"
              >
                Development <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Metrics Hub</span>
              </motion.h1>
              <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-xl">
                Transparency in every brick and drop. Tracking the transformation of our constituency across key sectors.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 shrink-0">
               {[
                 { label: "Active Sites", value: "154", color: "text-blue-500" },
                 { label: "Capital Deployed", value: "₹1.4B", color: "text-white" },
                 { label: "Success Rate", value: "98%", color: "text-green-500" }
               ].map((stat, i) => (
                 <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
                    <p className={`text-2xl font-black tracking-tight ${stat.color}`}>{stat.value}</p>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#F9F9F8]">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
             <div className="xl:col-span-4 space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Primary Sectors</h3>
                {SECTORS.map((sector, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 bg-slate-50 text-slate-400 group-hover:text-blue-700 group-hover:bg-blue-50 rounded-xl flex items-center justify-center border border-slate-100 transition-all">
                          <sector.icon size={22} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{sector.name}</p>
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{sector.projects} Active Projects</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xl font-black text-slate-900 leading-none">{sector.progress}%</p>
                       <p className="text-[9px] font-bold text-green-600 uppercase mt-1">On Track</p>
                    </div>
                  </motion.div>
                ))}
             </div>

             <div className="xl:col-span-8 space-y-12">
                <div className="bg-white border-2 border-slate-200 p-8 rounded-[3rem] shadow-sm min-h-[500px] flex flex-col">
                   <div className="flex justify-between items-center mb-8">
                      <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Interactive Project Map</h3>
                      <button className="px-6 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                         Open Map View
                      </button>
                   </div>
                   <div className="flex-grow bg-slate-50 rounded-3xl flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                      <div className="relative text-center">
                         <MapPin size={48} className="text-slate-300 mx-auto mb-4" />
                         <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Select region for local metrics</p>
                      </div>
                      
                      {/* Mock Pin */}
                      <div className="absolute top-1/3 right-1/4 group">
                         <div className="w-4 h-4 bg-blue-600 rounded-full ring-8 ring-blue-600/10 animate-pulse cursor-pointer shadow-lg" />
                         <div className="absolute top-8 right-0 bg-slate-900 text-white p-4 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 w-48 z-20">
                            <p className="text-[9px] font-black uppercase text-blue-400 mb-1">Mandal A Center</p>
                            <p className="text-xs font-bold leading-relaxed mb-4">Grama Varadhi Road construction underway.</p>
                            <div className="flex justify-between items-center text-[9px] font-black uppercase">
                               <span>Progress</span>
                               <span className="text-blue-400">78%</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-blue-900 p-10 rounded-[3rem] text-white">
                      <h4 className="text-xl font-black uppercase tracking-tight mb-4">Capital Allocation</h4>
                      <p className="text-blue-300 text-[11px] font-bold uppercase tracking-widest leading-loose mb-8">
                        Our fiscal strategy focuses on high-impact infrastructure and human capital transformation.
                      </p>
                      <div className="space-y-6">
                         {[
                           { label: "Infrastructure", val: "45%" },
                           { label: "Healthcare", val: "25%" },
                           { label: "Digital Literacy", val: "20%" },
                         ].map((item, i) => (
                           <div key={i} className="flex justify-between items-end border-b border-white/10 pb-4">
                              <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                              <span className="text-2xl font-black tracking-tighter">{item.val}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                   <div className="bg-white border-2 border-slate-200 p-10 rounded-[3rem]">
                      <div className="flex items-center gap-4 mb-8">
                         <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                            <Activity size={20} />
                         </div>
                         <h4 className="text-xl font-black uppercase tracking-tight text-slate-800">Growth Index</h4>
                      </div>
                      <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-[1.8] mb-10">
                        Quarterly assessment shows a 12% increase in rural connectivity and 18% improvement in public health accessibility.
                      </p>
                      <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-700 transition-colors">
                        Download Quarterly Report <ArrowRight size={14} />
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

