/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Phase 4F.1D - Vercel Serverless Function & Express App Migration Test Runner
 * Tests the shared serverApp and the Vercel function handler in api/index.ts.
 */

import http from "http";
import app from "../src/serverApp";
import handler from "../api/index";

async function runMigrationTests() {
  console.log("=============================================================");
  console.log("PHASE 4F.1D — VERCEL SERVERLESS FUNCTION INTEGRATION TEST");
  console.log("=============================================================");

  // Create test server wrapping the Vercel handler
  const server = http.createServer((req, res) => {
    handler(req as any, res as any);
  });

  const PORT = 3056;
  await new Promise<void>((resolve) => server.listen(PORT, () => resolve()));
  const baseUrl = `http://127.0.0.1:${PORT}`;
  console.log(`✅ Test server running on ${baseUrl} using api/index handler.\n`);

  let allPassed = true;

  const testCases = [
    // 1. Health check
    {
      name: "GET /api/health",
      url: `${baseUrl}/api/health`,
      method: "GET",
      expectedStatus: 200,
      validate: (data: any, headers: Headers) => {
        if (data.status !== "ok") throw new Error("Expected status: ok");
        if (!headers.get("content-type")?.includes("application/json")) throw new Error("Expected application/json");
      }
    },
    // 2. Public Site Settings
    {
      name: "GET /api/public/site-settings",
      url: `${baseUrl}/api/public/site-settings`,
      method: "GET",
      expectedStatus: 200,
      validate: (data: any, headers: Headers) => {
        if (!data || typeof data !== "object") throw new Error("Expected site-settings object");
        if (!headers.get("content-type")?.includes("application/json")) throw new Error("Expected JSON content-type");
      }
    },
    // 3. Public Home Page Content
    {
      name: "GET /api/public/home",
      url: `${baseUrl}/api/public/home`,
      method: "GET",
      expectedStatus: 200,
      validate: (data: any, headers: Headers) => {
        if (!data || typeof data !== "object") throw new Error("Expected home page payload");
        if (!headers.get("content-type")?.includes("application/json")) throw new Error("Expected JSON content-type");
      }
    },
    // 4. Public About Page Content
    {
      name: "GET /api/public/about",
      url: `${baseUrl}/api/public/about`,
      method: "GET",
      expectedStatus: 200,
      validate: (data: any) => {
        if (!data) throw new Error("Expected about data object");
      }
    },
    // 5. Public Vision Page Content
    {
      name: "GET /api/public/vision",
      url: `${baseUrl}/api/public/vision`,
      method: "GET",
      expectedStatus: 200,
      validate: (data: any) => {
        if (!data.visionPage || !data.visionSection) throw new Error("Expected visionPage and visionSection");
      }
    },
    // 6. Public Activities Page Content
    {
      name: "GET /api/public/activities",
      url: `${baseUrl}/api/public/activities`,
      method: "GET",
      expectedStatus: 200,
      validate: (data: any) => {
        if (!data) throw new Error("Expected activities data object");
      }
    },
    // 7. Public Development Page Content
    {
      name: "GET /api/public/development",
      url: `${baseUrl}/api/public/development`,
      method: "GET",
      expectedStatus: 200,
      validate: (data: any) => {
        if (!data) throw new Error("Expected development data object");
      }
    },
    // 8. Public Media Center Page Content
    {
      name: "GET /api/public/media",
      url: `${baseUrl}/api/public/media`,
      method: "GET",
      expectedStatus: 200,
      validate: (data: any) => {
        if (!data) throw new Error("Expected media data object");
      }
    },
    // 9. Unknown API Endpoint (Should return 404 JSON, NOT SPA HTML)
    {
      name: "GET /api/nonexistent-endpoint (404 JSON verification)",
      url: `${baseUrl}/api/nonexistent-endpoint`,
      method: "GET",
      expectedStatus: 404,
      validate: (data: any, headers: Headers) => {
        if (data.error !== "Not Found") throw new Error(`Expected error: Not Found, got: ${data.error}`);
        if (!headers.get("content-type")?.includes("application/json")) throw new Error("Expected JSON, not HTML!");
      }
    },
    // 10. Unauthenticated Protected Endpoint: GET /api/admin/users
    {
      name: "GET /api/admin/users (Unauthenticated check)",
      url: `${baseUrl}/api/admin/users`,
      method: "GET",
      expectedStatus: 401,
      validate: (data: any, headers: Headers) => {
        if (!data.error) throw new Error("Expected error message for unauthenticated request");
        const cacheControl = headers.get("cache-control");
        if (!cacheControl || !cacheControl.includes("no-store")) {
          throw new Error(`Expected Cache-Control: no-store, got: ${cacheControl}`);
        }
      }
    },
    // 11. Unauthenticated Protected Submission: GET /api/admin/submissions/grievances
    {
      name: "GET /api/admin/submissions/grievances (Unauthenticated RBAC check)",
      url: `${baseUrl}/api/admin/submissions/grievances`,
      method: "GET",
      expectedStatus: 401,
      validate: (data: any, headers: Headers) => {
        if (!data.error) throw new Error("Expected error for unauthenticated access");
        const cacheControl = headers.get("cache-control");
        if (!cacheControl || !cacheControl.includes("no-store")) {
          throw new Error(`Expected Cache-Control: no-store, got: ${cacheControl}`);
        }
      }
    },
    // 12. Invalid Contact Form Submission
    {
      name: "POST /api/public/contact (Validation check - missing fields)",
      url: `${baseUrl}/api/public/contact`,
      method: "POST",
      body: { fullName: "Incomplete Input" },
      expectedStatus: 400,
      validate: (data: any) => {
        if (!data.error || !data.error.includes("Missing required fields")) {
          throw new Error(`Expected missing fields error, got: ${data.error}`);
        }
      }
    },
    // 13. Invalid Volunteer Form Submission
    {
      name: "POST /api/public/volunteer (Validation check - missing fields)",
      url: `${baseUrl}/api/public/volunteer`,
      method: "POST",
      body: { fullName: "Incomplete" },
      expectedStatus: 400,
      validate: (data: any) => {
        if (!data.error) throw new Error("Expected error for incomplete submission");
      }
    },
    // 14. Invalid Grievance Form Submission
    {
      name: "POST /api/public/grievances (Validation check - missing description)",
      url: `${baseUrl}/api/public/grievances`,
      method: "POST",
      body: { fullName: "Citizen", mobile: "9876543210" },
      expectedStatus: 400,
      validate: (data: any) => {
        if (!data.error) throw new Error("Expected error for missing description");
      }
    }
  ];

  for (const tc of testCases) {
    try {
      const res = await fetch(tc.url, {
        method: tc.method,
        headers: { "Content-Type": "application/json" },
        body: tc.body ? JSON.stringify(tc.body) : undefined
      });

      const contentType = res.headers.get("content-type") || "";
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }

      if (res.status !== tc.expectedStatus) {
        console.error(`❌ [FAIL] ${tc.name}: Expected status ${tc.expectedStatus}, got ${res.status}`);
        console.error("   Response body:", text.substring(0, 200));
        allPassed = false;
        continue;
      }

      if (tc.validate) {
        tc.validate(data, res.headers);
      }

      console.log(`✅ [PASS] ${tc.name} -> HTTP ${res.status} (${contentType})`);
    } catch (err: any) {
      console.error(`❌ [ERROR] ${tc.name}:`, err.message);
      allPassed = false;
    }
  }

  // 15. Test URL Path Normalization in api/index.ts
  // Simulates Vercel rewrite where req.url was stripped to /public/site-settings
  console.log("\nTesting Vercel rewrite URL path normalization...");
  try {
    const rawReq = new http.IncomingMessage({} as any);
    rawReq.url = "/public/site-settings";
    rawReq.method = "GET";

    const normalizedPromise = new Promise<{ status: number; body: string }>((resolve) => {
      const fakeRes: any = {
        statusCode: 200,
        headers: {},
        setHeader(k: string, v: string) { this.headers[k] = v; },
        getHeader(k: string) { return this.headers[k]; },
        status(code: number) { this.statusCode = code; return this; },
        json(data: any) { resolve({ status: this.statusCode, body: JSON.stringify(data) }); },
        send(data: any) { resolve({ status: this.statusCode, body: String(data) }); },
        end() { resolve({ status: this.statusCode, body: "" }); }
      };

      handler(rawReq as any, fakeRes as any);
    });

    const normalizedResult = await normalizedPromise;
    if (normalizedResult.status === 200) {
      console.log("✅ [PASS] URL Path Normalization: Rewritten '/public/site-settings' correctly resolved to '/api/public/site-settings'");
    } else {
      console.error(`❌ [FAIL] URL Path Normalization failed with status ${normalizedResult.status}`);
      allPassed = false;
    }
  } catch (err: any) {
    console.error("❌ [ERROR] URL Path Normalization error:", err.message);
    allPassed = false;
  }

  server.close();

  const { getMongoClient } = await import("../src/lib/mongodb");
  const client = await getMongoClient();
  if (client) {
    await client.close().catch(() => {});
  }

  console.log("\n=============================================================");
  console.log(`FINAL RESULT: ${allPassed ? "ALL TESTS PASSED ✅" : "SOME TESTS FAILED ❌"}`);
  console.log("=============================================================\n");

  process.exit(allPassed ? 0 : 1);
}

runMigrationTests().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
