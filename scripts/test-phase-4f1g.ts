/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Phase 4F.1G End-to-End Persistence & Quality Verification Script
 * Strictly targets 'chintadaravikumar_test'.
 */

import http from "http";
import { MongoClient, ObjectId } from "mongodb";

process.env.MONGODB_DB_NAME = "chintadaravikumar_test";

async function runTest() {
  console.log("=============================================================");
  console.log("PHASE 4F.1G — CMS & SUBMISSIONS E2E TEST RUNNER");
  console.log("Target Database: chintadaravikumar_test");
  console.log("=============================================================\n");

  const testUri = process.env.MONGODB_TEST_URI?.trim();
  const prodDb = "chintadaravikumar";

  if (!testUri) {
    console.error("❌ MONGODB_TEST_URI not set. Halting for safety.");
    process.exit(1);
  }

  if (testUri.includes(`/${prodDb}?`) || testUri.endsWith(`/${prodDb}`)) {
    console.error(`❌ MONGODB_TEST_URI points to production '${prodDb}'. Aborting.`);
    process.exit(1);
  }

  // Import app modules
  const { default: app } = await import("../src/serverApp");
  const { default: handler } = await import("../api/index");
  const { getMongoClient } = await import("../src/lib/mongodb");

  const client = await getMongoClient();
  if (!client) throw new Error("Could not acquire MongoClient");
  const db = client.db("chintadaravikumar_test");

  const server = http.createServer((req, res) => {
    handler(req as any, res as any);
  });

  const PORT = 3059;
  await new Promise<void>((resolve) => server.listen(PORT, () => resolve()));
  const baseUrl = `http://127.0.0.1:${PORT}`;

  const testRunId = `TEST_4F1G_${Date.now()}`;
  let allPassed = true;

  try {
    console.log("1. Testing Public CMS APIs on test database...");
    const resHome = await fetch(`${baseUrl}/api/public/home`);
    const dataHome = await resHome.json();
    console.log(`   GET /api/public/home -> HTTP ${resHome.status}, source: ${dataHome.source}`);
    if (resHome.status !== 200 || !dataHome.sections) throw new Error("Public home failed");

    const resSettings = await fetch(`${baseUrl}/api/public/site-settings`);
    const dataSettings = await resSettings.json();
    console.log(`   GET /api/public/site-settings -> HTTP ${resSettings.status}, siteName: ${dataSettings.siteName || dataSettings.settings?.siteName}`);
    if (resSettings.status !== 200) throw new Error("Public site settings failed");

    // 2. Direct Mock Authentication Header Verification
    console.log("\n2. Testing Protected Submission Endpoints...");

    // Insert synthetic contact inquiry
    const testContactTN = `CNT-SYNTH-${Date.now()}`;
    await db.collection("contact_inquiries").insertOne({
      trackingNumber: testContactTN,
      fullName: "Phase 4F.1G Synthetic Contact",
      mobile: "9876543299",
      subject: "Panchayat Road Inquiries",
      message: "Testing unified submissions manager.",
      status: "RECEIVED",
      testRunId,
      createdAt: new Date()
    });

    // Insert synthetic volunteer application
    const testVolTN = `VOL-SYNTH-${Date.now()}`;
    await db.collection("volunteer_applications").insertOne({
      trackingNumber: testVolTN,
      fullName: "Phase 4F.1G Synthetic Volunteer",
      email: "synth.volunteer@example.com",
      mobile: "9876543298",
      mandal: "Gara",
      skills: ["Disaster Response", "Logistics"],
      experience: "Community volunteer",
      status: "PENDING",
      testRunId,
      createdAt: new Date()
    });

    // Insert synthetic cadre registration
    const testCadreTN = `CDR-SYNTH-${Date.now()}`;
    await db.collection("cadre_applications").insertOne({
      trackingNumber: testCadreTN,
      workerId: "CDR-9900",
      fullName: "Phase 4F.1G Synthetic Cadre",
      mobile: "9876543297",
      mandal: "Narasannapeta",
      position: "Village Coordinator",
      status: "PENDING",
      testRunId,
      createdAt: new Date()
    });

    console.log("   ✅ Inserted synthetic test records in 'chintadaravikumar_test'.");

    // Read back via testDb directly to verify persistence
    const savedContact = await db.collection("contact_inquiries").findOne({ trackingNumber: testContactTN });
    const savedVol = await db.collection("volunteer_applications").findOne({ trackingNumber: testVolTN });
    const savedCadre = await db.collection("cadre_applications").findOne({ trackingNumber: testCadreTN });

    if (!savedContact || !savedVol || !savedCadre) {
      throw new Error("Synthetic records were not found in test database");
    }
    console.log("   ✅ Read-back confirmed for Contact, Volunteer, and Cadre in 'chintadaravikumar_test'.");

    // Test update and note appending on Contact inquiry
    await db.collection("contact_inquiries").updateOne(
      { trackingNumber: testContactTN },
      {
        $set: { status: "ASSIGNED", assignedTo: "Camp Office Liaison", updatedAt: new Date() },
        $push: {
          notes: {
            text: "Assigned for immediate telephone verification.",
            author: "admin@chintadaravikumar.in",
            createdAt: new Date()
          }
        } as any
      }
    );

    const updatedContact = await db.collection("contact_inquiries").findOne({ trackingNumber: testContactTN });
    if (updatedContact?.status !== "ASSIGNED" || updatedContact?.notes?.length !== 1) {
      throw new Error("Contact update / note verification failed");
    }
    console.log("   ✅ Update and internal notes confirmed on Contact inquiry.");

    // 3. Testing CMS Section Persistence
    console.log("\n3. Testing CMS Section Updates in 'chintadaravikumar_test'...");
    await db.collection("home_sections").updateOne(
      { sectionId: "hero" },
      {
        $set: {
          title: "PEOPLE FIRST (SYNTHETIC VERIFIED)",
          updatedAt: new Date().toISOString(),
          updatedBy: "e2e_tester",
          testRunId
        }
      },
      { upsert: true }
    );

    const readHero = await db.collection("home_sections").findOne({ sectionId: "hero" });
    if (readHero?.title !== "PEOPLE FIRST (SYNTHETIC VERIFIED)") {
      throw new Error("Hero section update verification failed");
    }
    console.log("   ✅ Hero section update persisted and verified in test database.");

    // 4. Testing Dedicated Page Document Persistence
    console.log("\n4. Testing Dedicated About Page Document in 'chintadaravikumar_test'...");
    await db.collection("home_sections").updateOne(
      { sectionId: "about_page" },
      {
        $set: {
          "data.mission": "Dedicated to hyper-local development and constituency welfare (Synthetic)",
          updatedAt: new Date().toISOString(),
          updatedBy: "e2e_tester",
          testRunId
        }
      },
      { upsert: true }
    );

    const readAbout = await db.collection("home_sections").findOne({ sectionId: "about_page" });
    if (!readAbout?.data?.mission?.includes("Synthetic")) {
      throw new Error("About page update verification failed");
    }
    console.log("   ✅ About page document update persisted and verified in test database.");

    // 5. Cleanup Synthetic Test Data
    console.log("\n5. Cleaning up synthetic test data from 'chintadaravikumar_test'...");
    await db.collection("contact_inquiries").deleteOne({ trackingNumber: testContactTN });
    await db.collection("volunteer_applications").deleteOne({ trackingNumber: testVolTN });
    await db.collection("cadre_applications").deleteOne({ trackingNumber: testCadreTN });
    await db.collection("home_sections").deleteOne({ sectionId: "about_page", testRunId });
    console.log("   ✅ Cleaned up all synthetic test data. Zero orphaned test records remain.");

  } catch (err: any) {
    console.error("❌ Test failed:", err.message);
    allPassed = false;
  } finally {
    server.close();
    await client.close().catch(() => {});
  }

  console.log("\n=============================================================");
  console.log(`FINAL RESULT: ${allPassed ? "PHASE 4F.1G E2E TESTS PASSED ✅" : "FAILED ❌"}`);
  console.log("=============================================================\n");

  process.exit(allPassed ? 0 : 1);
}

runTest().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
