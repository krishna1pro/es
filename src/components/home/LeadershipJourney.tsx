/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { LeadershipJourneySectionData, JourneyMilestone } from "@/src/types/homeCms";

const COLORS = {
  primary: "#1e40af", // Blue for progress/line
  accent: "#10b981"  // Green for CTA/Headers
};

interface LeadershipJourneyProps {
  content?: any;
  data?: LeadershipJourneySectionData;
}

export default function LeadershipJourney({ content, data: propData }: LeadershipJourneyProps) {
  const journeyData: LeadershipJourneySectionData =
    propData || (content?.milestones ? content : content?.data) || {};

  const title = journeyData.title || "Our Journey";
  const viewAllText = journeyData.viewAllText || "Explore Implementation";
  const viewAllLink = journeyData.viewAllLink || "/vision";

  const defaultMilestones: JourneyMilestone[] = [
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

  const milestones =
    journeyData.milestones && journeyData.milestones.length > 0
      ? journeyData.milestones
      : defaultMilestones;

  const [activeIndex, setActiveIndex] = useState(0);
  const activeEvent = milestones[activeIndex] || milestones[0];

  const nextStep = () => {
    setActiveIndex((prev) => (prev + 1) % milestones.length);
  };

  return (
    <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-100 shadow-sm h-full flex flex-col relative overflow-hidden group">
      {/* Background Year Accent */}
      <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 select-none pointer-events-none opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-700">
        <span className="text-[12rem] font-bold" style={{ color: COLORS.primary }}>
          {activeEvent.year}
        </span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          {title}
        </h3>

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
            width: `${((activeIndex + 1) / milestones.length) * 100}%`,
            backgroundColor: COLORS.primary,
            boxShadow: `0 0 10px ${COLORS.primary}4d`
          }}
        />
        <div className="absolute inset-0 flex justify-between items-center -mt-[1.5px]">
          {milestones.map((_, i) => (
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
            key={activeEvent.year}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col md:flex-row gap-6 items-center flex-grow"
          >
            <div className="w-full md:w-1/2 space-y-4 text-left">
              <span
                className="text-xs font-black px-2.5 py-1 rounded-md text-white inline-block"
                style={{ backgroundColor: COLORS.primary }}
              >
                {activeEvent.year}
              </span>
              <h4 className="text-xl font-black text-slate-900 tracking-tight">
                {activeEvent.title}
              </h4>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                {activeEvent.desc}
              </p>
              <div className="pt-2">
                <Link
                  to={viewAllLink}
                  className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-700 hover:underline"
                >
                  {viewAllText} <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            <div className="w-full md:w-1/2 h-48 md:h-56 rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
              <img
                src={activeEvent.image}
                alt={activeEvent.title}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
