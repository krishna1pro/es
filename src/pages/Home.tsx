/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RefreshCw, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  HomeSectionDocument,
  SiteSettingsDocument,
  PublicHomePagePayload,
  SectionType
} from "@/src/types/homeCms";

import PublicLayout from "@/src/components/layout/PublicLayout";
import SectionRenderer from "@/src/components/cms/SectionRenderer";
import MLAHero from "@/src/components/home/MLAHero";
import MLAStats from "@/src/components/home/MLAStats";
import AboutLeader from "@/src/components/home/AboutLeader";
import OurVision from "@/src/components/home/OurVision";
import LeadershipJourney from "@/src/components/home/LeadershipJourney";
import {
  DailyActivities,
  MonthlyActivities,
  YearlyReport
} from "@/src/components/home/ActivitiesGrid";
import ConstituencyDevelopment from "@/src/components/home/ConstituencyDevelopment";
import CommunityHero from "@/src/components/home/CommunityHero";
import { CadreCorner, PeopleVoiceGrid } from "@/src/components/home/CadreCorner";
import { MediaCenterRevamp, SocialMediaHub } from "@/src/components/home/MediaSocialHub";
import { UpcomingEvents, VolunteerContact } from "@/src/components/home/VolunteerContact";
import BrandedLoading from "@/src/components/BrandedLoading";
import { use10SecPublicPolling } from "@/src/hooks/use10SecPublicPolling";

