/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getMongoClient } from "./mongodb";
import { UserRole, UserStatus, AdminUserDocument, AuditLogDocument } from "../types";
import { ALL_HOMEPAGE_SECTION_IDS } from "../types/homeCms";

const DB_NAME = process.env.MONGODB_DB_NAME || "chintadaravikumar";
const USERS_COLLECTION = "admin_users";
const AUDIT_LOGS_COLLECTION = "audit_logs";

/**
 * Returns complete list of allowed Super Admin emails strictly from environment variables.
 * Fails closed: returns an empty array if SUPER_ADMIN_EMAILS is not set or empty.
 */
export function getSuperAdminAllowlist(): string[] {
  const envEmails = (process.env.SUPER_ADMIN_EMAILS || process.env.SUPER_ADMIN_EMAIL || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e && e !== "your-admin-account@gmail.com");

  return Array.from(new Set(envEmails));
}

/**
 * Returns complete list of allowed Super Admin Firebase UIDs strictly from environment.
 * Fails closed: returns an empty array if SUPER_ADMIN_UIDS is not set or empty.
 */
export function getSuperAdminUidAllowlist(): string[] {
  const envUids = (process.env.SUPER_ADMIN_UIDS || process.env.SUPER_ADMIN_UID || "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
  return Array.from(new Set(envUids));
}

/**
 * Checks if a given email is on the Super Admin allowlist.
 * Fails closed: always returns false if allowlist is empty or email is not present.
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const allowlist = getSuperAdminAllowlist();
  if (allowlist.length === 0) return false;
  return allowlist.includes(email.toLowerCase().trim());
}

/**
 * Checks if a given Firebase UID is on the Super Admin allowlist.
 * Fails closed: always returns false if UID allowlist is empty or UID is not present.
 */
export function isSuperAdminUid(uid?: string | null): boolean {
  if (!uid) return false;
  const allowlist = getSuperAdminUidAllowlist();
  if (allowlist.length === 0) return false;
  return allowlist.includes(uid.trim());
}

/**
 * Validates whether an identity satisfies the Super Admin allowlist policy.
 * Requires emailVerified to be true if supplied.
 * Fails closed if no allowlist matches.
 */
export function isSuperAdmin(identity?: {
  email?: string | null;
  uid?: string | null;
  emailVerified?: boolean;
} | null): boolean {
  if (!identity) return false;
  if (identity.emailVerified !== undefined && !identity.emailVerified) {
    return false;
  }
  if (identity.uid && isSuperAdminUid(identity.uid)) return true;
  if (identity.email && isSuperAdminEmail(identity.email)) return true;
  return false;
}

/**
 * Creates an immutable audit log entry in MongoDB
 */
export async function createAuditLog(log: {
  actorUid: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetEntity: string;
  targetId?: string;
  details?: Record<string, any> | string;
  ipAddress?: string;
}): Promise<AuditLogDocument> {
  try {
    const client = await getMongoClient();
    if (!client) {
      console.warn("[AuditLog] MongoDB client unavailable for audit persistence");
      return { timestamp: new Date().toISOString(), ...log };
    }
    const db = client.db(DB_NAME);
    const col = db.collection<AuditLogDocument>(AUDIT_LOGS_COLLECTION);

    const doc: AuditLogDocument = {
      timestamp: new Date().toISOString(),
      actorUid: log.actorUid,
      actorEmail: log.actorEmail,
      actorRole: log.actorRole,
      action: log.action,
      targetEntity: log.targetEntity,
      targetId: log.targetId || "",
      details: log.details || {},
      ipAddress: log.ipAddress || ""
    };

    await col.insertOne(doc);
    return doc;
  } catch (err) {
    console.error("[AuditLog] Failed to persist audit entry:", err);
    return {
      timestamp: new Date().toISOString(),
      ...log
    };
  }
}

/**
 * Fetches recent audit logs from MongoDB
 */
export async function getAuditLogs(limitCount = 50): Promise<AuditLogDocument[]> {
  try {
    const client = await getMongoClient();
    if (!client) return [];
    const db = client.db(DB_NAME);
    const col = db.collection<AuditLogDocument>(AUDIT_LOGS_COLLECTION);

    const results = await col
      .find({})
      .sort({ timestamp: -1 })
      .limit(limitCount)
      .toArray();

    return results.map((r) => ({
      ...r,
      _id: r._id?.toString()
    }));
  } catch (err) {
    console.error("[AuditLog] Failed to read audit logs:", err);
    return [];
  }
}

/**
 * Checks Super Admin configuration in MongoDB Atlas
 * Fails closed if SUPER_ADMIN_EMAILS is not configured in the environment.
 */
export async function bootstrapSuperAdmin(): Promise<void> {
  try {
    const client = await getMongoClient();
    if (!client) {
      console.warn("[Auth] Cannot check Super Admin: MongoDB not connected");
      return;
    }
    const db = client.db(DB_NAME);
    const col = db.collection<AdminUserDocument>(USERS_COLLECTION);

    const allowlist = getSuperAdminAllowlist();
    if (allowlist.length === 0) {
      console.log("[Auth] SUPER_ADMIN_EMAILS is not configured in environment. Super Admin access disabled (fail closed).");
      return;
    }

    console.log(`[Auth] Super Admin allowlist active with ${allowlist.length} email(s). Super Admin identity will be bound on verified Google sign-in.`);
    const now = new Date().toISOString();

    for (const email of allowlist) {
      const existing = await col.findOne({ email });
      if (existing) {
        // Enforce Super Admin status for allowlisted identities
        if (existing.role !== UserRole.SUPER_ADMIN || existing.status !== UserStatus.APPROVED) {
          await col.updateOne(
            { email },
            {
              $set: {
                role: UserRole.SUPER_ADMIN,
                status: UserStatus.APPROVED,
                permissions: ["*"],
                assignedSections: [...ALL_HOMEPAGE_SECTION_IDS],
                updatedAt: now
              }
            }
          );
        }
      }
    }
  } catch (err) {
    console.error("[Auth] Error checking Super Admin status:", err);
  }
}

/**
 * Syncs a Google authenticated user with MongoDB Atlas
 * - Requires email to be verified by Google before granting Super Admin privileges.
 * - If user matches Super Admin allowlist: binds verified Firebase UID, grants SUPER_ADMIN, APPROVED.
 * - Prevents UID hijacking: If an existing user record with the same email has already bound a different UID, rejects.
 * - If user exists: updates last login & profile info without altering authorization role.
 * - If new non-super-admin: creates user with safe default VIEWER role and PENDING status.
 * - CRITICAL: requestedRole is strictly informational and NEVER assigned to effective authorization role.
 */
export async function syncGoogleUser(params: {
  uid: string;
  email: string;
  emailVerified?: boolean;
  displayName?: string;
  photoURL?: string;
  requestedRole?: string;
  requestNotes?: string;
  ipAddress?: string;
}): Promise<AdminUserDocument> {
  const client = await getMongoClient();
  if (!client) {
    throw new Error("Database connection unavailable.");
  }
  const db = client.db(DB_NAME);
  const col = db.collection<AdminUserDocument>(USERS_COLLECTION);

  const email = params.email.toLowerCase().trim();
  const isEmailVerified = Boolean(params.emailVerified);
  const isSA = isEmailVerified && isSuperAdmin({ email, uid: params.uid, emailVerified: isEmailVerified });
  const now = new Date().toISOString();

  // Query existing records to enforce UID binding and prevent identity hijacking
  const existingByUid = await col.findOne({ uid: params.uid });
  const existingByEmail = await col.findOne({ email });

  // Invariant 1: If an account exists for this email with a bound UID that does not match this token's UID, reject
  if (existingByEmail && existingByEmail.uid && existingByEmail.uid !== params.uid) {
    await createAuditLog({
      actorUid: params.uid,
      actorEmail: email,
      actorRole: "BLOCKED",
      action: "UID_MISMATCH_REJECTED",
      targetEntity: "admin_users",
      targetId: email,
      details: {
        attemptedUid: params.uid,
        boundUid: existingByEmail.uid,
        reason: "Attempted sign-in with different Firebase UID for bound account"
      },
      ipAddress: params.ipAddress
    });
    throw new Error("Security conflict: This account is already bound to a different verified Firebase identity.");
  }

  // Invariant 2: If an account exists for this UID with a different email, reject
  if (existingByUid && existingByUid.email.toLowerCase().trim() !== email) {
    await createAuditLog({
      actorUid: params.uid,
      actorEmail: email,
      actorRole: "BLOCKED",
      action: "EMAIL_MISMATCH_REJECTED",
      targetEntity: "admin_users",
      targetId: email,
      details: {
        attemptedEmail: email,
        boundEmail: existingByUid.email,
        reason: "Attempted sign-in with different email for bound UID"
      },
      ipAddress: params.ipAddress
    });
    throw new Error("Security conflict: This Firebase identity is already bound to a different email address.");
  }

  const existing = existingByUid || existingByEmail;

  if (isSA) {
    // Authorized Super Admin: Bind verified Firebase UID
    const superAdminDoc: Partial<AdminUserDocument> = {
      uid: params.uid, // Strictly bound to verified Firebase UID
      email,
      displayName: params.displayName || existing?.displayName || "Super Admin",
      photoURL: params.photoURL || existing?.photoURL || `https://ui-avatars.com/api/?name=Super+Admin&background=001D3D&color=fff`,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.APPROVED,
      permissions: ["*"],
      assignedSections: [...ALL_HOMEPAGE_SECTION_IDS],
      lastLogin: now,
      updatedAt: now
    };

    if (!existing) {
      const fullDoc: AdminUserDocument = {
        ...(superAdminDoc as AdminUserDocument),
        createdAt: now,
        notes: "Authorized Super Admin provisioned via verified Google sign-in"
      };
      await col.insertOne(fullDoc);
      await createAuditLog({
        actorUid: params.uid,
        actorEmail: email,
        actorRole: UserRole.SUPER_ADMIN,
        action: "SUPER_ADMIN_INITIAL_BOOTSTRAP",
        targetEntity: "admin_users",
        targetId: email,
        details: { uid: params.uid, email, allowlistMatched: true },
        ipAddress: params.ipAddress
      });
      return fullDoc;
    } else {
      await col.updateOne({ _id: existing._id }, { $set: superAdminDoc });
      await createAuditLog({
        actorUid: params.uid,
        actorEmail: email,
        actorRole: UserRole.SUPER_ADMIN,
        action: "SUPER_ADMIN_VERIFIED_SIGN_IN",
        targetEntity: "admin_users",
        targetId: email,
        details: { uid: params.uid, email },
        ipAddress: params.ipAddress
      });
      return { ...existing, ...superAdminDoc };
    }
  }

  // Non-super admin flow
  if (existing) {
    // Existing team member: update last login and profile changes
    // Role and status cannot be modified by the applicant
    const updates: Partial<AdminUserDocument> = {
      uid: params.uid, // Keep verified UID in sync
      lastLogin: now,
      displayName: params.displayName || existing.displayName,
      photoURL: params.photoURL || existing.photoURL,
      updatedAt: now
    };

    if (params.requestedRole && existing.status === UserStatus.PENDING) {
      updates.requestedRole = String(params.requestedRole).slice(0, 100);
    }
    if (params.requestNotes && existing.status === UserStatus.PENDING) {
      updates.requestNotes = String(params.requestNotes).slice(0, 500);
    }

    await col.updateOne({ _id: existing._id }, { $set: updates });
    return { ...existing, ...updates };
  } else {
    // New team member registration: PENDING approval
    // CRITICAL: role is ALWAYS hardcoded to safe UserRole.VIEWER.
    // requestedRole is stored purely as informational metadata.
    const newDoc: AdminUserDocument = {
      uid: params.uid,
      email,
      displayName: params.displayName || email.split("@")[0].toUpperCase(),
      photoURL: params.photoURL || `https://ui-avatars.com/api/?name=${email}&background=004B8D&color=fff`,
      role: UserRole.VIEWER, // STRICT SAFE DEFAULT
      status: UserStatus.PENDING,
      permissions: [],
      assignedSections: [],
      requestedRole: (params.requestedRole || "Team Member").slice(0, 100),
      requestNotes: (params.requestNotes || "").slice(0, 500),
      createdAt: now,
      lastLogin: now,
      updatedAt: now
    };

    await col.insertOne(newDoc);
    await createAuditLog({
      actorUid: params.uid,
      actorEmail: email,
      actorRole: "GUEST",
      action: "USER_REGISTRATION_REQUESTED",
      targetEntity: "admin_users",
      targetId: email,
      details: {
        email,
        requestedRole: newDoc.requestedRole,
        notes: newDoc.requestNotes
      },
      ipAddress: params.ipAddress
    });

    return newDoc;
  }
}

/**
 * Retrieves a user from MongoDB by Firebase UID
 */
export async function getUserByUid(uid: string): Promise<AdminUserDocument | null> {
  try {
    const client = await getMongoClient();
    if (!client) return null;
    const db = client.db(DB_NAME);
    const col = db.collection<AdminUserDocument>(USERS_COLLECTION);
    const user = await col.findOne({ uid });
    if (!user) return null;
    return { ...user, _id: user._id?.toString() };
  } catch (err) {
    console.error("[Auth] Error fetching user by UID:", err);
    return null;
  }
}

/**
 * Retrieves all users from MongoDB with optional status/search filters
 */
export async function getAllUsers(filter?: {
  status?: string;
  search?: string;
}): Promise<AdminUserDocument[]> {
  try {
    const client = await getMongoClient();
    if (!client) return [];
    const db = client.db(DB_NAME);
    const col = db.collection<AdminUserDocument>(USERS_COLLECTION);

    const query: any = {};
    if (filter?.status && filter.status !== "ALL") {
      query.status = filter.status;
    }
    if (filter?.search) {
      const regex = new RegExp(filter.search, "i");
      query.$or = [{ displayName: regex }, { email: regex }, { role: regex }];
    }

    const docs = await col.find(query).sort({ createdAt: -1 }).toArray();
    return docs.map((d) => ({ ...d, _id: d._id?.toString() }));
  } catch (err) {
    console.error("[Auth] Error fetching all users:", err);
    return [];
  }
}

/**
 * Updates a user's role, status, or section permissions
 * Enforces Super Admin immutability (cannot demote or disable allowlisted Super Admin)
 * Enforces that only an authorized Super Admin can update team members
 * Prohibits assigning SUPER_ADMIN role to non-allowlisted users
 */
export async function updateUser(
  targetUid: string,
  updates: Partial<AdminUserDocument>,
  actor: { uid: string; email: string; role: string; ipAddress?: string }
): Promise<AdminUserDocument> {
  const client = await getMongoClient();
  if (!client) {
    throw new Error("Database connection unavailable.");
  }
  const db = client.db(DB_NAME);
  const col = db.collection<AdminUserDocument>(USERS_COLLECTION);

  // Require actor to satisfy the Super Admin allowlist policy
  if (!isSuperAdmin(actor)) {
    throw new Error("Only an authorized Super Admin can update team member permissions.");
  }

  const existing = await col.findOne({ uid: targetUid });
  if (!existing) {
    throw new Error(`User with UID '${targetUid}' not found.`);
  }

  // Prevent demotion or revocation of allowlisted Super Admin
  if (isSuperAdmin({ email: existing.email, uid: existing.uid })) {
    if (updates.role && updates.role !== UserRole.SUPER_ADMIN) {
      throw new Error("Primary Super Admin account role cannot be changed.");
    }
    if (updates.status && updates.status !== UserStatus.APPROVED) {
      throw new Error("Primary Super Admin account cannot be suspended or rejected.");
    }
  }

  // Prevent assigning SUPER_ADMIN role to non-allowlisted accounts
  if (updates.role === UserRole.SUPER_ADMIN && !isSuperAdmin({ email: existing.email, uid: existing.uid })) {
    throw new Error("Cannot assign Super Admin role to an account that is not on the trusted Super Admin allowlist.");
  }

  const now = new Date().toISOString();
  const safeUpdates: Partial<AdminUserDocument> = {
    ...updates,
    updatedAt: now
  };

  // If status is being updated to APPROVED
  if (updates.status === UserStatus.APPROVED && existing.status !== UserStatus.APPROVED) {
    safeUpdates.approvedBy = actor.email;
    safeUpdates.approvedAt = now;
  }

  await col.updateOne({ uid: targetUid }, { $set: safeUpdates });

  // Record audit log
  await createAuditLog({
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: updates.status === UserStatus.APPROVED ? "USER_APPROVED" : "USER_UPDATED",
    targetEntity: "admin_users",
    targetId: existing.email,
    details: {
      targetEmail: existing.email,
      changes: safeUpdates
    },
    ipAddress: actor.ipAddress
  });

  const updated = await col.findOne({ uid: targetUid });
  return { ...updated!, _id: updated!._id?.toString() };
}

/**
 * Deletes a user record from MongoDB
 * Protects allowlisted Super Admin from deletion
 * Requires Super Admin authority
 */
export async function deleteUser(
  targetUid: string,
  actor: { uid: string; email: string; role: string; ipAddress?: string }
): Promise<boolean> {
  const client = await getMongoClient();
  if (!client) {
    throw new Error("Database connection unavailable.");
  }
  const db = client.db(DB_NAME);
  const col = db.collection<AdminUserDocument>(USERS_COLLECTION);

  if (!isSuperAdmin(actor)) {
    throw new Error("Only an authorized Super Admin can delete team members.");
  }

  const existing = await col.findOne({ uid: targetUid });
  if (!existing) {
    throw new Error("User not found");
  }

  if (isSuperAdmin({ email: existing.email, uid: existing.uid })) {
    throw new Error("Cannot delete primary Super Admin account.");
  }

  await col.deleteOne({ uid: targetUid });

  await createAuditLog({
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: "USER_DELETED",
    targetEntity: "admin_users",
    targetId: existing.email,
    details: { deletedUser: existing.email },
    ipAddress: actor.ipAddress
  });

  return true;
}
