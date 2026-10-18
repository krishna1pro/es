/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { AlertCircle, RefreshCw } from "lucide-react";

import PublicLayout from "@/src/components/layout/PublicLayout";
import BrandedLoading from "@/src/components/BrandedLoading";
import MLAHero from "@/src/components/home/MLAHero";
import MLAStats from "@/src/components/home/MLAStats";
import AboutLeader from "@/src/components/home/AboutLeader";
import OurVision from "@/src/components/home/OurVision";
import LeadershipJourney from "@/src/components/home/LeadershipJourney";
import { DailyActivities, MonthlyActivities, YearlyReport } from "@/src/components/home/ActivitiesGrid";
import ConstituencyDevelopment from "@/src/components/home/ConstituencyDevelopment";
import { CadreCorner, PeopleVoiceGrid as PeoplesVoice } from "@/src/components/home/CadreCorner";
import { MediaCenterRevamp, SocialMediaHub as SocialHub } from "@/src/components/home/MediaSocialHub";
import { UpcomingEvents, VolunteerContact } from "@/src/components/home/VolunteerContact";

import { HomeSectionDocument, SiteSettingsDocument, PublicHomePagePayload } from "@/src/types/homeCms";

// In-memory cache for public homepage payload (5-minute TTL)
let cachedHomePayload: PublicHomePagePayload | null = null;
let homeCacheTimestamp = 0;
const HOME_CACHE_TTL = 5 * 60 * 1000;

export default function Home() {
  const { t } = useTranslation();
  const [sections, setSections] = useState<HomeSectionDocument[]>(cachedHomePayload?.sections || []);
  const [settings, setSettings] = useState<SiteSettingsDocument | null>(cachedHomePayload?.settings || null);
  const [loading, setLoading] = useState(!cachedHomePayload);
  const [error, setError] = useState<string | null>(null);

  // Check if session storage marks this as not the first visit
  const [isFirstVisit, setIsFirstVisit] = useState(() => {
    if (typeof window === "undefined") return true;
    const visited = sessionStorage.getItem("ar_visited");
    if (!visited) {
      sessionStorage.setItem("ar_visited", "true");
      return true;
    }
    return false;
  });

  const fetchHomeData = async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && cachedHomePayload && now - homeCacheTimestamp < HOME_CACHE_TTL) {
      setSections(cachedHomePayload.sections.filter((s) => s.enabled !== false));
      if (cachedHomePayload.settings) setSettings(cachedHomePayload.settings);
      setLoading(false);
      return;
    }

    try {
      if (sections.length === 0) setLoading(true);
      setError(null);
      const res = await fetch("/api/public/home");
      if (!res.ok) {
        throw new Error(`Failed to load homepage data: ${res.status} ${res.statusText}`);
      }
      const data: PublicHomePagePayload = await res.json();
      if (data && data.sections) {
        cachedHomePayload = data;
        homeCacheTimestamp = Date.now();
        setSections(data.sections.filter((s) => s.enabled !== false));
        if (data.settings) {
          setSettings(data.settings);
        }
      } else {
        throw new Error("Invalid payload format received from server");
      }
    } catch (err: any) {
      console.error("[Home] Error fetching public home payload:", err);
      if (sections.length === 0) {
        setError(err.message || "Failed to load home page content");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  if (loading && sections.length === 0) {
    return (
      <PublicLayout settings={settings}>
        <BrandedLoading message="Namaste — Mee Chintada Ravi Kumar" isFirstVisit={isFirstVisit} />
      </PublicLayout>
    );
  }

  if (error && sections.length === 0) {
    return (
      <PublicLayout settings={settings}>
        <div className="max-w-xl mx-auto my-24 p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
            <AlertCircle size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Temporary Connection Notice
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              We are connecting to the constituency servers. Please try refreshing.
            </p>
          </div>
          <button
            onClick={() => fetchHomeData(true)}
            className="px-6 py-3.5 bg-blue-900 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg hover:bg-blue-800 transition-all inline-flex items-center gap-2"
          >
            <RefreshCw size={14} /> Retry Connection
          </button>
        </div>
      </PublicLayout>
    );
  }

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "hero":
        return <MLAHero key={sectionId} />;
      case "stats":
        return <MLAStats key={sectionId} />;
      case "about_leader":
        return <AboutLeader key={sectionId} />;
      case "our_vision":
        return <OurVision key={sectionId} />;
      case "leadership_journey":
        return <LeadershipJourney key={sectionId} />;
      case "daily_activities":
        return <DailyActivities key={sectionId} />;
      case "monthly_activities":
        return <MonthlyActivities key={sectionId} />;
      case "yearly_report":
        return <YearlyReport key={sectionId} />;
      case "development_projects":
        return <ConstituencyDevelopment key={sectionId} />;
      case "peoples_voice":
        return <PeoplesVoice key={sectionId} />;
      case "cadre_corner":
        return <CadreCorner key={sectionId} />;
      case "media_center":
        return <MediaCenterRevamp key={sectionId} />;
      case "social_hub":
        return <SocialHub key={sectionId} />;
      case "upcoming_events":
        return <UpcomingEvents key={sectionId} />;
      case "volunteer_contact":
        return <VolunteerContact key={sectionId} />;
      default:
        return null;
    }
  };

  return (
    <PublicLayout settings={settings}>
      {loading && sections.length > 0 && (
        <div className="bg-blue-900 text-white py-2 px-4 text-center text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Updating Latest Constituency Data...
        </div>
      )}
      <div className="flex flex-col">
        {sections.map((sec) => renderSection(sec.sectionId))}
      </div>
    </PublicLayout>
  );
}
