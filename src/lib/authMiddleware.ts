/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from "express";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { UserRole, UserStatus } from "../types";
import { SectionType, ALL_HOMEPAGE_SECTION_IDS } from "../types/homeCms";
import { getUserByUid, isSuperAdmin } from "./userService";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase Admin SDK for server-side ID token cryptographic verification
const firebaseAdminApp = getApps().length === 0
  ? initializeApp({ projectId: (firebaseConfig as any).projectId })
  : getApps()[0];

const adminAuth = getAuth(firebaseAdminApp);

export interface AuthenticatedUser {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole | string;
  status: UserStatus | string;
  permissions: string[];
  assignedSections: SectionType[] | string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Section Role Matrix (Roles that inherently have permission for each section)
export const SECTION_PERMISSIONS_MAP: Record<SectionType, string[]> = {
  hero: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER],
  stats: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER],
  about_leader: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER],
  our_vision: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RESEARCH_MANAGER],
  leadership_journey: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER],
  daily_activities: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.OFFICE_MANAGER],
  monthly_activities: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER],
  yearly_report: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER],
  development_projects: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER],
  peoples_voice: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PUBLIC_RELATIONS_MANAGER],
  cadre_corner: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CADRE_MANAGER],
  media_center: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MEDIA_MANAGER],
  social_hub: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MEDIA_MANAGER],
  upcoming_events: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EVENT_MANAGER],
  volunteer_contact: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VOLUNTEER_MANAGER],
  about_page: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER],
  vision_page: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RESEARCH_MANAGER],
  activities_page: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER],
  development_page: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER],
  media_page: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MEDIA_MANAGER]
};

// Bounded in-memory verified token cache with cryptographic expiration enforcement
interface CachedToken {
  uid: string;
  email: string;
  email_verified: boolean;
  displayName?: string;
  exp?: number;
  expiresAt: number;
}

const MAX_CACHE_SIZE = 500;
const tokenCache = new Map<string, CachedToken>();

/**
 * Prunes expired tokens and evicts oldest items if cache size exceeds limit
 */
function pruneTokenCache(): void {
  const now = Date.now();
  for (const [key, value] of tokenCache.entries()) {
    if (value.expiresAt <= now) {
      tokenCache.delete(key);
    }
  }
  if (tokenCache.size > MAX_CACHE_SIZE * 0.8) {
    const keys = Array.from(tokenCache.keys());
    const toRemove = keys.slice(0, Math.floor(MAX_CACHE_SIZE * 0.3));
    for (const k of toRemove) {
      tokenCache.delete(k);
    }
  }
}

export function setCachedTokenForTesting(
  token: string,
  data: { uid: string; email: string; email_verified?: boolean; displayName?: string; exp?: number }
) {
  tokenCache.set(token.trim(), {
    uid: data.uid,
    email: data.email.toLowerCase().trim(),
    email_verified: data.email_verified !== undefined ? data.email_verified : true,
    displayName: data.displayName,
    exp: data.exp || Math.floor(Date.now() / 1000) + 3600,
    expiresAt: Date.now() + 3600 * 1000
  });
}

export function clearTokenCacheForTesting() {
  tokenCache.clear();
}

/**
 * Cryptographically verifies a Firebase ID token via Firebase Admin SDK
 * Enforces project ID audience, issuer, signature, and expiration validity.
 * Eliminates all mock/fabricated token backdoors.
 */
export async function verifyFirebaseIdToken(token: string): Promise<{
  uid: string;
  email: string;
  email_verified: boolean;
  displayName?: string;
  exp?: number;
} | null> {
  if (!token || typeof token !== "string" || token.trim() === "") {
    return null;
  }

  const trimmedToken = token.trim();

  // Check bounded token cache
  const cached = tokenCache.get(trimmedToken);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      uid: cached.uid,
      email: cached.email,
      email_verified: cached.email_verified,
      displayName: cached.displayName,
      exp: cached.exp
    };
  }

  try {
    // Cryptographically verify ID token using Firebase Admin SDK
    const decoded = await adminAuth.verifyIdToken(trimmedToken);
    if (!decoded || !decoded.uid) {
      return null;
    }

    const verified = {
      uid: decoded.uid,
      email: (decoded.email || "").toLowerCase().trim(),
      email_verified: Boolean(decoded.email_verified),
      displayName: (decoded.name as string) || (decoded.displayName as string) || undefined,
      exp: decoded.exp
    };

    // Strict Cache Lifetime: Never exceed token's actual cryptographic expiration!
    const now = Date.now();
    const tokenExpMs = decoded.exp ? decoded.exp * 1000 : now;
    const remainingLifetimeMs = tokenExpMs - now;
    const maxTtlMs = Math.min(10 * 60 * 1000, remainingLifetimeMs);

    if (maxTtlMs > 0) {
      if (tokenCache.size >= MAX_CACHE_SIZE) {
        pruneTokenCache();
      }
      tokenCache.set(trimmedToken, {
        ...verified,
        expiresAt: now + maxTtlMs
      });
    }

    return verified;
  } catch (err) {
    // Any invalid, malformed, or expired token strictly rejected
    return null;
  }
}

