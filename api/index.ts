/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Vercel Serverless Function entry point for Chintada Ravi Kumar Official Portal
 */

import app from "../src/serverApp";
import type { Request, Response } from "express";

export default function handler(req: Request, res: Response) {
  // Ensure the request URL preserves the /api path for Express route matching
  if (req.url && !req.url.startsWith("/api")) {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }
  return app(req, res);
}
