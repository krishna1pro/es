/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Standalone Node.js & local development server for Chintada Ravi Kumar Official Portal.
 * Uses shared app from src/serverApp.ts and mounts Vite development middleware.
 */

import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import app from "./src/serverApp";
import { ensureBaselineData } from "./src/lib/homeService";
import { bootstrapSuperAdmin } from "./src/lib/userService";

const isProd = process.env.NODE_ENV === "production";
const PORT = 3000;

async function startServer() {
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
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Auto-check and initialize MongoDB baseline if empty (local / standalone server)
    await ensureBaselineData();
    // Bootstrap Super Admin in MongoDB Atlas
    await bootstrapSuperAdmin();
  });
}

startServer();
