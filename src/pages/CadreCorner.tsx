import PublicLayout from "@/src/components/layout/PublicLayout";
import { motion } from "motion/react";
import { Users, Star, Award, MessageCircle } from "lucide-react";

export default function CadreCorner() {
  return (
    <PublicLayout>
      <section className="bg-red-700 py-24 text-white">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 text-center">
          <span className="bg-white/20 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-4 inline-block">Exclusive for Party Workers</span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6"
          >
            Cadre Corner
          </motion.h1>
          <p className="text-xl text-red-100 max-w-3xl mx-auto font-medium">
            The heartbeat of our movement. Dedicated to the warriors on the field who build our future.
          </p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
             {[
               { icon: Star, title: "Top Performers", count: "128", label: "Monthly Stars" },
               { icon: Users, title: "Booth Management", count: "450", label: "Active Booths" },
               { icon: Award, title: "Certifications", count: "1.2k", label: "Trained Workers" },
               { icon: MessageCircle, title: "Chat Group", count: "24/7", label: "Direct Access" }
             ].map((item, i) => (
               <div key={i} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm">
                 <div className="w-12 h-12 bg-red-100 text-red-700 rounded-xl flex items-center justify-center mb-6">
                    <item.icon size={24} />
                 </div>
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.title}</h4>
                 <div className="text-3xl font-black text-slate-900 tracking-tighter mb-2">{item.count}</div>
                 <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{item.label}</p>
               </div>
             ))}
          </div>

          <div className="bg-slate-900 rounded-[3rem] p-12 text-white flex flex-col md:flex-row items-center gap-12">
             <div className="md:w-1/2">
                <h3 className="text-3xl font-black uppercase tracking-tighter mb-6">Volunteer Leaderboard</h3>
                <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest leading-loose mb-8">
                  Recognizing the relentless efforts of our booth level leaders and area organizers.
                </p>
                <div className="space-y-4">
                   {[
                     { name: "Rahul Sharma", role: "Mandal Convener", points: "2,450" },
                     { name: "Priya Reddy", role: "Booth Leader", points: "1,920" },
                     { name: "Suresh Kumar", role: "Yuva Shruthi Head", points: "1,780" },
                   ].map((p, i) => (
                     <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-black">{i+1}</div>
                           <div>
                              <p className="font-black text-xs uppercase">{p.name}</p>
                              <p className="text-[9px] font-bold text-slate-500 uppercase">{p.role}</p>
                           </div>
                        </div>
                        <div className="text-red-500 font-black text-xs">{p.points} Pts</div>
                     </div>
                   ))}
                </div>
             </div>
             <div className="md:w-1/2 bg-white/5 p-12 rounded-[2.5rem] border border-white/10">
                <h3 className="text-xl font-black uppercase tracking-tight mb-6">Cadre Login</h3>
                <form className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Worker ID</label>
                      <input className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-red-600" placeholder="Enter ID" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mobile OTP</label>
                      <input className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-red-600" placeholder="Verify Mobile" />
                   </div>
                   <button className="w-full py-5 bg-red-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-xl hover:bg-red-700 transition-all">
                      Access Workspace
                   </button>
                </form>
             </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
