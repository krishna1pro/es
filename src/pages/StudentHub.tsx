import PublicLayout from "@/src/components/layout/PublicLayout";
import { motion } from "motion/react";
import { GraduationCap, Award, BookOpen, Lightbulb, UserCheck, Briefcase, Trophy, Search, ArrowRight } from "lucide-react";

export default function StudentHub() {
  const CATEGORIES = [
    { title: "Scholarships", icon: Award, count: 12, color: "blue", desc: "View available state and district level education grants." },
    { title: "Competitive Exams", icon: Trophy, count: 8, color: "green", desc: "Resources and schedules for national & state exams." },
    { title: "Career Guidance", icon: Lightbulb, count: 24, color: "amber", desc: "Expert advice on choosing the right academic path." },
    { title: "Internships", icon: Briefcase, count: 15, color: "purple", desc: "Local training opportunities with district departments." },
  ];

  return (
    <PublicLayout>
      <div className="bg-slate-50 pb-32">
        {/* Banner */}
        <div className="bg-blue-700 py-16 sm:py-24 text-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="max-w-3xl"
            >
              <span className="inline-block px-3 py-1 bg-white/20 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded mb-6">Empowering Education</span>
              <h1 className="text-4xl sm:text-6xl font-black mb-8 leading-[1.1] tracking-tighter">Student Success Hub</h1>
              <p className="text-lg sm:text-xl text-blue-100 font-medium leading-relaxed mb-12">
                Empowering the next generation with resources, mentorship, and opportunities to build a brighter future for the district.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <button className="px-8 py-3 bg-green-600 text-white text-xs font-bold rounded shadow-lg hover:bg-green-700 transition-colors uppercase tracking-widest">Browse Opportunities</button>
                <div className="hidden sm:flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <img key={i} src={`https://i.pravatar.cc/100?u=${i}`} className="w-10 h-10 rounded-full border-2 border-blue-700 shadow-md" alt="Student" />
                  ))}
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold shadow-md border-2 border-blue-700">
                    +2k
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          <div className="absolute top-0 right-0 w-1/3 h-full hidden lg:block opacity-10">
             <GraduationCap size={400} className="rotate-12 translate-x-1/2 -translate-y-12" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 -mt-12 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card-minimal hover:border-blue-300 transition-all hover:-translate-y-1 cursor-pointer group"
              >
                <div className={`w-12 h-12 bg-slate-50 text-blue-700 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-700 group-hover:text-white transition-all border border-slate-100`}>
                  <cat.icon size={22} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight mb-2">{cat.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6 font-medium">{cat.desc}</p>
                <div className="flex items-center justify-between text-[10px] font-bold text-blue-700 uppercase tracking-widest pt-4 border-t border-slate-50">
                  <span>{cat.count} Resources</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 sm:mt-24 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row">
            <div className="lg:w-1/2 p-8 sm:p-16 space-y-8">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-6 bg-green-600 rounded-full" />
                <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Live Now</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight tracking-tighter">YSR Jagananna Vidya Deevena Scholarship 2026</h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
                Complete fee reimbursement for students from underprivileged backgrounds. Ensuring that poverty is never a barrier to higher education.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-slate-700 text-sm font-bold uppercase tracking-tight">
                  <div className="p-2 bg-slate-50 rounded border border-slate-100"><UserCheck size={18} className="text-blue-700" /></div>
                  Over 12,000 students benefited
                </div>
                <div className="flex items-center gap-4 text-slate-700 text-sm font-bold uppercase tracking-tight">
                  <div className="p-2 bg-slate-50 rounded border border-slate-100"><BookOpen size={18} className="text-blue-700" /></div>
                  Professional & Technical Courses
                </div>
              </div>
              <button className="btn-primary !px-10 !py-4 shadow-xl shadow-blue-700/10">
                Apply for Scholarship
              </button>
            </div>
            <div className="lg:w-1/2 relative min-h-[300px]">
              <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover" alt="Students" />
            </div>
          </div>

          <div className="mt-20">
            <div className="flex items-center gap-3 mb-10">
              <span className="w-2 h-8 bg-blue-700 rounded-full" />
              <h2 className="text-xl font-bold uppercase tracking-tight text-slate-800">Latest Resources</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {[
                 { title: "Daily Quiz: General Knowledge", type: "Interactive" },
                 { title: "UPSC Mains Guidance 2026", type: "PDF Guide" },
                 { title: "Skill Dev: Web Development", type: "Video Course" }
               ].map((item, i) => (
                 <div key={i} className="card-minimal flex items-center justify-between group hover:border-blue-300 cursor-pointer transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-slate-50 text-slate-400 group-hover:text-blue-700 rounded-lg border border-slate-100 transition-colors">
                        <BookOpen size={18} />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.type}</p>
                        <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors uppercase tracking-tight">{item.title}</p>
                      </div>
                    </div>
                    <Search size={16} className="text-slate-300 group-hover:text-blue-700 transition-colors" />
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
