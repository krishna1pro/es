/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import { GoogleGenAI } from "@google/genai";
import { google } from "googleapis";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { getMongoClient, checkMongoHealth, getMongoDbName } from "./lib/mongodb";
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
  requireMediaAccess,
  requireSegmentAccess,
  verifyFirebaseIdToken
} from "./lib/authMiddleware";
import {
  getMediaItems,
  getMediaItemById,
  createMediaItem,
  updateMediaItem,
  deleteMediaItem,
  getSocialChannels,
  getSocialChannelById,
  createSocialChannel,
  updateSocialChannel,
  deleteSocialChannel,
  getMediaActivityLogs,
  getMediaPermissions,
  getSegmentPermissions,
  grantSegmentPermission,
  revokeSegmentPermission,
  checkUserSegmentPermission,
  validateSpreadsheet,
  isSheetsConfigured,
  invalidateAllMediaCaches,
  sanitizePublicMediaItem,
  VALID_MEDIA_SEGMENTS
} from "./lib/mediaService";
import {
  syncGoogleUser,
  getAllUsers,
  updateUser,
  deleteUser,
  getAuditLogs,
  createAuditLog,
  getUserByUid,
  isSuperAdmin
} from "./lib/userService";
import { SectionType } from "./types/homeCms";
import {
  createOAuthTransaction,
  consumeOAuthTransaction,
  encryptToken,
  createResumableUploadSession,
  verifyUploadedDriveFile,
  deleteDriveFile,
  streamDriveFile,
  getShortLivedPickerToken,
  ALLOWED_MIME_TYPES,
  AllowedMimeType,
  sanitizeFileName,
  DEFAULT_DRIVE_FOLDER_ID,
  DriveIntegrationError
} from "./lib/driveAuth";

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

  // Public: Media Center Page Content (Homepage Section)
  // Combines presentation metadata from MongoDB home_sections with authoritative published items from Google Sheets MediaItems
  app.get("/api/public/media", async (_req, res) => {
    try {
      const section = await getHomeSectionById("media_page");
      let authoritativeItems: any[];

      try {
        const { items } = await getMediaItems({
          status: "PUBLISHED",
          showOnHomeOnly: true,
          limit: 12
        });
        authoritativeItems = items;
      } catch (sheetErr: any) {
        console.error("[API] Authoritative Sheets fetch failed for homepage media:", sheetErr);
        return res.status(503).json({
          error: "Service Unavailable",
          message: "Authoritative media storage is temporarily unavailable"
        });
      }

      // Merge layout metadata from MongoDB with authoritative Sheet items without modifying MongoDB
      // If Sheets succeeds but returns no eligible records, items is strictly [] (never falling back to MongoDB items)
      // Strip private driveFileId and direct driveViewUrl to keep internal storage opaque
      const mergedSection = {
        ...(section || { sectionId: "media_page", name: "Media Center", enabled: true }),
        data: {
          ...(section?.data || {}),
          items: authoritativeItems.map(sanitizePublicMediaItem)
        }
      };

      res.json(mergedSection);
    } catch (err) {
      console.error("[API] Error fetching public media data:", err);
      res.status(500).json({ error: "Failed to load media page content" });
    }
  });

  // ==========================================
  // MEDIA CENTER & SOCIAL HUB PUBLIC APIS
  // ==========================================

  // Public: List media items with filtering and search (Authoritative from MediaItems sheet)
  // Strips private driveFileId and direct driveViewUrl to keep internal storage opaque
  app.get("/api/public/media/items", async (req, res) => {
    try {
      const { category, type, search, limit, offset } = req.query;
      const result = await getMediaItems({
        category: category as string,
        mediaType: type as string,
        status: "PUBLISHED",
        search: search as string,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
        includeDeleted: false
      });
      res.json({
        ...result,
        items: result.items.map(sanitizePublicMediaItem)
      });
    } catch (err: any) {
      console.error("[API] Error fetching public media items:", err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to load media items" });
    }
  });

  // Public: Single media item by ID
  app.get("/api/public/media/items/:id", async (req, res) => {
    try {
      const item = await getMediaItemById(req.params.id);
      if (!item || item.status !== "PUBLISHED") {
        return res.status(404).json({ error: "Media item not found or not published" });
      }
      res.json({ item: sanitizePublicMediaItem(item) });
    } catch (err: any) {
      console.error("[API] Error fetching public media item:", err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to load media item" });
    }
  });

  // Public: Media streaming via opaque media ID with HTTP byte-range support
  // Enforces published status (rejects DRAFT, ARCHIVED, DELETED with 404)
  // Completely hides underlying Google Drive file IDs and private URLs
  app.get("/api/public/media/stream/:opaqueId", async (req, res) => {
    try {
      const item = await getMediaItemById(req.params.opaqueId);
      if (!item || item.status !== "PUBLISHED") {
        return res.status(404).json({ error: "Media item not found or not published" });
      }

      if (!item.driveFileId) {
        return res.status(404).json({ error: "Media file unavailable in storage" });
      }

      const streamResult = await streamDriveFile(item.driveFileId, req.headers.range as string);

      for (const [key, value] of Object.entries(streamResult.headers)) {
        res.setHeader(key, value);
      }

      res.status(streamResult.status);
      streamResult.stream.pipe(res);
    } catch (err: any) {
      if (err.statusCode === 416) {
        res.status(416);
        if (err.details?.totalSize) {
          res.setHeader("Content-Range", `bytes */${err.details.totalSize}`);
        }
        return res.end();
      }
      console.error("[API] Error streaming public media:", err.message);
      const status = err.statusCode || 500;
      res.status(status).json({
        error: err.statusCode === 404 ? "Media file not found" : "Failed to stream media"
      });
    }
  });

  // Public: Active Social Channels (Authoritative from SocialChannels sheet)
  app.get("/api/public/social/channels", async (req, res) => {
    try {
      const showOnHome = req.query.home === "true";
      const channels = await getSocialChannels({
        onlyEnabled: true,
        showOnHomeOnly: showOnHome,
        includeDeleted: false
      });
      const resultChannels = showOnHome ? channels.slice(0, 4) : channels;
      res.json({ channels: resultChannels });
    } catch (err: any) {
      console.error("[API] Error fetching public social channels:", err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to load social channels" });
    }
  });

  app.get("/api/public/social", async (req, res) => {
    try {
      const showOnHome = req.query.home === "true" || req.query.limit === "4";
      const channels = await getSocialChannels({
        onlyEnabled: true,
        showOnHomeOnly: showOnHome,
        includeDeleted: false
      });
      const resultChannels = showOnHome ? channels.slice(0, 4) : channels;
      res.json({ channels: resultChannels });
    } catch (err: any) {
      console.error("[API] Error fetching public social hub:", err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to load social hub" });
    }
  });

  // ==========================================
  // MEDIA CENTER & SOCIAL HUB ADMINISTRATIVE APIS
  // ==========================================

  // Admin: Get media items (supports all statuses including drafts and soft-deleted)
  app.get("/api/admin/media/items", requireMediaAccess, async (req, res) => {
    try {
      const user = req.user!;
      const { category, type, status, search, limit, offset, includeDeleted } = req.query;

      if (!isSuperAdmin(user)) {
        if (category) {
          const hasPerm = await checkUserSegmentPermission(user, category as string, "read");
          if (!hasPerm) {
            return res.status(403).json({
              error: "Forbidden",
              message: `Account '${user.email}' lacks 'read' permission for media segment '${category}'.`
            });
          }
        } else {
          const grants = await getSegmentPermissions();
          const userGrants = grants.filter(
            (g) =>
              g.status === "ACTIVE" &&
              g.canRead &&
              ((user.email && g.userEmail.toLowerCase() === user.email.toLowerCase()) ||
                (user.uid && g.userUid === user.uid))
          );
          if (userGrants.length === 0) {
            return res.status(403).json({
              error: "Forbidden",
              message: `Account '${user.email}' lacks read permission for any media segment.`
            });
          }
          const allowedSegments = userGrants.map((g) => g.segment);
          const result = await getMediaItems({
            category: category as string,
            mediaType: type as string,
            status: status as string,
            search: search as string,
            limit: 1000,
            includeDeleted: includeDeleted === "true"
          });
          const filteredItems = result.items.filter((item) => allowedSegments.includes(item.category));
          const offsetNum = offset ? parseInt(offset as string, 10) : 0;
          const limitNum = limit ? parseInt(limit as string, 10) : 50;
          return res.json({
            items: filteredItems.slice(offsetNum, offsetNum + limitNum),
            total: filteredItems.length
          });
        }
      }

      const result = await getMediaItems({
        category: category as string,
        mediaType: type as string,
        status: status as string,
        search: search as string,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
        includeDeleted: includeDeleted === "true"
      });
      res.json(result);
    } catch (err: any) {
      console.error("[API] Error fetching admin media items:", err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to load media items" });
    }
  });

  // Admin: Get single media item
  app.get("/api/admin/media/items/:id", requireMediaAccess, async (req, res) => {
    try {
      const item = await getMediaItemById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Media item not found" });
      }
      const user = req.user!;
      if (!isSuperAdmin(user)) {
        const hasPerm = await checkUserSegmentPermission(user, item.category, "read");
        if (!hasPerm) {
          return res.status(403).json({
            error: "Forbidden",
            message: `Account '${user.email}' lacks 'read' permission for media segment '${item.category}'.`
          });
        }
      }
      res.json({ item });
    } catch (err: any) {
      console.error("[API] Error fetching media item:", err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to load media item" });
    }
  });

  // Admin: Create media item (Enforces segment create rights & appends to MediaItems and ActivityLog)
  app.post(
    "/api/admin/media/items",
    requireMediaAccess,
    requireSegmentAccess((req) => req.body?.category || "PHOTO_GALLERY", "create"),
    async (req, res) => {
      try {
        const user = req.user!;
        const {
          title,
          type,
          mediaType,
          category,
          description,
          caption,
          imageUrl,
          img,
          publicMediaUrl,
          thumbnailUrl,
          driveFileId,
          driveFileName,
          driveViewUrl,
          date,
          status,
          sortOrder,
          order,
          showOnHome
        } = req.body;

        if (!title || typeof title !== "string" || !title.trim()) {
          return res.status(400).json({ error: "A valid title is required" });
        }

        const resolvedType = mediaType || type;
        if (!resolvedType || typeof resolvedType !== "string" || !resolvedType.trim()) {
          return res.status(400).json({ error: "A valid media type (e.g. PHOTO, VIDEO, PRESS, REPORT) is required" });
        }

        const result = await createMediaItem(
          {
            title,
            mediaType: resolvedType,
            category,
            description: description || caption,
            publicMediaUrl: publicMediaUrl || imageUrl || img,
            thumbnailUrl: thumbnailUrl || imageUrl || img,
            driveFileId,
            driveFileName,
            driveViewUrl,
            status,
            sortOrder: sortOrder ?? order,
            showOnHome: Boolean(showOnHome)
          },
          {
            uid: user.uid,
            email: user.email,
            role: user.role as string,
            name: user.displayName,
            ipAddress: req.ip,
            requestId: (req.headers["x-request-id"] as string) || undefined
          }
        );

        if (result.warning) {
          return res.status(207).json({
            success: true,
            partialSuccess: true,
            item: result.item,
            warning: result.warning,
            auditLogged: result.auditLogged
          });
        }

        res.status(201).json({ success: true, item: result.item, auditLogged: result.auditLogged });
      } catch (err: any) {
        console.error("[API] Error creating media item:", err);
        const status = err.statusCode || 500;
        res.status(status).json({ error: err.message || "Failed to create media item" });
      }
    }
  );

  // Admin: Initiate Google Drive Resumable Upload
  // Creates a server-controlled draft record in Google Sheets MediaItems and initiates a direct Drive resumable upload session
  // File bytes bypass Vercel serverless proxy limits and upload directly to Google's HTTPS endpoint
  app.post(
    "/api/admin/media/upload",
    requireMediaAccess,
    requireSegmentAccess((req) => req.body?.category || "PHOTO_GALLERY", "create"),
    async (req, res) => {
      try {
        const user = req.user!;
        const {
          category,
          title,
          description,
          filename,
          fileName,
          mimeType,
          fileSize,
          declaredSize,
          showOnHome,
          sortOrder,
          order
        } = req.body;

        const effectiveName = (filename || fileName || "").trim();
        const effectiveSize = Number(fileSize || declaredSize || 0);

        if (!title || typeof title !== "string" || !title.trim()) {
          return res.status(400).json({ error: "Title is required" });
        }
        if (title.trim().length > 200) {
          return res.status(400).json({ error: "Title cannot exceed 200 characters" });
        }

        const categoryUpper = String(category || "PHOTO_GALLERY").trim().toUpperCase().replace(/\s+/g, "_");
        if (!VALID_MEDIA_SEGMENTS.includes(categoryUpper as any)) {
          return res.status(400).json({
            error: "Invalid category",
            message: `Category must be one of: ${VALID_MEDIA_SEGMENTS.join(", ")}`
          });
        }

        if (!mimeType || !(mimeType in ALLOWED_MIME_TYPES)) {
          return res.status(400).json({
            error: "Unsupported MIME type",
            message: `Allowed MIME types: ${Object.keys(ALLOWED_MIME_TYPES).join(", ")}`
          });
        }

        const mimeRule = ALLOWED_MIME_TYPES[mimeType as AllowedMimeType];
        if (effectiveSize <= 0) {
          return res.status(400).json({ error: "File size must be greater than 0 bytes" });
        }
        if (effectiveSize > mimeRule.maxSize) {
          return res.status(400).json({
            error: "File size exceeds limit",
            message: `Maximum allowed size for ${mimeType} is ${Math.round(mimeRule.maxSize / (1024 * 1024))} MB`
          });
        }

        const sanitizedFileName = sanitizeFileName(effectiveName || `upload_${Date.now()}`);
        const mediaId = `med_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

        // Initiate resumable upload session with Google Drive (strictly bound to DEFAULT_DRIVE_FOLDER_ID)
        let session: { uploadUrl: string; mediaId: string; expiresIn: number };
        try {
          session = await createResumableUploadSession({
            mediaId,
            fileName: sanitizedFileName,
            mimeType,
            fileSize: effectiveSize,
            category: categoryUpper,
            uploadedByUid: user.uid,
            uploadedByEmail: user.email
          });
        } catch (driveErr: any) {
          console.error("[API] Failed to create Drive upload session:", driveErr);
          const status = driveErr.statusCode || 502;
          return res.status(status).json({
            error: "Drive Upload Initiation Failed",
            message: driveErr.message
          });
        }

        // Persist initial draft metadata record in Google Sheets MediaItems
        try {
          await createMediaItem(
            {
              mediaId,
              category: categoryUpper,
              mediaType: mimeRule.type,
              title: title.trim(),
              description: description ? String(description).trim() : "",
              driveFileId: "", // Empty until verified at completion
              driveFileName: sanitizedFileName,
              driveViewUrl: "",
              publicMediaUrl: `/api/public/media/stream/${mediaId}`,
              thumbnailUrl: "",
              showOnHome: Boolean(showOnHome),
              status: "DRAFT", // Uploads strictly begin in DRAFT status
              sortOrder: sortOrder ?? order ?? 0
            },
            {
              uid: user.uid,
              email: user.email,
              role: user.role as string,
              name: user.displayName,
              ipAddress: req.ip,
              requestId: (req.headers["x-request-id"] as string) || undefined
            }
          );
        } catch (sheetErr: any) {
          console.error("[API] Failed to record draft in Google Sheets:", sheetErr);
          return res.status(sheetErr.statusCode || 503).json({
            error: "Service Unavailable",
            message: "Failed to persist draft media record to Google Sheets"
          });
        }

        res.setHeader("Cache-Control", "no-store");
        res.status(201).json({
          success: true,
          mediaId,
          uploadUrl: session.uploadUrl,
          headers: {
            "Content-Type": mimeType
          },
          expiresIn: session.expiresIn,
          message: "Resumable upload session created. Upload bytes directly to uploadUrl, then call /complete."
        });
      } catch (err: any) {
        console.error("[API] Unexpected error in /api/admin/media/upload:", err);
        const status = err.statusCode || 500;
        res.status(status).json({ error: err.message || "Failed to initiate media upload" });
      }
    }
  );

  // Admin: Finalize Google Drive Upload
  // Verifies the completed file in Google Drive, confirms folder and mediaId identity, and links metadata in Google Sheets
  app.post("/api/admin/media/upload/:mediaId/complete", requireMediaAccess, async (req, res) => {
    const actorContext = {
      uid: req.user!.uid,
      email: req.user!.email,
      role: req.user!.role as string,
      name: req.user!.displayName,
      ipAddress: req.ip,
      requestId: (req.headers["x-request-id"] as string) || undefined
    };

    try {
      const user = req.user!;
      const existing = await getMediaItemById(req.params.mediaId);
      if (!existing) {
        return res.status(404).json({ error: "Media record not found" });
      }

      // Authorization: Super Admin, or creator with create permission for the category
      if (!isSuperAdmin(user)) {
        const hasPerm = await checkUserSegmentPermission(user, existing.category, "create");
        if (!hasPerm) {
          return res.status(403).json({
            error: "Forbidden",
            message: `Account '${user.email}' lacks create permission for media segment '${existing.category}'.`
          });
        }
        const isCreator =
          (existing.createdByUid && existing.createdByUid === user.uid) ||
          (existing.createdByEmail && existing.createdByEmail.toLowerCase() === user.email.toLowerCase());
        if (!isCreator && user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
          return res.status(403).json({
            error: "Forbidden",
            message: "Only the initiating creator or an administrator can finalize this upload."
          });
        }
      }

      // Check status & idempotency
      if (existing.status === "DELETED") {
        return res.status(400).json({ error: "Cannot finalize a deleted upload record" });
      }
      if (existing.driveFileId && existing.status !== "DRAFT") {
        // Idempotent: already verified and finalized
        return res.json({
          success: true,
          item: existing,
          message: "Upload has already been finalized."
        });
      }

      // Independently verify file in Google Drive
      let verified: any;
      try {
        verified = await verifyUploadedDriveFile({
          mediaId: existing.mediaId,
          fileId: req.body?.driveFileId,
          expectedFolderId: DEFAULT_DRIVE_FOLDER_ID
        });
      } catch (driveErr: any) {
        console.error("[API] Drive file verification failed during upload finalization:", driveErr);
        return res.status(driveErr.statusCode || 400).json({
          error: "Drive Verification Failed",
          message: driveErr.message
        });
      }

      // Update MediaItems row in Google Sheets
      try {
        const result = await updateMediaItem(
          existing.mediaId,
          {
            driveFileId: verified.fileId,
            driveFileName: verified.fileName,
            driveViewUrl: verified.driveViewUrl,
            publicMediaUrl: `/api/public/media/stream/${existing.mediaId}`,
            status: "DRAFT" // Stays in DRAFT until explicitly published by user
          },
          actorContext
        );

        res.json({
          success: true,
          item: result.item,
          auditLogged: result.auditLogged,
          warning: result.warning,
          message: "Drive upload verified and finalized. Media record is saved in DRAFT status."
        });
      } catch (persistErr: any) {
        console.error("[API] Sheets persistence failed during finalization. Executing safe rollback:", persistErr);
        // Safe rollback: delete the verified Drive file and soft-delete draft record
        const driveDeleted = await deleteDriveFile(verified.fileId);
        let sheetDeleted = false;
        try {
          await deleteMediaItem(existing.mediaId, actorContext);
          sheetDeleted = true;
        } catch {}

        return res.status(503).json({
          error: "Finalization Persistence Failed",
          message: "Failed to persist verified media metadata to Google Sheets. Safe rollback executed.",
          cleanup: {
            driveFileDeleted: driveDeleted,
            draftSoftDeleted: sheetDeleted
          }
        });
      }
    } catch (err: any) {
      console.error("[API] Unexpected error in /api/admin/media/upload/:mediaId/complete:", err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to finalize upload" });
    }
  });

  // Admin: Cancel Upload & Cleanup Draft
  app.post("/api/admin/media/upload/:mediaId/cancel", requireMediaAccess, async (req, res) => {
    const actorContext = {
      uid: req.user!.uid,
      email: req.user!.email,
      role: req.user!.role as string,
      name: req.user!.displayName,
      ipAddress: req.ip,
      requestId: (req.headers["x-request-id"] as string) || undefined
    };

    try {
      const user = req.user!;
      const existing = await getMediaItemById(req.params.mediaId);
      if (!existing) {
        return res.status(404).json({ error: "Media record not found" });
      }

      if (!isSuperAdmin(user)) {
        const hasPerm = await checkUserSegmentPermission(user, existing.category, "edit");
        if (!hasPerm) {
          return res.status(403).json({
            error: "Forbidden",
            message: `Account '${user.email}' lacks edit permission for media segment '${existing.category}'.`
          });
        }
      }

      if (existing.driveFileId) {
        await deleteDriveFile(existing.driveFileId);
      }

      await deleteMediaItem(existing.mediaId, actorContext);

      res.json({
        success: true,
        message: "Upload cancelled, associated Drive file removed, and draft soft-deleted."
      });
    } catch (err: any) {
      console.error("[API] Error cancelling upload:", err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to cancel upload" });
    }
  });

  // Admin: Update media item (Enforces segment edit rights & updates MediaItems row)
  app.put("/api/admin/media/items/:id", requireMediaAccess, async (req, res) => {
    try {
      const user = req.user!;
      const existing = await getMediaItemById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Media item not found" });
      }

      if (!isSuperAdmin(user)) {
        const hasEditPerm = await checkUserSegmentPermission(user, existing.category, "edit");
        if (!hasEditPerm) {
          return res.status(403).json({
            error: "Forbidden",
            message: `Account '${user.email}' lacks 'edit' permission for media segment '${existing.category}'.`
          });
        }
        if (req.body?.category) {
          const targetCat = req.body.category.toUpperCase().replace(/\s+/g, "_");
          if (targetCat !== existing.category) {
            const hasTargetPerm = await checkUserSegmentPermission(user, targetCat, "edit");
            if (!hasTargetPerm) {
              return res.status(403).json({
                error: "Forbidden",
                message: `Account '${user.email}' lacks 'edit' permission for destination media segment '${targetCat}'.`
              });
            }
          }
        }
      }

      const result = await updateMediaItem(
        req.params.id,
        req.body,
        {
          uid: user.uid,
          email: user.email,
          role: user.role as string,
          ipAddress: req.ip,
          requestId: (req.headers["x-request-id"] as string) || undefined
        }
      );

      if (result.warning) {
        return res.status(207).json({
          success: true,
          partialSuccess: true,
          item: result.item,
          warning: result.warning,
          auditLogged: result.auditLogged
        });
      }

      res.json({ success: true, item: result.item, auditLogged: result.auditLogged });
    } catch (err: any) {
      console.error("[API] Error updating media item:", err);
      const status = err.message?.includes("not found") ? 404 : err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to update media item" });
    }
  });

  // Admin: Soft-delete media item (Sets status = 'DELETED', showOnHome = FALSE, never deletes row)
  app.delete("/api/admin/media/items/:id", requireMediaAccess, async (req, res) => {
    try {
      const user = req.user!;
      const existing = await getMediaItemById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Media item not found" });
      }

      if (!isSuperAdmin(user)) {
        const hasDeletePerm = await checkUserSegmentPermission(user, existing.category, "delete");
        if (!hasDeletePerm) {
          return res.status(403).json({
            error: "Forbidden",
            message: `Account '${user.email}' lacks 'delete' permission for media segment '${existing.category}'.`
          });
        }
      }

      const result = await deleteMediaItem(
        req.params.id,
        {
          uid: user.uid,
          email: user.email,
          role: user.role as string,
          ipAddress: req.ip,
          requestId: (req.headers["x-request-id"] as string) || undefined
        }
      );
      res.json({
        success: true,
        message: "Media item soft-deleted successfully (row preserved in MediaItems)",
        auditLogged: result.auditLogged,
        warning: result.warning
      });
    } catch (err: any) {
      console.error("[API] Error deleting media item:", err);
      const status = err.message?.includes("not found") ? 404 : err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to delete media item" });
    }
  });

  // Admin: Get all social channels
  app.get(
    "/api/admin/social/channels",
    requireMediaAccess,
    requireSegmentAccess("SOCIAL_HUB", "read"),
    async (req, res) => {
      try {
        const includeDeleted = req.query.includeDeleted === "true";
        const channels = await getSocialChannels({ includeDeleted });
        res.json({ channels });
      } catch (err: any) {
        console.error("[API] Error fetching admin social channels:", err);
        const status = err.statusCode || 500;
        res.status(status).json({ error: err.message || "Failed to load social channels" });
      }
    }
  );

  // Admin: Get single social channel
  app.get(
    "/api/admin/social/channels/:id",
    requireMediaAccess,
    requireSegmentAccess("SOCIAL_HUB", "read"),
    async (req, res) => {
      try {
        const channel = await getSocialChannelById(req.params.id);
        if (!channel) {
          return res.status(404).json({ error: "Social channel not found" });
        }
        res.json({ channel });
      } catch (err: any) {
        console.error("[API] Error fetching social channel:", err);
        const status = err.statusCode || 500;
        res.status(status).json({ error: err.message || "Failed to load social channel" });
      }
    }
  );

  // Admin: Create social channel
  app.post(
    "/api/admin/social/channels",
    requireMediaAccess,
    requireSegmentAccess("SOCIAL_HUB", "create"),
    async (req, res) => {
      try {
        const user = req.user!;
        const { name, displayName, platform, url, enabled, showOnHome, homepagePosition, sortOrder, order } = req.body;

        const finalName = displayName || name;
        if (!finalName || typeof finalName !== "string" || !finalName.trim()) {
          return res.status(400).json({ error: "Channel display name is required" });
        }

        const result = await createSocialChannel(
          {
            displayName: finalName,
            platform: platform || "OTHER",
            url: url || "",
            enabled: enabled !== false,
            showOnHome: Boolean(showOnHome),
            homepagePosition: homepagePosition || 0,
            sortOrder: sortOrder ?? order ?? 0
          },
          {
            uid: user.uid,
            email: user.email,
            role: user.role as string,
            ipAddress: req.ip,
            requestId: (req.headers["x-request-id"] as string) || undefined
          }
        );

        res.status(201).json({
          success: true,
          channel: result.channel,
          auditLogged: result.auditLogged,
          warning: result.warning
        });
      } catch (err: any) {
        console.error("[API] Error creating social channel:", err);
        const status = err.statusCode || 500;
        res.status(status).json({ error: err.message || "Failed to create social channel" });
      }
    }
  );

  // Admin: Update social channel
  app.put(
    "/api/admin/social/channels/:id",
    requireMediaAccess,
    requireSegmentAccess("SOCIAL_HUB", "edit"),
    async (req, res) => {
      try {
        const user = req.user!;
        const result = await updateSocialChannel(
          req.params.id,
          req.body,
          {
            uid: user.uid,
            email: user.email,
            role: user.role as string,
            ipAddress: req.ip,
            requestId: (req.headers["x-request-id"] as string) || undefined
          }
        );
        res.json({
          success: true,
          channel: result.channel,
          auditLogged: result.auditLogged,
          warning: result.warning
        });
      } catch (err: any) {
        console.error("[API] Error updating social channel:", err);
        const status = err.message?.includes("not found") ? 404 : err.statusCode || 500;
        res.status(status).json({ error: err.message || "Failed to update social channel" });
      }
    }
  );

  // Admin: Soft-delete social channel (Sets status = 'DELETED', enabled = FALSE, showOnHome = FALSE)
  app.delete(
    "/api/admin/social/channels/:id",
    requireMediaAccess,
    requireSegmentAccess("SOCIAL_HUB", "delete"),
    async (req, res) => {
      try {
        const user = req.user!;
        const result = await deleteSocialChannel(
          req.params.id,
          {
            uid: user.uid,
            email: user.email,
            role: user.role as string,
            ipAddress: req.ip,
            requestId: (req.headers["x-request-id"] as string) || undefined
          }
        );
        res.json({
          success: true,
          message: "Social channel soft-deleted successfully (row preserved in SocialChannels)",
          auditLogged: result.auditLogged,
          warning: result.warning
        });
      } catch (err: any) {
        console.error("[API] Error deleting social channel:", err);
        const status = err.message?.includes("not found") ? 404 : err.statusCode || 500;
        res.status(status).json({ error: err.message || "Failed to delete social channel" });
      }
    }
  );

  // Admin: Media Permissions Matrix & Active Grants
  app.get("/api/admin/media/permissions", requireMediaAccess, async (_req, res) => {
    try {
      const grants = await getSegmentPermissions();
      res.json({
        matrix: getMediaPermissions(),
        grants: grants.filter((g) => g.status === "ACTIVE")
      });
    } catch (err: any) {
      console.error("[API] Error fetching permissions:", err);
      res.json({ matrix: getMediaPermissions(), grants: [] });
    }
  });

  // Admin: Grant Segment Permission (Super Admin only)
  app.post("/api/admin/media/permissions/grant", requireSuperAdmin, async (req, res) => {
    try {
      const user = req.user!;
      const { userUid, userEmail, segment, canRead, canCreate, canEdit, canDelete } = req.body;

      if (!userEmail || !segment) {
        return res.status(400).json({ error: "userEmail and segment are required" });
      }

      const result = await grantSegmentPermission(
        { userUid: userUid || "", userEmail, segment, canRead, canCreate, canEdit, canDelete },
        { uid: user.uid, email: user.email, role: user.role as string, ipAddress: req.ip }
      );

      res.status(201).json(result);
    } catch (err: any) {
      console.error("[API] Error granting permission:", err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to grant segment permission" });
    }
  });

  // Admin: Revoke Segment Permission (Super Admin only - updates status to 'REVOKED')
  app.delete("/api/admin/media/permissions/:id", requireSuperAdmin, async (req, res) => {
    try {
      const user = req.user!;
      const result = await revokeSegmentPermission(req.params.id, {
        uid: user.uid,
        email: user.email,
        role: user.role as string,
        ipAddress: req.ip
      });
      res.json({ success: true, message: "Permission grant revoked (status set to REVOKED in MediaPermissions)" });
    } catch (err: any) {
      console.error("[API] Error revoking permission:", err);
      const status = err.message?.includes("not found") ? 404 : err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to revoke permission" });
    }
  });

  // Admin: Media Activity Logs from Google Sheets ActivityLog tab
  app.get("/api/admin/media/activity", requireMediaAccess, async (req, res) => {
    try {
      const user = req.user!;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const segment = req.query.segment as string;

      if (!isSuperAdmin(user)) {
        if (segment) {
          const hasPerm = await checkUserSegmentPermission(user, segment, "read");
          if (!hasPerm) {
            return res.status(403).json({
              error: "Forbidden",
              message: `Account '${user.email}' lacks 'read' permission for media segment '${segment}'.`
            });
          }
        } else {
          const grants = await getSegmentPermissions();
          const userGrants = grants.filter(
            (g) =>
              g.status === "ACTIVE" &&
              g.canRead &&
              ((user.email && g.userEmail.toLowerCase() === user.email.toLowerCase()) ||
                (user.uid && g.userUid === user.uid))
          );
          if (userGrants.length === 0) {
            return res.status(403).json({
              error: "Forbidden",
              message: `Account '${user.email}' lacks read permission for any media segment.`
            });
          }
          const allowedSegments = userGrants.map((g) => g.segment);
          const logs = await getMediaActivityLogs({
            limit: 200,
            actorRole: user.role as string,
            actorUid: user.uid
          });
          const filteredLogs = logs.filter((l) => !l.segment || allowedSegments.includes(l.segment));
          return res.json({ logs: filteredLogs.slice(0, limit) });
        }
      }

      const logs = await getMediaActivityLogs({
        limit,
        segment,
        actorRole: user.role as string,
        actorUid: user.uid
      });
      res.json({ logs });
    } catch (err: any) {
      console.error("[API] Error fetching media activity logs:", err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to load media activity logs" });
    }
  });

  // Admin: Validate Google Sheets Setup & Tabs Status
  app.get("/api/admin/media/sheets/status", requireMediaAccess, async (_req, res) => {
    try {
      const configured = isSheetsConfigured();
      if (!configured) {
        return res.json({
          configured: false,
          message: "Google Sheets integration is not configured. Missing GOOGLE_SHEET_ID or service account key."
        });
      }

      const status = await validateSpreadsheet();
      res.json({
        configured: true,
        ...status
      });
    } catch (err: any) {
      res.json({
        configured: true,
        valid: false,
        error: err.message,
        details: err.details
      });
    }
  });

  // Admin: Spreadsheet Health & Cache Invalidation Operation
  // Note: Converted from MongoDB-to-Sheets export into cache purge & Sheets validation
  app.post("/api/admin/media/sync", requireMediaAccess, async (_req, res) => {
    try {
      invalidateAllMediaCaches();
      const configured = isSheetsConfigured();
      let health: any = { configured };
      if (configured) {
        health = await validateSpreadsheet();
      }
      res.json({
        success: true,
        message: "Media in-memory caches purged. Google Sheets authoritative state verified.",
        health
      });
    } catch (err: any) {
      console.error("[API] Error in media sync/health check:", err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || "Spreadsheet validation failed" });
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
  // MEDIA CENTER & SOCIAL HUB (DRIVE/SHEETS)
  // ==========================================

  app.get("/api/public/config", (_req, res) => {
    res.json({
      pickerApiKey: process.env.GOOGLE_PICKER_API_KEY,
      projectNumber: process.env.GOOGLE_CLOUD_PROJECT_NUMBER
    });
  });

  // Admin: Check Google Drive integration connection status
  app.get("/api/admin/drive/status", requireAdminOrSuperAdmin, async (_req, res) => {
    try {
      const client = await getMongoClient();
      if (!client) {
        return res.json({ connected: false, message: "Database unavailable" });
      }
      const db = client.db(getMongoDbName());
      const credentials = await db.collection("integration_credentials").find({ active: { $ne: false } }).toArray();

      if (credentials.length === 0) {
        return res.json({ connected: false, message: "No authorized Google Drive integration found" });
      }

      const primary = credentials.find((c) => c.isPrimary === true) || credentials[0];
      res.json({
        connected: true,
        primary: Boolean(primary.isPrimary),
        email: primary.email || "",
        updatedAt: primary.updatedAt || null,
        totalIntegrations: credentials.length
      });
    } catch (err: any) {
      res.status(500).json({ connected: false, error: err.message });
    }
  });

  // Admin: Short-lived access token for Google Picker (Super Admin only)
  // Strictly returns short-lived token and public config. Never exposes refresh tokens or secrets.
  app.get("/api/admin/drive/picker-token", requireSuperAdmin, async (req, res) => {
    try {
      const tokenData = await getShortLivedPickerToken(req.user!.uid);
      res.setHeader("Cache-Control", "no-store");
      res.json(tokenData);
    } catch (err: any) {
      console.error("[API] Error generating picker token:", err.message);
      const status = err.statusCode || 500;
      res.status(status).json({
        error: "Picker Token Generation Failed",
        message: err.message
      });
    }
  });

  app.get("/api/admin/drive/auth", requireSuperAdmin, async (req, res) => {
    const state = crypto.randomBytes(32).toString("hex");
    const secureState = await createOAuthTransaction(req.user!.uid, state);
    
    // Cookie with Lax, HttpOnly, Secure
    res.cookie("oauth_state", secureState, { 
      httpOnly: true, secure: true, sameSite: "lax", maxAge: 600000, path: "/api/admin/drive/callback" 
    });
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      `${process.env.SITE_URL}/api/admin/drive/callback`
    );
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/drive.file"],
      state: secureState
    });
    res.json({ authUrl });
  });

  app.get("/api/admin/drive/callback", async (req, res) => {
    const { code, state, error } = req.query;
    const cookieState = req.cookies.oauth_state;

    if (error) {
       res.clearCookie("oauth_state", { path: "/api/admin/drive/callback" });
       return res.status(400).json({ error });
    }
    
    // 1. Validate state against cookie and consume transaction
    if (!state || state !== cookieState) {
        return res.status(403).json({ error: "Invalid state" });
    }
    const uid = await consumeOAuthTransaction(state as string);
    res.clearCookie("oauth_state", { path: "/api/admin/drive/callback" });
    
    if (!uid) return res.status(403).json({ error: "Expired or invalid transaction" });

    // 2. Re-verify Super Admin role
    try {
        const user = await getUserByUid(uid);
        if (!user || user.role !== "SUPER_ADMIN") {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // 3. Exchange code
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_DRIVE_CLIENT_ID,
            process.env.GOOGLE_DRIVE_CLIENT_SECRET,
            `${process.env.SITE_URL}/api/admin/drive/callback`
        );
        const { tokens } = await oauth2Client.getToken(code as string);
        
        // 4. Encrypt and store refresh token safely with deterministic primary flag
        const client = await getMongoClient();
        if (!client) {
            throw new Error("Database unavailable for credential persistence");
        }
        const db = client.db(getMongoDbName());

        // Demote other integration credentials to ensure single unambiguous primary
        await db.collection("integration_credentials").updateMany({}, { $set: { isPrimary: false } });

        if (tokens.refresh_token) {
            await db.collection("integration_credentials").updateOne(
                { uid },
                {
                  $set: {
                    refreshToken: encryptToken(tokens.refresh_token),
                    updatedAt: new Date(),
                    isPrimary: true,
                    active: true,
                    email: user.email || ""
                  }
                },
                { upsert: true }
            );
        } else {
            // If Google omitted a replacement refresh_token, verify an existing token is already stored
            const existing = await db.collection("integration_credentials").findOne({ uid });
            if (!existing?.refreshToken) {
                throw new Error("No refresh token received and no existing credentials found");
            }
            await db.collection("integration_credentials").updateOne(
                { uid },
                {
                  $set: {
                    updatedAt: new Date(),
                    isPrimary: true,
                    active: true,
                    email: user.email || ""
                  }
                }
            );
        }

        res.redirect("/admin/media");
    } catch (err) {
        res.status(500).json({ error: "Failed to finalize connection" });
    }
  });

  // CATCH-ALL 404 FOR UNKNOWN API ENDPOINTS
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
