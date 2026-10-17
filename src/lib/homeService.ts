/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCollection, getMongoDbName } from "./mongodb";
import {
  HomeSectionDocument,
  SiteSettingsDocument,
  PublicHomePagePayload,
  SectionType
} from "../types/homeCms";

export const SITE_SETTINGS_COLLECTION = "site_settings";
export const HOME_SECTIONS_COLLECTION = "home_sections";

// Initial Authentic Production Baseline Settings
export const DEFAULT_SITE_SETTINGS: SiteSettingsDocument = {
  slug: "global",
  siteName: "Chintada Ravi Kumar Official Portal",
  siteTitle: "Chintada Ravi Kumar | Member of Legislative Assembly",
  tagline: "People First • Development Always",
  leaderName: "Chintada Ravi Kumar",
  constituency: "Ramanayapeta / Constituency",
  contactEmail: "office@chintadaravikumar.in",
  helpline: "1902",
  officeAddress: "MLA Camp Office, Main Road, Ramanayapeta, Andhra Pradesh",
  logoText: "MLA",
  socialLinks: {
    facebook: "https://facebook.com/chintadaravikumar",
    twitter: "https://twitter.com/chintadaravi",
    instagram: "https://instagram.com/chintadaravikumar",
    youtube: "https://youtube.com/@chintadaravikumar",
    whatsapp: "https://wa.me/919999999999"
  },
  announcement: {
    enabled: true,
    text: "Prajadarbar held every Saturday at the Camp Office from 9:00 AM to 1:00 PM.",
    link: "/contact"
  },
  navLinks: [
    { name: "Home", nameTe: "హోమ్", path: "/", order: 0, isVisible: true },
    { name: "About", nameTe: "గురించి", path: "/about", order: 1, isVisible: true },
    { name: "Vision", nameTe: "దృష్టి", path: "/vision", order: 2, isVisible: true },
    { name: "Activities", nameTe: "కార్యకలాపాలు", path: "/activities", order: 3, isVisible: true },
    { name: "Development", nameTe: "అభివృద్ధి", path: "/development", order: 4, isVisible: true },
    { name: "Public Voice", nameTe: "ప్రజా గొంతుక", path: "/public-voice", order: 5, isVisible: true },
    { name: "Cadre Corner", nameTe: "క్యాడర్ కార్నర్", path: "/cadre-corner", order: 6, isVisible: true },
    { name: "Media", nameTe: "మీడియా", path: "/media-center", order: 7, isVisible: true },
    { name: "Contact", nameTe: "సంప్రదించండి", path: "/contact", order: 8, isVisible: true },
    { name: "Volunteer", nameTe: "వాలంటీర్", path: "/volunteer", order: 9, isVisible: true }
  ],
  footer: {
    platformTitle: "MLA Public Representative Portal",
    platformDescription: "A unified administrative interface for citizen engagement, transparent governance, and hyper-local service delivery for the people.",
    copyrightText: "© 2026 Office of Chintada Ravi Kumar, MLA. All rights reserved."
  },
  updatedAt: new Date().toISOString(),
  updatedBy: "system"
};