/**
 * Resolves authenticated user from Bearer header and verifies access against MongoDB Atlas live
 * Never caches authorization or user status.
 * Requires email to be verified by Google.
 * Enforces UID-to-email binding to prevent account hijacking.
 */
export async function resolveAuthUser(req: Request): Promise<AuthenticatedUser | null> {
  let token: string | null = null;
  const authHeader = req.headers["authorization"];

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (req.headers["x-firebase-token"]) {
    token = String(req.headers["x-firebase-token"]).trim();
  }

  if (!token) {
    return null;
  }

  const verified = await verifyFirebaseIdToken(token);
  if (!verified || !verified.email) {
    return null;
  }

  // Reject unverified emails immediately
  if (!verified.email_verified) {
    console.warn(`[Auth] Rejected unverified email token for: ${verified.email}`);
    return null;
  }

  const email = verified.email.toLowerCase().trim();

  // 1. Super Admin Allowlist check: Must match specifically authorized identity
  if (isSuperAdmin({ email, uid: verified.uid, emailVerified: verified.email_verified })) {
    const mongoUser = await getUserByUid(verified.uid);
    // If a record is stored, ensure it is bound to this exact verified email
    if (mongoUser && mongoUser.email.toLowerCase().trim() !== email) {
      console.error(`[Auth] UID / Email binding conflict for Super Admin: ${email} vs ${mongoUser.email}`);
      return null;
    }

    return {
      uid: verified.uid,
      email,
      displayName: verified.displayName || mongoUser?.displayName || "Super Admin",
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.APPROVED,
      permissions: ["*"],
      assignedSections: [...ALL_HOMEPAGE_SECTION_IDS]
    };
  }

  // 2. Query MongoDB admin_users live for team member status and effective permissions
  const mongoUser = await getUserByUid(verified.uid);
  if (!mongoUser) {
    return {
      uid: verified.uid,
      email,
      displayName: verified.displayName,
      role: UserRole.VIEWER,
      status: UserStatus.PENDING,
      permissions: [],
      assignedSections: []
    };
  }

  // Enforce UID to email binding for team members
  if (mongoUser.email.toLowerCase().trim() !== email) {
    console.error(`[Auth] UID / Email binding conflict: token email ${email} does not match record email ${mongoUser.email}`);
    return null;
  }

  return {
    uid: mongoUser.uid,
    email: mongoUser.email,
    displayName: mongoUser.displayName,
    role: mongoUser.role,
    status: mongoUser.status,
    permissions: mongoUser.permissions || [],
    assignedSections: (mongoUser.assignedSections || []) as SectionType[]
  };
}

/**
 * Checks whether an authenticated user is permitted to edit a specific home page section
 */
export function canUserEditSection(user: AuthenticatedUser | null, sectionId: SectionType): boolean {
  if (!user) return false;
  if (user.status !== UserStatus.APPROVED) return false;

  // Super Admin can edit all sections
  if (user.role === UserRole.SUPER_ADMIN && isSuperAdmin({ email: user.email, uid: user.uid })) return true;

  // Wildcard permissions
  if (user.permissions && user.permissions.includes("*")) return true;

  // Explicitly assigned section in MongoDB
  if (user.assignedSections && user.assignedSections.includes(sectionId)) return true;

  // Functional role fallback
  const allowedRoles = SECTION_PERMISSIONS_MAP[sectionId] || [];
  return allowedRoles.includes(user.role as string);
}

/**
 * Middleware: Requires a valid authenticated user with APPROVED status
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await resolveAuthUser(req);
    if (!user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "A valid Google / Firebase Authorization Bearer token must be provided."
      });
    }

    if (user.status !== UserStatus.APPROVED) {
      return res.status(403).json({
        error: "Access Pending Approval",
        status: user.status,
        message: "Your account is awaiting Super Admin clearance before accessing the control center."
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("[Auth] requireAuth error:", err);
    res.status(500).json({ error: "Internal authentication verification error" });
  }
}

/**
 * Middleware: Requires Super Admin authority exclusively
 * Strictly enforces that the caller satisfies the Super Admin allowlist policy.
 */
export async function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await resolveAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Strict allowlist validation — role in DB document alone is insufficient
    if (!isSuperAdmin(user)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "This administrative operation strictly requires Super Admin authority."
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("[Auth] requireSuperAdmin error:", err);
    res.status(500).json({ error: "Internal authorization error" });
  }
}

