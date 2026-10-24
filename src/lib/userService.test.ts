/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRole, UserStatus } from "../types";
import { isSuperAdmin, getSuperAdminAllowlist } from "./userService";

console.log("================================================================");
console.log("STAGE 2D.2: PROFESSIONAL RBAC & SUPER ADMIN AUTHORITY TEST SUITE");
console.log("================================================================");

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✓ Test Passed: ${message}`);
    passedTests++;
  } else {
    console.error(`✗ Test Failed: ${message}`);
    failedTests++;
  }
}

// 1. Test Fail-Closed when SUPER_ADMIN_EMAILS is empty/unset
process.env.SUPER_ADMIN_EMAILS = "";
const emptyAllowlist = getSuperAdminAllowlist();
assert(emptyAllowlist.length === 0, "Super Admin allowlist fails closed (empty) when SUPER_ADMIN_EMAILS is unset/empty");
const testIdentityNoEnv = { email: "chraviysrcp@gmail.com", uid: "uid_sa_1", emailVerified: true };
assert(!isSuperAdmin(testIdentityNoEnv), "Super Admin access denied (fails closed) when allowlist is empty");

// 2. Test Super Admin Allowlist & Recognition when configured via environment
process.env.SUPER_ADMIN_EMAILS = "chraviysrcp@gmail.com, krishnapro216@gmail.com";
const allowlist = getSuperAdminAllowlist();
assert(allowlist.includes("chraviysrcp@gmail.com"), "Configured owner chraviysrcp@gmail.com is on Super Admin allowlist");
assert(allowlist.includes("krishnapro216@gmail.com"), "Configured owner krishnapro216@gmail.com is on Super Admin allowlist");

const saIdentity = { email: "chraviysrcp@gmail.com", uid: "uid_sa_1", emailVerified: true };
assert(isSuperAdmin(saIdentity), "Verified allowlisted email is recognized as Super Admin");

const unverifiedSa = { email: "chraviysrcp@gmail.com", uid: "uid_sa_1", emailVerified: false };
assert(!isSuperAdmin(unverifiedSa), "Unverified email is correctly denied Super Admin privileges (Fail Closed)");

const guestIdentity = { email: "random@gmail.com", uid: "uid_guest_1", emailVerified: true };
assert(!isSuperAdmin(guestIdentity), "Non-allowlisted email is correctly denied Super Admin privileges");

// 2. Test Role Catalogue Constants & Compatibility
assert(UserRole.SUPER_ADMIN === "SUPER_ADMIN", "Super Admin role constant matches");
assert(UserRole.GENERAL_ADMINISTRATOR === "ADMIN", "General Administrator maps correctly to ADMIN");
assert(UserRole.READ_ONLY_OBSERVER === "VIEWER", "Read-Only Observer maps correctly to VIEWER");

console.log("================================================================");
console.log(`RESULTS: Passed: ${passedTests}, Failed: ${failedTests}`);
console.log("================================================================");

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
