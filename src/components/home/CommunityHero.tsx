import React from "react";
import { motion } from "motion/react";
import { 
  Users, 
  UserCheck, 
  GraduationCap, 
  Venus, 
  ShieldAlert, 
  Heart, 
  Activity,
  Search,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { COLORS } from "@/src/types";

interface CommunityHeroProps {
  content?: {
    bgImage?: string;
    leaderImage?: string;
    headline?: string;
    description?: string;
  };
}

export default function CommunityHero({ content }: CommunityHeroProps) {
  const { t } = useTranslation();

  const bgImage = content?.bgImage || "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=2000";
  const leaderImage = content?.leaderImage || "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=1000";
  const headline = content?.headline || "Democracy & Dialogue";
  const description = content?.description || "Everyone deserves to be heard. We are building a people-centric governance model where every voice matters. Be a part of the change and make your contribution count.";

  const cadreWings = [
    { label: "Student Wing", icon: GraduationCap },
    { label: "Youth Wing", icon: Users },
    { label: "Women Wing", icon: Venus },
    { label: "Minority Wing", icon: Heart }
  ];

  const peopleItems = [
    { icon: ShieldAlert, label: "Submit Grievance" },
    { icon: Activity, label: "Give Suggestions" },
    { icon: UserCheck, label: "Success Stories" },
    { icon: Search, label: "Track Your Request" },
  ];

  return (
    <section className="relative min-h-[400px] flex items-start lg:items-center overflow-hidden bg-slate-900 text-left py-6 lg:py-10">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={bgImage} 
          alt="Background"
          className="w-full h-full object-cover opacity-20 mix-blend-overlay scale-105 group-hover:scale-100 transition-transform duration-[20s]"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900 to-transparent"></div>
      </div>
      
      <div className="container mx-auto px-4 md:px-12 relative z-10 flex flex-col lg:flex-row items-stretch min-h-auto">
        
        {/* Left Part: Entirely for Image */}
        <div className="lg:w-1/2 relative flex items-start justify-center pt-4 lg:pt-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative h-full w-full flex items-start justify-center -mt-6 lg:-mt-12"
          >
            <img 
              src={leaderImage} 
              alt="Leader"
              className="max-h-[75vh] w-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform -scale-x-100 lg:scale-x-100"
            />
            {/* Outline Effect or Subtle Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none"></div>
          </motion.div>
        </div>

        {/* Right Part: Text and Cards */}
        <div className="lg:w-1/2 flex flex-col justify-start py-4 lg:pl-12">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-4 lg:space-y-5"
          >
            {/* Heading Section */}
            <div className="space-y-2 lg:space-y-3">
              <div className="inline-block px-4 py-1 rounded-lg bg-blue-600/10 border border-blue-500/20">
                <span className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em]">Governance & Reach</span>
              </div>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-tight italic">
                {headline}
              </h2>
              <p className="text-slate-300 text-[11px] lg:text-xs font-medium leading-relaxed italic max-w-xl border-l-2 border-emerald-500 pl-4 py-1 opacity-90">
                "{description}"
              </p>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 pt-2">
              
              {/* People's Voice Card */}
              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white p-6 lg:p-7 rounded-2xl shadow-2xl transition-all duration-300 border border-slate-100 flex flex-col"
              >
                <div className="flex justify-between items-center mb-4 lg:mb-5">
                  <h3 className="text-xl lg:text-2xl font-black text-slate-900 uppercase tracking-tighter">
                    People's Voice
                  </h3>
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                    <Heart size={18} fill="currentColor" />
                  </div>
                </div>
                
                <ul className="space-y-2 mb-6 lg:mb-8">
                  {peopleItems.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-600 group/item cursor-default">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 group-hover/item:scale-150 transition-transform"></div>
                      <span className="text-[10px] lg:text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
                    </li>
                  ))}
                </ul>
                
                <Link 
                  to="/public-voice" 
                  className="w-full py-3.5 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg mt-auto"
                >
                  Raise Voice <ArrowRight size={14} />
                </Link>
              </motion.div>

              {/* Cadre Corner Card */}
              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-slate-50 p-6 lg:p-7 rounded-2xl shadow-2xl transition-all duration-300 border border-slate-200 flex flex-col"
              >
                <div className="flex justify-between items-center mb-4 lg:mb-5">
                  <h3 className="text-xl lg:text-2xl font-black text-slate-900 uppercase tracking-tighter">
                    Cadre Wing
                  </h3>
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <Users size={18} fill="currentColor" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-6 lg:mb-8">
                  {cadreWings.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200">
                      <item.icon size={12} className="text-emerald-600 shrink-0" />
                      <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-tight text-slate-800 truncate">{item.label}</span>
                    </div>
                  ))}
                </div>
                
                <Link 
                  to="/cadre-corner" 
                  className="w-full py-3.5 bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg mt-auto"
                >
                  Join Us <ArrowRight size={14} />
                </Link>
              </motion.div>

            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