// Initial Authentic Production Baseline Sections
export const DEFAULT_HOME_SECTIONS: HomeSectionDocument[] = [
  {
    sectionId: "hero",
    title: "Main Hero Banner",
    subtitle: "Hero presentation with leader photo, slogans, and daily highlights",
    order: 0,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "CONTENT_MANAGER"],
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    data: {
      title: "PEOPLE FIRST",
      subtitle: "DEVELOPMENT ALWAYS",
      leaderTitle: "An Educated | Energetic | Hardworking Leader",
      subtext: "Working for the People, With the People",
      leaderPhotoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=1200",
      activitiesCtaText: "Latest Activities",
      activitiesCtaLink: "/activities",
      publicVoiceCtaText: "People's Voice",
      publicVoiceCtaLink: "/public-voice",
      socialFollowText: "Follow us on",
      socialPlatforms: [
        { name: "youtube", url: "https://youtube.com" },
        { name: "facebook", url: "https://facebook.com" },
        { name: "instagram", url: "https://instagram.com" },
        { name: "twitter", url: "https://twitter.com" },
        { name: "whatsapp", url: "https://whatsapp.com" }
      ],
      highlightsCardTitle: "Today's Highlights",
      highlightsItems: [
        { id: "h1", icon: "MapPin", text: "3 Village Visits", sub: "Ramanayapeta" },
        { id: "h2", icon: "Users", text: "2 Public Meetings", sub: "Mandal Center" },
        { id: "h3", icon: "Clock", text: "Review Meeting", sub: "Evening 5 PM" }
      ],
      fullScheduleCtaText: "Full Schedule",
      fullScheduleCtaLink: "/activities"
    }
  },
  {
    sectionId: "stats",
    title: "Key Impact Statistics",
    subtitle: "Quantitative achievements and milestone metrics",
    order: 1,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "CONTENT_MANAGER"],
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    data: {
      stats: [
        { id: "s1", label: "Villages Visited", labelTe: "సందర్శించిన గ్రామాలు", value: "500+", icon: "MapPin", color: "text-green-600", bg: "bg-green-50" },
        { id: "s2", label: "Public Meetings", labelTe: "బహిరంగ సభలు", value: "1000+", icon: "Users", color: "text-blue-600", bg: "bg-blue-50" },
        { id: "s3", label: "Issues Resolved", labelTe: "పరిష్కరించబడిన సమస్యలు", value: "2000+", icon: "CheckCircle", color: "text-amber-600", bg: "bg-amber-50" },
        { id: "s4", label: "Active Volunteers", labelTe: "క్రియాశీల వాలంటీర్లు", value: "15K+", icon: "Heart", color: "text-purple-600", bg: "bg-purple-50" },
        { id: "s5", label: "People Benefited", labelTe: "ప్రజలు ప్రయోజనం పొందారు", value: "3L+", icon: "Heart", color: "text-red-500", bg: "bg-red-50" },
        { id: "s6", label: "Social Media Followers", labelTe: "సోషల్ మీడియా ఫాలోవర్స్", value: "1M+", icon: "ThumbsUp", color: "text-blue-500", bg: "bg-blue-50" }
      ]
    }
  },
  {
    sectionId: "about_leader",
    title: "Leader's Profile",
    subtitle: "Biographical overview and core leadership principles",
    order: 2,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "CONTENT_MANAGER"],
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    data: {
      title: "Leader's Profile",
      titleTe: "నాయకుడి ప్రొఫైల్",
      imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800",
      imageAlt: "Chintada Ravi Kumar MLA",
      bullets: [
        { key: "academic", label: "Academic Excellence", labelTe: "విద్యా నైపుణ్యం" },
        { key: "grassroots", label: "Grassroots Connection", labelTe: "అట్టడుగు స్థాయి సంబంధం" },
        { key: "social", label: "Social Transformation", labelTe: "సామాజిక మార్పు" },
        { key: "party", label: "Party Visionary", labelTe: "పార్టీ విజనరీ" },
        { key: "constituency", label: "Constituency Focus", labelTe: "నియోజకవర్గ దృష్టి" },
        { key: "committed", label: "Committed Leadership", labelTe: "కట్టుబడి ఉన్న నాయకత్వం" }
      ],
      ctaText: "Full Biography",
      ctaLink: "/about"
    }
  },
  {
    sectionId: "our_vision",
    title: "Our Vision",
    subtitle: "Constituency master plan and core focus pillars",
    order: 3,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "RESEARCH_MANAGER"],
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    data: {
      title: "Our Vision",
      visions: [
        { id: "v1", title: "Education For All", titleTe: "అందరికీ విద్య", icon: "GraduationCap", color: "text-blue-600", bg: "bg-blue-50" },
        { id: "v2", title: "Agriculture & Farmers", titleTe: "వ్యవసాయం & రైతులు", icon: "Sprout", color: "text-green-600", bg: "bg-green-50" },
        { id: "v3", title: "Youth Employment", titleTe: "యువత ఉపాధి", icon: "Briefcase", color: "text-amber-600", bg: "bg-amber-50" },
        { id: "v4", title: "Women Empowerment", titleTe: "మహిళా సాధికారత", icon: "Venus", color: "text-pink-600", bg: "bg-pink-50" },
        { id: "v5", title: "Healthcare For All", titleTe: "అందరికీ ఆరోగ్యం", icon: "Heart", color: "text-red-600", bg: "bg-red-50" },
        { id: "v6", title: "Infrastructure Dev", titleTe: "మౌలిక సదుపాయాలు", icon: "Zap", color: "text-indigo-600", bg: "bg-indigo-50" },
        { id: "v7", title: "Clean Water For All", titleTe: "పరిశుభ్రమైన తాగునీరు", icon: "Waves", color: "text-cyan-600", bg: "bg-cyan-50" },
        { id: "v8", title: "Transparent Governance", titleTe: "పారదర్శక పాలన", icon: "ShieldCheck", color: "text-slate-800", bg: "bg-slate-100" }
      ],
      manifestoCtaText: "View Full Manifesto",
      manifestoCtaLink: "/vision"
    }
  },
  {
    sectionId: "leadership_journey",
    title: "Leadership Journey",
    subtitle: "Milestones from grassroots activist to Member of Legislative Assembly",
    order: 4,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "CONTENT_MANAGER"],
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    data: {
      title: "Our Journey",
      viewAllText: "Explore Implementation",
      viewAllLink: "/vision",
      milestones: [
        {
          year: "1992",
          title: "Youth Welfare Movement",
          desc: "The journey began with a simple gathering of admirers transformed into a powerful social service movement dedicated to grassroots community support and identifying local needs.",
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
      ]
    }
  },
  {
    sectionId: "daily_activities",
    title: "Daily Activities",
    subtitle: "Routine schedule, constituency rounds, and recent activity logs",
    order: 5,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "CONTENT_MANAGER"],
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    data: {
      title: "Daily Activities",
      slots: [
        { time: "Morning", activity: "Village Visits", icon: "MapPin" },
        { time: "Afternoon", activity: "Public Interactions", icon: "Heart" },
        { time: "Evening", activity: "Meetings", icon: "Users" },
        { time: "Night", activity: "Review & Planning", icon: "Zap" }
      ],
      galleryImages: [
        "https://picsum.photos/seed/act1/400/400",
        "https://picsum.photos/seed/act2/400/400",
        "https://picsum.photos/seed/act3/400/400"
      ],
      ctaText: "View Today's Full Activities",
      ctaLink: "/activities"
    }
  },
  {
    sectionId: "monthly_activities",
    title: "Monthly Activities & Report",
    subtitle: "Aggregated monthly metrics and performance logs",
    order: 6,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "CONTENT_MANAGER"],
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    data: {
      title: "Monthly Activities",
      monthLabel: "Current Month 2026",
      stats: [
        { label: "Village Visits", count: 48, icon: "MapPin" },
        { label: "Public Meetings", count: 16, icon: "Users" },
        { label: "Welfare Programs", count: 12, icon: "Heart" },
        { label: "Youth Programs", count: 8, icon: "Zap" },
        { label: "Party Strengthening", count: 20, icon: "Users" }
      ]
    }
  },
  {
    sectionId: "development_projects",
    title: "Constituency Development Projects",
    subtitle: "Active infrastructure projects and delivery progress indicators",
    order: 7,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "CONTENT_MANAGER"],
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    data: {
      title: "District Transformation",
      viewAllText: "Launch Dashboard",
      viewAllLink: "/development",
      workflowSteps: [
        { label: "Identify", icon: "Search" },
        { label: "Plan", icon: "FileText" },
        { label: "Execute", icon: "Zap" },
        { label: "Monitor", icon: "Activity" }
      ],
      projects: [
        { id: "p1", name: "Roads", category: "Infrastructure", progress: 75, color: "bg-green-500", imageSeed: "road", description: "All-weather connectivity across rural habitations" },
        { id: "p2", name: "Water", category: "Public Utilities", progress: 60, color: "bg-blue-500", imageSeed: "water", description: "Piped drinking water distribution pipeline" },
        { id: "p3", name: "Schools", category: "Education", progress: 80, color: "bg-amber-500", imageSeed: "school", description: "Modern classrooms, digital labs, and sanitation facilities" },
        { id: "p4", name: "Hospitals", category: "Healthcare", progress: 70, color: "bg-red-500", imageSeed: "hospital", description: "Primary Health Center upgrades and 24/7 emergency service" },
        { id: "p5", name: "Employment", category: "Livelihood", progress: 65, color: "bg-purple-500", imageSeed: "work", description: "Skill training centers and rural youth placement drives" }
      ]
    }
  },
  {
    sectionId: "peoples_voice",
    title: "People's Voice & Redressal",
    subtitle: "Public interaction and grievance resolution gateway",
    order: 8,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "PUBLIC_RELATIONS_MANAGER"],
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    data: {
      title: "People's Voice",
      services: [
        { id: "pv1", label: "Submit Grievance", sub: "We are here to listen & help", icon: "ShieldAlert", link: "/public-voice" },
        { id: "pv2", label: "Give Suggestions", sub: "Your ideas, Our Future", icon: "Activity", link: "/public-voice" },
        { id: "pv3", label: "Success Stories", sub: "Real Stories, Real Change", icon: "UserCheck", link: "/public-voice" },
        { id: "pv4", label: "Track Your Request", sub: "Know the status of your request", icon: "Search", link: "/public-voice" }
      ]
    }
  },
  {
    sectionId: "cadre_corner",
    title: "Cadre Corner",
    subtitle: "Dedicated space for party workers, booth committees, and wings",
    order: 9,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "CADRE_MANAGER"],
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    data: {
      title: "Cadre Corner",
      wings: [
        { id: "w1", label: "Youth Wing", icon: "Users", color: "text-orange-600" },
        { id: "w2", label: "Women Wing", icon: "Venus", color: "text-pink-600" },
        { id: "w3", label: "Student Wing", icon: "GraduationCap", color: "text-blue-600" },
        { id: "w4", label: "BC Wing", icon: "Briefcase", color: "text-amber-600" },
        { id: "w5", label: "SC/ST Wing", icon: "ShieldAlert", color: "text-red-600" },
        { id: "w6", label: "Minority Wing", icon: "Heart", color: "text-purple-600" },
        { id: "w7", label: "Booth Committees", icon: "Building2", color: "text-slate-800" },
        { id: "w8", label: "Mandal Teams", icon: "UserCheck", color: "text-green-600" }
      ],
      ctaText: "Join the Cadre",
      ctaLink: "/cadre-corner"
    }
  },
  {
    sectionId: "media_center",
    title: "Media Center",
    subtitle: "Photo galleries, video clips, press releases, and news items",
    order: 10,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "MEDIA_MANAGER"],
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    data: {
      title: "Media Center",
      tabs: ["Photo Gallery", "Video Gallery", "Press Releases", "News Coverage", "Interviews"],
      activeTabDefault: "Photo Gallery",
      items: [
        { id: "m1", title: "Development Review Meeting", category: "Photo Gallery", imageUrl: "https://picsum.photos/seed/med1/600/400", date: "May 2024" },
        { id: "m2", title: "Constituency Village Visit", category: "Photo Gallery", imageUrl: "https://picsum.photos/seed/med2/600/400", date: "May 2024" },
        { id: "m3", title: "Youth Career Guidance Camp", category: "Photo Gallery", imageUrl: "https://picsum.photos/seed/med3/600/400", date: "April 2024" },
        { id: "m4", title: "Water Scheme Inauguration", category: "Photo Gallery", imageUrl: "https://picsum.photos/seed/med4/600/400", date: "April 2024" }
      ],
      ctaText: "View All Media",
      ctaLink: "/media-center"
    }
  },
  {
    sectionId: "social_hub",
    title: "Social Media Hub",
    subtitle: "Official social media channels and handle links",
    order: 11,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "MEDIA_MANAGER"],
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    data: {
      title: "Social Media Hub",
      platforms: [
        { name: "YouTube", handle: "@chintadaravikumar", url: "https://youtube.com/@chintadaravikumar", followers: "250K+", color: "text-red-600" },
        { name: "Facebook", handle: "/chintadaravikumar", url: "https://facebook.com/chintadaravikumar", followers: "500K+", color: "text-blue-600" },
        { name: "Instagram", handle: "@chintadaravikumar", url: "https://instagram.com/chintadaravikumar", followers: "320K+", color: "text-pink-600" },
        { name: "Twitter / X", handle: "@chintadaravi", url: "https://twitter.com/chintadaravi", followers: "180K+", color: "text-sky-500" }
      ]
    }
  },
  {
    sectionId: "upcoming_events",
    title: "Upcoming Events",
    subtitle: "Public meetings, village tours, and upcoming constituency events",
    order: 12,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "EVENT_MANAGER"],
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    data: {
      title: "Upcoming Events",
      events: [
        { id: "e1", day: "25", month: "MAY", title: "Village Visit", location: "Ramanayapeta", time: "09:00 AM" },
        { id: "e2", day: "26", month: "MAY", title: "Public Meeting", location: "Siddapuram", time: "06:00 PM" },
        { id: "e3", day: "28", month: "MAY", title: "Welfare Program", location: "Government School", time: "10:00 AM" }
      ],
      ctaText: "View Full Calendar",
      ctaLink: "/activities"
    }
  },
  {
    sectionId: "volunteer_contact",
    title: "Volunteer & Contact",
    subtitle: "Volunteer enrollment form and constituency office contact info",
    order: 13,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "VOLUNTEER_MANAGER"],
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    data: {
      volunteerTitle: "Join as Volunteer",
      volunteerSubtitle: "Be part of the grassroots team working for real progress",
      volunteerCtaText: "Register Now",
      volunteerCtaLink: "/volunteer",
      contactTitle: "Contact Us",
      officeName: "Constituency Camp Office",
      officeAddress: "Main Road, Ramanayapeta, Andhra Pradesh",
      phone: "+91 891 2345678",
      helpline: "1902 (Toll Free)",
      email: "office@chintadaravikumar.in"
    }
  },
  {
    sectionId: "about_page",
    title: "About Page Content",
    subtitle: "Complete biography, mission, values, and credentials",
    order: 14,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "CONTENT_MANAGER"],
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    data: {
      pageTitle: "Our District Core",
      pageSubtitle: "Founded on the principles of transparency and development, we work tirelessly to serve every citizen in the district.",
      missionTitle: "Our Mission",
      missionText: "\"To bridge the gap between governance and citizens using technology and human-centric policies, ensuring sustainable development across all mandals.\"",
      heroImageUrl: "https://images.unsplash.com/photo-1541802645635-11f2286a7482?auto=format&fit=crop&q=80&w=1200"
    }
  },
  {
    sectionId: "vision_page",
    title: "Vision Page Content",
    subtitle: "Strategic manifesto and core focus pillars",
    order: 15,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "RESEARCH_MANAGER"],
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    data: {
      pageTitle: "Vision for a Better Tomorrow",
      pageSubtitle: "Building a prosperous, inclusive, and sustainable constituency through innovation, integrity, and hard work."
    }
  },
  {
    sectionId: "activities_page",
    title: "Activities Page Content",
    subtitle: "Ground presence, recent activity logs, and event schedules",
    order: 16,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "CONTENT_MANAGER"],
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    data: {
      pageTitle: "Leadership in Action",
      pageSubtitle: "Ground presence, public meetings, and grassroots interactions across the constituency.",
      recentLogs: [
        { date: "June 15, 2026", title: "Review Meeting on Water Projects", desc: "Met with engineers to discuss the pipeline progress in eastern villages." },
        { date: "June 14, 2026", title: "Inauguration of New Community Center", desc: "Gram Panchayat facility opened for public use in Mandal Town." },
        { date: "June 12, 2026", title: "Palle Baata - Village Visit Program", desc: "Walking with people to understand local grievances firsthand." }
      ]
    }
  },
  {
    sectionId: "development_page",
    title: "Development Page Content",
    subtitle: "Development metrics hub, capital deployment, and sector progress",
    order: 17,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "RESEARCH_MANAGER"],
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    data: {
      pageTitle: "Development Metrics Hub",
      pageSubtitle: "Transparency in every brick and drop. Tracking the transformation of our constituency across key sectors.",
      activeSites: "154",
      capitalDeployed: "₹1.4B",
      successRate: "98%",
      sectors: [
        { name: "Infrastructure & Roads", progress: 85, projects: 12 },
        { name: "Water & Sanitation", progress: 64, projects: 8 },
        { name: "Healthcare Facilities", progress: 92, projects: 5 },
        { name: "Education & Schools", progress: 78, projects: 15 },
        { name: "Agriculture & Allied", progress: 56, projects: 20 },
        { name: "Housing Projects", progress: 42, projects: 10 }
      ],
      capitalAllocation: [
        { label: "Infrastructure", val: "45%" },
        { label: "Healthcare", val: "25%" },
        { label: "Digital Literacy", val: "20%" }
      ],
      growthIndexText: "Quarterly assessment shows a 12% increase in rural connectivity and 18% improvement in public health accessibility."
    }
  },
  {
    sectionId: "media_page",
    title: "Media Center Page Content",
    subtitle: "Communication hub, press releases, video gallery, photo archives, and reports",
    order: 18,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "MEDIA_MANAGER"],
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    data: {
      pageTitle: "Media Center",
      pageSubtitle: "Communication hub, press releases, video gallery, photo archive, and official reports.",
      items: [
        { id: "m1", type: "VIDEO", title: "Quarterly Townhall Highlights", date: "June 10, 2026", img: "https://images.unsplash.com/photo-1475721027785-f74dea9f2672?auto=format&fit=crop&q=80&w=1200", category: "VIDEO GALLERY" },
        { id: "m2", type: "PRESS", title: "New Health Initiative Launch", date: "June 08, 2026", img: "https://images.unsplash.com/photo-1576085898323-218337e3e43c?auto=format&fit=crop&q=80&w=1200", category: "PRESS RELEASES" },
        { id: "m3", type: "PHOTO", title: "District Sports Meet 2026", date: "June 05, 2026", img: "https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&q=80&w=1200", category: "PHOTO ARCHIVE" },
        { id: "m4", type: "VIDEO", title: "Weekly Development Vlog #12", date: "June 01, 2026", img: "https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&q=80&w=1200", category: "VIDEO GALLERY" },
        { id: "m5", type: "PRESS", title: "Bypass Road Contract Signed", date: "May 28, 2026", img: "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80&w=1200", category: "PRESS RELEASES" },
        { id: "m6", type: "PHOTO", title: "School Renovation Tour", date: "May 25, 2026", img: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1200", category: "PHOTO ARCHIVE" }
      ]
    }
  }
];

