// src/serverApp.ts
import express from "express";
import cookieParser from "cookie-parser";
import { GoogleGenAI } from "@google/genai";
import { google } from "googleapis";
import rateLimit from "express-rate-limit";

// src/lib/mongodb.ts
import { MongoClient } from "mongodb";
var DEFAULT_CLUSTER_HOST = "cluster0.lqdmdvr.mongodb.net";
var DEFAULT_DATABASE_NAME = "chintadaravikumar";
var OBSOLETE_CLUSTER_HOST = "cluster0.wvy2yis.mongodb.net";
function getMongoDbName() {
  const customDb = process.env.MONGODB_DB_NAME?.trim();
  if (customDb && customDb !== "Party") return customDb;
  return DEFAULT_DATABASE_NAME;
}
function getMongoUri() {
  const username = process.env.MONGODB_USERNAME?.trim();
  const password = process.env.MONGODB_PASSWORD?.trim();
  const host = process.env.MONGODB_CLUSTER_HOST?.trim() || DEFAULT_CLUSTER_HOST;
  const db = getMongoDbName();
  if (username && password) {
    const encodedUser = encodeURIComponent(username);
    const encodedPass = encodeURIComponent(password);
    return `mongodb+srv://${encodedUser}:${encodedPass}@${host}/${db}?retryWrites=true&w=majority`;
  }
  const rawUri = process.env.MONGODB_URI?.trim();
  if (rawUri) {
    if (password && (rawUri.includes("<password>") || rawUri.includes("<db_password>"))) {
      const encodedPass = encodeURIComponent(password);
      return rawUri.replace(/<password>|<db_password>/g, encodedPass);
    }
    if (rawUri.includes(OBSOLETE_CLUSTER_HOST)) {
      return null;
    }
    return rawUri;
  }
  const testUri = process.env.MONGODB_TEST_URI?.trim();
  if (testUri && db === "chintadaravikumar_test") {
    return testUri;
  }
  return null;
}
function sanitizeErrorMessage(message) {
  if (!message) return "Unknown database error";
  return message.replace(/\/\/[^:]+:[^@]+@/g, "//***:***@").replace(/password=[^&]+/gi, "password=***");
}
function getMongoClusterHost() {
  const hostEnv = process.env.MONGODB_CLUSTER_HOST?.trim();
  if (hostEnv) return hostEnv;
  const uri = getMongoUri();
  if (!uri) return DEFAULT_CLUSTER_HOST;
  try {
    const parsed = new URL(uri);
    return parsed.hostname;
  } catch {
    const match = uri.match(/@([^/?#]+)/);
    return match ? match[1] : DEFAULT_CLUSTER_HOST;
  }
}
var client = null;
var currentConnectedUri = null;
async function getMongoClient(forceReconnect = false) {
  const uri = getMongoUri();
  if (!uri) {
    if (client) {
      await client.close().catch(() => {
      });
      client = null;
      currentConnectedUri = null;
    }
    return null;
  }
  if (client && (forceReconnect || currentConnectedUri !== uri)) {
    try {
      await client.close().catch(() => {
      });
    } finally {
      client = null;
      currentConnectedUri = null;
    }
  }
  if (!client) {
    const maxPoolSize = parseInt(process.env.MONGODB_MAX_POOL_SIZE || "5", 10);
    const minPoolSize = parseInt(process.env.MONGODB_MIN_POOL_SIZE || "0", 10);
    const newClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5e3,
      connectTimeoutMS: 1e4,
      maxPoolSize,
      minPoolSize,
      family: 4
    });
    try {
      await newClient.connect();
      const targetDb = getMongoDbName();
      await newClient.db(targetDb).command({ ping: 1 });
      client = newClient;
      currentConnectedUri = uri;
      console.log(`[MongoDB] Connected successfully to database: ${targetDb}`);
    } catch (err) {
      await newClient.close().catch(() => {
      });
      client = null;
      currentConnectedUri = null;
      const sanitizedErr = sanitizeErrorMessage(err.message);
      console.error(`[MongoDB] Connection failed: ${sanitizedErr}`);
      throw new Error(sanitizedErr);
    }
  }
  return client;
}
async function getCollection(collectionName, dbName) {
  const targetDb = dbName || getMongoDbName();
  const activeClient = await getMongoClient();
  if (!activeClient) return null;
  return activeClient.db(targetDb).collection(collectionName);
}
async function checkMongoHealth() {
  const uri = getMongoUri();
  const dbName = getMongoDbName();
  const cluster = getMongoClusterHost();
  if (!uri) {
    return {
      status: "disconnected",
      database: dbName,
      cluster,
      message: "MongoDB credentials not configured. Please set MONGODB_USERNAME & MONGODB_PASSWORD (or MONGODB_URI) in Secrets or environment."
    };
  }
  const startTime = Date.now();
  try {
    const activeClient = await getMongoClient();
    if (!activeClient) {
      return {
        status: "disconnected",
        database: dbName,
        cluster,
        message: "MongoClient could not be initialized"
      };
    }
    await activeClient.db(dbName).command({ ping: 1 });
    const latencyMs = Date.now() - startTime;
    let collections = [];
    try {
      const collectionInfos = await activeClient.db(dbName).listCollections().toArray();
      collections = collectionInfos.map((c) => c.name);
    } catch {
    }
    return {
      status: "connected",
      database: dbName,
      cluster,
      latencyMs,
      collections,
      hasSiteSettings: collections.includes("site_settings")
    };
  } catch (err) {
    const sanitizedError = sanitizeErrorMessage(err.message);
    return {
      status: "error",
      database: dbName,
      cluster,
      error: sanitizedError
    };
  }
}

// src/lib/homeService.ts
var SITE_SETTINGS_COLLECTION = "site_settings";
var HOME_SECTIONS_COLLECTION = "home_sections";
var DEFAULT_SITE_SETTINGS = {
  slug: "global",
  siteName: "Chintada Ravi Kumar Official Portal",
  siteTitle: "Chintada Ravi Kumar | Member of Legislative Assembly",
  tagline: "People First \u2022 Development Always",
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
    { name: "Home", nameTe: "\u0C39\u0C4B\u0C2E\u0C4D", path: "/", order: 0, isVisible: true },
    { name: "About", nameTe: "\u0C17\u0C41\u0C30\u0C3F\u0C02\u0C1A\u0C3F", path: "/about", order: 1, isVisible: true },
    { name: "Vision", nameTe: "\u0C26\u0C43\u0C37\u0C4D\u0C1F\u0C3F", path: "/vision", order: 2, isVisible: true },
    { name: "Activities", nameTe: "\u0C15\u0C3E\u0C30\u0C4D\u0C2F\u0C15\u0C32\u0C3E\u0C2A\u0C3E\u0C32\u0C41", path: "/activities", order: 3, isVisible: true },
    { name: "Development", nameTe: "\u0C05\u0C2D\u0C3F\u0C35\u0C43\u0C26\u0C4D\u0C27\u0C3F", path: "/development", order: 4, isVisible: true },
    { name: "Public Voice", nameTe: "\u0C2A\u0C4D\u0C30\u0C1C\u0C3E \u0C17\u0C4A\u0C02\u0C24\u0C41\u0C15", path: "/public-voice", order: 5, isVisible: true },
    { name: "Cadre Corner", nameTe: "\u0C15\u0C4D\u0C2F\u0C3E\u0C21\u0C30\u0C4D \u0C15\u0C3E\u0C30\u0C4D\u0C28\u0C30\u0C4D", path: "/cadre-corner", order: 6, isVisible: true },
    { name: "Media", nameTe: "\u0C2E\u0C40\u0C21\u0C3F\u0C2F\u0C3E", path: "/media-center", order: 7, isVisible: true },
    { name: "Contact", nameTe: "\u0C38\u0C02\u0C2A\u0C4D\u0C30\u0C26\u0C3F\u0C02\u0C1A\u0C02\u0C21\u0C3F", path: "/contact", order: 8, isVisible: true },
    { name: "Volunteer", nameTe: "\u0C35\u0C3E\u0C32\u0C02\u0C1F\u0C40\u0C30\u0C4D", path: "/volunteer", order: 9, isVisible: true }
  ],
  footer: {
    platformTitle: "MLA Public Representative Portal",
    platformDescription: "A unified administrative interface for citizen engagement, transparent governance, and hyper-local service delivery for the people.",
    copyrightText: "\xA9 2026 Office of Chintada Ravi Kumar, MLA. All rights reserved."
  },
  updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
  updatedBy: "system"
};
var DEFAULT_HOME_SECTIONS = [
  {
    sectionId: "hero",
    title: "Main Hero Banner",
    subtitle: "Hero presentation with leader photo, slogans, and daily highlights",
    order: 0,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "CONTENT_MANAGER"],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "system",
    data: {
      stats: [
        { id: "s1", label: "Villages Visited", labelTe: "\u0C38\u0C02\u0C26\u0C30\u0C4D\u0C36\u0C3F\u0C02\u0C1A\u0C3F\u0C28 \u0C17\u0C4D\u0C30\u0C3E\u0C2E\u0C3E\u0C32\u0C41", value: "500+", icon: "MapPin", color: "text-green-600", bg: "bg-green-50" },
        { id: "s2", label: "Public Meetings", labelTe: "\u0C2C\u0C39\u0C3F\u0C30\u0C02\u0C17 \u0C38\u0C2D\u0C32\u0C41", value: "1000+", icon: "Users", color: "text-blue-600", bg: "bg-blue-50" },
        { id: "s3", label: "Issues Resolved", labelTe: "\u0C2A\u0C30\u0C3F\u0C37\u0C4D\u0C15\u0C30\u0C3F\u0C02\u0C1A\u0C2C\u0C21\u0C3F\u0C28 \u0C38\u0C2E\u0C38\u0C4D\u0C2F\u0C32\u0C41", value: "2000+", icon: "CheckCircle", color: "text-amber-600", bg: "bg-amber-50" },
        { id: "s4", label: "Active Volunteers", labelTe: "\u0C15\u0C4D\u0C30\u0C3F\u0C2F\u0C3E\u0C36\u0C40\u0C32 \u0C35\u0C3E\u0C32\u0C02\u0C1F\u0C40\u0C30\u0C4D\u0C32\u0C41", value: "15K+", icon: "Heart", color: "text-purple-600", bg: "bg-purple-50" },
        { id: "s5", label: "People Benefited", labelTe: "\u0C2A\u0C4D\u0C30\u0C1C\u0C32\u0C41 \u0C2A\u0C4D\u0C30\u0C2F\u0C4B\u0C1C\u0C28\u0C02 \u0C2A\u0C4A\u0C02\u0C26\u0C3E\u0C30\u0C41", value: "3L+", icon: "Heart", color: "text-red-500", bg: "bg-red-50" },
        { id: "s6", label: "Social Media Followers", labelTe: "\u0C38\u0C4B\u0C37\u0C32\u0C4D \u0C2E\u0C40\u0C21\u0C3F\u0C2F\u0C3E \u0C2B\u0C3E\u0C32\u0C4B\u0C35\u0C30\u0C4D\u0C38\u0C4D", value: "1M+", icon: "ThumbsUp", color: "text-blue-500", bg: "bg-blue-50" }
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
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "system",
    data: {
      title: "Leader's Profile",
      titleTe: "\u0C28\u0C3E\u0C2F\u0C15\u0C41\u0C21\u0C3F \u0C2A\u0C4D\u0C30\u0C4A\u0C2B\u0C48\u0C32\u0C4D",
      imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800",
      imageAlt: "Chintada Ravi Kumar MLA",
      bullets: [
        { key: "academic", label: "Academic Excellence", labelTe: "\u0C35\u0C3F\u0C26\u0C4D\u0C2F\u0C3E \u0C28\u0C48\u0C2A\u0C41\u0C23\u0C4D\u0C2F\u0C02" },
        { key: "grassroots", label: "Grassroots Connection", labelTe: "\u0C05\u0C1F\u0C4D\u0C1F\u0C21\u0C41\u0C17\u0C41 \u0C38\u0C4D\u0C25\u0C3E\u0C2F\u0C3F \u0C38\u0C02\u0C2C\u0C02\u0C27\u0C02" },
        { key: "social", label: "Social Transformation", labelTe: "\u0C38\u0C3E\u0C2E\u0C3E\u0C1C\u0C3F\u0C15 \u0C2E\u0C3E\u0C30\u0C4D\u0C2A\u0C41" },
        { key: "party", label: "Party Visionary", labelTe: "\u0C2A\u0C3E\u0C30\u0C4D\u0C1F\u0C40 \u0C35\u0C3F\u0C1C\u0C28\u0C30\u0C40" },
        { key: "constituency", label: "Constituency Focus", labelTe: "\u0C28\u0C3F\u0C2F\u0C4B\u0C1C\u0C15\u0C35\u0C30\u0C4D\u0C17 \u0C26\u0C43\u0C37\u0C4D\u0C1F\u0C3F" },
        { key: "committed", label: "Committed Leadership", labelTe: "\u0C15\u0C1F\u0C4D\u0C1F\u0C41\u0C2C\u0C21\u0C3F \u0C09\u0C28\u0C4D\u0C28 \u0C28\u0C3E\u0C2F\u0C15\u0C24\u0C4D\u0C35\u0C02" }
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
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "system",
    data: {
      title: "Our Vision",
      visions: [
        { id: "v1", title: "Education For All", titleTe: "\u0C05\u0C02\u0C26\u0C30\u0C3F\u0C15\u0C40 \u0C35\u0C3F\u0C26\u0C4D\u0C2F", icon: "GraduationCap", color: "text-blue-600", bg: "bg-blue-50" },
        { id: "v2", title: "Agriculture & Farmers", titleTe: "\u0C35\u0C4D\u0C2F\u0C35\u0C38\u0C3E\u0C2F\u0C02 & \u0C30\u0C48\u0C24\u0C41\u0C32\u0C41", icon: "Sprout", color: "text-green-600", bg: "bg-green-50" },
        { id: "v3", title: "Youth Employment", titleTe: "\u0C2F\u0C41\u0C35\u0C24 \u0C09\u0C2A\u0C3E\u0C27\u0C3F", icon: "Briefcase", color: "text-amber-600", bg: "bg-amber-50" },
        { id: "v4", title: "Women Empowerment", titleTe: "\u0C2E\u0C39\u0C3F\u0C33\u0C3E \u0C38\u0C3E\u0C27\u0C3F\u0C15\u0C3E\u0C30\u0C24", icon: "Venus", color: "text-pink-600", bg: "bg-pink-50" },
        { id: "v5", title: "Healthcare For All", titleTe: "\u0C05\u0C02\u0C26\u0C30\u0C3F\u0C15\u0C40 \u0C06\u0C30\u0C4B\u0C17\u0C4D\u0C2F\u0C02", icon: "Heart", color: "text-red-600", bg: "bg-red-50" },
        { id: "v6", title: "Infrastructure Dev", titleTe: "\u0C2E\u0C4C\u0C32\u0C3F\u0C15 \u0C38\u0C26\u0C41\u0C2A\u0C3E\u0C2F\u0C3E\u0C32\u0C41", icon: "Zap", color: "text-indigo-600", bg: "bg-indigo-50" },
        { id: "v7", title: "Clean Water For All", titleTe: "\u0C2A\u0C30\u0C3F\u0C36\u0C41\u0C2D\u0C4D\u0C30\u0C2E\u0C48\u0C28 \u0C24\u0C3E\u0C17\u0C41\u0C28\u0C40\u0C30\u0C41", icon: "Waves", color: "text-cyan-600", bg: "bg-cyan-50" },
        { id: "v8", title: "Transparent Governance", titleTe: "\u0C2A\u0C3E\u0C30\u0C26\u0C30\u0C4D\u0C36\u0C15 \u0C2A\u0C3E\u0C32\u0C28", icon: "ShieldCheck", color: "text-slate-800", bg: "bg-slate-100" }
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
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "system",
    data: {
      pageTitle: "Our District Core",
      pageSubtitle: "Founded on the principles of transparency and development, we work tirelessly to serve every citizen in the district.",
      missionTitle: "Our Mission",
      missionText: '"To bridge the gap between governance and citizens using technology and human-centric policies, ensuring sustainable development across all mandals."',
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
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "system",
    data: {
      pageTitle: "Development Metrics Hub",
      pageSubtitle: "Transparency in every brick and drop. Tracking the transformation of our constituency across key sectors.",
      activeSites: "154",
      capitalDeployed: "\u20B91.4B",
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
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
var CACHE_TTL_MS = 30 * 1e3;
var cache = {
  payload: null,
  settings: null,
  timestamp: 0
};
function invalidateHomeCache() {
  cache.payload = null;
  cache.settings = null;
  cache.timestamp = 0;
}
async function getSiteSettings() {
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
    const settings = {
      _id: _id.toString(),
      ...rest
    };
    cache.settings = settings;
    return settings;
  }
  await col.updateOne(
    { slug: "global" },
    { $set: { ...DEFAULT_SITE_SETTINGS, updatedAt: (/* @__PURE__ */ new Date()).toISOString() } },
    { upsert: true }
  );
  cache.settings = DEFAULT_SITE_SETTINGS;
  return DEFAULT_SITE_SETTINGS;
}
async function updateSiteSettings(updates, updatedBy) {
  const col = await getCollection(SITE_SETTINGS_COLLECTION);
  if (!col) {
    throw new Error("MongoDB connection unavailable");
  }
  const payload = {
    ...updates,
    slug: "global",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: updatedBy || "admin"
  };
  await col.updateOne({ slug: "global" }, { $set: payload }, { upsert: true });
  invalidateHomeCache();
  return getSiteSettings();
}
async function getAllHomeSections(includeDisabled = false) {
  const col = await getCollection(HOME_SECTIONS_COLLECTION);
  if (!col) {
    return DEFAULT_HOME_SECTIONS.filter((s) => includeDisabled || s.enabled);
  }
  const query = includeDisabled ? {} : { enabled: true };
  const docs = await col.find(query).sort({ order: 1 }).toArray();
  if (docs.length === 0) {
    return DEFAULT_HOME_SECTIONS.filter((s) => includeDisabled || s.enabled);
  }
  return docs.map((doc) => {
    const { _id, ...rest } = doc;
    return {
      _id: _id.toString(),
      ...rest
    };
  });
}
async function getHomeSectionById(sectionId) {
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
    ...rest
  };
}
async function updateHomeSection(sectionId, updates, updatedBy) {
  const col = await getCollection(HOME_SECTIONS_COLLECTION);
  if (!col) {
    throw new Error("MongoDB connection unavailable");
  }
  const existing = await getHomeSectionById(sectionId);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const mergedPayload = {
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
async function getPublicHomePayload() {
  if (cache.payload && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return cache.payload;
  }
  const [settings, sections] = await Promise.all([
    getSiteSettings(),
    getAllHomeSections(false)
  ]);
  const payload = {
    settings,
    sections,
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
    source: "mongodb"
  };
  cache.payload = payload;
  cache.timestamp = Date.now();
  return payload;
}
async function seedInitialHomeData(force = false) {
  const dbName = getMongoDbName();
  const settingsCol = await getCollection(SITE_SETTINGS_COLLECTION);
  const sectionsCol = await getCollection(HOME_SECTIONS_COLLECTION);
  if (!settingsCol || !sectionsCol) {
    throw new Error(`Cannot connect to database '${dbName}' for seeding.`);
  }
  let settingsSeeded = false;
  let sectionsCount = 0;
  const existingSettings = await settingsCol.findOne({ slug: "global" });
  if (!existingSettings || force) {
    await settingsCol.updateOne(
      { slug: "global" },
      { $set: { ...DEFAULT_SITE_SETTINGS, updatedAt: (/* @__PURE__ */ new Date()).toISOString(), updatedBy: "seeder" } },
      { upsert: true }
    );
    settingsSeeded = true;
  }
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
            updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
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

// src/lib/authMiddleware.ts
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// src/types/homeCms.ts
var ALL_HOMEPAGE_SECTION_IDS = [
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

// src/lib/userService.ts
var DB_NAME = process.env.MONGODB_DB_NAME || "chintadaravikumar";
var USERS_COLLECTION = "admin_users";
var AUDIT_LOGS_COLLECTION = "audit_logs";
function getSuperAdminAllowlist() {
  const envEmails = (process.env.SUPER_ADMIN_EMAILS || process.env.SUPER_ADMIN_EMAIL || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return Array.from(new Set(envEmails));
}
function getSuperAdminUidAllowlist() {
  const envUids = (process.env.SUPER_ADMIN_UIDS || process.env.SUPER_ADMIN_UID || "").split(",").map((u) => u.trim()).filter(Boolean);
  return Array.from(new Set(envUids));
}
function isSuperAdminEmail(email) {
  if (!email) return false;
  const allowlist = getSuperAdminAllowlist();
  if (allowlist.length === 0) return false;
  return allowlist.includes(email.toLowerCase().trim());
}
function isSuperAdminUid(uid) {
  if (!uid) return false;
  const allowlist = getSuperAdminUidAllowlist();
  if (allowlist.length === 0) return false;
  return allowlist.includes(uid.trim());
}
function isSuperAdmin(identity) {
  if (!identity) return false;
  if (identity.emailVerified !== void 0 && !identity.emailVerified) {
    return false;
  }
  if (identity.uid && isSuperAdminUid(identity.uid)) return true;
  if (identity.email && isSuperAdminEmail(identity.email)) return true;
  return false;
}
async function createAuditLog(log) {
  try {
    const client2 = await getMongoClient();
    if (!client2) {
      console.warn("[AuditLog] MongoDB client unavailable for audit persistence");
      return { timestamp: (/* @__PURE__ */ new Date()).toISOString(), ...log };
    }
    const db = client2.db(DB_NAME);
    const col = db.collection(AUDIT_LOGS_COLLECTION);
    const doc = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      actorUid: log.actorUid,
      actorEmail: log.actorEmail,
      actorRole: log.actorRole,
      action: log.action,
      targetEntity: log.targetEntity,
      targetId: log.targetId || "",
      details: log.details || {},
      ipAddress: log.ipAddress || ""
    };
    await col.insertOne(doc);
    return doc;
  } catch (err) {
    console.error("[AuditLog] Failed to persist audit entry:", err);
    return {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      ...log
    };
  }
}
async function getAuditLogs(limitCount = 50) {
  try {
    const client2 = await getMongoClient();
    if (!client2) return [];
    const db = client2.db(DB_NAME);
    const col = db.collection(AUDIT_LOGS_COLLECTION);
    const results = await col.find({}).sort({ timestamp: -1 }).limit(limitCount).toArray();
    return results.map((r) => ({
      ...r,
      _id: r._id?.toString()
    }));
  } catch (err) {
    console.error("[AuditLog] Failed to read audit logs:", err);
    return [];
  }
}
async function syncGoogleUser(params) {
  const client2 = await getMongoClient();
  if (!client2) {
    throw new Error("Database connection unavailable.");
  }
  const db = client2.db(DB_NAME);
  const col = db.collection(USERS_COLLECTION);
  const email = params.email.toLowerCase().trim();
  const isEmailVerified = Boolean(params.emailVerified);
  const isSA = isEmailVerified && isSuperAdmin({ email, uid: params.uid, emailVerified: isEmailVerified });
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const existingByUid = await col.findOne({ uid: params.uid });
  const existingByEmail = await col.findOne({ email });
  if (existingByEmail && existingByEmail.uid && existingByEmail.uid !== params.uid) {
    await createAuditLog({
      actorUid: params.uid,
      actorEmail: email,
      actorRole: "BLOCKED",
      action: "UID_MISMATCH_REJECTED",
      targetEntity: "admin_users",
      targetId: email,
      details: {
        attemptedUid: params.uid,
        boundUid: existingByEmail.uid,
        reason: "Attempted sign-in with different Firebase UID for bound account"
      },
      ipAddress: params.ipAddress
    });
    throw new Error("Security conflict: This account is already bound to a different verified Firebase identity.");
  }
  if (existingByUid && existingByUid.email.toLowerCase().trim() !== email) {
    await createAuditLog({
      actorUid: params.uid,
      actorEmail: email,
      actorRole: "BLOCKED",
      action: "EMAIL_MISMATCH_REJECTED",
      targetEntity: "admin_users",
      targetId: email,
      details: {
        attemptedEmail: email,
        boundEmail: existingByUid.email,
        reason: "Attempted sign-in with different email for bound UID"
      },
      ipAddress: params.ipAddress
    });
    throw new Error("Security conflict: This Firebase identity is already bound to a different email address.");
  }
  const existing = existingByUid || existingByEmail;
  if (isSA) {
    const superAdminDoc = {
      uid: params.uid,
      // Strictly bound to verified Firebase UID
      email,
      displayName: params.displayName || existing?.displayName || "Super Admin",
      photoURL: params.photoURL || existing?.photoURL || `https://ui-avatars.com/api/?name=Super+Admin&background=001D3D&color=fff`,
      role: "SUPER_ADMIN" /* SUPER_ADMIN */,
      status: "APPROVED" /* APPROVED */,
      permissions: ["*"],
      assignedSections: [...ALL_HOMEPAGE_SECTION_IDS],
      lastLogin: now,
      updatedAt: now
    };
    if (!existing) {
      const fullDoc = {
        ...superAdminDoc,
        createdAt: now,
        notes: "Authorized Super Admin provisioned via verified Google sign-in"
      };
      await col.insertOne(fullDoc);
      await createAuditLog({
        actorUid: params.uid,
        actorEmail: email,
        actorRole: "SUPER_ADMIN" /* SUPER_ADMIN */,
        action: "SUPER_ADMIN_INITIAL_BOOTSTRAP",
        targetEntity: "admin_users",
        targetId: email,
        details: { uid: params.uid, email, allowlistMatched: true },
        ipAddress: params.ipAddress
      });
      return fullDoc;
    } else {
      await col.updateOne({ _id: existing._id }, { $set: superAdminDoc });
      await createAuditLog({
        actorUid: params.uid,
        actorEmail: email,
        actorRole: "SUPER_ADMIN" /* SUPER_ADMIN */,
        action: "SUPER_ADMIN_VERIFIED_SIGN_IN",
        targetEntity: "admin_users",
        targetId: email,
        details: { uid: params.uid, email },
        ipAddress: params.ipAddress
      });
      return { ...existing, ...superAdminDoc };
    }
  }
  if (existing) {
    const updates = {
      uid: params.uid,
      // Keep verified UID in sync
      lastLogin: now,
      displayName: params.displayName || existing.displayName,
      photoURL: params.photoURL || existing.photoURL,
      updatedAt: now
    };
    if (params.requestedRole && existing.status === "PENDING" /* PENDING */) {
      updates.requestedRole = String(params.requestedRole).slice(0, 100);
    }
    if (params.requestNotes && existing.status === "PENDING" /* PENDING */) {
      updates.requestNotes = String(params.requestNotes).slice(0, 500);
    }
    await col.updateOne({ _id: existing._id }, { $set: updates });
    return { ...existing, ...updates };
  } else {
    const newDoc = {
      uid: params.uid,
      email,
      displayName: params.displayName || email.split("@")[0].toUpperCase(),
      photoURL: params.photoURL || `https://ui-avatars.com/api/?name=${email}&background=004B8D&color=fff`,
      role: "VIEWER" /* VIEWER */,
      // STRICT SAFE DEFAULT
      status: "PENDING" /* PENDING */,
      permissions: [],
      assignedSections: [],
      requestedRole: (params.requestedRole || "Team Member").slice(0, 100),
      requestNotes: (params.requestNotes || "").slice(0, 500),
      createdAt: now,
      lastLogin: now,
      updatedAt: now
    };
    await col.insertOne(newDoc);
    await createAuditLog({
      actorUid: params.uid,
      actorEmail: email,
      actorRole: "GUEST",
      action: "USER_REGISTRATION_REQUESTED",
      targetEntity: "admin_users",
      targetId: email,
      details: {
        email,
        requestedRole: newDoc.requestedRole,
        notes: newDoc.requestNotes
      },
      ipAddress: params.ipAddress
    });
    return newDoc;
  }
}
async function getUserByUid(uid) {
  try {
    const client2 = await getMongoClient();
    if (!client2) return null;
    const db = client2.db(DB_NAME);
    const col = db.collection(USERS_COLLECTION);
    const user = await col.findOne({ uid });
    if (!user) return null;
    return { ...user, _id: user._id?.toString() };
  } catch (err) {
    console.error("[Auth] Error fetching user by UID:", err);
    return null;
  }
}
async function getAllUsers(filter) {
  try {
    const client2 = await getMongoClient();
    if (!client2) return [];
    const db = client2.db(DB_NAME);
    const col = db.collection(USERS_COLLECTION);
    const query = {};
    if (filter?.status && filter.status !== "ALL") {
      query.status = filter.status;
    }
    if (filter?.search) {
      const regex = new RegExp(filter.search, "i");
      query.$or = [{ displayName: regex }, { email: regex }, { role: regex }];
    }
    const docs = await col.find(query).sort({ createdAt: -1 }).toArray();
    return docs.map((d) => ({ ...d, _id: d._id?.toString() }));
  } catch (err) {
    console.error("[Auth] Error fetching all users:", err);
    return [];
  }
}
async function updateUser(targetUid, updates, actor) {
  const client2 = await getMongoClient();
  if (!client2) {
    throw new Error("Database connection unavailable.");
  }
  const db = client2.db(DB_NAME);
  const col = db.collection(USERS_COLLECTION);
  if (!isSuperAdmin(actor)) {
    throw new Error("Only an authorized Super Admin can update team member permissions.");
  }
  const existing = await col.findOne({ uid: targetUid });
  if (!existing) {
    throw new Error(`User with UID '${targetUid}' not found.`);
  }
  if (isSuperAdmin({ email: existing.email, uid: existing.uid })) {
    if (updates.role && updates.role !== "SUPER_ADMIN" /* SUPER_ADMIN */) {
      throw new Error("Primary Super Admin account role cannot be changed.");
    }
    if (updates.status && updates.status !== "APPROVED" /* APPROVED */) {
      throw new Error("Primary Super Admin account cannot be suspended or rejected.");
    }
  }
  if (updates.role === "SUPER_ADMIN" /* SUPER_ADMIN */ && !isSuperAdmin({ email: existing.email, uid: existing.uid })) {
    throw new Error("Cannot assign Super Admin role to an account that is not on the trusted Super Admin allowlist.");
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const safeUpdates = {
    ...updates,
    updatedAt: now
  };
  if (updates.status === "APPROVED" /* APPROVED */ && existing.status !== "APPROVED" /* APPROVED */) {
    safeUpdates.approvedBy = actor.email;
    safeUpdates.approvedAt = now;
  }
  await col.updateOne({ uid: targetUid }, { $set: safeUpdates });
  await createAuditLog({
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: updates.status === "APPROVED" /* APPROVED */ ? "USER_APPROVED" : "USER_UPDATED",
    targetEntity: "admin_users",
    targetId: existing.email,
    details: {
      targetEmail: existing.email,
      changes: safeUpdates
    },
    ipAddress: actor.ipAddress
  });
  const updated = await col.findOne({ uid: targetUid });
  return { ...updated, _id: updated._id?.toString() };
}
async function deleteUser(targetUid, actor) {
  const client2 = await getMongoClient();
  if (!client2) {
    throw new Error("Database connection unavailable.");
  }
  const db = client2.db(DB_NAME);
  const col = db.collection(USERS_COLLECTION);
  if (!isSuperAdmin(actor)) {
    throw new Error("Only an authorized Super Admin can delete team members.");
  }
  const existing = await col.findOne({ uid: targetUid });
  if (!existing) {
    throw new Error("User not found");
  }
  if (isSuperAdmin({ email: existing.email, uid: existing.uid })) {
    throw new Error("Cannot delete primary Super Admin account.");
  }
  await col.deleteOne({ uid: targetUid });
  await createAuditLog({
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: "USER_DELETED",
    targetEntity: "admin_users",
    targetId: existing.email,
    details: { deletedUser: existing.email },
    ipAddress: actor.ipAddress
  });
  return true;
}

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "gen-lang-client-0873496318",
  appId: "1:846766419061:web:670534ad2d10b359665c3c",
  apiKey: "AIzaSyAVt73rg0rJlrfJPLIbRkp0Tz-yziobVc8",
  authDomain: "gen-lang-client-0873496318.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-226b6725-a152-4c53-a5f4-5d3db1f90902",
  storageBucket: "gen-lang-client-0873496318.firebasestorage.app",
  messagingSenderId: "846766419061",
  measurementId: ""
};

// src/lib/authMiddleware.ts
var firebaseAdminApp = getApps().length === 0 ? initializeApp({ projectId: firebase_applet_config_default.projectId }) : getApps()[0];
var adminAuth = getAuth(firebaseAdminApp);
var SECTION_PERMISSIONS_MAP = {
  hero: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CONTENT_MANAGER" /* CONTENT_MANAGER */],
  stats: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CONTENT_MANAGER" /* CONTENT_MANAGER */],
  about_leader: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CONTENT_MANAGER" /* CONTENT_MANAGER */],
  our_vision: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "RESEARCH_MANAGER" /* RESEARCH_MANAGER */],
  leadership_journey: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CONTENT_MANAGER" /* CONTENT_MANAGER */],
  daily_activities: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CONTENT_MANAGER" /* CONTENT_MANAGER */, "OFFICE_MANAGER" /* OFFICE_MANAGER */],
  monthly_activities: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CONTENT_MANAGER" /* CONTENT_MANAGER */],
  yearly_report: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CONTENT_MANAGER" /* CONTENT_MANAGER */],
  development_projects: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CONTENT_MANAGER" /* CONTENT_MANAGER */],
  peoples_voice: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "PUBLIC_RELATIONS_MANAGER" /* PUBLIC_RELATIONS_MANAGER */],
  cadre_corner: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CADRE_MANAGER" /* CADRE_MANAGER */],
  media_center: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "MEDIA_MANAGER" /* MEDIA_MANAGER */],
  social_hub: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "MEDIA_MANAGER" /* MEDIA_MANAGER */],
  upcoming_events: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "EVENT_MANAGER" /* EVENT_MANAGER */],
  volunteer_contact: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "VOLUNTEER_MANAGER" /* VOLUNTEER_MANAGER */],
  about_page: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CONTENT_MANAGER" /* CONTENT_MANAGER */],
  vision_page: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "RESEARCH_MANAGER" /* RESEARCH_MANAGER */],
  activities_page: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CONTENT_MANAGER" /* CONTENT_MANAGER */],
  development_page: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CONTENT_MANAGER" /* CONTENT_MANAGER */],
  media_page: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "MEDIA_MANAGER" /* MEDIA_MANAGER */]
};
var MAX_CACHE_SIZE = 500;
var tokenCache = /* @__PURE__ */ new Map();
function pruneTokenCache() {
  const now = Date.now();
  for (const [key, value] of tokenCache.entries()) {
    if (value.expiresAt <= now) {
      tokenCache.delete(key);
    }
  }
  if (tokenCache.size > MAX_CACHE_SIZE * 0.8) {
    const keys = Array.from(tokenCache.keys());
    const toRemove = keys.slice(0, Math.floor(MAX_CACHE_SIZE * 0.3));
    for (const k of toRemove) {
      tokenCache.delete(k);
    }
  }
}
async function verifyFirebaseIdToken(token) {
  if (!token || typeof token !== "string" || token.trim() === "") {
    return null;
  }
  const trimmedToken = token.trim();
  const cached = tokenCache.get(trimmedToken);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      uid: cached.uid,
      email: cached.email,
      email_verified: cached.email_verified,
      displayName: cached.displayName,
      exp: cached.exp
    };
  }
  try {
    const decoded = await adminAuth.verifyIdToken(trimmedToken);
    if (!decoded || !decoded.uid) {
      return null;
    }
    const verified = {
      uid: decoded.uid,
      email: (decoded.email || "").toLowerCase().trim(),
      email_verified: Boolean(decoded.email_verified),
      displayName: decoded.name || decoded.displayName || void 0,
      exp: decoded.exp
    };
    const now = Date.now();
    const tokenExpMs = decoded.exp ? decoded.exp * 1e3 : now;
    const remainingLifetimeMs = tokenExpMs - now;
    const maxTtlMs = Math.min(10 * 60 * 1e3, remainingLifetimeMs);
    if (maxTtlMs > 0) {
      if (tokenCache.size >= MAX_CACHE_SIZE) {
        pruneTokenCache();
      }
      tokenCache.set(trimmedToken, {
        ...verified,
        expiresAt: now + maxTtlMs
      });
    }
    return verified;
  } catch (err) {
    return null;
  }
}
async function resolveAuthUser(req) {
  let token = null;
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (req.headers["x-firebase-token"]) {
    token = String(req.headers["x-firebase-token"]).trim();
  }
  if (!token) {
    return null;
  }
  const verified = await verifyFirebaseIdToken(token);
  if (!verified || !verified.email) {
    return null;
  }
  if (!verified.email_verified) {
    console.warn(`[Auth] Rejected unverified email token for: ${verified.email}`);
    return null;
  }
  const email = verified.email.toLowerCase().trim();
  if (isSuperAdmin({ email, uid: verified.uid, emailVerified: verified.email_verified })) {
    const mongoUser2 = await getUserByUid(verified.uid);
    if (mongoUser2 && mongoUser2.email.toLowerCase().trim() !== email) {
      console.error(`[Auth] UID / Email binding conflict for Super Admin: ${email} vs ${mongoUser2.email}`);
      return null;
    }
    return {
      uid: verified.uid,
      email,
      displayName: verified.displayName || mongoUser2?.displayName || "Super Admin",
      role: "SUPER_ADMIN" /* SUPER_ADMIN */,
      status: "APPROVED" /* APPROVED */,
      permissions: ["*"],
      assignedSections: [...ALL_HOMEPAGE_SECTION_IDS]
    };
  }
  const mongoUser = await getUserByUid(verified.uid);
  if (!mongoUser) {
    return {
      uid: verified.uid,
      email,
      displayName: verified.displayName,
      role: "VIEWER" /* VIEWER */,
      status: "PENDING" /* PENDING */,
      permissions: [],
      assignedSections: []
    };
  }
  if (mongoUser.email.toLowerCase().trim() !== email) {
    console.error(`[Auth] UID / Email binding conflict: token email ${email} does not match record email ${mongoUser.email}`);
    return null;
  }
  return {
    uid: mongoUser.uid,
    email: mongoUser.email,
    displayName: mongoUser.displayName,
    role: mongoUser.role,
    status: mongoUser.status,
    permissions: mongoUser.permissions || [],
    assignedSections: mongoUser.assignedSections || []
  };
}
function canUserEditSection(user, sectionId) {
  if (!user) return false;
  if (user.status !== "APPROVED" /* APPROVED */) return false;
  if (user.role === "SUPER_ADMIN" /* SUPER_ADMIN */ && isSuperAdmin({ email: user.email, uid: user.uid })) return true;
  if (user.permissions && user.permissions.includes("*")) return true;
  if (user.assignedSections && user.assignedSections.includes(sectionId)) return true;
  const allowedRoles = SECTION_PERMISSIONS_MAP[sectionId] || [];
  return allowedRoles.includes(user.role);
}
async function requireAuth(req, res, next) {
  try {
    const user = await resolveAuthUser(req);
    if (!user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "A valid Google / Firebase Authorization Bearer token must be provided."
      });
    }
    if (user.status !== "APPROVED" /* APPROVED */) {
      return res.status(403).json({
        error: "Access Pending Approval",
        status: user.status,
        message: "Your account is awaiting Super Admin clearance before accessing the control center."
      });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error("[Auth] requireAuth error:", err);
    res.status(500).json({ error: "Internal authentication verification error" });
  }
}
async function requireSuperAdmin(req, res, next) {
  try {
    const user = await resolveAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!isSuperAdmin(user)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "This administrative operation strictly requires Super Admin authority."
      });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error("[Auth] requireSuperAdmin error:", err);
    res.status(500).json({ error: "Internal authorization error" });
  }
}
async function requireAdminOrSuperAdmin(req, res, next) {
  try {
    const user = await resolveAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (user.status !== "APPROVED" /* APPROVED */) {
      return res.status(403).json({ error: "Access Pending Approval" });
    }
    const isSA = isSuperAdmin(user);
    if (!isSA && user.role !== "ADMIN" /* ADMIN */) {
      return res.status(403).json({
        error: "Forbidden",
        message: "This operation requires Administrator or Super Admin privileges."
      });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error("[Auth] requireAdminOrSuperAdmin error:", err);
    res.status(500).json({ error: "Internal authorization error" });
  }
}
async function requireSectionEditPermission(req, res, next) {
  try {
    const user = await resolveAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (user.status !== "APPROVED" /* APPROVED */) {
      return res.status(403).json({ error: "Access Pending Approval" });
    }
    const sectionId = req.params.sectionId;
    if (!canUserEditSection(user, sectionId)) {
      return res.status(403).json({
        error: "Permission denied",
        message: `Account '${user.email}' (${user.role}) is not authorized to edit section '${sectionId}'.`
      });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error("[Auth] requireSectionEditPermission error:", err);
    res.status(500).json({ error: "Internal authorization error" });
  }
}
var SUBMISSION_PERMISSIONS_MAP = {
  contact: {
    roles: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "OFFICE_MANAGER" /* OFFICE_MANAGER */, "PUBLIC_RELATIONS_MANAGER" /* PUBLIC_RELATIONS_MANAGER */, "OUTREACH_MANAGER" /* OUTREACH_MANAGER */],
    permissions: ["submissions:contact", "contact", "submissions:*"],
    sections: ["volunteer_contact"]
  },
  volunteer: {
    roles: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "VOLUNTEER_MANAGER" /* VOLUNTEER_MANAGER */, "OUTREACH_MANAGER" /* OUTREACH_MANAGER */],
    permissions: ["submissions:volunteer", "volunteer", "submissions:*"],
    sections: ["volunteer_contact"]
  },
  cadre: {
    roles: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CADRE_MANAGER" /* CADRE_MANAGER */, "OFFICE_MANAGER" /* OFFICE_MANAGER */],
    permissions: ["submissions:cadre", "cadre", "submissions:*"],
    sections: ["cadre_corner"]
  },
  grievances: {
    // Highly confidential: restricted to Super Admin, Admin, and designated Office Manager / Approval Authority
    roles: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "OFFICE_MANAGER" /* OFFICE_MANAGER */, "APPROVAL_AUTHORITY" /* APPROVAL_AUTHORITY */],
    permissions: ["submissions:grievances", "grievances", "submissions:*"],
    sections: ["peoples_voice"]
  }
};
function canUserAccessSubmissionType(user, submissionType, action = "read") {
  if (!user) return false;
  if (user.status !== "APPROVED" /* APPROVED */) return false;
  if (user.role === "SUPER_ADMIN" /* SUPER_ADMIN */ && isSuperAdmin({ email: user.email, uid: user.uid })) {
    return true;
  }
  if (user.permissions && user.permissions.includes("*")) {
    return true;
  }
  const typeConfig = SUBMISSION_PERMISSIONS_MAP[submissionType];
  if (!typeConfig) {
    return false;
  }
  if (user.permissions && user.permissions.some((p) => typeConfig.permissions.includes(p))) {
    return true;
  }
  if (user.assignedSections && user.assignedSections.some((s) => typeConfig.sections.includes(s))) {
    return true;
  }
  if (action === "notes") {
    if (user.role === "ADMIN" /* ADMIN */ || user.role === "APPROVAL_AUTHORITY" /* APPROVAL_AUTHORITY */) {
      return true;
    }
    return false;
  }
  return typeConfig.roles.includes(user.role);
}
function requireSubmissionAccess(action = "read") {
  return async (req, res, next) => {
    try {
      const user = await resolveAuthUser(req);
      if (!user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "A valid Google / Firebase Authorization Bearer token must be provided."
        });
      }
      if (user.status !== "APPROVED" /* APPROVED */) {
        return res.status(403).json({
          error: "Access Pending Approval",
          status: user.status,
          message: "Your account is awaiting Super Admin clearance before accessing submissions."
        });
      }
      const type = req.params.type;
      const validTypes = ["contact", "volunteer", "cadre", "grievances"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          error: "Invalid submission type",
          message: `Supported types are: ${validTypes.join(", ")}`
        });
      }
      const isNoteUpdate = action === "write" && req.body && Boolean(req.body.note);
      const effectiveAction = isNoteUpdate ? "notes" : action;
      if (!canUserAccessSubmissionType(user, type, effectiveAction)) {
        return res.status(403).json({
          error: "Forbidden",
          message: `Account '${user.email}' (${user.role}) is not authorized to access '${type}' submissions.`
        });
      }
      req.user = user;
      next();
    } catch (err) {
      console.error("[Auth] requireSubmissionAccess error:", err);
      res.status(500).json({ error: "Internal authorization error" });
    }
  };
}

