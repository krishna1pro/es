/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import { GoogleGenAI } from "@google/genai";
import { google } from "googleapis";
import rateLimit from "express-rate-limit";
import { getMongoClient, checkMongoHealth } from "./lib/mongodb";
import {
  getPublicHomePayload,
  getSiteSettings,
  updateSiteSettings,
  getAllHomeSections,
  getHomeSectionById,
  updateHomeSection,
  seedInitialHomeData
} from "./lib/homeService";
import {
  resolveAuthUser,
  canUserEditSection,
  requireAuth,
  requireSuperAdmin,
  requireAdminOrSuperAdmin,
  requireSectionEditPermission,
  requireSubmissionAccess,
  verifyFirebaseIdToken
} from "./lib/authMiddleware";
import {
  syncGoogleUser,
  getAllUsers,
  updateUser,
  deleteUser,
  getAuditLogs,
  createAuditLog
} from "./lib/userService";
import { SectionType } from "./types/homeCms";

// Google Sheets Authorization helper
const getGoogleAuth = () => {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return null;
  }
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://googleapis.com/auth/spreadsheets"]
  });
};

export function createServerApp() {
  const app = express();

  // Trust proxy for Vercel and reverse-proxy deployment (1 hop)
  app.set("trust proxy", 1);

  app.use(express.json());
  app.use(cookieParser());

  // Security: Prevent Vercel Edge caching on private administrative and submission endpoints
  app.use("/api/admin", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });

  // Configurable Rate Limiting for Public Submissions (Default 10 per 15 min per IP)
  const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10);
  const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || "10", 10);

  const publicSubmissionLimiter = rateLimit({
    windowMs: rateLimitWindowMs,
    max: rateLimitMax,
    standardHeaders: true, // Draft-6 RateLimit-* headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    statusCode: 429,
    message: {
      error: "Too Many Requests",
      message: "Too many submission attempts from your IP address. Please wait a few minutes before trying again."
    },
    validate: { trustProxy: false }
  });

  // Gemini Setup
  const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      })
    : null;

  // ==========================================
  // HEALTH & DIAGNOSTIC ENDPOINTS
  // ==========================================

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/health/mongodb", async (_req, res) => {
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
      const rawError = (err as Error).message || "Unknown error";
      const sanitized = rawError.replace(/\/\/[^:]+:[^@]+@/g, "//***:***@");
      res.status(500).json({ status: "error", error: sanitized });
    }
  });

  // ==========================================
  // AUTHENTICATION & TEAM IDENTITY ENDPOINTS
  // ==========================================

  // Sync Google user with MongoDB Atlas upon frontend sign-in
  app.post("/api/auth/sync", async (req, res) => {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7).trim()
        : (req.headers["x-firebase-token"] ? String(req.headers["x-firebase-token"]).trim() : null);

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
      res.status(500).json({ error: (err as Error).message || "Failed to sync user" });
    }
  });

  // Current User profile verification
  app.get("/api/auth/me", async (req, res) => {
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

  // ==========================================
  // SUPER ADMIN USER MANAGEMENT ENDPOINTS
  // ==========================================

  // List all users from MongoDB
  app.get("/api/admin/users", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const filter = {
        status: req.query.status as string,
        search: req.query.search as string
      };
      const users = await getAllUsers(filter);
      res.json({ users, total: users.length });
    } catch (err) {
      console.error("[API] Error fetching admin users:", err);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Update user role, status or section permissions (Super Admin only)
  app.put("/api/admin/users/:uid", requireSuperAdmin, async (req, res) => {
    try {
      const targetUid = req.params.uid;
      const updates = req.body;
      const actor = {
        uid: req.user!.uid,
        email: req.user!.email,
        role: req.user!.role as string,
        ipAddress: req.ip
      };

      const updated = await updateUser(targetUid, updates, actor);
      res.json({ success: true, user: updated });
    } catch (err) {
      console.error("[API] Error updating user:", err);
      res.status(400).json({ error: (err as Error).message || "Failed to update user" });
    }
  });

  // Delete user (Super Admin only, protected against deleting primary Super Admin)
  app.delete("/api/admin/users/:uid", requireSuperAdmin, async (req, res) => {
    try {
      const targetUid = req.params.uid;
      const actor = {
        uid: req.user!.uid,
        email: req.user!.email,
        role: req.user!.role as string,
        ipAddress: req.ip
      };

      await deleteUser(targetUid, actor);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (err) {
      console.error("[API] Error deleting user:", err);
      res.status(400).json({ error: (err as Error).message || "Failed to delete user" });
    }
  });

  // Fetch recent audit logs (Admin/Super Admin only)
  app.get("/api/admin/audit-logs", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await getAuditLogs(limit);
      res.json({ logs, total: logs.length });
    } catch (err) {
      console.error("[API] Error fetching audit logs:", err);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // AI Insights Endpoint
  app.post("/api/admin/ai-insights", requireAdminOrSuperAdmin, async (req, res) => {
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

  // Google Sheets Grievance Sync
  app.post("/api/grievances", async (req, res) => {
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
          new Date(grievance?.createdAt?.seconds * 1000 || Date.now()).toLocaleString(),
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

  // ==========================================
  // MONGODB HOME PAGE CMS & SETTINGS ENDPOINTS
  // ==========================================

  // Public: Aggregated Home Page Content (Cached)
  app.get("/api/public/home", async (_req, res) => {
    try {
      const data = await getPublicHomePayload();
      res.json(data);
    } catch (err) {
      console.error("[API] Error fetching public home data:", err);
      res.status(500).json({ error: "Failed to load home page content" });
    }
  });

  // Public: Global Site Settings
  app.get("/api/public/site-settings", async (_req, res) => {
    try {
      const settings = await getSiteSettings();
      res.json(settings);
    } catch (err) {
      console.error("[API] Error fetching site settings:", err);
      res.status(500).json({ error: "Failed to load site settings" });
    }
  });

  // Public: About Page Content
  app.get("/api/public/about", async (_req, res) => {
    try {
      const section = await getHomeSectionById("about_page");
      res.json(section || { data: {} });
    } catch (err) {
      console.error("[API] Error fetching public about data:", err);
      res.status(500).json({ error: "Failed to load about page content" });
    }
  });

  // Public: Vision Page Content (reusing our_vision as single source of truth)
  app.get("/api/public/vision", async (_req, res) => {
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

  // Public: Activities Page Content
  app.get("/api/public/activities", async (_req, res) => {
    try {
      const section = await getHomeSectionById("activities_page");
      res.json(section || { data: {} });
    } catch (err) {
      console.error("[API] Error fetching public activities data:", err);
      res.status(500).json({ error: "Failed to load activities page content" });
    }
  });

  // Public: Development Page Content
  app.get("/api/public/development", async (_req, res) => {
    try {
      const section = await getHomeSectionById("development_page");
      res.json(section || { data: {} });
    } catch (err) {
      console.error("[API] Error fetching public development data:", err);
      res.status(500).json({ error: "Failed to load development page content" });
    }
  });

  // Public: Media Center Page Content
  app.get("/api/public/media", async (_req, res) => {
    try {
      const section = await getHomeSectionById("media_page");
      res.json(section || { data: {} });
    } catch (err) {
      console.error("[API] Error fetching public media data:", err);
      res.status(500).json({ error: "Failed to load media page content" });
    }
  });

  // Admin: Get all home sections (with metadata & edit permission flags)
  app.get("/api/admin/home/sections", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
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

  // Admin: Get single home section
  app.get("/api/admin/home/sections/:sectionId", requireAuth, async (req, res) => {
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

  // Admin: Update single home section (Protected by RBAC)
  app.put("/api/admin/home/sections/:sectionId", requireSectionEditPermission, async (req, res) => {
    try {
      const sectionId = req.params.sectionId as SectionType;
      const updates = req.body;
      const updatedBy = req.user?.email || req.user?.uid || "admin";
      const updated = await updateHomeSection(sectionId, updates, updatedBy);

      // Audit log section update
      await createAuditLog({
        actorUid: req.user!.uid,
        actorEmail: req.user!.email,
        actorRole: req.user!.role as string,
        action: "SECTION_UPDATED",
        targetEntity: "home_sections",
        targetId: sectionId,
        details: { sectionId, changes: Object.keys(updates) },
        ipAddress: req.ip
      });

      res.json({ success: true, section: updated });
    } catch (err) {
      console.error("[API] Error updating home section:", err);
      res.status(500).json({ error: (err as Error).message || "Failed to update section" });
    }
  });

  // Admin: Update Site Settings (Protected by Admin/Super Admin)
  app.put("/api/admin/site-settings", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const updates = req.body;
      const updatedBy = req.user?.email || req.user?.uid || "admin";
      const settings = await updateSiteSettings(updates, updatedBy);

      // Audit log site settings update
      await createAuditLog({
        actorUid: req.user!.uid,
        actorEmail: req.user!.email,
        actorRole: req.user!.role as string,
        action: "SITE_SETTINGS_UPDATED",
        targetEntity: "site_settings",
        targetId: "global",
        details: { changes: Object.keys(updates) },
        ipAddress: req.ip
      });

      res.json({ success: true, settings });
    } catch (err) {
      console.error("[API] Error updating site settings:", err);
      res.status(500).json({ error: (err as Error).message || "Failed to update site settings" });
    }
  });

  // Admin: Seed or re-seed baseline home data into MongoDB Atlas (Super Admin only)
  app.post("/api/admin/home/seed", requireSuperAdmin, async (req, res) => {
    try {
      const force = req.body?.force === true;
      const result = await seedInitialHomeData(force);

      await createAuditLog({
        actorUid: req.user!.uid,
        actorEmail: req.user!.email,
        actorRole: req.user!.role as string,
        action: "HOME_DATA_SEEDED",
        targetEntity: "home_sections",
        targetId: "all",
        details: { force, sectionsCount: result.sectionsCount },
        ipAddress: req.ip
      });

      res.json({ success: true, ...result });
    } catch (err) {
      console.error("[API] Error seeding home data:", err);
      res.status(500).json({ error: (err as Error).message || "Failed to seed home data" });
    }
  });

  // ==========================================
  // PUBLIC FORM SUBMISSION ENDPOINTS (RATE LIMITED)
  // ==========================================

  app.post("/api/public/contact", publicSubmissionLimiter, async (req, res) => {
    try {
      const { fullName, mobile, subject, message } = req.body;
      if (!fullName || !mobile || !message) {
        return res.status(400).json({ error: "Missing required fields: fullName, mobile, message" });
      }
      const client = await getMongoClient();
      if (!client) {
        return res.status(500).json({ error: "Database not connected" });
      }
      const db = client.db(process.env.MONGODB_DB_NAME || "chintadaravikumar");
      const trackingNumber = `CNT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const doc = {
        trackingNumber,
        fullName: String(fullName).trim(),
        mobile: String(mobile).trim(),
        subject: String(subject || "General Inquiry").trim(),
        message: String(message).trim(),
        status: "RECEIVED",
        createdAt: new Date()
      };
      await db.collection("contact_inquiries").insertOne(doc);
      res.json({ success: true, trackingNumber });
    } catch (err) {
      console.error("[API] Error saving contact inquiry:", err);
      res.status(500).json({ error: "Failed to submit contact inquiry" });
    }
  });

  app.post("/api/public/volunteer", publicSubmissionLimiter, async (req, res) => {
    try {
      const { fullName, email, mobile, mandal, skills, experience } = req.body;
      if (!fullName || !mobile || !email) {
        return res.status(400).json({ error: "Missing required fields: fullName, email, mobile" });
      }
      const client = await getMongoClient();
      if (!client) {
        return res.status(500).json({ error: "Database not connected" });
      }
      const db = client.db(process.env.MONGODB_DB_NAME || "chintadaravikumar");
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
        createdAt: new Date()
      };
      await db.collection("volunteer_applications").insertOne(doc);
      res.json({ success: true, trackingNumber });
    } catch (err) {
      console.error("[API] Error saving volunteer application:", err);
      res.status(500).json({ error: "Failed to submit volunteer application" });
    }
  });

  app.post("/api/public/cadre", publicSubmissionLimiter, async (req, res) => {
    try {
      const { fullName, workerId, mobile, mandal, position } = req.body;
      if (!fullName || !mobile) {
        return res.status(400).json({ error: "Missing required fields: fullName, mobile" });
      }
      const client = await getMongoClient();
      if (!client) {
        return res.status(500).json({ error: "Database not connected" });
      }
      const db = client.db(process.env.MONGODB_DB_NAME || "chintadaravikumar");
      const trackingNumber = `CDR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const doc = {
        trackingNumber,
        fullName: String(fullName).trim(),
        workerId: String(workerId || "").trim(),
        mobile: String(mobile).trim(),
        mandal: String(mandal || "").trim(),
        position: String(position || "").trim(),
        status: "PENDING",
        createdAt: new Date()
      };
      await db.collection("cadre_applications").insertOne(doc);
      res.json({ success: true, trackingNumber });
    } catch (err) {
      console.error("[API] Error saving cadre application:", err);
      res.status(500).json({ error: "Failed to submit cadre application" });
    }
  });

  app.post("/api/public/grievances", publicSubmissionLimiter, async (req, res) => {
    try {
      const { fullName, mobile, subject, category, description } = req.body;
      if (!fullName || !mobile || !description) {
        return res.status(400).json({ error: "Missing required fields: fullName, mobile, description" });
      }
      const client = await getMongoClient();
      if (!client) {
        return res.status(500).json({ error: "Database not connected" });
      }
      const db = client.db(process.env.MONGODB_DB_NAME || "chintadaravikumar");
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
        createdAt: new Date()
      };
      await db.collection("grievances").insertOne(doc);
      res.json({ success: true, trackingNumber });
    } catch (err) {
      console.error("[API] Error saving grievance:", err);
      res.status(500).json({ error: "Failed to submit grievance" });
    }
  });

  // ==========================================
  // ADMIN SUBMISSIONS MANAGEMENT (GRANULAR RBAC)
  // ==========================================

  const COLLECTION_MAP: Record<string, string> = {
    contact: "contact_inquiries",
    volunteer: "volunteer_applications",
    cadre: "cadre_applications",
    grievances: "grievances"
  };

  // List submissions with type-specific RBAC (Default Deny)
  app.get("/api/admin/submissions/:type", requireSubmissionAccess("read"), async (req, res) => {
    try {
      const type = req.params.type;
      const collectionName = COLLECTION_MAP[type];
      if (!collectionName) {
        return res.status(400).json({ error: "Invalid submission type" });
      }
      const client = await getMongoClient();
      if (!client) {
        return res.status(500).json({ error: "Database not connected" });
      }
      const db = client.db(process.env.MONGODB_DB_NAME || "chintadaravikumar");
      const items = await db.collection(collectionName).find({}).sort({ createdAt: -1 }).toArray();
      res.json({ submissions: items });
    } catch (err) {
      console.error("[API] Error fetching submissions:", err);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  // Individual submission details with type-specific RBAC & IDOR protection
  app.get("/api/admin/submissions/:type/:id", requireSubmissionAccess("read"), async (req, res) => {
    try {
      const type = req.params.type;
      const id = req.params.id;
      const collectionName = COLLECTION_MAP[type];
      if (!collectionName) {
        return res.status(400).json({ error: "Invalid submission type" });
      }
      const client = await getMongoClient();
      if (!client) {
        return res.status(500).json({ error: "Database not connected" });
      }
      const db = client.db(process.env.MONGODB_DB_NAME || "chintadaravikumar");

      const { ObjectId } = await import("mongodb");
      let queryFilter: any = { trackingNumber: id };
      try {
        if (ObjectId.isValid(id)) {
          queryFilter = { $or: [{ _id: new ObjectId(id) }, { trackingNumber: id }] };
        }
      } catch {}

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

  // Update submission with type-specific RBAC & strict field whitelist
  app.put("/api/admin/submissions/:type/:id", requireSubmissionAccess("write"), async (req, res) => {
    try {
      const type = req.params.type;
      const id = req.params.id;
      const collectionName = COLLECTION_MAP[type];
      if (!collectionName) {
        return res.status(400).json({ error: "Invalid submission type" });
      }
      const updates = req.body || {};
      const client = await getMongoClient();
      if (!client) {
        return res.status(500).json({ error: "Database not connected" });
      }
      const db = client.db(process.env.MONGODB_DB_NAME || "chintadaravikumar");

      const { ObjectId } = await import("mongodb");
      let queryFilter: any = { trackingNumber: id };
      try {
        if (ObjectId.isValid(id)) {
          queryFilter = { $or: [{ _id: new ObjectId(id) }, { trackingNumber: id }] };
        }
      } catch {}

      // Strict field whitelisting to prevent parameter pollution or overwriting protected attributes
      const allowedStatuses = ["RECEIVED", "UNDER_REVIEW", "ASSIGNED", "RESOLVED", "CLOSED", "PENDING", "APPROVED", "REJECTED"];
      const updateData: any = { updatedAt: new Date() };

      if (updates.status && allowedStatuses.includes(String(updates.status).trim())) {
        updateData.status = String(updates.status).trim();
      }
      if (updates.assignedTo !== undefined) {
        updateData.assignedTo = String(updates.assignedTo || "").trim();
      }

      if (updates.note && typeof updates.note === "string" && updates.note.trim()) {
        const noteText = updates.note.trim();
        await db.collection(collectionName).updateOne(queryFilter, {
          $push: {
            notes: {
              text: noteText,
              author: req.user?.email || "admin",
              createdAt: new Date()
            }
          } as any,
          $set: updateData
        });
      } else {
        await db.collection(collectionName).updateOne(queryFilter, { $set: updateData });
      }

      await createAuditLog({
        actorUid: req.user!.uid,
        actorEmail: req.user!.email,
        actorRole: req.user!.role as string,
        action: "SUBMISSION_UPDATED",
        targetEntity: collectionName,
        targetId: id,
        details: { type, changes: Object.keys(updateData).filter(k => k !== "updatedAt") },
        ipAddress: req.ip
      });

      res.json({ success: true });
    } catch (err) {
      console.error("[API] Error updating submission:", err);
      res.status(500).json({ error: "Failed to update submission" });
    }
  });

  // ==========================================
  // CATCH-ALL 404 FOR UNKNOWN API ENDPOINTS
  // Prevents falling through to SPA index.html
  // ==========================================
  app.all("/api/*", (req, res) => {
    res.status(404).json({
      error: "Not Found",
      message: `Cannot ${req.method} ${req.path}`,
      path: req.path
    });
  });

  return app;
}

const app = createServerApp();
export default app;
