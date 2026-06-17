import PublicLayout from "@/src/components/layout/PublicLayout";
import { motion } from "motion/react";
import { Phone, Mail, MapPin, Send, MessageSquare } from "lucide-react";

export default function Contact() {
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
                        { icon: Mail, label: "Official Email", value: "office@district.gov.in" },
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
                   <form className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Full Name</label>
                            <input className="w-full bg-white border border-slate-200 rounded-2xl p-5 outline-none focus:ring-4 focus:ring-blue-700/5 transition-all" placeholder="John Doe" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mobile Number</label>
                            <input className="w-full bg-white border border-slate-200 rounded-2xl p-5 outline-none focus:ring-4 focus:ring-blue-700/5 transition-all" placeholder="+91 ..." />
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subject / Category</label>
                         <select className="w-full bg-white border border-slate-200 rounded-2xl p-5 outline-none focus:ring-4 focus:ring-blue-700/5 appearance-none">
                            <option>Development Suggestion</option>
                            <option>Health/Sanitation Issue</option>
                            <option>Personal Grievance</option>
                            <option>Appreciation/Feedback</option>
                            <option>Other</option>
                         </select>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Detailed Message</label>
                         <textarea rows={6} className="w-full bg-white border border-slate-200 rounded-2xl p-5 outline-none focus:ring-4 focus:ring-blue-700/5 transition-all resize-none" placeholder="Describe your concern in detail..."></textarea>
                      </div>

                      <button className="w-full py-6 bg-blue-900 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-2xl hover:bg-blue-800 transition-all active:scale-95">
                         Submit Information
                      </button>
                   </form>
                </div>
             </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
