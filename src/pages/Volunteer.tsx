import { useState } from "react";
import PublicLayout from "@/src/components/layout/PublicLayout";
import { motion, AnimatePresence } from "motion/react";
import { Heart, UserPlus, MapPin, Award, Users, CheckCircle, Activity, X, AlertCircle } from "lucide-react";

export default function Volunteer() {
  const [showModal, setShowModal] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [mandal, setMandal] = useState("");
  const [experience, setExperience] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successNumber, setSuccessNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !mobile.trim()) {
      setError("Please fill out all required fields.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/public/volunteer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, mobile, mandal, experience, skills: ["Community Outreach"] })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit volunteer application");
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
      <section className="bg-slate-950 py-24 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 text-center relative z-10">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center border border-white/5 shadow-2xl">
              <Heart size={32} />
            </div>
          </div>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-[0.9]"
          >
            A Force <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">For Good</span>
          </motion.h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Join our systematic volunteer network. Your time and skills are the greatest assets 
            in our journey toward district transformation.
          </p>
        </div>
      </section>

      <section className="py-24 bg-[#F9F9F8]">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-12">
               <div className="bg-white rounded-[3rem] border border-slate-200 p-12 shadow-sm relative overflow-hidden">
                  <div className="flex flex-col md:flex-row gap-12 items-center">
                     <div className="md:w-1/2 space-y-8">
                        <span className="text-blue-700 font-black uppercase tracking-[0.4em] text-[10px]">Onboarding Console</span>
                        <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-tight">Join the District Voluntariat</h2>
                        <div className="space-y-6">
                           {[
                             { title: "Register Account", desc: "Create your profile with basic details and contact info.", icon: UserPlus },
                             { title: "Skill Mapping", desc: "Define your level of expertise in key impact sectors.", icon: Award },
                             { title: "Deploy Location", desc: "Assign yourself to a local booth or mandal center.", icon: MapPin }
                           ].map((item, i) => (
                             <div key={i} className="flex gap-6 items-start group">
                                <div className="mt-1 p-3 bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-700 border border-slate-100 rounded-xl transition-all"><item.icon size={20} /></div>
                                <div>
                                   <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">{item.title}</p>
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">{item.desc}</p>
                                </div>
                             </div>
                           ))}
                        </div>
                        <button 
                          onClick={() => { setShowModal(true); setSuccessNumber(null); setError(null); }}
                          className="w-full py-5 bg-blue-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-blue-800 transition-all"
                        >
                           Start Registration Session
                        </button>
                     </div>
                     <div className="md:w-1/2 rounded-[2.5rem] overflow-hidden relative aspect-[4/5] shadow-2xl">
                        <img src="https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover grayscale brightness-75" />
                        <div className="absolute inset-0 bg-blue-900/10" />
                        <div className="absolute bottom-8 left-8 right-8 p-8 bg-white/90 backdrop-blur rounded-3xl shadow-2xl">
                           <div className="flex items-center gap-3 text-blue-700 mb-2">
                             <CheckCircle size={16} />
                             <span className="text-[9px] uppercase font-black tracking-widest">Active Communities</span>
                           </div>
                           <p className="text-slate-800 font-black text-xs uppercase leading-tight tracking-tight">Environmental Drive: 5,000+ trees planted in East Mandal.</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { label: "Volunteers", value: "8,420", icon: Users },
                    { label: "Mandals", value: "45", icon: MapPin },
                    { label: "Monthly Events", value: "240", icon: Activity }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-slate-200 text-center shadow-sm group">
                       <div className="w-12 h-12 bg-slate-50 text-slate-400 group-hover:bg-blue-900 group-hover:text-white rounded-xl flex items-center justify-center mx-auto mb-6 transition-all shadow-inner">
                          <stat.icon size={24} />
                       </div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                       <p className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                    </div>
                  ))}
               </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
               <div className="bg-blue-900 p-10 rounded-[3rem] text-white shadow-2xl">
                  <h3 className="text-xl font-black uppercase tracking-tighter mb-10 border-l-4 border-blue-400 pl-4">Vanguard Leaders</h3>
                  <div className="space-y-8">
                     {[1,2,3,4].map(i => (
                       <div key={i} className="flex items-center gap-6 group">
                          <img src={`https://i.pravatar.cc/100?u=${i+20}`} className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                          <div>
                            <p className="font-black text-xs uppercase mb-1">Volunteer Leader {i}</p>
                            <div className="flex items-center gap-3">
                               <span className="text-[9px] text-blue-400 font-black uppercase tracking-widest">Rank #0{i}</span>
                               <span className="w-1 h-1 bg-white/20 rounded-full" />
                               <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">128 Pts</span>
                            </div>
                          </div>
                       </div>
                     ))}
                  </div>
                  <button className="w-full mt-10 py-5 bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all">
                    Full Leaderboard
                  </button>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Volunteer Registration Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[3rem] p-10 max-w-xl w-full relative shadow-2xl overflow-y-auto max-h-[90vh]"
            >
               <button 
                 onClick={() => setShowModal(false)}
                 className="absolute top-8 right-8 p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
               >
                  <X size={20} />
               </button>

               <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-2">Volunteer Application</h3>
               <p className="text-xs text-slate-500 uppercase tracking-widest mb-8">Register securely in the district volunteer database.</p>

               {successNumber ? (
                 <div className="bg-green-50 border border-green-200 p-8 rounded-3xl text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto">
                       <CheckCircle size={32} />
                    </div>
                    <h4 className="text-2xl font-black text-green-900 uppercase">Application Received</h4>
                    <p className="text-xs text-green-700">Your volunteer registration has been successfully stored in MongoDB.</p>
                    <div className="bg-white p-4 rounded-xl border border-green-200 inline-block">
                       <p className="text-[10px] uppercase font-bold text-slate-400">Tracking Reference</p>
                       <p className="text-xl font-black text-slate-900 tracking-wider">{successNumber}</p>
                    </div>
                    <div>
                      <button 
                        onClick={() => setShowModal(false)}
                        className="px-6 py-3 bg-green-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest mt-4"
                      >
                         Close Window
                      </button>
                    </div>
                 </div>
               ) : (
                 <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-bold">
                         <AlertCircle size={18} /> {error}
                      </div>
                    )}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name *</label>
                       <input 
                         value={fullName}
                         onChange={e => setFullName(e.target.value)}
                         required
                         className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-700/10" 
                         placeholder="Enter your full name" 
                       />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address *</label>
                          <input 
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-700/10" 
                            placeholder="name@example.com" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mobile Number *</label>
                          <input 
                            value={mobile}
                            onChange={e => setMobile(e.target.value)}
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-700/10" 
                            placeholder="+91 ..." 
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mandal / Division</label>
                       <input 
                         value={mandal}
                         onChange={e => setMandal(e.target.value)}
                         className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-700/10" 
                         placeholder="e.g. East Mandal" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Experience / Areas of Interest</label>
                       <textarea 
                         rows={3}
                         value={experience}
                         onChange={e => setExperience(e.target.value)}
                         className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-700/10 resize-none" 
                         placeholder="Briefly describe your previous social work or skills..." 
                       />
                    </div>

                    <button 
                      disabled={submitting}
                      className="w-full py-5 bg-blue-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-blue-800 transition-all disabled:opacity-50"
                    >
                       {submitting ? "Submitting Application..." : "Submit Volunteer Application"}
                    </button>
                 </form>
               )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PublicLayout>
  );
}
