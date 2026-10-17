/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Phase 4F.1E - Preview Environment Simulation & Test Database Verification
 * Validates the exact Vercel serverless application behavior when configured
 * strictly with 'chintadaravikumar_test' and isolated credentials.
 */

import http from "http";
import { MongoClient, ObjectId } from "mongodb";

// Enforce test database before importing app
process.env.MONGODB_DB_NAME = "chintadaravikumar_test";

async function runPreviewVerification() {
  console.log("=============================================================");
  console.log("PHASE 4F.1E — PREVIEW ENVIRONMENT TEST RUNNER");
  console.log("Database target: chintadaravikumar_test (Isolated Acceptance)");
  console.log("=============================================================\n");

  const testUri = process.env.MONGODB_TEST_URI?.trim();
  const prodDb = "chintadaravikumar";

  if (!testUri) {
    console.error("❌ MONGODB_TEST_URI is not set. Halting write tests for safety.");
    process.exit(1);
  }

  // Safety guard: ensure test URI does not point to production database
  if (testUri.includes(`/${prodDb}?`) || testUri.endsWith(`/${prodDb}`)) {
    console.error(`❌ MONGODB_TEST_URI points to production '${prodDb}'. Aborting.`);
    process.exit(1);
  }

  // Import app after env vars are set
  const { default: app } = await import("../src/serverApp");
  const { default: handler } = await import("../api/index");
  const { checkMongoHealth, getMongoClient } = await import("../src/lib/mongodb");

  // 1. Verify health check on chintadaravikumar_test
  console.log("1. Checking MongoDB connectivity to 'chintadaravikumar_test'...");
  const health = await checkMongoHealth();
  console.log("   Health result:", health);
  if (health.status !== "connected" || health.database !== "chintadaravikumar_test") {
    console.error("❌ Failed to connect to test database 'chintadaravikumar_test'");
    process.exit(1);
  }
  console.log("   ✅ Successfully connected to isolated acceptance database.\n");

  // Start test server using Vercel handler
  const server = http.createServer((req, res) => {
    handler(req as any, res as any);
  });

  const PORT = 3058;
  await new Promise<void>((resolve) => server.listen(PORT, () => resolve()));
  const baseUrl = `http://127.0.0.1:${PORT}`;
  console.log(`✅ Preview test server running on ${baseUrl} using api/index handler.\n`);

  const testRunId = `PREVIEW_TEST_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const createdTrackingNumbers: string[] = [];
  let allPassed = true;

  try {
    // 2. Test Public Content Endpoints
    console.log("2. Testing Public API Endpoints on Preview...");
    const publicEndpoints = [
      { name: "GET /api/health", url: `${baseUrl}/api/health`, expectedStatus: 200 },
      { name: "GET /api/health/mongodb", url: `${baseUrl}/api/health/mongodb`, expectedStatus: 200 },
      { name: "GET /api/public/site-settings", url: `${baseUrl}/api/public/site-settings`, expectedStatus: 200 },
      { name: "GET /api/public/home", url: `${baseUrl}/api/public/home`, expectedStatus: 200 },
      { name: "GET /api/public/about", url: `${baseUrl}/api/public/about`, expectedStatus: 200 },
      { name: "GET /api/public/vision", url: `${baseUrl}/api/public/vision`, expectedStatus: 200 },
      { name: "GET /api/public/activities", url: `${baseUrl}/api/public/activities`, expectedStatus: 200 },
      { name: "GET /api/public/development", url: `${baseUrl}/api/public/development`, expectedStatus: 200 },
      { name: "GET /api/public/media", url: `${baseUrl}/api/public/media`, expectedStatus: 200 },
    ];

    for (const ep of publicEndpoints) {
      const res = await fetch(ep.url);
      const contentType = res.headers.get("content-type") || "";
      const text = await res.text();
      let isJson = false;
      try {
        JSON.parse(text);
        isJson = true;
      } catch {}

      if (res.status === ep.expectedStatus && isJson) {
        console.log(`   ✅ [PASS] ${ep.name} -> HTTP ${res.status} (${contentType})`);
      } else {
        console.error(`   ❌ [FAIL] ${ep.name} -> HTTP ${res.status}, isJson=${isJson}`);
        allPassed = false;
      }
    }

    // 3. Test Unknown API Route (404 JSON, NOT SPA HTML)
    console.log("\n3. Testing Unknown API Endpoint Trapping...");
    const notFoundRes = await fetch(`${baseUrl}/api/nonexistent-preview-route`);
    const notFoundText = await notFoundRes.text();
    let notFoundJson: any = null;
    try { notFoundJson = JSON.parse(notFoundText); } catch {}
    if (notFoundRes.status === 404 && notFoundJson && notFoundJson.error === "Not Found") {
      console.log(`   ✅ [PASS] GET /api/nonexistent-preview-route -> HTTP 404 JSON (Trapped: no SPA HTML fallback)`);
    } else {
      console.error(`   ❌ [FAIL] Missing endpoint returned unexpected response:`, notFoundRes.status, notFoundText);
      allPassed = false;
    }

    // 4. Test Unauthenticated Admin Endpoints
    console.log("\n4. Testing Unauthenticated Protected Access...");
    const adminRes = await fetch(`${baseUrl}/api/admin/users`);
    const cacheHeader = adminRes.headers.get("cache-control");
    if (adminRes.status === 401 && cacheHeader?.includes("no-store")) {
      console.log(`   ✅ [PASS] GET /api/admin/users -> HTTP 401 (Cache-Control: no-store verified)`);
    } else {
      console.error(`   ❌ [FAIL] Unauthenticated admin check failed: HTTP ${adminRes.status}`);
      allPassed = false;
    }

    // 5. Test Synthetic Form Submissions & Read-Back in chintadaravikumar_test
    console.log("\n5. Testing Synthetic Form Submissions in 'chintadaravikumar_test'...");
    const directClient = await getMongoClient();
    if (!directClient) throw new Error("Could not acquire direct test client");
    const testDb = directClient.db("chintadaravikumar_test");

    // Contact
    const contactRes = await fetch(`${baseUrl}/api/public/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Preview Synthetic Citizen",
        mobile: "9876543210",
        subject: "Preview Road Maintenance",
        message: `Synthetic test message for ${testRunId}`
      })
    });
    const contactData = await contactRes.json();
    if (contactRes.status === 200 && contactData.trackingNumber) {
      createdTrackingNumbers.push(contactData.trackingNumber);
      const readBack = await testDb.collection("contact_inquiries").findOne({ trackingNumber: contactData.trackingNumber });
      if (readBack && readBack.fullName === "Preview Synthetic Citizen") {
        console.log(`   ✅ [PASS] Contact submission & read-back verified in 'chintadaravikumar_test' (${contactData.trackingNumber})`);
      } else {
        console.error("   ❌ [FAIL] Contact read-back mismatch");
        allPassed = false;
      }
    } else {
      console.error("   ❌ [FAIL] Contact submission failed:", contactRes.status, contactData);
      allPassed = false;
    }

    // Invalid Contact (Missing fields)
    const invalidContactRes = await fetch(`${baseUrl}/api/public/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "Incomplete" })
    });
    if (invalidContactRes.status === 400) {
      console.log("   ✅ [PASS] Contact invalid submission rejected with HTTP 400");
    } else {
      console.error("   ❌ [FAIL] Contact invalid submission did not return 400:", invalidContactRes.status);
      allPassed = false;
    }

    // Volunteer
    const volRes = await fetch(`${baseUrl}/api/public/volunteer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Preview Synthetic Volunteer",
        email: "preview.volunteer@example.com",
        mobile: "9876543211",
        mandal: "Gara",
        skills: ["Community Organizing"],
        experience: "Test experience"
      })
    });
    const volData = await volRes.json();
    if (volRes.status === 200 && volData.trackingNumber) {
      createdTrackingNumbers.push(volData.trackingNumber);
      const readBack = await testDb.collection("volunteer_applications").findOne({ trackingNumber: volData.trackingNumber });
      if (readBack && readBack.email === "preview.volunteer@example.com") {
        console.log(`   ✅ [PASS] Volunteer submission & read-back verified in 'chintadaravikumar_test' (${volData.trackingNumber})`);
      } else {
        console.error("   ❌ [FAIL] Volunteer read-back mismatch");
        allPassed = false;
      }
    } else {
      console.error("   ❌ [FAIL] Volunteer submission failed:", volRes.status, volData);
      allPassed = false;
    }

    // Cadre
    const cadreRes = await fetch(`${baseUrl}/api/public/cadre`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Preview Synthetic Cadre",
        workerId: "CDR-PREVIEW-01",
        mobile: "9876543212",
        mandal: "Narasannapeta",
        position: "Ward Coordinator"
      })
    });
    const cadreData = await cadreRes.json();
    if (cadreRes.status === 200 && cadreData.trackingNumber) {
      createdTrackingNumbers.push(cadreData.trackingNumber);
      const readBack = await testDb.collection("cadre_applications").findOne({ trackingNumber: cadreData.trackingNumber });
      if (readBack && readBack.workerId === "CDR-PREVIEW-01") {
        console.log(`   ✅ [PASS] Cadre submission & read-back verified in 'chintadaravikumar_test' (${cadreData.trackingNumber})`);
      } else {
        console.error("   ❌ [FAIL] Cadre read-back mismatch");
        allPassed = false;
      }
    } else {
      console.error("   ❌ [FAIL] Cadre submission failed:", cadreRes.status, cadreData);
      allPassed = false;
    }

    // Grievance
    const grvRes = await fetch(`${baseUrl}/api/public/grievances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Preview Synthetic Citizen",
        mobile: "9876543213",
        subject: "Water Supply Delay",
        category: "Drinking Water",
        description: "Synthetic grievance description for preview testing."
      })
    });
    const grvData = await grvRes.json();
    if (grvRes.status === 200 && grvData.trackingNumber) {
      createdTrackingNumbers.push(grvData.trackingNumber);
      const readBack = await testDb.collection("grievances").findOne({ trackingNumber: grvData.trackingNumber });
      if (readBack && readBack.subject === "Water Supply Delay") {
        console.log(`   ✅ [PASS] Grievance submission & read-back verified in 'chintadaravikumar_test' (${grvData.trackingNumber})`);
      } else {
        console.error("   ❌ [FAIL] Grievance read-back mismatch");
        allPassed = false;
      }
    } else {
      console.error("   ❌ [FAIL] Grievance submission failed:", grvRes.status, grvData);
      allPassed = false;
    }

    // 6. Safe Cleanup: Delete only records created by this run
    console.log("\n6. Cleaning up synthetic preview records...");
    for (const tn of createdTrackingNumbers) {
      await testDb.collection("contact_inquiries").deleteOne({ trackingNumber: tn });
      await testDb.collection("volunteer_applications").deleteOne({ trackingNumber: tn });
      await testDb.collection("cadre_applications").deleteOne({ trackingNumber: tn });
      await testDb.collection("grievances").deleteOne({ trackingNumber: tn });
    }
    console.log(`   ✅ Cleaned up ${createdTrackingNumbers.length} synthetic records from 'chintadaravikumar_test'.`);

  } catch (err: any) {
    console.error("❌ Unexpected test runner error:", err.message);
    allPassed = false;
  } finally {
    server.close();
    const activeClient = await getMongoClient();
    if (activeClient) {
      await activeClient.close().catch(() => {});
    }
  }

  console.log("\n=============================================================");
  console.log(`PREVIEW SIMULATION RESULT: ${allPassed ? "ALL TESTS PASSED ✅" : "FAILED ❌"}`);
  console.log("=============================================================\n");

  process.exit(allPassed ? 0 : 1);
}

runPreviewVerification().catch((err) => {
  console.error("Fatal preview test failure:", err);
  process.exit(1);
});
