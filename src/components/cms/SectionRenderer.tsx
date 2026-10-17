/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HomeSectionDocument } from "@/src/types/homeCms";

import MLAHero from "../home/MLAHero";
import MLAStats from "../home/MLAStats";
import AboutLeader from "../home/AboutLeader";
import OurVision from "../home/OurVision";
import LeadershipJourney from "../home/LeadershipJourney";
import { DailyActivities, MonthlyActivities, YearlyReport } from "../home/ActivitiesGrid";
import ConstituencyDevelopment from "../home/ConstituencyDevelopment";
import { CadreCorner, PeopleVoiceGrid } from "../home/CadreCorner";
import CommunityHero from "../home/CommunityHero";
import { MediaCenterRevamp, SocialMediaHub } from "../home/MediaSocialHub";
import { UpcomingEvents, VolunteerContact } from "../home/VolunteerContact";

interface SectionRendererProps {
  section: HomeSectionDocument | any;
}

export default function SectionRenderer({ section }: SectionRendererProps) {
  const { t } = useTranslation();
  // Support both sectionId and legacy type
  const type = section.sectionId || section.type;
  const data = section.data || section.content || {};

  switch (type) {
    case "hero":
      return <MLAHero data={data} content={data} />;

    case "stats":
      return <MLAStats data={data} content={data} />;

    case "about_leader":
      return <AboutLeader data={data} content={data} />;

    case "our_vision":
      return (
        <section className="py-10 sm:py-16 bg-slate-50 border-b border-slate-100">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 sm:mb-12 gap-4">
              <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tighter text-slate-900">
                {section.title || t("sections.vision")}
              </h3>
              <Link
                to="/vision"
                className="text-[9px] sm:text-[10px] font-black text-blue-700 uppercase tracking-widest hover:underline flex items-center gap-2"
              >
                {t("sections.visionCta")} <ArrowRight size={14} />
              </Link>
            </div>
            <OurVision data={data} />
          </div>
        </section>
      );

    case "leadership_journey":
      return (
        <section className="py-10 sm:py-16 bg-white border-b border-slate-100">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
              <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tighter text-slate-900">
                {section.title || "Leadership Journey"}
              </h3>
              <Link
                to="/vision"
                className="text-[9px] sm:text-[10px] font-black text-blue-700 uppercase tracking-widest hover:underline flex items-center gap-2"
              >
                Explore Journey <ArrowRight size={14} />
              </Link>
            </div>
            <LeadershipJourney data={data} />
          </div>
        </section>
      );

    case "daily_activities":
      return (
        <section className="py-10 sm:py-16 bg-white border-b border-slate-100">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 sm:mb-12 gap-4">
              <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tighter text-slate-900">
                {section.title || t("sections.activities")}
              </h3>
              <Link
                to="/activities"
                className="text-[9px] sm:text-[10px] font-black text-blue-700 uppercase tracking-widest hover:underline flex items-center gap-2"
              >
                {t("sections.activitiesCta")} <ArrowRight size={14} />
              </Link>
            </div>
            <DailyActivities data={data} />
          </div>
        </section>
      );

    case "monthly_activities":
      return (
        <section className="py-10 sm:py-16 bg-slate-50 border-b border-slate-100">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <MonthlyActivities data={data} />
            <YearlyReport />
          </div>
        </section>
      );

    case "development_projects":
      return (
        <section className="py-10 sm:py-20 bg-white border-b border-slate-100">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-12 space-y-8 sm:space-y-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tighter text-slate-900">
                {section.title || t("sections.development")}
              </h3>
              <Link
                to="/development"
                className="text-[9px] sm:text-[10px] font-black text-blue-700 uppercase tracking-widest hover:underline flex items-center gap-2"
              >
                {t("sections.developmentCta")} <ArrowRight size={14} />
              </Link>
            </div>
            <ConstituencyDevelopment data={data} />
          </div>
        </section>
      );

    case "peoples_voice":
      return <CommunityHero data={data} content={data} />;

    case "cadre_corner":
      return (
        <section className="py-10 sm:py-16 bg-slate-50 border-b border-slate-100">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CadreCorner data={data} />
            <PeopleVoiceGrid />
          </div>
        </section>
      );

    case "media_center":
      return (
        <section className="py-10 sm:py-20 bg-white border-b border-slate-100">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-12 space-y-8 sm:space-y-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tighter text-slate-900">
                {section.title || t("sections.media")}
              </h3>
              <Link
                to="/media-center"
                className="text-[9px] sm:text-[10px] font-black text-blue-700 uppercase tracking-widest hover:underline flex items-center gap-2"
              >
                {t("sections.viewArchive")} <ArrowRight size={14} />
              </Link>
            </div>
            <MediaCenterRevamp data={data} />
          </div>
        </section>
      );

    case "social_hub":
      return (
        <section className="py-10 sm:py-16 bg-slate-50 border-b border-slate-100">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-12">
            <SocialMediaHub data={data} />
          </div>
        </section>
      );

    case "upcoming_events":
      return (
        <section className="py-10 sm:py-16 bg-white border-b border-slate-100">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-12">
            <UpcomingEvents data={data} />
          </div>
        </section>
      );

    case "volunteer_contact":
      return (
        <section className="py-10 sm:py-20 bg-slate-50 border-b border-slate-100">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-12">
            <VolunteerContact data={data} />
          </div>
        </section>
      );

    default:
      return (
        <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 mx-8 rounded-2xl my-4">
          Section [{type}] data loaded
        </div>
      );
  }
}
