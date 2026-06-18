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

        {/* 1. COMPACT HERO SECTION */}
        <section className="relative h-[80vh] flex items-center bg-[#05070a] overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-30">
            <img 
              src="https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=2000" 
              className="w-full h-full object-cover grayscale" 
              alt="Context" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#05070a] via-[#05070a]/60 to-transparent" />
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10 w-full grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-3 px-4 py-1.5 bg-[#800000]/20 border border-[#800000]/30 rounded-full"
              >
                <div className="w-2 h-2 rounded-full bg-[#800000] animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#ff4d4d]">Legislative Secretariat Hub</span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl sm:text-7xl lg:text-8xl font-black font-display text-white leading-[0.9] tracking-tighter uppercase italic"
              >
                Vision. <br />
                <span className="text-[#D4AF37]">Integrity.</span> <br />
                Growth.
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/50 text-xl font-medium border-l-4 border-[#800000] pl-6 max-w-lg mb-8 italic"
              >
                "Serving the people of Ramanayapeta with unwavering dedication and transparent leadership."
              </motion.p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link to="/vision" className="h-14 px-10 bg-[#800000] text-white rounded-lg flex items-center gap-3 text-sm font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-lg">
                  Read Manifesto <ArrowUpRight size={18} />
                </Link>
                <Link to="/contact" className="h-14 px-10 bg-white/5 border border-white/10 text-white rounded-lg flex items-center gap-3 text-sm font-bold uppercase tracking-widest hover:bg-white/10 transition-all backdrop-blur-md">
                  Citizen Portal <ChevronRight size={16} />
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-20 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10 aspect-[4/5] max-w-sm ml-auto"
              >
                <img 
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800" 
                  className="w-full h-full object-cover grayscale brightness-90 contrast-110" 
                  alt="Leader" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#800000]/60 to-transparent" />
                <div className="absolute bottom-10 left-0 right-0 text-center px-6">
                  <p className="text-white font-black font-display text-2xl uppercase tracking-widest">Hon. Leader Name</p>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.4em] mt-2">Member of Legislative Assembly</p>
                </div>
              </motion.div>
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#D4AF37]/10 rounded-full blur-3xl opacity-50" />
              <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-[#800000]/10 rounded-full blur-3xl opacity-50" />
            </div>
          </div>
        </section>

        {/* 2. STATS & ABOUT (DENSE GRID) */}
        <section className="py-20 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
              {STATS.map((stat, i) => (
                <div key={i} className="p-8 bg-slate-50 rounded-2xl flex flex-col items-center text-center group hover:bg-[#800000] transition-colors duration-500">
                  <stat.icon size={32} className="text-[#800000] mb-4 group-hover:text-white transition-colors" />
                  <p className="text-4xl font-black font-display text-[#001F3F] group-hover:text-white transition-colors tracking-tighter">{stat.val}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 group-hover:text-white/60 transition-colors mt-2">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-8">
                <div className="space-y-4">
                  <h3 className="text-4xl font-black font-display text-[#001F3F] uppercase tracking-tighter">About the Leader</h3>
                  <p className="text-slate-500 text-lg leading-relaxed max-w-3xl">
                    Dedicated to transforming Ramanayapeta into a model constituency through inclusive development, digital governance, and transparency. Our mission is to ensure every citizen has access to modern infrastructure and social welfare.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { title: "Inclusive Growth", desc: "Focus on bottom-up development for all communities." },
                    { title: "Digital Governance", desc: "Implementing tech for transparent public services." }
                  ].map((p, i) => (
                    <div key={i} className="p-6 border border-slate-100 rounded-xl bg-slate-50/50">
                      <h4 className="font-bold text-[#800000] uppercase text-sm mb-2">{p.title}</h4>
                      <p className="text-slate-500 text-xs font-medium leading-relaxed">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-5 bg-[#001F3F] rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#800000] -mr-20 -mt-20 rounded-full blur-3xl opacity-20" />
                <Quote size={48} className="text-[#D4AF37] mb-8" />
                <p className="text-2xl font-black font-display leading-[1.2] uppercase italic mb-8">
                  "Leadership is not a title; it is a responsibility to be the voice of those who are unheard."
                </p>
                <div className="flex items-center gap-4">
                   <div className="h-px bg-[#D4AF37] grow" />
                   <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#D4AF37]">Admin Secretariat</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. JOURNEY & DAILY ACTIVITIES (TIGHTER DISPLAY) */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16">
            
            {/* Journey Sidebar */}
            <div className="lg:col-span-4 space-y-10">
              <h3 className="text-xl font-black font-display uppercase tracking-widest text-[#001F3F] border-b-2 border-[#800000] pb-4 inline-block">Service Journey</h3>
              <div className="space-y-8 relative">
                <div className="absolute left-6 top-2 bottom-2 w-px bg-slate-200" />
                {JOURNEY.map((item, i) => (
                  <div key={i} className="flex gap-8 relative z-10 group">
                    <div className="w-12 h-12 rounded-full border border-slate-200 bg-white flex items-center justify-center group-hover:border-[#800000] transition-colors">
                      <Star size={16} className="text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#800000] tracking-widest">{item.year}</p>
                      <p className="text-sm font-bold text-slate-800 mt-1 uppercase leading-none">{item.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Activities Grid */}
            <div className="lg:col-span-8 space-y-10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black font-display uppercase tracking-widest text-[#001F3F]">Daily Engagements</h3>
                <Link to="/activities" className="text-[10px] font-black uppercase tracking-widest text-[#800000] hover:underline">Full Log</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { tag: "Village Visit", title: "Ramanayapeta Ground Review", time: "09:00 AM", img: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800" },
                  { tag: "Civil Service", title: "Grievance Redressal Meeting", time: "11:30 AM", img: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=800" },
                  { tag: "Development", title: "Smart School Hub Site Visit", time: "03:00 PM", img: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800" },
                  { tag: "Community", title: "Townhall Awareness Session", time: "06:00 PM", img: "https://images.unsplash.com/photo-1524178232363-1fb28f74b0cd?auto=format&fit=crop&q=80&w=800" }
                ].map((act, i) => (
                  <div key={i} className="flex gap-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm group hover:shadow-md transition-all">
                    <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
                      <img src={act.img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="Activity" />
                    </div>
                    <div className="flex flex-col justify-center gap-1">
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#800000]">{act.tag}</span>
                      <h4 className="text-sm font-black text-slate-900 leading-tight group-hover:text-[#800000] transition-colors">{act.title}</h4>
                      <div className="flex items-center gap-2 text-slate-400 mt-2">
                        <Clock size={12} />
                        <span className="text-[10px] font-bold">{act.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. DEVELOPMENT PROJECTS & MEDIA (DASHBOARD STYLE) */}
        <section className="py-20 bg-white border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              
              {/* Media Center (Magazine Layout) */}
              <div className="lg:col-span-5 space-y-10">
                <div className="flex items-center gap-4">
                   <Megaphone size={28} className="text-[#800000]" />
                   <h3 className="text-xl font-black font-display uppercase tracking-widest text-[#001F3F]">Media Hub</h3>
                </div>
                <div className="space-y-6">
                  {[
                    { date: "JUN 15, 2024", title: "New Drinking Water Project Phase 2 Commences", cat: "Infrastructure" },
                    { date: "JUN 12, 2024", title: "Inauguration of Smart Classroom in District High School", cat: "Education" },
                    { date: "JUN 10, 2024", title: "Annual Farmer Credit Support Scheme Rollout", cat: "Welfare" }
                  ].map((news, i) => (
                    <div key={i} className="p-6 border-b border-slate-100 group cursor-pointer hover:bg-slate-50/50 transition-colors first:pt-0">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-[8px] font-black uppercase tracking-widest bg-[#800000]/10 text-[#800000] px-2 py-0.5 rounded-md">{news.cat}</span>
                        <span className="text-[8px] font-bold text-slate-300 uppercase">{news.date}</span>
                      </div>
                      <h4 className="text-lg font-black font-display text-slate-800 leading-tight group-hover:text-[#800000] transition-colors">{news.title}</h4>
                      <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#001F3F] opacity-0 group-hover:opacity-100 transition-opacity">
                         Read Bulletin <ArrowRight size={12} />
                      </div>
                    </div>
                  ))}
                  <button className="w-full py-4 bg-[#001F3F] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#001429] transition-colors">
                     Full Media Archive
                  </button>
                </div>
              </div>

              {/* Development Projects (Grid) */}
              <div className="lg:col-span-7 space-y-10">
                <div className="flex items-center justify-between">
                   <h3 className="text-xl font-black font-display uppercase tracking-widest text-[#001F3F]">Ongoing Projects</h3>
                   <span className="text-[10px] font-black uppercase tracking-widest text-[#800000] bg-[#800000]/10 px-3 py-1 rounded-full">34 Active Modules</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { title: "Ramanayapeta Ring Road", status: "85% Complete", icon: Map },
                    { title: "Digital Public Library", status: "Finishing Touches", icon: Zap },
                    { title: "Model Health Clinic", status: "Phase 1 Done", icon: Shield },
                    { title: "Youth Skill Lab", status: "Operational", icon: Target }
                  ].map((proj, i) => (
                    <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-[#800000] transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center mb-4 group-hover:bg-[#800000] group-hover:text-white transition-colors">
                        <proj.icon size={20} />
                      </div>
                      <h4 className="text-sm font-black text-slate-900 uppercase">{proj.title}</h4>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{proj.status}</span>
                        <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden">
                           <div className="w-3/4 h-full bg-[#800000]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* UPCOMING EVENTS COMPACT LIST */}
                <div className="pt-8 border-t border-slate-100 mt-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-6 font-display">Administrative Calendar</h4>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {[
                      { date: "22 JUN", title: "Public Meet", icon: MessageSquare },
                      { date: "24 JUN", title: "Review Meet", icon: Info },
                      { date: "28 JUN", title: "Youth Rally", icon: Flag }
                    ].map((ev, i) => (
                       <div key={i} className="min-w-[180px] p-4 bg-white border border-slate-100 rounded-xl flex items-center gap-4">
                          <p className="text-xs font-black text-[#800000] leading-tight text-center border-r border-slate-100 pr-4">
                            {ev.date.split(' ')[0]} <br /> {ev.date.split(' ')[1]}
                          </p>
                          <p className="text-[10px] font-bold text-[#001F3F] uppercase leading-tight line-clamp-2">{ev.title}</p>
                       </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. PEOPLE'S VOICE & CTA (BOXED & CLEAN) */}
        <section className="py-20 lg:py-40 bg-[#001F3F] relative overflow-hidden">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#800000] -mr-32 -mt-32 rounded-full blur-[150px] opacity-20" />
           
           <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-12">
                 <div className="space-y-6">
                    <h2 className="text-5xl font-black font-display text-white tracking-tighter uppercase leading-none">The People's <br /><span className="text-[#D4AF37]">Mandate.</span></h2>
                    <p className="text-white/40 text-lg italic border-l-4 border-[#800000] pl-8">
                      Every voice matters. Every concern is an opportunity for improved governance. Share your thoughts directly with the secretariat.
                    </p>
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                       <MessageSquare className="text-[#D4AF37] mb-4" />
                       <h4 className="text-white font-bold text-sm uppercase">Direct Channel</h4>
                       <p className="text-white/30 text-[10px] mt-2 font-medium">Verified concerns are reviewed weekly by the core committee.</p>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                       <Zap className="text-[#D4AF37] mb-4" />
                       <h4 className="text-white font-bold text-sm uppercase">Rapid Response</h4>
                       <p className="text-white/30 text-[10px] mt-2 font-medium">Current turnaround time for admin inquiries: 48 Hours.</p>
                    </div>
                 </div>
              </div>

              <div className="bg-white rounded-[3rem] p-10 lg:p-16 shadow-2xl relative">
                 <div className="space-y-10">
                    <div className="text-center space-y-4">
                       <div className="w-16 h-16 bg-[#800000]/10 text-[#800000] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                          <Users size={32} />
                       </div>
                       <h3 className="text-3xl font-black font-display text-[#001F3F] uppercase tracking-tighter">Join the Cadre</h3>
                       <p className="text-slate-400 text-sm font-medium">Become a part of the digital governance revolution today.</p>
                    </div>
                    <div className="space-y-4">
                       <button className="w-full h-14 bg-[#800000] text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-[#800000]/20 flex items-center justify-center gap-3">
                          Registration Portal <ArrowRight size={18} />
                       </button>
                       <button className="w-full h-14 bg-[#001F3F] text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-[#001429] transition-all flex items-center justify-center gap-3">
                          Visit State Hub <Globe size={18} />
                       </button>
                    </div>
                    <p className="text-center text-[10px] font-medium text-slate-300 uppercase tracking-widest">Digital Audit v1.0.4 • Official Node</p>
                 </div>
              </div>
           </div>
        </section>

        {/* 6. PROFESSIONAL FOOTER (DENSE & CLEAN) */}
        <footer className="bg-white py-16 px-12 border-t border-slate-100">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
              <div className="flex items-center gap-8">
                 <div className="w-14 h-14 bg-[#001F3F] rounded-xl flex items-center justify-center text-white shadow-xl">
                    <Flag size={24} />
                 </div>
                 <div>
                    <h5 className="text-[#001F3F] font-black uppercase tracking-tighter text-lg leading-none">Ramanayapeta Secretariat</h5>
                    <p className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.4em] mt-1 italic">Building a legacy through transparent action.</p>
                 </div>
              </div>
              <div className="flex gap-12">
                 {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                    <Icon key={i} size={20} className="text-slate-200 hover:text-[#800000] cursor-pointer transition-colors" />
                 ))}
              </div>
           </div>
           <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">
              <div className="flex gap-8">
                 <span className="hover:text-[#800000] cursor-pointer transition-colors">Privacy Charter</span>
                 <span className="hover:text-[#800000] cursor-pointer transition-colors">Manifesto Hub</span>
                 <span className="hover:text-[#800000] cursor-pointer transition-colors">Global Admin</span>
              </div>
              <p>© 2024 Administrative Head Office Ramanayapeta</p>
           </div>
        </footer>
      </div>
    </PublicLayout>
  );
};

export default Redesign;
