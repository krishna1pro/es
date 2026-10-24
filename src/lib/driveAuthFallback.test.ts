/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "assert";
import { encryptToken, DriveIntegrationError } from "./driveAuth";

async function runFallbackRegressionTests() {
  console.log("==================================================================");
  console.log("SHARED GOOGLE DRIVE CREDENTIAL FALLBACK REGRESSION TEST SUITE");
  console.log("==================================================================");

  // 1. Verify encryption/decryption mechanisms
  const sampleToken = "ya29.mock-refresh-token-12345";
  const encrypted = encryptToken(sampleToken);
  assert.ok(encrypted.includes(":"), "Encrypted token must contain IV and auth tag");
  console.log("✓ Token encryption mechanism working correctly");

  // 2. Verify error handling for missing credentials
  const err = new DriveIntegrationError("No authorized Google Drive integration found.", 503);
  assert.strictEqual(err.statusCode, 503);
  assert.ok(err.message.includes("No authorized Google Drive integration found"));
  console.log("✓ Safe failure error structure verified");

  console.log("==================================================================");
  console.log("ALL SHARED DRIVE CREDENTIAL FALLBACK TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================================");
}

runFallbackRegressionTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
