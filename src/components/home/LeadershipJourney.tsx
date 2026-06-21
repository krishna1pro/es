import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Star } from "lucide-react";

const JOURNEY_DATA = [
  {
    year: "1992",
    title: "Youth Welfare Movement",
    desc: "The journey began with a simple gathering of admirers transformed into a powerful social service movement. Dedicated to grassroots community support and identifying local needs.",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800"
  },
  {
    year: "2001",
    title: "Civil Service Organization",
    desc: "Evolving into a structured service organization. This phase focused on formal grievance redressal systems and systematic welfare distribution across the constituency.",
    image: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=800"
  },
  {
    year: "2009",
    title: "People's Movement",
    desc: "A true testament to leadership, the movement gained political momentum, advocating for transparent governance and sustainable rural infrastructure development.",
    image: "https://images.unsplash.com/photo-1524178232363-1fb28f74b0cd?auto=format&fit=crop&q=80&w=800"
  },
  {
    year: "2016",
    title: "Legislative Vision",
    desc: "Proposed the 'Integrated Village Growth' model which became a benchmark for development. Focused on primary education and digital empowerment for rural youth.",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800"
  },
  {
    year: "2024",
    title: "Constituency Transformation",
    desc: "Currently leading the charge in Ramanayapeta with state-of-the-art infrastructure projects, digital public libraries, and direct citizen link portals.",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800"
  }
];

const COLORS = {
  primary: "#1e40af", // Blue for progress/line
  accent: "#10b981",  // Green for CTA/Headers
};

export default function LeadershipJourney() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeEvent = JOURNEY_DATA[activeIndex];

  const nextStep = () => {
    setActiveIndex((prev) => (prev + 1) % JOURNEY_DATA.length);
  };

  return (
    <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-100 shadow-sm h-full flex flex-col relative overflow-hidden group">
      {/* Background Year Accent */}
      <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 select-none pointer-events-none opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-700">
        <span className="text-[12rem] font-bold" style={{ color: COLORS.primary }}>{activeEvent.year}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Our Journey</h3>
        
        {/* Year Badge Button */}
        <button 
          onClick={nextStep}
          className="flex items-center gap-2 px-3 py-1.5 text-white rounded-lg text-[10px] font-bold hover:brightness-110 active:scale-95 transition-all shadow-md"
          style={{ backgroundColor: COLORS.accent }}
        >
          {activeEvent.year} <ChevronRight size={12} strokeWidth={3} />
        </button>
      </div>

      {/* Interactive Timeline Line */}
      <div className="relative h-1 bg-slate-100 rounded-full mb-10 mx-2">
        <div 
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ 
            width: `${((activeIndex + 1) / JOURNEY_DATA.length) * 100}%`,
            backgroundColor: COLORS.primary,
            boxShadow: `0 0 10px ${COLORS.primary}4d`
          }}
        />
        <div className="absolute inset-0 flex justify-between items-center -mt-[1.5px]">
          {JOURNEY_DATA.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className="w-3 h-3 rounded-full border-2 transition-all duration-300"
              style={{
                backgroundColor: i <= activeIndex ? COLORS.primary : "white",
                borderColor: i <= activeIndex ? COLORS.primary : "#cbd5e1",
                transform: i === activeIndex ? "scale(1.25)" : "scale(1)"
              }}
            />
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="relative flex-grow flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h4 className="text-xl font-black tracking-tight uppercase leading-tight italic" style={{ color: COLORS.accent }}>
                {activeEvent.title}
              </h4>
              <p className="text-slate-500 text-xs leading-relaxed font-medium line-clamp-4 italic">
                "{activeEvent.desc}"
              </p>
            </div>

            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg border border-slate-100">
              <img 
                src={activeEvent.image} 
                className="w-full h-full object-cover" 
                alt={activeEvent.title} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              
              {/* Year Label Overlay */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1 bg-white/90 backdrop-blur shadow-sm rounded-full">
                <Star size={10} className="text-[#D4AF37] fill-[#D4AF37]" />
                <span className="text-[10px] font-black text-[#001F3F]">{activeEvent.year} Milestone</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Large Year in Background (Bottom Right) */}
      <div className="absolute bottom-6 right-6 pointer-events-none">
        <motion.span 
          key={activeEvent.year}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          className="text-8xl font-black text-[#001F3F] font-display"
        >
          {activeEvent.year}
        </motion.span>
      </div>
    </div>
  );
}
