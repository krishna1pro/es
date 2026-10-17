/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { HeroSectionData } from "@/src/types/homeCms";
import HomeIcon from "./HomeIcon";

interface MLAHeroProps {
  content?: any;
  data?: HeroSectionData;
}

export default function MLAHero({ content, data: propData }: MLAHeroProps) {
  const { t } = useTranslation();
  // Extract data from props or content payload
  const heroData: HeroSectionData = propData || (content?.title ? content : content?.data) || {};

  const title = heroData.title || "PEOPLE FIRST";
  const subtitle = heroData.subtitle || "DEVELOPMENT ALWAYS";
  const leaderTitle = heroData.leaderTitle || "An Educated | Energetic | Hardworking Leader";
  const subtext = heroData.subtext || "Working for the People, With the People";
  const leaderPhotoUrl =
    heroData.leaderPhotoUrl ||
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=1200";

  const activitiesCtaText = heroData.activitiesCtaText || t("hero.latestActivities");
  const activitiesCtaLink = heroData.activitiesCtaLink || "/activities";
  const publicVoiceCtaText = heroData.publicVoiceCtaText || t("hero.peoplesVoice");
  const publicVoiceCtaLink = heroData.publicVoiceCtaLink || "/public-voice";

  const socialFollowText = heroData.socialFollowText || "Follow us on";
  const socialPlatforms = heroData.socialPlatforms || [
    { name: "youtube", url: "https://youtube.com" },
    { name: "facebook", url: "https://facebook.com" },
    { name: "instagram", url: "https://instagram.com" },
    { name: "twitter", url: "https://twitter.com" },
    { name: "whatsapp", url: "https://whatsapp.com" }
  ];

  const highlightsCardTitle = heroData.highlightsCardTitle || t("hero.todayHighlights");
  const highlightsItems = heroData.highlightsItems || [
    { id: "h1", icon: "MapPin", text: "3 Village Visits", sub: "Ramanayapeta" },
    { id: "h2", icon: "Users", text: "2 Public Meetings", sub: "Mandal Center" },
    { id: "h3", icon: "Clock", text: "Review Meeting", sub: "Evening 5 PM" }
  ];
  const fullScheduleCtaText = heroData.fullScheduleCtaText || t("hero.fullSchedule");
  const fullScheduleCtaLink = heroData.fullScheduleCtaLink || "/activities";

  // Split title if it has multiple words for distinctive styling
  const titleWords = title.split(" ");
  const firstWord = titleWords[0] || "PEOPLE";
  const remainingWords = titleWords.slice(1).join(" ") || "FIRST";

  return (
    <section className="relative bg-white pt-6 pb-10 sm:pt-8 sm:pb-16 overflow-hidden border-b border-slate-100">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-50/30 -skew-x-12 transform translate-x-1/2 -z-10 hidden lg:block" />

      <div className="max-w-[1400px] mx-auto px-6 sm:px-12 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
        {/* Left Content */}
        <div className="w-full lg:flex-1 space-y-8 z-10 text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-3xl xs:text-5xl sm:text-6xl lg:text-8xl font-black tracking-tighter text-slate-900 leading-[0.85]">
              {firstWord}{" "}
              <span className="text-blue-700 underline decoration-[8px] sm:decoration-[14px] underline-offset-[2px]">
                {remainingWords}
              </span>
              <br />
              <span className="text-green-600">{subtitle}</span>
            </h2>
            <div className="space-y-1">
              <p className="text-xl sm:text-2xl font-bold text-slate-500 leading-tight">
                {leaderTitle}
              </p>
              <p className="text-lg sm:text-xl font-bold text-blue-900/60 leading-tight">
                {subtext}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-4"
          >
            <Link
              to={activitiesCtaLink}
              className="px-10 py-5 bg-blue-800 text-white text-[12px] font-black uppercase tracking-widest rounded-md shadow-2xl hover:bg-blue-900 transition-all active:scale-95"
            >
              {activitiesCtaText}
            </Link>
            <Link
              to={publicVoiceCtaLink}
              className="px-10 py-5 bg-green-600 text-white text-[12px] font-black uppercase tracking-widest rounded-md shadow-2xl hover:bg-green-700 transition-all active:scale-95"
            >
              {publicVoiceCtaText}
            </Link>
          </motion.div>

          {/* Social Links Small */}
          <div className="flex items-center gap-6 pt-4">
            <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">
              {socialFollowText}
            </span>
            <div className="flex gap-3">
              {socialPlatforms.map((s, idx) => (
                <a
                  key={s.name + idx}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-slate-100/80 flex items-center justify-center text-slate-400 hover:bg-blue-700 hover:text-white transition-all shadow-sm"
                  title={s.name}
                >
                  <HomeIcon name={s.name} size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Leader Photo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="lg:flex-1 relative hidden lg:block"
        >
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white via-white/80 to-transparent z-10" />
          <img
            src={leaderPhotoUrl}
            alt="Leader"
            className="w-full h-auto object-contain max-h-[600px] relative z-0"
          />
        </motion.div>

        {/* Right: Highlights Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full lg:w-[380px] z-20"
        >
          <div className="bg-[#002B5B] text-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 sm:px-8 sm:py-6 bg-[#001D3D] flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <Calendar className="text-white/40 w-4 h-4 sm:w-5 sm:h-5" />
                <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/90">
                  {highlightsCardTitle}
                </h3>
              </div>
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            </div>
            <div className="p-5 sm:p-8 space-y-5 sm:space-y-8">
              {highlightsItems.map((item, i) => (
                <div key={item.id || i} className="flex gap-4 sm:gap-5 group cursor-pointer">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-blue-600 transition-colors">
                    <HomeIcon
                      name={item.icon}
                      className="text-white/40 group-hover:text-white w-3.5 h-3.5 sm:w-4 sm:h-4"
                    />
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-[10px] sm:text-[12px] font-black uppercase tracking-tight text-white/90 group-hover:text-white transition-colors">
                      {item.text}
                    </p>
                    <p className="text-[8px] sm:text-[10px] font-medium text-white/30 uppercase tracking-widest">
                      {item.sub}
                    </p>
                  </div>
                </div>
              ))}

              <Link
                to={fullScheduleCtaLink}
                className="block text-center w-full py-3 sm:py-4 bg-white/5 hover:bg-white/10 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/60 border border-white/10 rounded-xl transition-all mt-2 sm:mt-4"
              >
                {fullScheduleCtaText}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
