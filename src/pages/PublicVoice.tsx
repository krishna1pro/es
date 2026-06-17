import PublicLayout from "@/src/components/layout/PublicLayout";
import { motion } from "motion/react";
import { MessageSquare, ThumbsUp, Send, User } from "lucide-react";

export default function PublicVoice() {
  return (
    <PublicLayout>
      <section className="bg-slate-50 py-24 border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 text-center">
          <span className="text-blue-700 font-black uppercase tracking-[0.4em] text-[10px] mb-6 block">Democracy in Dialogue</span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8 leading-tight text-slate-900"
          >
            The People's Voice
          </motion.h1>
          <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
            Your ideas, your concerns, and your aspirations drive our development agenda. 
            Share your thoughts directly with the leadership.
          </p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
             <div className="lg:col-span-2 space-y-12">
                <div className="flex items-center justify-between">
                   <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Recent Community Discussion</h3>
                   <div className="flex gap-2">
                      <button className="px-4 py-2 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg">All</button>
                      <button className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">Newest</button>
                   </div>
                </div>

                <div className="space-y-8">
                   {[
                     { user: "Anand R.", time: "2 hours ago", text: "The new LED streetlights in Ward 4 are excellent. Can we expect similar upgrades in Ward 7 soon?", likes: 24 },
                     { user: "Lakshmi K.", time: "5 hours ago", text: "Suggesting a weekly small-scale farmers market at the old bypass junction. It would help local vendors immensely.", likes: 156 },
                     { user: "Suresh M.", time: "Yesterday", text: "The drainage clearance drive last weekend was very effective. Thank you for the proactive work.", likes: 89 },
                   ].map((post, i) => (
                     <div key={i} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-sm relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                           <MessageSquare size={80} />
                        </div>
                        <div className="flex gap-6 items-start relative z-10">
                           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200 text-slate-400">
                             <User size={24} />
                           </div>
                           <div className="flex-grow">
                              <div className="flex items-center justify-between mb-2">
                                 <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{post.user}</p>
                                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{post.time}</span>
                              </div>
                              <p className="text-sm font-bold text-slate-600 leading-relaxed mb-6">"{post.text}"</p>
                              <div className="flex items-center gap-6">
                                 <button className="flex items-center gap-2 text-[10px] font-black text-blue-700 uppercase tracking-widest">
                                    <ThumbsUp size={14} /> {post.likes} Upvotes
                                 </button>
                                 <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900">
                                    <MessageSquare size={14} /> Reply
                                 </button>
                              </div>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             <div className="lg:col-span-1">
                <div className="bg-blue-900 p-12 rounded-[3.5rem] text-white shadow-2xl sticky top-24">
                   <h3 className="text-2xl font-black uppercase tracking-tighter mb-6">Submit Your Voice</h3>
                   <p className="text-blue-300 text-[11px] font-bold uppercase tracking-widest leading-loose mb-10">
                     Join the conversation. Suggest a project, report a civic issue, or share your vision for the district.
                   </p>
                   <form className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-200">Category</label>
                         <select className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-blue-500 text-sm">
                            <option>Development Idea</option>
                            <option>Civic Complaint</option>
                            <option>Community Event</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-200">Your Message</label>
                         <textarea rows={5} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-blue-500 text-sm" placeholder="Write here..."></textarea>
                      </div>
                      <button className="w-full py-5 bg-white text-blue-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                         Submit Post <Send size={14} />
                      </button>
                   </form>
                   <p className="mt-8 text-[9px] text-blue-400 font-bold uppercase tracking-widest text-center">
                     Posts are moderated to maintain community standards.
                   </p>
                </div>
             </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
