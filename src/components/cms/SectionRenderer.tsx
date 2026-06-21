import React from "react";
import { CMSSection } from "@/src/types";
import { motion } from "motion/react";
import { ArrowRight, Users, Map, BookOpen, Flag, CheckCircle, Clock, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

interface SectionRendererProps {
  section: CMSSection;
}

const IconMap: Record<string, any> = {
  Users,
  Map,
  BookOpen,
  Flag,
  CheckCircle,
  Clock,
  Calendar
};

import MLAHero from "../home/MLAHero";
import MLAStats from "../home/MLAStats";
import LeadershipJourney from "../home/LeadershipJourney";
import OurVision from "../home/OurVision";
import CommunityHero from "../home/CommunityHero";
import { DailyActivities, MonthlyActivities, YearlyReport } from "../home/ActivitiesGrid";
import ConstituencyDevelopment from "../home/ConstituencyDevelopment";
import { CadreCorner, PeopleVoiceGrid } from "../home/CadreCorner";
import { MediaCenterRevamp, SocialMediaHub } from "../home/MediaSocialHub";
import { UpcomingEvents, VolunteerContact } from "../home/VolunteerContact";

import { useTranslation } from "react-i18next";

export default function SectionRenderer({ section }: SectionRendererProps) {
  const { t } = useTranslation();
  const { type, content } = section;

  switch (type) {
    case "hero":
      return <MLAHero content={content} />;

    case "stats":
      return <MLAStats content={content} />;

    case "about_leader":
      return (
        <section className="py-12 bg-white border-b border-slate-50">
          <div className="max-w-[1200px] mx-auto px-6 sm:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}>
              <div className="relative group max-w-sm mx-auto lg:mx-0">
                 <div className="absolute -inset-2 bg-blue-50 rounded-[2rem] -z-10 group-hover:scale-105 transition-transform" />
                 <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800" className="w-full h-[400px] object-cover rounded-[1.8rem] shadow-xl border-2 border-white grayscale hover:grayscale-0 transition-all duration-700" alt="MLA" />
              </div>
            </motion.div>
            <div className="space-y-6">
              <h2 className="text-lg font-black uppercase tracking-widest text-blue-900 flex items-center gap-3">
                <Users size={20} className="text-blue-600" /> {t('leader.title')}
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                {[
                  { key: 'academic', label: t('leader.academic') },
                  { key: 'grassroots', label: t('leader.grassroots') },
                  { key: 'social', label: t('leader.social') },
                  { key: 'party', label: t('leader.party') },
                  { key: 'constituency', label: t('leader.constituency') },
                  { key: 'committed', label: t('leader.committed') }
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 group">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full group-hover:scale-150 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-blue-900 transition-colors">{item.label}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4">
                <Link to="/about" className="inline-block px-8 py-3 bg-blue-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-800 transition-all shadow-lg active:scale-95">
                  {t('leader.cta')}
                </Link>
              </div>
            </div>
          </div>
        </section>
      );

    case "leadership_journey":
      return (
        <section className="py-10 sm:py-20 bg-slate-50 relative overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 sm:mb-12 gap-4">
               <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tighter text-slate-900">{t('sections.vision')}</h3>
               <Link to="/vision" className="text-[9px] sm:text-[10px] font-black text-blue-700 uppercase tracking-widest hover:underline flex items-center gap-2">
                  {t('sections.visionCta')} <ArrowRight size={14} />
               </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
               <div className="lg:col-span-1">
                 <OurVision />
               </div>
               <div className="lg:col-span-2">
                 <LeadershipJourney />
               </div>
            </div>
          </div>
        </section>
      );

    case "daily_activities":
      return (
        <section className="py-10 sm:py-20 bg-white">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-12 space-y-8 sm:space-y-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
               <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tighter text-slate-900">{t('sections.activities')}</h3>
               <Link to="/activities" className="text-[9px] sm:text-[10px] font-black text-blue-700 uppercase tracking-widest hover:underline flex items-center gap-2">
                  {t('sections.activitiesCta')} <ArrowRight size={14} />
               </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <DailyActivities />
              <MonthlyActivities />
              <YearlyReport />
            </div>
          </div>
        </section>
      );

    case "development_projects":
      return (
        <section className="py-10 sm:py-20 bg-white">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-12 space-y-8 sm:space-y-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
               <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tighter text-slate-900">{t('sections.development')}</h3>
               <Link to="/development" className="text-[9px] sm:text-[10px] font-black text-blue-700 uppercase tracking-widest hover:underline flex items-center gap-2">
                  {t('sections.developmentCta')} <ArrowRight size={14} />
               </Link>
            </div>
            <ConstituencyDevelopment />
          </div>
        </section>
      );

    case "peoples_voice":
      return <CommunityHero content={content} />;

    case "media_center":
      return (
        <section className="py-10 sm:py-20 bg-white">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-12 space-y-8 sm:space-y-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
               <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tighter text-slate-900">{t('sections.media')}</h3>
               <Link to="/media-center" className="text-[9px] sm:text-[10px] font-black text-blue-700 uppercase tracking-widest hover:underline flex items-center gap-2">
                  {t('sections.viewArchive')} <ArrowRight size={14} />
               </Link>
            </div>
            <MediaCenterRevamp />
            <SocialMediaHub />
          </div>
        </section>
      );


    case "upcoming_events":
      return (
        <section className="py-20 bg-slate-50">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
             <div className="lg:col-span-1">
               <UpcomingEvents />
             </div>
             <div className="lg:col-span-2">
               <VolunteerContact />
             </div>
          </div>
        </section>
      );

    default:
      return <div className="py-20 text-center text-slate-400 border-2 border-dashed border-slate-100 mx-8 rounded-2xl">Section type [{type}] not implemented</div>;
  }
}
