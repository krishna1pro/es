import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import cookieParser from "cookie-parser";
import session from "express-session";
import { google } from "googleapis";
import { getMongoClient } from "./src/lib/mongodb";

const isProd = process.env.NODE_ENV === "production";
const PORT = 3000;

// Google Sheets Authorization
const getGoogleAuth = () => {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return null;
  }
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });
};

async function startServer() {
  const app = express();
  
  app.use(express.json());
  app.use(cookieParser());
  
  // Configure session for cross-origin iframe
  app.use(session({
    secret: "district-portal-secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true,
      sameSite: "none",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Gemini Setup
  const genAI = process.env.GEMINI_API_KEY 
    ? new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      })
    : null;

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/health/mongodb", async (req, res) => {
    try {
      const client = await getMongoClient();
      if (!client) {
        return res.json({ status: "disconnected", message: "MONGODB_URI not provided" });
      }
      res.json({ status: "connected" });
    } catch (err) {
      res.status(500).json({ status: "error", error: (err as Error).message });
    }
  });

  // AI Insights Endpoint
  app.post("/api/admin/ai-insights", async (req, res) => {
    if (!genAI) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }
    
    try {
      const { analyticsData, reportType } = req.body;
      const model = "gemini-1.5-flash";
      
      const prompt = `Analyze the following district portal analytics data and generate a ${reportType} report with insights on engagement, volunteer growth, and content performance. Suggest improvements for the homepage and CTAs.
      
      Analytics Data:
      ${JSON.stringify(analyticsData, null, 2)}`;

      const { text } = await genAI.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
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
          grievance.trackingNumber,
          new Date(grievance.createdAt?.seconds * 1000 || Date.now()).toLocaleString(),
          grievance.category,
          grievance.subject,
          grievance.description,
          grievance.isAnonymous ? "Yes" : "No",
          grievance.status
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

  // Vite middleware for development
  if (!isProd) {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true",
        watch: process.env.DISABLE_HMR === "true" ? null : {},
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