// src/serverApp.ts
var getGoogleAuth = () => {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return null;
  }
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://googleapis.com/auth/spreadsheets"]
  });
};
function createServerApp() {
  const app2 = express();
  app2.set("trust proxy", 1);
  app2.use(express.json());
  app2.use(cookieParser());
  app2.use("/api/admin", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });
  const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10);
  const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || "10", 10);
  const publicSubmissionLimiter = rateLimit({
    windowMs: rateLimitWindowMs,
    max: rateLimitMax,
    standardHeaders: true,
    // Draft-6 RateLimit-* headers
    legacyHeaders: false,
    // Disable X-RateLimit-* headers
    statusCode: 429,
    message: {
      error: "Too Many Requests",
      message: "Too many submission attempts from your IP address. Please wait a few minutes before trying again."
    },
    validate: { trustProxy: false }
  });
  const genAI = process.env.GEMINI_API_KEY ? new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } }
  }) : null;
  app2.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app2.get("/api/health/mongodb", async (_req, res) => {
    try {
      const health = await checkMongoHealth();
      if (health.status === "error") {
        return res.status(503).json(health);
      }
      if (health.status === "disconnected") {
        return res.json(health);
      }
      res.json(health);
    } catch (err) {
      const rawError = err.message || "Unknown error";
      const sanitized = rawError.replace(/\/\/[^:]+:[^@]+@/g, "//***:***@");
      res.status(500).json({ status: "error", error: sanitized });
    }
  });
  app2.post("/api/auth/sync", async (req, res) => {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : req.headers["x-firebase-token"] ? String(req.headers["x-firebase-token"]).trim() : null;
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      const verified = await verifyFirebaseIdToken(token);
      if (!verified || !verified.email) {
        return res.status(401).json({ error: "Invalid or expired Firebase ID token" });
      }
      if (!verified.email_verified) {
        return res.status(403).json({ error: "Email address must be verified by Google before accessing this system" });
      }
      const user = await syncGoogleUser({
        uid: verified.uid,
        email: verified.email,
        emailVerified: verified.email_verified,
        displayName: req.body?.displayName || verified.displayName,
        photoURL: req.body?.photoURL,
        requestedRole: req.body?.requestedRole,
        requestNotes: req.body?.requestNotes,
        ipAddress: req.ip
      });
      res.json({ success: true, user });
    } catch (err) {
      console.error("[API] Error in /api/auth/sync:", err);
      res.status(500).json({ error: err.message || "Failed to sync user" });
    }
  });
  app2.get("/api/auth/me", async (req, res) => {
    try {
      const user = await resolveAuthUser(req);
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.json({ user });
    } catch (err) {
      console.error("[API] Error in /api/auth/me:", err);
      res.status(500).json({ error: "Failed to resolve authenticated profile" });
    }
  });
  app2.get("/api/admin/users", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const filter = {
        status: req.query.status,
        search: req.query.search
      };
      const users = await getAllUsers(filter);
      res.json({ users, total: users.length });
    } catch (err) {
      console.error("[API] Error fetching admin users:", err);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  app2.put("/api/admin/users/:uid", requireSuperAdmin, async (req, res) => {
    try {
      const targetUid = req.params.uid;
      const updates = req.body;
      const actor = {
        uid: req.user.uid,
        email: req.user.email,
        role: req.user.role,
        ipAddress: req.ip
      };
      const updated = await updateUser(targetUid, updates, actor);
      res.json({ success: true, user: updated });
    } catch (err) {
      console.error("[API] Error updating user:", err);
      res.status(400).json({ error: err.message || "Failed to update user" });
    }
  });
  app2.delete("/api/admin/users/:uid", requireSuperAdmin, async (req, res) => {
    try {
      const targetUid = req.params.uid;
      const actor = {
        uid: req.user.uid,
        email: req.user.email,
        role: req.user.role,
        ipAddress: req.ip
      };
      await deleteUser(targetUid, actor);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (err) {
      console.error("[API] Error deleting user:", err);
      res.status(400).json({ error: err.message || "Failed to delete user" });
    }
  });
  app2.get("/api/admin/audit-logs", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const logs = await getAuditLogs(limit);
      res.json({ logs, total: logs.length });
    } catch (err) {
      console.error("[API] Error fetching audit logs:", err);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });
  app2.post("/api/admin/ai-insights", requireAdminOrSuperAdmin, async (req, res) => {
    if (!genAI) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }
    try {
      const { analyticsData, reportType } = req.body;
      const model = "gemini-2.5-flash";
      const prompt = `Analyze the following district portal analytics data and generate a ${reportType} report with insights on engagement, volunteer growth, and content performance. Suggest improvements for the homepage and CTAs.

Analytics Data:
${JSON.stringify(analyticsData, null, 2)}`;
      const { text } = await genAI.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });
      res.json({ report: text });
    } catch (error) {
      console.error("AI Insight Error:", error);
      res.status(500).json({ error: "Failed to generate AI report" });
    }
  });
  app2.post("/api/grievances", async (req, res) => {
    const { grievance } = req.body;
    const auth = getGoogleAuth();
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!auth || !sheetId) {
      console.log("Google Sheets not configured, skipping sync");
      return res.json({ success: true, message: "Grievance saved (Sheets sync skipped)" });
    }
    try {
      const sheets = google.sheets({ version: "v4", auth });
      const values = [
        [
          grievance?.trackingNumber || "",
          new Date(grievance?.createdAt?.seconds * 1e3 || Date.now()).toLocaleString(),
          grievance?.category || "",
          grievance?.subject || "",
          grievance?.description || "",
          grievance?.isAnonymous ? "Yes" : "No",
          grievance?.status || ""
        ]
      ];
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: "A:G",
        valueInputOption: "USER_ENTERED",
        requestBody: { values }
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Google Sheets Sync Error:", error);
      res.status(500).json({ error: "Failed to sync to Google Sheets" });
    }
  });
  app2.get("/api/public/home", async (_req, res) => {
    try {
      const data = await getPublicHomePayload();
      res.json(data);
    } catch (err) {
      console.error("[API] Error fetching public home data:", err);
      res.status(500).json({ error: "Failed to load home page content" });
    }
  });
  app2.get("/api/public/site-settings", async (_req, res) => {
    try {
      const settings = await getSiteSettings();
      res.json(settings);
    } catch (err) {
      console.error("[API] Error fetching site settings:", err);
      res.status(500).json({ error: "Failed to load site settings" });
    }
  });
  app2.get("/api/public/about", async (_req, res) => {
    try {
      const section = await getHomeSectionById("about_page");
      res.json(section || { data: {} });
    } catch (err) {
      console.error("[API] Error fetching public about data:", err);
      res.status(500).json({ error: "Failed to load about page content" });
    }
  });
  app2.get("/api/public/vision", async (_req, res) => {
    try {
      const visionSection = await getHomeSectionById("our_vision");
      const visionPageSection = await getHomeSectionById("vision_page");
      res.json({
        visionPage: visionPageSection?.data || {},
        visionSection: visionSection?.data || {}
      });
    } catch (err) {
      console.error("[API] Error fetching public vision data:", err);
      res.status(500).json({ error: "Failed to load vision page content" });
    }
  });
  app2.get("/api/public/activities", async (_req, res) => {
    try {
      const section = await getHomeSectionById("activities_page");
      res.json(section || { data: {} });
    } catch (err) {
      console.error("[API] Error fetching public activities data:", err);
      res.status(500).json({ error: "Failed to load activities page content" });
    }
  });
  app2.get("/api/public/development", async (_req, res) => {
    try {
      const section = await getHomeSectionById("development_page");
      res.json(section || { data: {} });
    } catch (err) {
      console.error("[API] Error fetching public development data:", err);
      res.status(500).json({ error: "Failed to load development page content" });
    }
  });
  app2.get("/api/public/media", async (_req, res) => {
    try {
      const section = await getHomeSectionById("media_page");
      res.json(section || { data: {} });
    } catch (err) {
      console.error("[API] Error fetching public media data:", err);
      res.status(500).json({ error: "Failed to load media page content" });
    }
  });
  app2.get("/api/admin/home/sections", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const sections = await getAllHomeSections(true);
      const enriched = sections.map((section) => ({
        ...section,
        canEdit: canUserEditSection(user, section.sectionId)
      }));
      res.json({ sections: enriched, total: enriched.length });
    } catch (err) {
      console.error("[API] Error fetching admin home sections:", err);
      res.status(500).json({ error: "Failed to fetch home sections" });
    }
  });
  app2.get("/api/admin/home/sections/:sectionId", requireAuth, async (req, res) => {
    try {
      const section = await getHomeSectionById(req.params.sectionId);
      if (!section) {
        return res.status(404).json({ error: "Section not found" });
      }
      res.json(section);
    } catch (err) {
      console.error("[API] Error fetching home section:", err);
      res.status(500).json({ error: "Failed to fetch home section" });
    }
  });
  app2.put("/api/admin/home/sections/:sectionId", requireSectionEditPermission, async (req, res) => {
    try {
      const sectionId = req.params.sectionId;
      const updates = req.body;
      const updatedBy = req.user?.email || req.user?.uid || "admin";
      const updated = await updateHomeSection(sectionId, updates, updatedBy);
      await createAuditLog({
        actorUid: req.user.uid,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: "SECTION_UPDATED",
        targetEntity: "home_sections",
        targetId: sectionId,
        details: { sectionId, changes: Object.keys(updates) },
        ipAddress: req.ip
      });
      res.json({ success: true, section: updated });
    } catch (err) {
      console.error("[API] Error updating home section:", err);
      res.status(500).json({ error: err.message || "Failed to update section" });
    }
  });
  app2.put("/api/admin/site-settings", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const updates = req.body;
      const updatedBy = req.user?.email || req.user?.uid || "admin";
      const settings = await updateSiteSettings(updates, updatedBy);
      await createAuditLog({
        actorUid: req.user.uid,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: "SITE_SETTINGS_UPDATED",
        targetEntity: "site_settings",
        targetId: "global",
        details: { changes: Object.keys(updates) },
        ipAddress: req.ip
      });
      res.json({ success: true, settings });
    } catch (err) {
      console.error("[API] Error updating site settings:", err);
      res.status(500).json({ error: err.message || "Failed to update site settings" });
    }
  });
  app2.post("/api/admin/home/seed", requireSuperAdmin, async (req, res) => {
    try {
      const force = req.body?.force === true;
      const result = await seedInitialHomeData(force);
      await createAuditLog({
        actorUid: req.user.uid,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: "HOME_DATA_SEEDED",
        targetEntity: "home_sections",
        targetId: "all",
        details: { force, sectionsCount: result.sectionsCount },
        ipAddress: req.ip
      });
      res.json({ success: true, ...result });
    } catch (err) {
      console.error("[API] Error seeding home data:", err);
      res.status(500).json({ error: err.message || "Failed to seed home data" });
    }
  });
  app2.post("/api/public/contact", publicSubmissionLimiter, async (req, res) => {
    try {
      const { fullName, mobile, subject, message } = req.body;
      if (!fullName || !mobile || !message) {
        return res.status(400).json({ error: "Missing required fields: fullName, mobile, message" });
      }
      const client2 = await getMongoClient();
      if (!client2) {
        return res.status(500).json({ error: "Database not connected" });
      }
      const db = client2.db(process.env.MONGODB_DB_NAME || "chintadaravikumar");
      const trackingNumber = `CNT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const doc = {
        trackingNumber,
        fullName: String(fullName).trim(),
        mobile: String(mobile).trim(),
        subject: String(subject || "General Inquiry").trim(),
        message: String(message).trim(),
        status: "RECEIVED",
        createdAt: /* @__PURE__ */ new Date()
      };
      await db.collection("contact_inquiries").insertOne(doc);
      res.json({ success: true, trackingNumber });
    } catch (err) {
      console.error("[API] Error saving contact inquiry:", err);
      res.status(500).json({ error: "Failed to submit contact inquiry" });
    }
  });
  app2.post("/api/public/volunteer", publicSubmissionLimiter, async (req, res) => {
    try {
      const { fullName, email, mobile, mandal, skills, experience } = req.body;
      if (!fullName || !mobile || !email) {
        return res.status(400).json({ error: "Missing required fields: fullName, email, mobile" });
      }
      const client2 = await getMongoClient();
      if (!client2) {
        return res.status(500).json({ error: "Database not connected" });
      }
      const db = client2.db(process.env.MONGODB_DB_NAME || "chintadaravikumar");
      const trackingNumber = `VOL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const doc = {
        trackingNumber,
        fullName: String(fullName).trim(),
        email: String(email).trim(),
        mobile: String(mobile).trim(),
        mandal: String(mandal || "").trim(),
        skills: skills || [],
        experience: String(experience || "").trim(),
        status: "PENDING",
        createdAt: /* @__PURE__ */ new Date()
      };
      await db.collection("volunteer_applications").insertOne(doc);
      res.json({ success: true, trackingNumber });
    } catch (err) {
      console.error("[API] Error saving volunteer application:", err);
      res.status(500).json({ error: "Failed to submit volunteer application" });
    }
  });
  app2.post("/api/public/cadre", publicSubmissionLimiter, async (req, res) => {
    try {
      const { fullName, workerId, mobile, mandal, position } = req.body;
      if (!fullName || !mobile) {
        return res.status(400).json({ error: "Missing required fields: fullName, mobile" });
      }
      const client2 = await getMongoClient();
      if (!client2) {
        return res.status(500).json({ error: "Database not connected" });
      }
      const db = client2.db(process.env.MONGODB_DB_NAME || "chintadaravikumar");
      const trackingNumber = `CDR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const doc = {
        trackingNumber,
        fullName: String(fullName).trim(),
        workerId: String(workerId || "").trim(),
        mobile: String(mobile).trim(),
        mandal: String(mandal || "").trim(),
        position: String(position || "").trim(),
        status: "PENDING",
        createdAt: /* @__PURE__ */ new Date()
      };
      await db.collection("cadre_applications").insertOne(doc);
      res.json({ success: true, trackingNumber });
    } catch (err) {
      console.error("[API] Error saving cadre application:", err);
      res.status(500).json({ error: "Failed to submit cadre application" });
    }
  });
  app2.post("/api/public/grievances", publicSubmissionLimiter, async (req, res) => {
    try {
      const { fullName, mobile, subject, category, description } = req.body;
      if (!fullName || !mobile || !description) {
        return res.status(400).json({ error: "Missing required fields: fullName, mobile, description" });
      }
      const client2 = await getMongoClient();
      if (!client2) {
        return res.status(500).json({ error: "Database not connected" });
      }
      const db = client2.db(process.env.MONGODB_DB_NAME || "chintadaravikumar");
      const trackingNumber = `GRV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const doc = {
        trackingNumber,
        fullName: String(fullName).trim(),
        mobile: String(mobile).trim(),
        subject: String(subject || "Public Grievance").trim(),
        category: String(category || "General").trim(),
        description: String(description).trim(),
        status: "RECEIVED",
        notes: [],
        createdAt: /* @__PURE__ */ new Date()
      };
      await db.collection("grievances").insertOne(doc);
      res.json({ success: true, trackingNumber });
    } catch (err) {
      console.error("[API] Error saving grievance:", err);
      res.status(500).json({ error: "Failed to submit grievance" });
    }
  });
  const COLLECTION_MAP = {
    contact: "contact_inquiries",
    volunteer: "volunteer_applications",
    cadre: "cadre_applications",
    grievances: "grievances"
  };
  app2.get("/api/admin/submissions/:type", requireSubmissionAccess("read"), async (req, res) => {
    try {
      const type = req.params.type;
      const collectionName = COLLECTION_MAP[type];
      if (!collectionName) {
        return res.status(400).json({ error: "Invalid submission type" });
      }
      const client2 = await getMongoClient();
      if (!client2) {
        return res.status(500).json({ error: "Database not connected" });
      }
      const db = client2.db(process.env.MONGODB_DB_NAME || "chintadaravikumar");
      const items = await db.collection(collectionName).find({}).sort({ createdAt: -1 }).toArray();
      res.json({ submissions: items });
    } catch (err) {
      console.error("[API] Error fetching submissions:", err);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });
  app2.get("/api/admin/submissions/:type/:id", requireSubmissionAccess("read"), async (req, res) => {
    try {
      const type = req.params.type;
      const id = req.params.id;
      const collectionName = COLLECTION_MAP[type];
      if (!collectionName) {
        return res.status(400).json({ error: "Invalid submission type" });
      }
      const client2 = await getMongoClient();
      if (!client2) {
        return res.status(500).json({ error: "Database not connected" });
      }
      const db = client2.db(process.env.MONGODB_DB_NAME || "chintadaravikumar");
      const { ObjectId } = await import("mongodb");
      let queryFilter = { trackingNumber: id };
      try {
        if (ObjectId.isValid(id)) {
          queryFilter = { $or: [{ _id: new ObjectId(id) }, { trackingNumber: id }] };
        }
      } catch {
      }
      const item = await db.collection(collectionName).findOne(queryFilter);
      if (!item) {
        return res.status(404).json({ error: "Submission not found" });
      }
      res.json({ submission: item });
    } catch (err) {
      console.error("[API] Error fetching individual submission:", err);
      res.status(500).json({ error: "Failed to fetch submission details" });
    }
  });
  app2.put("/api/admin/submissions/:type/:id", requireSubmissionAccess("write"), async (req, res) => {
    try {
      const type = req.params.type;
      const id = req.params.id;
      const collectionName = COLLECTION_MAP[type];
      if (!collectionName) {
        return res.status(400).json({ error: "Invalid submission type" });
      }
      const updates = req.body || {};
      const client2 = await getMongoClient();
      if (!client2) {
        return res.status(500).json({ error: "Database not connected" });
      }
      const db = client2.db(process.env.MONGODB_DB_NAME || "chintadaravikumar");
      const { ObjectId } = await import("mongodb");
      let queryFilter = { trackingNumber: id };
      try {
        if (ObjectId.isValid(id)) {
          queryFilter = { $or: [{ _id: new ObjectId(id) }, { trackingNumber: id }] };
        }
      } catch {
      }
      const allowedStatuses = ["RECEIVED", "UNDER_REVIEW", "ASSIGNED", "RESOLVED", "CLOSED", "PENDING", "APPROVED", "REJECTED"];
      const updateData = { updatedAt: /* @__PURE__ */ new Date() };
      if (updates.status && allowedStatuses.includes(String(updates.status).trim())) {
        updateData.status = String(updates.status).trim();
      }
      if (updates.assignedTo !== void 0) {
        updateData.assignedTo = String(updates.assignedTo || "").trim();
      }
      if (updates.note && typeof updates.note === "string" && updates.note.trim()) {
        const noteText = updates.note.trim();
        await db.collection(collectionName).updateOne(queryFilter, {
          $push: {
            notes: {
              text: noteText,
              author: req.user?.email || "admin",
              createdAt: /* @__PURE__ */ new Date()
            }
          },
          $set: updateData
        });
      } else {
        await db.collection(collectionName).updateOne(queryFilter, { $set: updateData });
      }
      await createAuditLog({
        actorUid: req.user.uid,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: "SUBMISSION_UPDATED",
        targetEntity: collectionName,
        targetId: id,
        details: { type, changes: Object.keys(updateData).filter((k) => k !== "updatedAt") },
        ipAddress: req.ip
      });
      res.json({ success: true });
    } catch (err) {
      console.error("[API] Error updating submission:", err);
      res.status(500).json({ error: "Failed to update submission" });
    }
  });
  app2.all("/api/*", (req, res) => {
    res.status(404).json({
      error: "Not Found",
      message: `Cannot ${req.method} ${req.path}`,
      path: req.path
    });
  });
  return app2;
}
var app = createServerApp();
var serverApp_default = app;

// src/api.ts
function handler(req, res) {
  if (req.url && !req.url.startsWith("/api")) {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }
  return serverApp_default(req, res);
}
export {
  handler as default
};
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Source entry point for Vercel Serverless Function (Express API).
 * Bundled by esbuild into api/index.js for zero-dependency-resolution production runtime.
 */
