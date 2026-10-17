/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Source entry point for Vercel Serverless Function (Express API).
 * Bundled by esbuild into api/index.js for zero-dependency-resolution production runtime.
 */

import app from "./serverApp";
import type { Request, Response } from "express";

export default function handler(req: Request, res: Response) {
  // Ensure the request URL preserves the /api path for Express route matching
  if (req.url && !req.url.startsWith("/api")) {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }
  return app(req, res);
}