/**
 * Middleware: Requires Super Admin or Admin role
 */
export async function requireAdminOrSuperAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await resolveAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (user.status !== UserStatus.APPROVED) {
      return res.status(403).json({ error: "Access Pending Approval" });
    }

    const isSA = isSuperAdmin(user);
    if (!isSA && user.role !== UserRole.ADMIN) {
      return res.status(403).json({
        error: "Forbidden",
        message: "This operation requires Administrator or Super Admin privileges."
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("[Auth] requireAdminOrSuperAdmin error:", err);
    res.status(500).json({ error: "Internal authorization error" });
  }
}

/**
 * Middleware: Enforces granular section editing permissions
 */
export async function requireSectionEditPermission(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await resolveAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (user.status !== UserStatus.APPROVED) {
      return res.status(403).json({ error: "Access Pending Approval" });
    }

    const sectionId = req.params.sectionId as SectionType;
    if (!canUserEditSection(user, sectionId)) {
      return res.status(403).json({
        error: "Permission denied",
        message: `Account '${user.email}' (${user.role}) is not authorized to edit section '${sectionId}'.`
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("[Auth] requireSectionEditPermission error:", err);
    res.status(500).json({ error: "Internal authorization error" });
  }
}

/**
 * Middleware: Enforces access to Media Center and Social Hub administrative endpoints
 * Authorizes Super Admins, Admins, Media Managers, or users assigned to media sections.
 */
export async function requireMediaAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await resolveAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (user.status !== UserStatus.APPROVED && !isSuperAdmin(user)) {
      try {
        const { getSegmentPermissions } = await import("./mediaService");
        const grants = await getSegmentPermissions();
        const hasGrant = grants.some(
          (g) =>
            g.status === "ACTIVE" &&
            ((user.email && g.userEmail.toLowerCase() === user.email.toLowerCase()) ||
              (user.uid && g.userUid === user.uid))
        );
        if (!hasGrant) {
          return res.status(403).json({ error: "Access Pending Approval" });
        }
      } catch {
        return res.status(403).json({ error: "Access Pending Approval" });
      }
    }

    let hasAccess =
      isSuperAdmin(user) ||
      user.role === UserRole.ADMIN ||
      user.role === UserRole.MEDIA_MANAGER ||
      canUserEditSection(user, "media_center") ||
      canUserEditSection(user, "media_page") ||
      canUserEditSection(user, "social_hub") ||
      (user.permissions && (user.permissions.includes("*") || user.permissions.includes("media:*")));

    if (!hasAccess) {
      try {
        const { getSegmentPermissions } = await import("./mediaService");
        const grants = await getSegmentPermissions();
        hasAccess = grants.some(
          (g) =>
            g.status === "ACTIVE" &&
            ((user.email && g.userEmail.toLowerCase() === user.email.toLowerCase()) ||
              (user.uid && g.userUid === user.uid))
        );
      } catch {
        // If sheets permissions check fails, retain hasAccess = false
      }
    }

    if (!hasAccess) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Account '${user.email}' (${user.role}) is not authorized to manage Media Center or Social Hub.`
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("[Auth] requireMediaAccess error:", err);
    res.status(500).json({ error: "Internal authorization error" });
  }
}

/**
 * Middleware: Enforces fine-grained segment rights (canRead, canCreate, canEdit, canDelete)
 * based on the MediaPermissions tab in Google Sheets.
 * Super Admins retain global override.
 */
export function requireSegmentAccess(
  segmentOrResolver?: string | ((req: Request) => string),
  action: "read" | "create" | "edit" | "delete" = "read"
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await resolveAuthUser(req);
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (user.status !== UserStatus.APPROVED && !isSuperAdmin(user)) {
        try {
          const { getSegmentPermissions } = await import("./mediaService");
          const grants = await getSegmentPermissions();
          const hasGrant = grants.some(
            (g) =>
              g.status === "ACTIVE" &&
              ((user.email && g.userEmail.toLowerCase() === user.email.toLowerCase()) ||
                (user.uid && g.userUid === user.uid))
          );
          if (!hasGrant) {
            return res.status(403).json({ error: "Access Pending Approval" });
          }
        } catch {
          return res.status(403).json({ error: "Access Pending Approval" });
        }
      }

      if (isSuperAdmin(user)) {
        req.user = user;
        return next();
      }

      let segment = "";
      if (typeof segmentOrResolver === "function") {
        segment = segmentOrResolver(req);
      } else if (typeof segmentOrResolver === "string") {
        segment = segmentOrResolver;
      } else {
        segment = (req.body?.category || req.query?.category || req.params?.category || "PHOTO_GALLERY") as string;
      }

      const { checkUserSegmentPermission } = await import("./mediaService");
      const hasPermission = await checkUserSegmentPermission(user, segment, action);

      if (!hasPermission) {
        return res.status(403).json({
          error: "Forbidden",
          message: `Account '${user.email}' lacks '${action}' permission for media segment '${segment}'.`
        });
      }

      req.user = user;
      next();
    } catch (err) {
      console.error("[Auth] requireSegmentAccess error:", err);
      res.status(500).json({ error: "Internal authorization error" });
    }
  };
}

export type SubmissionType = "contact" | "volunteer" | "cadre" | "grievances";

export const SUBMISSION_PERMISSIONS_MAP: Record<SubmissionType, {
  roles: string[];
  permissions: string[];
  sections: SectionType[];
}> = {
  contact: {
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OFFICE_MANAGER, UserRole.PUBLIC_RELATIONS_MANAGER, UserRole.OUTREACH_MANAGER],
    permissions: ["submissions:contact", "contact", "submissions:*"],
    sections: ["volunteer_contact"]
  },
  volunteer: {
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.VOLUNTEER_MANAGER, UserRole.OUTREACH_MANAGER],
    permissions: ["submissions:volunteer", "volunteer", "submissions:*"],
    sections: ["volunteer_contact"]
  },
  cadre: {
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CADRE_MANAGER, UserRole.OFFICE_MANAGER],
    permissions: ["submissions:cadre", "cadre", "submissions:*"],
    sections: ["cadre_corner"]
  },
  grievances: {
    // Highly confidential: restricted to Super Admin, Admin, and designated Office Manager / Approval Authority
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OFFICE_MANAGER, UserRole.APPROVAL_AUTHORITY],
    permissions: ["submissions:grievances", "grievances", "submissions:*"],
    sections: ["peoples_voice"]
  }
};

/**
 * Checks whether an authenticated user is permitted to access submissions of a specific type.
 * Enforces strict default-deny.
 */
export function canUserAccessSubmissionType(
  user: AuthenticatedUser | null,
  submissionType: string,
  action: "read" | "write" | "notes" = "read"
): boolean {
  if (!user) return false;
  if (user.status !== UserStatus.APPROVED) return false;

  // Super Admin has full authority over all submission types and actions
  if (user.role === UserRole.SUPER_ADMIN && isSuperAdmin({ email: user.email, uid: user.uid })) {
    return true;
  }

  // Wildcard permissions
  if (user.permissions && user.permissions.includes("*")) {
    return true;
  }

  const typeConfig = SUBMISSION_PERMISSIONS_MAP[submissionType as SubmissionType];
  if (!typeConfig) {
    return false; // Unknown type is strictly rejected
  }

  // Check explicit permission strings (e.g., 'submissions:grievances')
  if (user.permissions && user.permissions.some(p => typeConfig.permissions.includes(p))) {
    return true;
  }

  // Check assigned section permissions
  if (user.assignedSections && user.assignedSections.some(s => typeConfig.sections.includes(s as SectionType))) {
    return true;
  }

  // For adding/editing internal notes:
  // Requires Super Admin, Admin, Approval Authority, or explicit permission
  if (action === "notes") {
    if (user.role === UserRole.ADMIN || user.role === UserRole.APPROVAL_AUTHORITY) {
      return true;
    }
    return false;
  }

  // Check functional role default permissions
  return typeConfig.roles.includes(user.role as string);
}

/**
 * Middleware: Enforces granular RBAC authorization per submission type
 */
export function requireSubmissionAccess(action: "read" | "write" = "read") {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await resolveAuthUser(req);
      if (!user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "A valid Google / Firebase Authorization Bearer token must be provided."
        });
      }

      if (user.status !== UserStatus.APPROVED) {
        return res.status(403).json({
          error: "Access Pending Approval",
          status: user.status,
          message: "Your account is awaiting Super Admin clearance before accessing submissions."
        });
      }

      const type = req.params.type;
      const validTypes: SubmissionType[] = ["contact", "volunteer", "cadre", "grievances"];
      if (!validTypes.includes(type as SubmissionType)) {
        return res.status(400).json({
          error: "Invalid submission type",
          message: `Supported types are: ${validTypes.join(", ")}`
        });
      }

      const isNoteUpdate = action === "write" && req.body && Boolean(req.body.note);
      const effectiveAction = isNoteUpdate ? "notes" : action;

      if (!canUserAccessSubmissionType(user, type, effectiveAction)) {
        return res.status(403).json({
          error: "Forbidden",
          message: `Account '${user.email}' (${user.role}) is not authorized to access '${type}' submissions.`
        });
      }

      req.user = user;
      next();
    } catch (err) {
      console.error("[Auth] requireSubmissionAccess error:", err);
      res.status(500).json({ error: "Internal authorization error" });
    }
  };
}