// In-Memory cache for high performance
interface CacheStore {
  payload: PublicHomePagePayload | null;
  settings: SiteSettingsDocument | null;
  timestamp: number;
}

const CACHE_TTL_MS = 30 * 1000; // 30 seconds
const cache: CacheStore = {
  payload: null,
  settings: null,
  timestamp: 0
};

export function invalidateHomeCache() {
  cache.payload = null;
  cache.settings = null;
  cache.timestamp = 0;
}

/**
 * Fetch or auto-initialize Site Settings from MongoDB
 */
export async function getSiteSettings(): Promise<SiteSettingsDocument> {
  if (cache.settings && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return cache.settings;
  }

  const col = await getCollection(SITE_SETTINGS_COLLECTION);
  if (!col) {
    return DEFAULT_SITE_SETTINGS;
  }

  const existing = await col.findOne({ slug: "global" });
  if (existing) {
    const { _id, ...rest } = existing;
    const settings: SiteSettingsDocument = {
      _id: _id.toString(),
      ...(rest as any)
    };
    cache.settings = settings;
    return settings;
  }

  // Not yet created in DB; seed default site settings
  await col.updateOne(
    { slug: "global" },
    { $set: { ...DEFAULT_SITE_SETTINGS, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );

  cache.settings = DEFAULT_SITE_SETTINGS;
  return DEFAULT_SITE_SETTINGS;
}

/**
 * Update Site Settings in MongoDB
 */
export async function updateSiteSettings(
  updates: Partial<SiteSettingsDocument>,
  updatedBy: string
): Promise<SiteSettingsDocument> {
  const col = await getCollection(SITE_SETTINGS_COLLECTION);
  if (!col) {
    throw new Error("MongoDB connection unavailable");
  }

  const payload = {
    ...updates,
    slug: "global" as const,
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy || "admin"
  };

  await col.updateOne({ slug: "global" }, { $set: payload }, { upsert: true });
  invalidateHomeCache();

  return getSiteSettings();
}

/**
 * Get all home sections (sorted by order)
 */
export async function getAllHomeSections(includeDisabled = false): Promise<HomeSectionDocument[]> {
  const col = await getCollection(HOME_SECTIONS_COLLECTION);
  if (!col) {
    return DEFAULT_HOME_SECTIONS.filter((s) => includeDisabled || s.enabled);
  }

  const query = includeDisabled ? {} : { enabled: true };
  const docs = await col.find(query).sort({ order: 1 }).toArray();

  if (docs.length === 0) {
    // Return defaults if database collection is empty
    return DEFAULT_HOME_SECTIONS.filter((s) => includeDisabled || s.enabled);
  }

  return docs.map((doc) => {
    const { _id, ...rest } = doc;
    return {
      _id: _id.toString(),
      ...(rest as any)
    };
  });
}

/**
 * Get single section by sectionId
 */
export async function getHomeSectionById(sectionId: string): Promise<HomeSectionDocument | null> {
  const col = await getCollection(HOME_SECTIONS_COLLECTION);
  if (!col) {
    return DEFAULT_HOME_SECTIONS.find((s) => s.sectionId === sectionId) || null;
  }

  const doc = await col.findOne({ sectionId });
  if (!doc) {
    return DEFAULT_HOME_SECTIONS.find((s) => s.sectionId === sectionId) || null;
  }

  const { _id, ...rest } = doc;
  return {
    _id: _id.toString(),
    ...(rest as any)
  };
}

/**
 * Update or upsert a home section
 */
export async function updateHomeSection(
  sectionId: SectionType,
  updates: Partial<HomeSectionDocument>,
  updatedBy: string
): Promise<HomeSectionDocument> {
  const col = await getCollection(HOME_SECTIONS_COLLECTION);
  if (!col) {
    throw new Error("MongoDB connection unavailable");
  }

  const existing = await getHomeSectionById(sectionId);
  const now = new Date().toISOString();

  const mergedPayload: Partial<HomeSectionDocument> = {
    ...existing,
    ...updates,
    sectionId,
    updatedAt: now,
    updatedBy: updatedBy || "admin"
  };

  delete mergedPayload._id;

  await col.updateOne(
    { sectionId },
    { $set: mergedPayload },
    { upsert: true }
  );

  invalidateHomeCache();

  const updated = await getHomeSectionById(sectionId);
  if (!updated) {
    throw new Error(`Failed to retrieve updated section: ${sectionId}`);
  }
  return updated;
}

/**
 * Get assembled Public Home Page payload
 */
export async function getPublicHomePayload(): Promise<PublicHomePagePayload> {
  if (cache.payload && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return cache.payload;
  }

  const [settings, sections] = await Promise.all([
    getSiteSettings(),
    getAllHomeSections(false)
  ]);

  const payload: PublicHomePagePayload = {
    settings,
    sections,
    fetchedAt: new Date().toISOString(),
    source: "mongodb"
  };

  cache.payload = payload;
  cache.timestamp = Date.now();
  return payload;
}

/**
 * Seeds initial baseline data into MongoDB Atlas if collections are empty or force=true
 */
export async function seedInitialHomeData(force = false): Promise<{
  settingsSeeded: boolean;
  sectionsCount: number;
  message: string;
}> {
  const dbName = getMongoDbName();
  const settingsCol = await getCollection(SITE_SETTINGS_COLLECTION);
  const sectionsCol = await getCollection(HOME_SECTIONS_COLLECTION);

  if (!settingsCol || !sectionsCol) {
    throw new Error(`Cannot connect to database '${dbName}' for seeding.`);
  }

  let settingsSeeded = false;
  let sectionsCount = 0;

  // 1. Site Settings
  const existingSettings = await settingsCol.findOne({ slug: "global" });
  if (!existingSettings || force) {
    await settingsCol.updateOne(
      { slug: "global" },
      { $set: { ...DEFAULT_SITE_SETTINGS, updatedAt: new Date().toISOString(), updatedBy: "seeder" } },
      { upsert: true }
    );
    settingsSeeded = true;
  }

  // 2. Home Sections
  const existingSectionsCount = await sectionsCol.countDocuments();
  if (existingSectionsCount === 0 || force) {
    if (force) {
      await sectionsCol.deleteMany({});
    }

    for (const section of DEFAULT_HOME_SECTIONS) {
      await sectionsCol.updateOne(
        { sectionId: section.sectionId },
        {
          $set: {
            ...section,
            updatedAt: new Date().toISOString(),
            updatedBy: "seeder"
          }
        },
        { upsert: true }
      );
      sectionsCount++;
    }
  } else {
    sectionsCount = existingSectionsCount;
  }

  invalidateHomeCache();

  return {
    settingsSeeded,
    sectionsCount,
    message: `Database '${dbName}' seeded successfully. ${sectionsCount} sections active.`
  };
}

/**
 * Startup helper to ensure baseline documents exist without manual user interaction
 */
export async function ensureBaselineData(): Promise<void> {
  try {
    const settingsCol = await getCollection(SITE_SETTINGS_COLLECTION);
    const sectionsCol = await getCollection(HOME_SECTIONS_COLLECTION);
    if (!settingsCol || !sectionsCol) return;

    const countSettings = await settingsCol.countDocuments();
    const countSections = await sectionsCol.countDocuments();

    if (countSettings === 0 || countSections === 0) {
      console.log(`[HomeService] Seeding baseline home page data into MongoDB...`);
      const res = await seedInitialHomeData(false);
      console.log(`[HomeService] ${res.message}`);
    } else {
      console.log(`[HomeService] Baseline documents present (settings: ${countSettings}, sections: ${countSections})`);
    }
  } catch (err) {
    console.warn(`[HomeService] Auto-seed check skipped or failed: ${(err as Error).message}`);
  }
}
