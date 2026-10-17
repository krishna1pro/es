/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SectionType =
  | "hero"
  | "stats"
  | "about_leader"
  | "our_vision"
  | "leadership_journey"
  | "daily_activities"
  | "monthly_activities"
  | "yearly_report"
  | "development_projects"
  | "peoples_voice"
  | "cadre_corner"
  | "media_center"
  | "social_hub"
  | "upcoming_events"
  | "volunteer_contact"
  | "about_page"
  | "vision_page"
  | "activities_page"
  | "development_page"
  | "media_page";

export const ALL_HOMEPAGE_SECTION_IDS: SectionType[] = [
  "hero",
  "stats",
  "about_leader",
  "our_vision",
  "leadership_journey",
  "daily_activities",
  "monthly_activities",
  "yearly_report",
  "development_projects",
  "peoples_voice",
  "cadre_corner",
  "media_center",
  "social_hub",
  "upcoming_events",
  "volunteer_contact",
  "about_page",
  "vision_page",
  "activities_page",
  "development_page",
  "media_page"
];


export interface LocalizedString {
  en: string;
  te: string;
}

// 1. Hero Section Data
export interface HeroHighlightItem {
  id: string;
  icon: string;
  text: string;
  sub: string;
}

export interface HeroSectionData {
  title: string;
  subtitle: string;
  leaderTitle: string;
  subtext: string;
  leaderPhotoUrl: string;
  activitiesCtaText: string;
  activitiesCtaLink: string;
  publicVoiceCtaText: string;
  publicVoiceCtaLink: string;
  socialFollowText: string;
  socialPlatforms: Array<{ name: string; url: string }>;
  highlightsCardTitle: string;
  highlightsItems: HeroHighlightItem[];
  fullScheduleCtaText: string;
  fullScheduleCtaLink: string;
}

// 2. Stats Section Data
export interface StatItem {
  id: string;
  label: string;
  labelTe?: string;
  value: string;
  icon: string;
  color: string;
  bg: string;
}

export interface StatsSectionData {
  stats: StatItem[];
}

// 3. About Leader Section Data
export interface AboutLeaderBullet {
  key: string;
  label: string;
  labelTe?: string;
}

export interface AboutLeaderSectionData {
  title: string;
  titleTe?: string;
  imageUrl: string;
  imageAlt: string;
  bullets: AboutLeaderBullet[];
  ctaText: string;
  ctaLink: string;
}

// 4. Our Vision Section Data
export interface VisionItem {
  id: string;
  title: string;
  titleTe?: string;
  icon: string;
  color: string;
  bg: string;
}

export interface OurVisionSectionData {
  title: string;
  visions: VisionItem[];
  manifestoCtaText: string;
  manifestoCtaLink: string;
}

// 5. Leadership Journey Section Data
export interface JourneyMilestone {
  year: string;
  title: string;
  desc: string;
  image: string;
}

export interface LeadershipJourneySectionData {
  title: string;
  viewAllLink: string;
  viewAllText: string;
  milestones: JourneyMilestone[];
}

// 6. Daily Activities Section Data
export interface DailyActivitySlot {
  time: string;
  activity: string;
  icon: string;
}

export interface DailyActivitiesSectionData {
  title: string;
  slots: DailyActivitySlot[];
  galleryImages: string[];
  ctaText: string;
  ctaLink: string;
}

// 7. Monthly Activities Section Data
export interface MonthlyActivityStat {
  label: string;
  count: number;
  icon: string;
}

export interface MonthlyActivitiesSectionData {
  title: string;
  monthLabel: string;
  stats: MonthlyActivityStat[];
}

// 8. Constituency Development Projects Data
export interface WorkflowStep {
  label: string;
  icon: string;
}

export interface DevelopmentProjectItem {
  id: string;
  name: string;
  category: string;
  progress: number;
  color: string;
  imageSeed: string;
  description?: string;
}

export interface DevelopmentProjectsSectionData {
  title: string;
  viewAllText: string;
  viewAllLink: string;
  workflowSteps: WorkflowStep[];
  projects: DevelopmentProjectItem[];
}

// 9. People's Voice Section Data
export interface VoiceServiceItem {
  id: string;
  label: string;
  sub: string;
  icon: string;
  link: string;
}

export interface PeoplesVoiceSectionData {
  title: string;
  services: VoiceServiceItem[];
}

// 10. Cadre Corner Section Data
export interface CadreWingItem {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface CadreCornerSectionData {
  title: string;
  wings: CadreWingItem[];
  ctaText: string;
  ctaLink: string;
}

// 11. Media Center Section Data
export interface MediaCenterSectionData {
  title: string;
  tabs: string[];
  activeTabDefault: string;
  items: Array<{
    id: string;
    title: string;
    imageUrl: string;
    category: string;
    date?: string;
  }>;
  ctaText: string;
  ctaLink: string;
}

// 12. Social Media Hub Section Data
export interface SocialMediaHubSectionData {
  title: string;
  platforms: Array<{
    name: string;
    handle: string;
    url: string;
    followers: string;
    color: string;
  }>;
}

// 13. Upcoming Events Section Data
export interface EventItem {
  id: string;
  day: string;
  month: string;
  title: string;
  location: string;
  time: string;
}

export interface UpcomingEventsSectionData {
  title: string;
  events: EventItem[];
  ctaText: string;
  ctaLink: string;
}

// 14. Volunteer & Contact Section Data
export interface VolunteerContactSectionData {
  volunteerTitle: string;
  volunteerSubtitle: string;
  volunteerCtaText: string;
  volunteerCtaLink: string;
  contactTitle: string;
  officeName: string;
  officeAddress: string;
  phone: string;
  helpline: string;
  email: string;
}

// Complete Home Section Document (Stored in MongoDB collection 'home_sections')
export interface HomeSectionDocument {
  _id?: string;
  sectionId: SectionType;
  title: string;
  subtitle?: string;
  order: number;
  enabled: boolean;
  data: any;
  assignedRoles: string[]; // e.g. ["SUPER_ADMIN", "CONTENT_MANAGER"]
  updatedAt: string;
  updatedBy: string;
}

// Site Settings Document (Stored in MongoDB collection 'site_settings')
export interface SiteSettingsDocument {
  _id?: string;
  slug: "global";
  siteName: string;
  siteTitle: string;
  tagline: string;
  leaderName: string;
  constituency: string;
  contactEmail: string;
  helpline: string;
  officeAddress: string;
  logoText: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    whatsapp?: string;
  };
  announcement?: {
    enabled: boolean;
    text: string;
    link?: string;
  };
  navLinks: Array<{
    name: string;
    nameTe?: string;
    path: string;
    order: number;
    isVisible: boolean;
  }>;
  footer: {
    platformTitle: string;
    platformDescription: string;
    copyrightText: string;
  };
  updatedAt: string;
  updatedBy: string;
}

// Aggregated Public Payload
export interface PublicHomePagePayload {
  settings: SiteSettingsDocument;
  sections: HomeSectionDocument[];
  fetchedAt: string;
  source: "mongodb";
}
