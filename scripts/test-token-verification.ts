/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Targeted Firebase Token Verification & Runtime ESM-CJS Compatibility Test
 * Verifies that verifyFirebaseIdToken and adminAuth.verifyIdToken do NOT throw ERR_REQUIRE_ESM.
 */

import { verifyFirebaseIdToken } from "../src/lib/authMiddleware";

async function runTokenVerificationTests() {
  console.log("=============================================================");
  console.log("PHASE 4F.1K — FIREBASE TOKEN VERIFICATION & JOSE COMPATIBILITY TEST");
  console.log("=============================================================");

  let allPassed = true;

  // Test 1: Empty token
  try {
    const res1 = await verifyFirebaseIdToken("");
    if (res1 === null) {
      console.log("✅ [PASS] Empty token returns null cleanly");
    } else {
      console.error("❌ [FAIL] Empty token did not return null");
      allPassed = false;
    }
  } catch (err: any) {
    console.error("❌ [FAIL] Empty token threw error:", err);
    allPassed = false;
  }

  // Test 2: Malformed token
  try {
    const res2 = await verifyFirebaseIdToken("malformed-not-a-jwt");
    if (res2 === null) {
      console.log("✅ [PASS] Malformed token returns null without ERR_REQUIRE_ESM");
    } else {
      console.error("❌ [FAIL] Malformed token did not return null");
      allPassed = false;
    }
  } catch (err: any) {
    if (err?.code === "ERR_REQUIRE_ESM" || err?.message?.includes("ERR_REQUIRE_ESM")) {
      console.error("❌ [FAIL] Threw ERR_REQUIRE_ESM on malformed token!", err);
      allPassed = false;
    } else {
      console.log("✅ [PASS] Handled malformed token gracefully:", err.message);
    }
  }

  // Test 3: Synthetic / invalid signature JWT token (header.payload.signature)
  try {
    const syntheticJwt = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJzeW50aGV0aWMtdGVzdCIsImV4cCI6MTk5OTk5OTk5OX0.invalidsignature";
    const res3 = await verifyFirebaseIdToken(syntheticJwt);
    if (res3 === null) {
      console.log("✅ [PASS] Invalid signature JWT returns null without ERR_REQUIRE_ESM");
    } else {
      console.error("❌ [FAIL] Invalid signature JWT did not return null");
      allPassed = false;
    }
  } catch (err: any) {
    if (err?.code === "ERR_REQUIRE_ESM" || err?.message?.includes("ERR_REQUIRE_ESM")) {
      console.error("❌ [FAIL] Threw ERR_REQUIRE_ESM on invalid signature JWT!", err);
      allPassed = false;
    } else {
      console.log("✅ [PASS] Handled invalid signature JWT gracefully:", err.message);
    }
  }

  // Test 4: Expired JWT token
  try {
    const expiredJwt = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJzeW50aGV0aWMtdGVzdCIsImV4cCI6MTAwMDAwMDAwMH0.invalidsignature";
    const res4 = await verifyFirebaseIdToken(expiredJwt);
    if (res4 === null) {
      console.log("✅ [PASS] Expired JWT returns null without ERR_REQUIRE_ESM");
    } else {
      console.error("❌ [FAIL] Expired JWT did not return null");
      allPassed = false;
    }
  } catch (err: any) {
    if (err?.code === "ERR_REQUIRE_ESM" || err?.message?.includes("ERR_REQUIRE_ESM")) {
      console.error("❌ [FAIL] Threw ERR_REQUIRE_ESM on expired JWT!", err);
      allPassed = false;
    } else {
      console.log("✅ [PASS] Handled expired JWT gracefully:", err.message);
    }
  }

  console.log("=============================================================");
  if (allPassed) {
    console.log("FINAL RESULT: ALL FIREBASE TOKEN VERIFICATION TESTS PASSED ✅");
    process.exit(0);
  } else {
    console.error("FINAL RESULT: TOKEN VERIFICATION TESTS FAILED ❌");
    process.exit(1);
  }
}

runTokenVerificationTests();