export default function Home() {
  const { t } = useTranslation();
  const [sections, setSections] = useState<HomeSectionDocument[]>([]);
  const [settings, setSettings] = useState<SiteSettingsDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>("mongodb");
  const isMountedRef = useRef(true);

  const fetchHomeData = async (isBackground = false) => {
    try {
      if (!isBackground && sections.length === 0) {
        setLoading(true);
      }
      const res = await fetch("/api/public/home");
      if (!res.ok) {
        throw new Error(`Failed to load homepage data: ${res.status} ${res.statusText}`);
      }
      const data: PublicHomePagePayload = await res.json();
      if (!isMountedRef.current) return;
      if (data && data.sections) {
        setSections(data.sections.filter((s) => s.enabled !== false));
        if (data.settings) {
          setSettings(data.settings);
        }
        if (data.source) {
          setSource(data.source);
        }
        setError(null);
      } else {
        throw new Error("Invalid payload format received from server");
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      console.error("[Home] Error fetching public home payload:", err);
      if (sections.length === 0) {
        setError(err.message || "Failed to load home page content from MongoDB");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchHomeData(false);
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  use10SecPublicPolling(async (isBackground) => {
    if (isBackground) {
      await fetchHomeData(true);
    }
  });

  if (loading && sections.length === 0) {
    return (
      <PublicLayout settings={settings}>
        <BrandedLoading />
      </PublicLayout>
    );
  }

  if (error && sections.length === 0) {
    return (
      <PublicLayout settings={settings}>
        <div className="max-w-xl mx-auto my-24 p-8 bg-white border border-red-100 rounded-3xl shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
            Unable to connect to database
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
          <button
            onClick={() => fetchHomeData(false)}
            className="px-6 py-2.5 bg-blue-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-800 transition-all flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={14} /> Retry Connection
          </button>
        </div>
      </PublicLayout>
    );
  }

  // Lookup helper for active sections
  const getSection = (id: SectionType) => sections.find((s) => s.sectionId === id);

  const heroSec = getSection("hero");
  const statsSec = getSection("stats");
  const aboutSec = getSection("about_leader");
  const visionSec = getSection("our_vision");
  const journeySec = getSection("leadership_journey");
  const dailySec = getSection("daily_activities");
  const monthlySec = getSection("monthly_activities");
  const devSec = getSection("development_projects");
  const voiceSec = getSection("peoples_voice");
  const cadreSec = getSection("cadre_corner");
  const mediaSec = getSection("media_center");
  const socialSec = getSection("social_hub");
  const eventsSec = getSection("upcoming_events");
  const volunteerSec = getSection("volunteer_contact");

  // Keep track of which paired sections are rendered in grouped containers
  const pairedRenderedIds = new Set<string>();
  const isVisionJourneyPaired = Boolean(visionSec && journeySec);
  if (isVisionJourneyPaired) {
    pairedRenderedIds.add("our_vision");
    pairedRenderedIds.add("leadership_journey");
  }

  const isActivitiesPaired = Boolean(dailySec && monthlySec);
  if (isActivitiesPaired) {
    pairedRenderedIds.add("daily_activities");
    pairedRenderedIds.add("monthly_activities");
  }

  const isMediaPaired = Boolean(mediaSec && socialSec);
  if (isMediaPaired) {
    pairedRenderedIds.add("media_center");
    pairedRenderedIds.add("social_hub");
  }

  const isEventsPaired = Boolean(eventsSec && volunteerSec);
  if (isEventsPaired) {
    pairedRenderedIds.add("upcoming_events");
    pairedRenderedIds.add("volunteer_contact");
  }

  return (
    <PublicLayout settings={settings}>
      <div className="flex flex-col">
        {/* 1. Hero Banner */}
        {heroSec && <MLAHero data={heroSec.data} content={heroSec.data} />}

        {/* 2. Key Impact Statistics */}
        {statsSec && <MLAStats data={statsSec.data} content={statsSec.data} />}

        {/* 3. About Leader Profile */}
        {aboutSec && <AboutLeader data={aboutSec.data} content={aboutSec.data} />}

        {/* 4. Strategic Vision & Leadership Journey (Signature 1/3 + 2/3 Grid) */}
        {isVisionJourneyPaired ? (
          <section className="py-10 sm:py-20 bg-slate-50 relative overflow-hidden border-b border-slate-100">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-12">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 sm:mb-12 gap-4">
                <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tighter text-slate-900">
                  {visionSec?.title || t("sections.vision")}
                </h3>
                <Link
                  to="/vision"
                  className="text-[9px] sm:text-[10px] font-black text-blue-700 uppercase tracking-widest hover:underline flex items-center gap-2"
                >
                  {t("sections.visionCta")} <ArrowRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-1">
                  <OurVision data={visionSec?.data} />
                </div>
                <div className="lg:col-span-2">
                  <LeadershipJourney data={journeySec?.data} />
                </div>
              </div>
            </div>
          </section>
        ) : (
          <>
            {visionSec && !pairedRenderedIds.has("our_vision") && (
              <SectionRenderer section={visionSec} />
            )}
            {journeySec && !pairedRenderedIds.has("leadership_journey") && (
              <SectionRenderer section={journeySec} />
            )}
          </>
        )}

        {/* 5. Activities Grid (Daily Activities + Monthly Activities + Yearly Report) */}
        {isActivitiesPaired ? (
          <section className="py-10 sm:py-20 bg-white border-b border-slate-100">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-12 space-y-8 sm:space-y-12">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tighter text-slate-900">
                  {dailySec?.title || t("sections.activities")}
                </h3>
                <Link
                  to="/activities"
                  className="text-[9px] sm:text-[10px] font-black text-blue-700 uppercase tracking-widest hover:underline flex items-center gap-2"
                >
                  {t("sections.activitiesCta")} <ArrowRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <DailyActivities data={dailySec?.data} />
                <MonthlyActivities data={monthlySec?.data} />
                <YearlyReport />
              </div>
            </div>
          </section>
        ) : (
          <>
            {dailySec && !pairedRenderedIds.has("daily_activities") && (
              <SectionRenderer section={dailySec} />
            )}
            {monthlySec && !pairedRenderedIds.has("monthly_activities") && (
              <SectionRenderer section={monthlySec} />
            )}
          </>
        )}

        {/* 6. Constituency Development Projects */}
        {devSec && (
          <section className="py-10 sm:py-20 bg-white border-b border-slate-100">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-12 space-y-8 sm:space-y-12">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tighter text-slate-900">
                  {devSec.title || t("sections.development")}
                </h3>
                <Link
                  to="/development"
                  className="text-[9px] sm:text-[10px] font-black text-blue-700 uppercase tracking-widest hover:underline flex items-center gap-2"
                >
                  {t("sections.developmentCta")} <ArrowRight size={14} />
                </Link>
              </div>
              <ConstituencyDevelopment data={devSec.data} />
            </div>
          </section>
        )}

        {/* 7. Democracy & Dialogue / People's Voice */}
        {voiceSec && <CommunityHero data={voiceSec.data} content={voiceSec.data} />}

        {/* 8. Cadre Corner */}
        {cadreSec && (
          <section className="py-10 sm:py-20 bg-slate-50 border-b border-slate-100">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <CadreCorner data={cadreSec.data} />
              <PeopleVoiceGrid />
            </div>
          </section>
        )}

        {/* 9. Media Center & Social Media Hub */}
        {isMediaPaired ? (
          <section className="py-10 sm:py-20 bg-white border-b border-slate-100">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-12 space-y-8 sm:space-y-12">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tighter text-slate-900">
                  {mediaSec?.title || t("sections.media")}
                </h3>
                <Link
                  to="/media-center"
                  className="text-[9px] sm:text-[10px] font-black text-blue-700 uppercase tracking-widest hover:underline flex items-center gap-2"
                >
                  {t("sections.viewArchive")} <ArrowRight size={14} />
                </Link>
              </div>
              <MediaCenterRevamp data={mediaSec?.data} />
              <SocialMediaHub data={socialSec?.data} />
            </div>
          </section>
        ) : (
          <>
            {mediaSec && !pairedRenderedIds.has("media_center") && (
              <SectionRenderer section={mediaSec} />
            )}
            {socialSec && !pairedRenderedIds.has("social_hub") && (
              <SectionRenderer section={socialSec} />
            )}
          </>
        )}

        {/* 10. Upcoming Events & Volunteer Contact (Signature 1/3 + 2/3 Grid) */}
        {isEventsPaired ? (
          <section className="py-20 bg-slate-50">
            <div className="max-w-[1400px] mx-auto px-6 sm:px-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1">
                <UpcomingEvents data={eventsSec?.data} />
              </div>
              <div className="lg:col-span-2">
                <VolunteerContact data={volunteerSec?.data} />
              </div>
            </div>
          </section>
        ) : (
          <>
            {eventsSec && !pairedRenderedIds.has("upcoming_events") && (
              <SectionRenderer section={eventsSec} />
            )}
            {volunteerSec && !pairedRenderedIds.has("volunteer_contact") && (
              <SectionRenderer section={volunteerSec} />
            )}
          </>
        )}
      </div>
    </PublicLayout>
  );
}
