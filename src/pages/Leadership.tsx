import PublicLayout from "@/src/components/layout/PublicLayout";
import { motion } from "motion/react";
import { Award, Briefcase, Calendar, MessageSquare, Quote, Star, User } from "lucide-react";

export default function Leadership() {
  const LEADERS = [
    { 
      name: "Sri Y.S. Jagan Mohan Reddy", 
      role: "Hon'ble Chief Minister", 
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800",
      quote: "Development is not just building bridges, it's building futures for our families."
    },
    { 
      name: "Dr. A. Sridhar Reddy", 
      role: "District Collector", 
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=800",
      quote: "Efficiency in administration is the byproduct of discipline and integrity."
    }
  ];

  return (
    <PublicLayout>
      <div className="bg-slate-50 pb-32">
        <div className="bg-white border-b border-slate-200 py-16 sm:py-24 mb-20 relative overflow-hidden">
           <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
              <div className="flex flex-col items-center text-center">
                <span className="label-caps mb-4">Visionary Leadership</span>
                <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tighter mb-6">Our Guiding Lights</h1>
                <p className="text-lg sm:text-xl text-slate-500 max-w-2xl font-medium leading-relaxed italic">"Leadership is the capacity to translate vision into reality for the common man."</p>
              </div>
           </div>
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-24 sm:space-y-32">
          {LEADERS.map((leader, i) => (
            <motion.div 
              key={leader.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} gap-12 sm:gap-20 items-center`}
            >
              <div className="w-full lg:w-2/5 relative group">
                 <div className="aspect-square rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white p-2">
                    <img src={leader.image} className="w-full h-full object-cover rounded-xl" alt={leader.name} />
                 </div>
                 <div className={`absolute -bottom-6 ${i % 2 === 0 ? "-right-6" : "-left-6"} bg-green-600 p-6 rounded-2xl text-white shadow-xl border-4 border-white hidden sm:block`}>
                    <p className="text-3xl font-black leading-none mb-1">15+</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-90">Years Experience</p>
                 </div>
              </div>

              <div className="w-full lg:w-3/5 space-y-8">
                 <div className="space-y-2">
                    <p className="text-blue-700 font-bold tracking-[0.2em] uppercase text-xs">{leader.role}</p>
                    <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter leading-tight">{leader.name}</h2>
                 </div>

                 <div className="card-minimal border-l-4 border-l-blue-700 italic text-slate-600 leading-relaxed font-medium text-lg relative">
                    <Quote size={40} className="text-blue-50 absolute -top-4 -left-2 -z-10" />
                    "{leader.quote}"
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { l: "Achievements", icon: Star, v: "24 records" },
                      { l: "Experience", icon: Briefcase, v: "IAS Grade-A" },
                      { l: "Projects", icon: Award, v: "150+ Lead" },
                      { l: "Timeline", icon: Calendar, v: "2024 - 2029" }
                    ].map((m, j) => (
                      <div key={j} className="space-y-1">
                        <div className="flex items-center gap-2 text-blue-700 font-bold text-[10px] uppercase tracking-wider mb-1">
                          <m.icon size={14} className="text-green-600" /> {m.l}
                        </div>
                        <p className="text-slate-500 text-xs font-semibold">{m.v}</p>
                      </div>
                    ))}
                 </div>

                 <div className="flex flex-wrap gap-4 pt-4">
                    <button className="btn-primary flex items-center gap-2">View Journey <ArrowRight size={16} /></button>
                    <button className="px-4 py-2 border border-slate-200 rounded-md text-slate-500 hover:text-blue-700 transition-colors uppercase text-[10px] font-bold tracking-widest">
                      <MessageSquare size={16} className="inline mr-2" /> Message
                    </button>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}

function ArrowRight({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  );
}
