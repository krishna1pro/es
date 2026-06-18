import React from "react";
import { motion } from "motion/react";
import { 
  ArrowRight, Flag, Star, ChevronRight, 
  Users, Award, TrendingUp, Megaphone,
  Facebook, Twitter, Instagram, Youtube,
  FileText, ArrowUpRight, Quote, Heart, 
  Map, CheckCircle, Clock, Calendar, Globe,
  Shield, Target, Zap, MessageSquare, Info
} from "lucide-react";
import PublicLayout from "@/src/components/layout/PublicLayout";
import { Link } from "react-router-dom";

const Redesign = () => {
  // Brand Colors: TVK-inspired Sophisticated Maroon & Navy
  const BRAND = {
    maroon: "#800000",
    navy: "#001F3F",
    accent: "#D4AF37", // Gold
    slate: "#F8FAFC"
  };

  const STATS = [
    { val: "1.2M+", label: "Citizens Impacted", icon: Users },
    { val: "340+", label: "Projects Delivered", icon: CheckCircle },
    { val: "45K", label: "Registered Cadre", icon: Flag },
    { val: "100%", label: "Manifesto Delivery", icon: Award }
  ];

  const JOURNEY = [
    { year: "1992", event: "Entry into Public Service" },
    { year: "2004", event: "Constituency Leadership" },
    { year: "2011", event: "Major Policy Reforms" },
    { year: "2019", event: "Regional Development Win" },
    { year: "2024", event: "Modern Digital Mission" }
  ];

  return (
    <PublicLayout>
      <div className="bg-[#fefefe] min-h-screen font-sans selection:bg-[#800000] selection:text-white overflow-x-hidden">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
          .font-display { font-family: 'Outfit', sans-serif; }
          .tvk-gradient { background: linear-gradient(135deg, #800000 0%, #400000 100%); }
          .glass-card { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); }
        `}</style>

        {/* 1. COMPACT HERO SECTION - Reduced Height */}
        <section className="relative h-[65vh] flex items-center bg-[#05070a] overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-20">
            <img 
              src="https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=2000" 
              className="w-full h-full object-cover grayscale" 
              alt="Context" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#05070a] via-[#05070a]/40 to-transparent" />
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10 w-full grid grid-cols-1 lg:grid-cols-2 items-center gap-8">
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 bg-[#800000]/20 border border-[#800000]/30 rounded-full"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#800000] animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#ff4d4d]">Legislative Secretariat</span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-black font-display text-white leading-[0.9] tracking-tighter uppercase italic"
              >
                Vision. <br />
                <span className="text-[#D4AF37]">Integrity.</span> <br />
                Growth.
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white/60 text-lg font-medium border-l-2 border-[#800000] pl-4 max-w-md italic"
              >
                "Transparent leadership. Proven results."
              </motion.p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link to="/vision" className="h-12 px-8 bg-[#800000] text-white rounded-lg flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider hover:brightness-110 transition-all shadow-lg">
                  Read Manifesto <ArrowUpRight size={16} />
                </Link>
                <Link to="/contact" className="h-12 px-8 bg-white/5 border border-white/10 text-white rounded-lg flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider hover:bg-white/10 transition-all backdrop-blur-md">
                  Citizen Portal <ChevronRight size={14} />
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-20 rounded-2xl overflow-hidden shadow-xl border border-white/10 aspect-[4/5] max-w-[280px] ml-auto"
              >
                <img 
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800" 
                  className="w-full h-full object-cover grayscale brightness-90 contrast-110" 
                  alt="Leader" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#800000]/60 to-transparent" />
                <div className="absolute bottom-6 left-0 right-0 text-center px-4">
                  <p className="text-white font-black font-display text-xl uppercase tracking-widest leading-none">Hon. Leader Name</p>
                  <p className="text-white/60 text-[8px] font-bold uppercase tracking-[0.3em] mt-1">Legislative Voice</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 2. STATS & ABOUT (COMPACT GRID) */}
        <section className="py-12 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
              {STATS.map((stat, i) => (
                <div key={i} className="p-5 bg-slate-50 rounded-xl flex items-center gap-4 group hover:bg-[#800000] transition-colors duration-300">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center group-hover:bg-white/10 shadow-sm">
                    <stat.icon size={20} className="text-[#800000] group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-2xl font-black font-display text-[#001F3F] group-hover:text-white transition-colors tracking-tighter">{stat.val}</p>
                    <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-400 group-hover:text-white/60 transition-colors">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <h3 className="text-3xl font-black font-display text-[#001F3F] uppercase tracking-tighter">Mission Statement</h3>
                <p className="text-slate-500 text-base leading-relaxed max-w-2xl">
                  Transforming Ramanayapeta through inclusive growth, digital transparency, and grassroots empowerment. We focus on modern infrastructure and accessible social welfare.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {[
                    { title: "Inclusive Growth", desc: "Bottom-up development for all sectors." },
                    { title: "Digital Governance", desc: "Tech-enabled public service hubs." }
                  ].map((p, i) => (
                    <div key={i} className="p-4 border border-slate-100 rounded-lg bg-slate-50/50">
                      <h4 className="font-bold text-[#800000] uppercase text-[10px] mb-1">{p.title}</h4>
                      <p className="text-slate-500 text-[10px] leading-tight font-medium">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-4 bg-[#001F3F] rounded-2xl p-6 text-white relative overflow-hidden">
                <Quote size={32} className="text-[#D4AF37] mb-4 opacity-50" />
                <p className="text-xl font-black font-display leading-tight uppercase italic mb-6">
                  "Leadership is service."
                </p>
                <div className="flex items-center gap-2">
                   <div className="h-px bg-[#D4AF37] grow opacity-30" />
                   <span className="text-[8px] font-bold tracking-[0.4em] uppercase text-[#D4AF37]">Secretariat</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. JOURNEY & ACTIVITIES (VERTICAL EFFICIENCY) */}
        <section className="py-12 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Journey - Compact */}
            <div className="lg:col-span-4 space-y-6">
              <h3 className="text-lg font-black font-display uppercase tracking-widest text-[#001F3F] border-b border-[#800000] pb-2 inline-block">Chronicle</h3>
              <div className="space-y-4 relative">
                <div className="absolute left-4 top-1 bottom-1 w-px bg-slate-200" />
                {JOURNEY.map((item, i) => (
                  <div key={i} className="flex gap-4 relative z-10 group">
                    <div className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center shrink-0 group-hover:border-[#800000] transition-colors">
                      <Star size={12} className="text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-[#800000] tracking-widest">{item.year}</p>
                      <p className="text-[11px] font-bold text-slate-800 mt-0.5 uppercase leading-none">{item.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Grid - Efficient */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black font-display uppercase tracking-widest text-[#001F3F]">Engagements</h3>
                <Link to="/activities" className="text-[9px] font-black uppercase tracking-widest text-[#800000] hover:underline">View History</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { tag: "Village Visit", title: "Ramanayapeta Ground Review", time: "09:00 AM", img: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800" },
                  { tag: "Civil Service", title: "Grievance Redressal Meeting", time: "11:30 AM", img: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=800" },
                  { tag: "Development", title: "Smart School Hub Site Visit", time: "03:00 PM", img: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800" },
                  { tag: "Community", title: "Townhall Awareness Session", time: "06:00 PM", img: "https://images.unsplash.com/photo-1524178232363-1fb28f74b0cd?auto=format&fit=crop&q=80&w=800" }
                ].map((act, i) => (
                  <div key={i} className="flex gap-4 bg-white p-3 rounded-lg border border-slate-100 shadow-sm group hover:shadow-md transition-all">
                    <div className="w-20 h-20 rounded-md overflow-hidden shrink-0">
                      <img src={act.img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="Activity" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-[7px] font-black uppercase tracking-widest text-[#800000]">{act.tag}</span>
                      <h4 className="text-[11px] font-black text-slate-900 leading-tight group-hover:text-[#800000] transition-colors mt-0.5">{act.title}</h4>
                      <div className="flex items-center gap-1.5 text-slate-400 mt-2">
                        <Clock size={10} />
                        <span className="text-[9px] font-bold">{act.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. MEDIA & PROJECTS (DENSE DASHBOARD) */}
        <section className="py-12 bg-white border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Media Center - Tighter */}
              <div className="lg:col-span-5 space-y-6">
                <div className="flex items-center gap-2">
                   <Megaphone size={20} className="text-[#800000]" />
                   <h3 className="text-lg font-black font-display uppercase tracking-widest text-[#001F3F]">Bulletins</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { date: "JUN 15, 2024", title: "Drinking Water Phase 2 Commences", cat: "Infrastructure" },
                    { date: "JUN 12, 2024", title: "Smart Classroom Inauguration", cat: "Education" },
                    { date: "JUN 10, 2024", title: "Farmer Credit Support Rollout", cat: "Welfare" }
                  ].map((news, i) => (
                    <div key={i} className="p-4 border-b border-slate-50 group cursor-pointer hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[7px] font-black uppercase tracking-widest bg-[#800000]/10 text-[#800000] px-1.5 py-0.5 rounded">{news.cat}</span>
                        <span className="text-[7px] font-bold text-slate-300 uppercase">{news.date}</span>
                      </div>
                      <h4 className="text-sm font-black font-display text-slate-800 leading-tight group-hover:text-[#800000] transition-colors">{news.title}</h4>
                    </div>
                  ))}
                  <button className="w-full py-3 bg-[#001F3F] text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-[#001429] transition-colors">
                     Media Archive
                  </button>
                </div>
              </div>

              {/* Projects - Tighter */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="text-lg font-black font-display uppercase tracking-widest text-[#001F3F]">Priority List</h3>
                   <span className="text-[8px] font-black uppercase tracking-widest text-[#800000] bg-[#800000]/10 px-2 py-0.5 rounded-full">34 Active</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { title: "Ring Road", status: "85%", icon: Map },
                    { title: "Digital Library", status: "95%", icon: Zap },
                    { title: "Model Clinic", status: "Phase 1", icon: Shield },
                    { title: "Skill Lab", status: "Live", icon: Target }
                  ].map((proj, i) => (
                    <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-xl group hover:border-[#800000] transition-all">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center mb-3 group-hover:bg-[#800000] group-hover:text-white transition-colors">
                        <proj.icon size={16} />
                      </div>
                      <h4 className="text-[10px] font-black text-slate-900 uppercase">{proj.title}</h4>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{proj.status}</span>
                        <div className="w-8 h-1 bg-slate-200 rounded-full overflow-hidden">
                           <div className="w-3/4 h-full bg-[#800000]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. CTA (CLEAN & MINIMAL) */}
        <section className="py-16 bg-[#001F3F] relative overflow-hidden">
           <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                 <h2 className="text-4xl font-black font-display text-white tracking-tighter uppercase leading-none">The People's <br /><span className="text-[#D4AF37]">Connect.</span></h2>
                 <p className="text-white/40 text-base italic border-l-2 border-[#800000] pl-6">
                   Direct access to your leadership.
                 </p>
                 <div className="flex gap-4">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex-1">
                       <MessageSquare size={16} className="text-[#D4AF37] mb-2" />
                       <h4 className="text-white font-bold text-[10px] uppercase">Direct Line</h4>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex-1">
                       <Zap size={16} className="text-[#D4AF37] mb-2" />
                       <h4 className="text-white font-bold text-[10px] uppercase">Service Hub</h4>
                    </div>
                 </div>
              </div>

              <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-xl relative">
                 <div className="space-y-6">
                    <div className="text-center space-y-2">
                       <h3 className="text-2xl font-black font-display text-[#001F3F] uppercase tracking-tighter">Citizen Portal</h3>
                       <p className="text-slate-400 text-[10px] font-medium">Verified governance node v1.0.4</p>
                    </div>
                    <div className="space-y-3">
                       <button className="w-full h-12 bg-[#800000] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2">
                          Registration <ArrowRight size={16} />
                       </button>
                       <button className="w-full h-12 bg-[#001F3F] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#001429] transition-all flex items-center justify-center gap-2">
                          Visit Hub <Globe size={16} />
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* 6. COMPACT FOOTER */}
        <footer className="bg-white py-10 px-12 border-t border-slate-100">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-[#001F3F] rounded-lg flex items-center justify-center text-white shadow-lg">
                    <Flag size={18} />
                 </div>
                 <h5 className="text-[#001F3F] font-black uppercase tracking-tighter text-base leading-none">Ramanayapeta</h5>
              </div>
              <div className="flex gap-8">
                 {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                    <Icon key={i} size={16} className="text-slate-200 hover:text-[#800000] cursor-pointer transition-colors" />
                 ))}
              </div>
           </div>
           <div className="max-w-7xl mx-auto mt-8 pt-4 border-t border-slate-50 flex justify-between items-center text-[7px] font-black uppercase tracking-[0.2em] text-slate-300">
              <p>© 2024 Administrative Head Office</p>
              <div className="flex gap-4">
                 <span className="hover:text-[#800000] cursor-pointer transition-colors">Privacy</span>
                 <span className="hover:text-[#800000] cursor-pointer transition-colors">Manifesto</span>
              </div>
           </div>
        </footer>
      </div>
    </PublicLayout>
  );
};

export default Redesign;
