import PublicLayout from "@/src/components/layout/PublicLayout";
import { motion } from "motion/react";
import { Users, Star, Award, MessageCircle, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function CadreCorner() {
  const [fullName, setFullName] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [mobile, setMobile] = useState("");
  const [mandal, setMandal] = useState("");
  const [position, setPosition] = useState("Booth Organizer");
  const [submitting, setSubmitting] = useState(false);
  const [successNumber, setSuccessNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !mobile.trim()) {
      setError("Please fill out required fields: Full Name and Mobile.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/public/cadre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, workerId, mobile, mandal, position })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit cadre application");
      }
      setSuccessNumber(data.trackingNumber);
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
             <div className="md:w-1/2 bg-white/5 p-12 rounded-[2.5rem] border border-white/10 w-full">
                <h3 className="text-xl font-black uppercase tracking-tight mb-2">Cadre Registration & Login</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Submit credentials to access district worker network.</p>

                {successNumber ? (
                  <div className="bg-green-500/10 border border-green-500/30 p-6 rounded-2xl text-center space-y-3">
                     <CheckCircle size={28} className="text-green-400 mx-auto" />
                     <p className="font-bold text-green-300 text-sm">Application Registered!</p>
                     <p className="text-[10px] text-slate-300">Tracking Reference:</p>
                     <p className="text-lg font-black text-white tracking-widest">{successNumber}</p>
                     <button 
                       onClick={() => { setSuccessNumber(null); setFullName(""); setWorkerId(""); setMobile(""); }}
                       className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold uppercase"
                     >
                        Submit Another
                     </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                     {error && (
                       <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl flex items-center gap-2 text-red-200 text-xs font-bold">
                          <AlertCircle size={16} /> {error}
                       </div>
                     )}
                     <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Full Name *</label>
                        <input 
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-red-600 text-white" 
                          placeholder="Worker Full Name" 
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Worker ID / Card No</label>
                           <input 
                             value={workerId}
                             onChange={e => setWorkerId(e.target.value)}
                             className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-red-600 text-white" 
                             placeholder="Optional ID" 
                           />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mobile Number *</label>
                           <input 
                             value={mobile}
                             onChange={e => setMobile(e.target.value)}
                             required
                             className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-red-600 text-white" 
                             placeholder="+91 ..." 
                           />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mandal / Role</label>
                        <input 
                          value={mandal}
                          onChange={e => setMandal(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-red-600 text-white" 
                          placeholder="e.g. Mandal Convener" 
                        />
                     </div>
                     <button 
                       disabled={submitting}
                       className="w-full py-4 bg-red-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-xl hover:bg-red-700 transition-all disabled:opacity-50 mt-2"
                     >
                        {submitting ? "Submitting..." : "Submit Cadre Application"}
                     </button>
                  </form>
                )}
             </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
