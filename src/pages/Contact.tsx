import PublicLayout from "@/src/components/layout/PublicLayout";
import { motion } from "motion/react";
import { Phone, Mail, MapPin, Send, MessageSquare, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function Contact() {
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [subject, setSubject] = useState("Development Suggestion");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successNumber, setSuccessNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !mobile.trim() || !message.trim()) {
      setError("Please fill out all required fields.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const endpoint = subject === "Personal Grievance" ? "/api/public/grievances" : "/api/public/contact";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, mobile, subject, message, category: subject })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit inquiry");
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
      <section className="bg-slate-50 py-24 border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 text-center">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 text-slate-900"
          >
            Get In Touch
          </motion.h1>
          <p className="text-xl text-slate-500 max-w-3xl mx-auto font-medium">
            Open doors, open mind. Reach out to the district office or speak to us directly.
          </p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <div className="flex flex-col lg:flex-row gap-20">
             <div className="lg:w-1/3 space-y-12">
                <div className="space-y-8">
                   <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800">Office Channels</h3>
                   <div className="space-y-6">
                      {[
                        { icon: MapPin, label: "Main Office", value: "District Capital, Main Road, Block 4" },
                        { icon: Phone, label: "Direct Line", value: "+91 99887 76655" },
                        { icon: Mail, label: "Official Email", value: "office@chintadaravikumar.in" },
                        { icon: MessageSquare, label: "Grievance WhatsApp", value: "+91 88776 65544" }
                      ].map((item, i) => (
                        <div key={i} className="flex gap-6 items-start">
                           <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-blue-700 shadow-sm">
                              <item.icon size={20} />
                           </div>
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
                              <p className="font-bold text-slate-800">{item.value}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="p-8 bg-blue-900 rounded-[2rem] text-white">
                   <h4 className="text-lg font-black uppercase tracking-tight mb-4">Urgent Matters?</h4>
                   <p className="text-[11px] font-bold text-blue-300 uppercase tracking-widest leading-loose mb-6">
                     If you have an emergency requirement or an immediate civic issue, please call our 24/7 helpline.
                   </p>
                   <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-blue-500 pb-1">
                      View Emergency Contacts <Send size={14} />
                   </button>
                </div>
             </div>

             <div className="lg:w-2/3">
                <div className="bg-slate-50 border border-slate-100 p-12 rounded-[3.5rem] shadow-sm">
                   <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-12">Send a Message</h3>
                   
                   {successNumber ? (
                     <div className="bg-green-50 border border-green-200 p-8 rounded-3xl text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto">
                           <CheckCircle size={32} />
                        </div>
                        <h4 className="text-2xl font-black text-green-900 uppercase">Submission Confirmed</h4>
                        <p className="text-sm text-green-700">Your message has been securely stored in the database.</p>
                        <div className="bg-white p-4 rounded-xl border border-green-200 inline-block">
                           <p className="text-[10px] uppercase font-bold text-slate-400">Tracking Reference</p>
                           <p className="text-xl font-black text-slate-900 tracking-wider">{successNumber}</p>
                        </div>
                        <div>
                          <button 
                            onClick={() => { setSuccessNumber(null); setFullName(""); setMobile(""); setMessage(""); }}
                            className="px-6 py-3 bg-green-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest mt-4"
                          >
                             Submit Another Inquiry
                          </button>
                        </div>
                     </div>
                   ) : (
                     <form onSubmit={handleSubmit} className="space-y-8">
                        {error && (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-bold">
                             <AlertCircle size={18} /> {error}
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Full Name *</label>
                              <input 
                                value={fullName} 
                                onChange={e => setFullName(e.target.value)} 
                                required 
                                className="w-full bg-white border border-slate-200 rounded-2xl p-5 outline-none focus:ring-4 focus:ring-blue-700/5 transition-all" 
                                placeholder="John Doe" 
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mobile Number *</label>
                              <input 
                                value={mobile} 
                                onChange={e => setMobile(e.target.value)} 
                                required 
                                className="w-full bg-white border border-slate-200 rounded-2xl p-5 outline-none focus:ring-4 focus:ring-blue-700/5 transition-all" 
                                placeholder="+91 ..." 
                              />
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subject / Category</label>
                           <select 
                             value={subject} 
                             onChange={e => setSubject(e.target.value)} 
                             className="w-full bg-white border border-slate-200 rounded-2xl p-5 outline-none focus:ring-4 focus:ring-blue-700/5 appearance-none"
                           >
                              <option>Development Suggestion</option>
                              <option>Health/Sanitation Issue</option>
                              <option>Personal Grievance</option>
                              <option>Appreciation/Feedback</option>
                              <option>Other</option>
                           </select>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Detailed Message *</label>
                           <textarea 
                             rows={6} 
                             value={message} 
                             onChange={e => setMessage(e.target.value)} 
                             required 
                             className="w-full bg-white border border-slate-200 rounded-2xl p-5 outline-none focus:ring-4 focus:ring-blue-700/5 transition-all resize-none" 
                             placeholder="Describe your concern in detail..."
                           />
                        </div>

                        <button 
                          disabled={submitting}
                          className="w-full py-6 bg-blue-900 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-2xl hover:bg-blue-800 transition-all active:scale-95 disabled:opacity-50"
                        >
                           {submitting ? "Submitting to Database..." : "Submit Information"}
                        </button>
                     </form>
                   )}
                </div>
             </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
