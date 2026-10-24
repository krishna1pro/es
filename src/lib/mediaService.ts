/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { google, sheets_v4 } from "googleapis";
import { UserRole } from "../types";

export const DEFAULT_SPREADSHEET_ID = "1VgR34P0CJNweC4lsuRUHTN2z3BCHaV0fdBgAAozNOWo";
export const DEFAULT_DRIVE_FOLDER_ID = "1gIQLW7nwr2ZwZMDlFicWD9aGTn7MX9hh";

export const REQUIRED_TABS = ["MediaItems", "SocialChannels", "MediaPermissions", "ActivityLog"] as const;

export const VALID_MEDIA_SEGMENTS = [
  "PHOTO_GALLERY",
  "VIDEO_GALLERY",
  "PRESS_RELEASES",
  "NEWS_COVERAGE",
  "INTERVIEWS",
  "SOCIAL_HUB"
] as const;

export type MediaSegment = typeof VALID_MEDIA_SEGMENTS[number];

// ==========================================
// EXACT AGREED SCHEMAS & HEADERS
// ==========================================

export const EXPECTED_MEDIA_ITEMS_HEADERS = [
  "mediaId",
  "category",
  "mediaType",
  "title",
  "description",
  "driveFileId",
  "driveFileName",
  "driveViewUrl",
  "publicMediaUrl",
  "thumbnailUrl",
  "showOnHome",
  "status",
  "createdByUid",
  "createdByEmail",
  "createdAt",
  "updatedByUid",
  "updatedAt",
  "publishedAt",
  "sortOrder"
] as const; // 19 Columns A:S

export const EXPECTED_SOCIAL_CHANNELS_HEADERS = [
  "channelId",
  "platform",
  "displayName",
  "url",
  "enabled",
  "showOnHome",
  "homepagePosition",
  "sortOrder",
  "createdByUid",
  "createdByEmail",
  "createdAt",
  "updatedByUid",
  "updatedAt",
  "status"
] as const; // 14 Columns A:N (Column N: status)

export const EXPECTED_MEDIA_PERMISSIONS_HEADERS = [
  "permissionId",
  "userUid",
  "userEmail",
  "segment",
  "canRead",
  "canCreate",
  "canEdit",
  "canDelete",
  "grantedByUid",
  "grantedByEmail",
  "grantedAt",
  "updatedAt",
  "status"
] as const; // 13 Columns A:M

export const EXPECTED_ACTIVITY_LOG_HEADERS = [
  "activityId",
  "timestamp",
  "actorUid",
  "actorEmail",
  "actorRole",
  "action",
  "module",
  "segment",
  "recordId",
  "recordTitle",
  "changesSummary",
  "result",
  "requestId"
] as const; // 13 Columns A:M

// ==========================================
// DATA STRUCTURES
// ==========================================

export interface MediaItemDocument {
  mediaId: string;
  category: string;
  mediaType: "PHOTO" | "VIDEO" | "PRESS" | "REPORT" | string;
  title: string;
  description: string;
  driveFileId: string;
  driveFileName: string;
  driveViewUrl: string;
  publicMediaUrl: string;
  thumbnailUrl: string;
  showOnHome: boolean;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED" | "DELETED";
  createdByUid: string;
  createdByEmail: string;
  createdAt: string;
  updatedByUid: string;
  updatedAt: string;
  publishedAt: string;
  sortOrder: number;

  // Compatibility aliases for existing UI and legacy consumers
  id: string;
  type: string;
  imageUrl: string;
  img: string;
  caption: string;
  order: number;
  date: string;
  videoUrl?: string;
  linkUrl?: string;
  tags?: string[];
}

export interface SocialChannelDocument {
  channelId: string;
  platform: string;
  displayName: string;
  url: string;
  enabled: boolean;
  showOnHome: boolean;
  homepagePosition: number;
  sortOrder: number;
  createdByUid: string;
  createdByEmail: string;
  createdAt: string;
  updatedByUid: string;
  updatedAt: string;
  status: "ACTIVE" | "DELETED";

  // Compatibility aliases for existing UI components
  id: string;
  name: string;
  handle: string;
  followers: string;
  color: string;
  order: number;
}

export interface MediaPermissionDocument {
  permissionId: string;
  userUid: string;
  userEmail: string;
  segment: MediaSegment | string;
  canRead: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  grantedByUid: string;
  grantedByEmail: string;
  grantedAt: string;
  updatedAt: string;
  status: "ACTIVE" | "REVOKED";
}

export interface ActivityLogEntry {
  activityId: string;
  timestamp: string;
  actorUid: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  module: "MEDIA_CENTER" | "SOCIAL_HUB";
  segment: string;
  recordId: string;
  recordTitle: string;
  changesSummary: Record<string, any> | string;
  result: "SUCCESS" | "FAILED" | "PARTIAL_SUCCESS";
  requestId?: string;
}

export interface ActorContext {
  uid: string;
  email: string;
  role: string;
  name?: string;
  ipAddress?: string;
  requestId?: string;
}

// ==========================================
// ERROR DEFINITIONS
// ==========================================

export class SheetsUnavailableError extends Error {
  statusCode: number;
  constructor(message = "Google Sheets service unavailable") {
    super(message);
    this.name = "SheetsUnavailableError";
    this.statusCode = 503;
  }
}

export class SchemaMismatchError extends Error {
  statusCode: number;
  details: Record<string, any>;
  constructor(message: string, details: Record<string, any> = {}) {
    super(message);
    this.name = "SchemaMismatchError";
    this.statusCode = 500;
    this.details = details;
  }
}

// ==========================================
// IN-MEMORY CACHE FOR HIGH-THROUGHPUT READS
// ==========================================

const CACHE_TTL_MS = 20_000; // 20s read cache to stay well below 300 req/min quota

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

let mediaCache: CacheEntry<MediaItemDocument[]> | null = null;
let socialCache: CacheEntry<SocialChannelDocument[]> | null = null;
let permissionsCache: CacheEntry<MediaPermissionDocument[]> | null = null;

export function invalidateMediaCache() {
  mediaCache = null;
}

export function invalidateSocialCache() {
  socialCache = null;
}

export function invalidatePermissionsCache() {
  permissionsCache = null;
}

export function invalidateAllMediaCaches() {
  mediaCache = null;
  socialCache = null;
  permissionsCache = null;
}

// ==========================================
// AUTHENTICATION & CLIENT INITIALIZATION
// ==========================================

export const getSpreadsheetId = (): string => {
  return process.env.GOOGLE_SHEET_ID || DEFAULT_SPREADSHEET_ID;
};

export const isSheetsConfigured = (): boolean => {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY
  );
};

export const getGoogleAuth = () => {
  if (!isSheetsConfigured()) {
    return null;
  }
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });
};

export const getSheetsClient = (): sheets_v4.Sheets => {
  const auth = getGoogleAuth();
  if (!auth) {
    throw new SheetsUnavailableError(
      "Google Sheets credentials unconfigured. Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY."
    );
  }
  return google.sheets({ version: "v4", auth });
};

// ==========================================
// IN-MEMORY TEST STORE (FOR UNIT/CI TESTS)
// ==========================================
// Used when testing in environments where live Google service account keys
// are not available, ensuring strict 1:1 schema enforcement without MongoDB fallback.

let mockSheetsStore: {
  MediaItems: string[][];
  SocialChannels: string[][];
  MediaPermissions: string[][];
  ActivityLog: string[][];
} | null = null;

export function initMockSheetsStore(customSeed?: Partial<typeof mockSheetsStore>) {
  mockSheetsStore = {
    MediaItems: [[...EXPECTED_MEDIA_ITEMS_HEADERS]],
    SocialChannels: [[...EXPECTED_SOCIAL_CHANNELS_HEADERS]],
    MediaPermissions: [[...EXPECTED_MEDIA_PERMISSIONS_HEADERS]],
    ActivityLog: [[...EXPECTED_ACTIVITY_LOG_HEADERS]],
    ...customSeed
  };
  invalidateAllMediaCaches();
}

export function clearMockSheetsStore() {
  mockSheetsStore = null;
  invalidateAllMediaCaches();
}

export function isMockStoreActive(): boolean {
  return mockSheetsStore !== null;
}

// Helper to determine if we should use mock driver (if active or if running unit tests without live credentials)
function shouldUseMockDriver(): boolean {
  return mockSheetsStore !== null;
}

// ==========================================
// SPREADSHEET VALIDATION & HEADER CHECKING
// ==========================================

export async function validateSpreadsheet(): Promise<{
  valid: boolean;
  tabs: string[];
  missingTabs: string[];
  headerMismatches: Record<string, { expected: string[]; found: string[] }>;
}> {
  if (shouldUseMockDriver()) {
    return {
      valid: true,
      tabs: [...REQUIRED_TABS],
      missingTabs: [],
      headerMismatches: {}
    };
  }

  if (!isSheetsConfigured()) {
    throw new SheetsUnavailableError("Google Sheets credentials are not configured in environment");
  }

  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingTabs = (meta.data.sheets?.map((s) => s.properties?.title) || []).filter(Boolean) as string[];

  const missingTabs = REQUIRED_TABS.filter((t) => !existingTabs.includes(t));
  if (missingTabs.length > 0) {
    throw new SchemaMismatchError(`Missing required spreadsheet tabs: ${missingTabs.join(", ")}`, {
      missingTabs
    });
  }

  const headerMismatches: Record<string, { expected: string[]; found: string[] }> = {};

  // Check headers for each tab
  const expectedMap: Record<string, readonly string[]> = {
    MediaItems: EXPECTED_MEDIA_ITEMS_HEADERS,
    SocialChannels: EXPECTED_SOCIAL_CHANNELS_HEADERS,
    MediaPermissions: EXPECTED_MEDIA_PERMISSIONS_HEADERS,
    ActivityLog: EXPECTED_ACTIVITY_LOG_HEADERS
  };

  for (const tab of REQUIRED_TABS) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tab}!1:1`
    });
    const foundHeaders = (res.data.values?.[0] || []).map((h) => String(h).trim());
    const expected = expectedMap[tab];

    // Check if any expected header is missing or out of alignment
    const missingHeaders = expected.filter((exp, idx) => {
      const found = foundHeaders[idx];
      return !found || found.toLowerCase() !== exp.toLowerCase();
    });

    if (missingHeaders.length > 0) {
      headerMismatches[tab] = {
        expected: [...expected],
        found: foundHeaders
      };
    }
  }

  if (Object.keys(headerMismatches).length > 0) {
    throw new SchemaMismatchError(
      `Spreadsheet schema mismatch detected. Stopping operations to prevent data corruption.`,
      { headerMismatches }
    );
  }

  return {
    valid: true,
    tabs: existingTabs,
    missingTabs: [],
    headerMismatches: {}
  };
}

// ==========================================
// LOW-LEVEL ROW CONVERTERS
// ==========================================

function parseBooleanCell(val: any): boolean {
  if (typeof val === "boolean") return val;
  if (!val) return false;
  const s = String(val).trim().toUpperCase();
  return s === "TRUE" || s === "1" || s === "YES";
}

function parseMediaItemRow(row: any[]): MediaItemDocument {
  const mediaId = String(row[0] || "").trim();
  const category = String(row[1] || "GENERAL").trim().toUpperCase();
  const mediaType = String(row[2] || "PHOTO").trim().toUpperCase();
  const title = String(row[3] || "").trim();
  const description = String(row[4] || "").trim();
  const driveFileId = String(row[5] || "").trim();
  const driveFileName = String(row[6] || "").trim();
  const driveViewUrl = String(row[7] || "").trim();
  const publicMediaUrl = String(row[8] || "").trim();
  const thumbnailUrl = String(row[9] || "").trim();
  const showOnHome = parseBooleanCell(row[10]);
  const rawStatus = String(row[11] || "DRAFT").trim().toUpperCase();
  const status = (["PUBLISHED", "DRAFT", "ARCHIVED", "DELETED"].includes(rawStatus)
    ? rawStatus
    : "DRAFT") as MediaItemDocument["status"];

  const createdByUid = String(row[12] || "").trim();
  const createdByEmail = String(row[13] || "").trim();
  const createdAt = String(row[14] || new Date().toISOString()).trim();
  const updatedByUid = String(row[15] || "").trim();
  const updatedAt = String(row[16] || createdAt).trim();
  const publishedAt = String(row[17] || "").trim();
  const sortOrder = parseInt(String(row[18] || "0"), 10) || 0;

  const displayImage =
    thumbnailUrl && !thumbnailUrl.includes("/stream/")
      ? thumbnailUrl
      : `/api/public/media/thumbnail/${mediaId}`;
  const displayDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" })
    : new Date(createdAt).toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });

  return {
    mediaId,
    category,
    mediaType,
    title,
    description,
    driveFileId,
    driveFileName,
    driveViewUrl,
    publicMediaUrl,
    thumbnailUrl,
    showOnHome,
    status,
    createdByUid,
    createdByEmail,
    createdAt,
    updatedByUid,
    updatedAt,
    publishedAt,
    sortOrder,

    // Aliases
    id: mediaId,
    type: mediaType,
    imageUrl: displayImage,
    img: displayImage,
    caption: description,
    order: sortOrder,
    date: displayDate,
    videoUrl: mediaType === "VIDEO" ? publicMediaUrl || driveViewUrl : undefined,
    linkUrl: publicMediaUrl || driveViewUrl || undefined
  };
}

export function sanitizePublicMediaItem(item: MediaItemDocument): Record<string, any> {
  const streamUrl = `/api/public/media/stream/${item.mediaId}`;
  const resolvedThumbnail =
    item.thumbnailUrl && !item.thumbnailUrl.includes("/stream/")
      ? item.thumbnailUrl
      : `/api/public/media/thumbnail/${item.mediaId}`;
  return {
    mediaId: item.mediaId,
    category: item.category,
    mediaType: item.mediaType,
    title: item.title,
    description: item.description,
    driveFileId: "", // Hidden from public callers
    driveFileName: "", // Hidden from public callers
    driveViewUrl: "", // Hidden from public callers
    publicMediaUrl: streamUrl,
    thumbnailUrl: resolvedThumbnail,
    showOnHome: item.showOnHome,
    status: item.status,
    createdAt: item.createdAt,
    publishedAt: item.publishedAt,
    sortOrder: item.sortOrder,

    // Aliases
    id: item.mediaId,
    type: item.mediaType,
    imageUrl: resolvedThumbnail,
    img: resolvedThumbnail,
    caption: item.description,
    order: item.sortOrder,
    date: item.date,
    videoUrl: item.mediaType === "VIDEO" ? streamUrl : undefined,
    linkUrl: streamUrl
  };
}

function mediaItemToRow(m: Partial<MediaItemDocument>): string[] {
  return [
    m.mediaId || "",
    m.category || "",
    m.mediaType || "",
    m.title || "",
    m.description || "",
    m.driveFileId || "",
    m.driveFileName || "",
    m.driveViewUrl || "",
    m.publicMediaUrl || "",
    m.thumbnailUrl || "",
    m.showOnHome ? "TRUE" : "FALSE",
    m.status || "DRAFT",
    m.createdByUid || "",
    m.createdByEmail || "",
    m.createdAt || "",
    m.updatedByUid || "",
    m.updatedAt || "",
    m.publishedAt || "",
    String(m.sortOrder ?? 0)
  ];
}

function parseSocialChannelRow(row: any[]): SocialChannelDocument {
  const channelId = String(row[0] || "").trim();
  const platform = String(row[1] || "").trim().toUpperCase();
  const displayName = String(row[2] || "").trim();
  const url = String(row[3] || "").trim();
  const enabled = parseBooleanCell(row[4]);
  const showOnHome = parseBooleanCell(row[5]);
  const homepagePosition = parseInt(String(row[6] || "0"), 10) || 0;
  const sortOrder = parseInt(String(row[7] || "0"), 10) || 0;
  const createdByUid = String(row[8] || "").trim();
  const createdByEmail = String(row[9] || "").trim();
  const createdAt = String(row[10] || new Date().toISOString()).trim();
  const updatedByUid = String(row[11] || "").trim();
  const updatedAt = String(row[12] || createdAt).trim();
  const rawStatus = String(row[13] || "ACTIVE").trim().toUpperCase();
  const status: "ACTIVE" | "DELETED" = rawStatus === "DELETED" ? "DELETED" : "ACTIVE";

  let color = "text-blue-600";
  if (platform.includes("YOUTUBE")) color = "text-red-600";
  else if (platform.includes("FACEBOOK")) color = "text-blue-600";
  else if (platform.includes("INSTAGRAM")) color = "text-pink-600";
  else if (platform.includes("TWITTER")) color = "text-sky-500";

  return {
    channelId,
    platform,
    displayName,
    url,
    enabled,
    showOnHome,
    homepagePosition,
    sortOrder,
    createdByUid,
    createdByEmail,
    createdAt,
    updatedByUid,
    updatedAt,
    status,

    // Aliases
    id: channelId,
    name: displayName,
    handle: displayName,
    followers: "Verified",
    color,
    order: sortOrder || homepagePosition
  };
}

function socialChannelToRow(c: Partial<SocialChannelDocument>): string[] {
  return [
    c.channelId || "",
    c.platform || "",
    c.displayName || "",
    c.url || "",
    c.enabled ? "TRUE" : "FALSE",
    c.showOnHome ? "TRUE" : "FALSE",
    String(c.homepagePosition ?? 0),
    String(c.sortOrder ?? 0),
    c.createdByUid || "",
    c.createdByEmail || "",
    c.createdAt || "",
    c.updatedByUid || "",
    c.updatedAt || "",
    c.status || "ACTIVE"
  ];
}

function parseMediaPermissionRow(row: any[]): MediaPermissionDocument {
  return {
    permissionId: String(row[0] || "").trim(),
    userUid: String(row[1] || "").trim(),
    userEmail: String(row[2] || "").trim(),
    segment: String(row[3] || "").trim().toUpperCase(),
    canRead: parseBooleanCell(row[4]),
    canCreate: parseBooleanCell(row[5]),
    canEdit: parseBooleanCell(row[6]),
    canDelete: parseBooleanCell(row[7]),
    grantedByUid: String(row[8] || "").trim(),
    grantedByEmail: String(row[9] || "").trim(),
    grantedAt: String(row[10] || "").trim(),
    updatedAt: String(row[11] || "").trim(),
    status: String(row[12] || "").trim().toUpperCase() === "REVOKED" ? "REVOKED" : "ACTIVE"
  };
}

function mediaPermissionToRow(p: Partial<MediaPermissionDocument>): string[] {
  return [
    p.permissionId || "",
    p.userUid || "",
    p.userEmail || "",
    p.segment || "",
    p.canRead ? "TRUE" : "FALSE",
    p.canCreate ? "TRUE" : "FALSE",
    p.canEdit ? "TRUE" : "FALSE",
    p.canDelete ? "TRUE" : "FALSE",
    p.grantedByUid || "",
    p.grantedByEmail || "",
    p.grantedAt || "",
    p.updatedAt || "",
    p.status || "ACTIVE"
  ];
}

function parseActivityLogRow(row: any[]): ActivityLogEntry {
  let changes: any = {};
  try {
    changes = JSON.parse(String(row[10] || "{}"));
  } catch {
    changes = String(row[10] || "");
  }

  return {
    activityId: String(row[0] || ""),
    timestamp: String(row[1] || ""),
    actorUid: String(row[2] || ""),
    actorEmail: String(row[3] || ""),
    actorRole: String(row[4] || ""),
    action: String(row[5] || ""),
    module: (String(row[6] || "").toUpperCase() === "SOCIAL_HUB" ? "SOCIAL_HUB" : "MEDIA_CENTER") as any,
    segment: String(row[7] || ""),
    recordId: String(row[8] || ""),
    recordTitle: String(row[9] || ""),
    changesSummary: changes,
    result: (String(row[11] || "SUCCESS").toUpperCase() as any),
    requestId: String(row[12] || "")
  };
}

function activityLogToRow(a: ActivityLogEntry): string[] {
  const summaryStr = typeof a.changesSummary === "string" ? a.changesSummary : JSON.stringify(a.changesSummary || {});
  return [
    a.activityId || `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    a.timestamp || new Date().toISOString(),
    a.actorUid || "",
    a.actorEmail || "",
    a.actorRole || "",
    a.action || "",
    a.module || "MEDIA_CENTER",
    a.segment || "",
    a.recordId || "",
    a.recordTitle || "",
    summaryStr,
    a.result || "SUCCESS",
    a.requestId || ""
  ];
}

// ==========================================
// ACTIVITY LOG WRITING & READING
// ==========================================

export async function createAuditLog(
  entry: Omit<ActivityLogEntry, "activityId" | "timestamp"> & { activityId?: string; timestamp?: string }
): Promise<{ success: boolean; activityId: string }> {
  const activityId = entry.activityId || `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const timestamp = entry.timestamp || new Date().toISOString();

  const fullEntry: ActivityLogEntry = {
    ...entry,
    activityId,
    timestamp,
    result: entry.result || "SUCCESS"
  };

  const row = activityLogToRow(fullEntry);

  if (shouldUseMockDriver()) {
    mockSheetsStore!.ActivityLog.push(row);
    return { success: true, activityId };
  }

  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "ActivityLog!A:M",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] }
    });
    return { success: true, activityId };
  } catch (err: any) {
    console.error("[ActivityLog] Failed to append audit row to Google Sheets ActivityLog:", err);
    throw new Error(`Failed to persist audit log to ActivityLog: ${err.message || String(err)}`);
  }
}

export async function getMediaActivityLogs(options: {
  limit?: number;
  segment?: string;
  actorUid?: string;
  actorRole?: string;
} = {}): Promise<ActivityLogEntry[]> {
  const limit = Math.min(options.limit || 50, 200);

  let rows: string[][] = [];

  if (shouldUseMockDriver()) {
    rows = mockSheetsStore!.ActivityLog.slice(1);
  } else {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "ActivityLog!A2:M"
    });
    rows = res.data.values || [];
  }

  let entries = rows.map(parseActivityLogRow);

  // Segment filtering if not Super Admin
  if (options.segment && options.actorRole !== UserRole.SUPER_ADMIN && options.actorRole !== "super_admin") {
    entries = entries.filter((e) => e.segment === options.segment);
  }

  // Sort descending by timestamp
  entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return entries.slice(0, limit);
}

// ==========================================
// MEDIA ITEMS CRUD (SHEETS AUTHORITATIVE)
// ==========================================

export async function getMediaItems(options: {
  category?: string;
  mediaType?: string;
  status?: string;
  showOnHomeOnly?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
} = {}): Promise<{ items: MediaItemDocument[]; total: number }> {
  // Check read-through cache
  const now = Date.now();
  let allItems: MediaItemDocument[];

  if (mediaCache && now - mediaCache.timestamp < CACHE_TTL_MS) {
    allItems = mediaCache.data;
  } else {
    let rows: string[][] = [];
    if (shouldUseMockDriver()) {
      rows = mockSheetsStore!.MediaItems.slice(1);
    } else {
      const sheets = getSheetsClient();
      const spreadsheetId = getSpreadsheetId();
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "MediaItems!A2:S"
      });
      rows = res.data.values || [];
    }

    allItems = rows.map(parseMediaItemRow).filter((m) => Boolean(m.mediaId));
    mediaCache = { data: allItems, timestamp: now };
  }

  // Filter pipeline
  let filtered = allItems;

  // Filter soft-deleted
  if (!options.includeDeleted) {
    filtered = filtered.filter((item) => item.status !== "DELETED");
  }

  // Status filter (e.g. "PUBLISHED")
  if (options.status && options.status !== "ALL") {
    filtered = filtered.filter((item) => item.status === options.status);
  }

  // showOnHomeOnly
  if (options.showOnHomeOnly) {
    filtered = filtered.filter((item) => item.showOnHome === true && item.status === "PUBLISHED");
  }

  // Category filter
  if (options.category && options.category !== "ALL" && options.category !== "ALL MEDIA") {
    const targetCat = options.category.toUpperCase().replace(/\s+/g, "_");
    filtered = filtered.filter((item) => {
      const itemCat = item.category.toUpperCase().replace(/\s+/g, "_");
      return itemCat === targetCat || item.category.toUpperCase() === options.category!.toUpperCase();
    });
  }

  // Type filter
  if (options.mediaType && options.mediaType !== "ALL") {
    filtered = filtered.filter((item) => item.mediaType === options.mediaType!.toUpperCase());
  }

  // Search filter
  if (options.search) {
    const q = options.search.trim().toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }

  // Sort by sortOrder ascending, then publishedAt / createdAt descending
  filtered.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    const timeA = new Date(a.publishedAt || a.createdAt).getTime();
    const timeB = new Date(b.publishedAt || b.createdAt).getTime();
    return timeB - timeA;
  });

  const total = filtered.length;
  const offset = options.offset || 0;
  const limit = Math.min(options.limit || 50, 100);
  const items = filtered.slice(offset, offset + limit);

  return { items, total };
}

export async function getMediaItemById(mediaId: string): Promise<MediaItemDocument | null> {
  const { items } = await getMediaItems({ limit: 1000, includeDeleted: true });
  return items.find((item) => item.mediaId === mediaId) || null;
}

export async function createMediaItem(
  payload: Partial<MediaItemDocument>,
  actor: ActorContext
): Promise<{ success: boolean; item: MediaItemDocument; auditLogged: boolean; warning?: string }> {
  if (!payload.title || !payload.title.trim()) {
    throw new Error("Media title is required");
  }

  const mediaId = payload.mediaId || `m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();
  const category = (payload.category || "PHOTO_GALLERY").toUpperCase().replace(/\s+/g, "_");
  const mediaType = (payload.mediaType || payload.type || "PHOTO").toUpperCase();
  const status = (payload.status as any) || "DRAFT";
  const publishedAt = status === "PUBLISHED" ? payload.publishedAt || nowIso : "";

  const newDoc: MediaItemDocument = {
    mediaId,
    category,
    mediaType,
    title: payload.title.trim(),
    description: (payload.description || payload.caption || "").trim(),
    driveFileId: (payload.driveFileId || "").trim(),
    driveFileName: (payload.driveFileName || "").trim(),
    driveViewUrl: (payload.driveViewUrl || "").trim(),
    publicMediaUrl: (payload.publicMediaUrl || payload.imageUrl || payload.img || "").trim(),
    thumbnailUrl: (payload.thumbnailUrl || payload.imageUrl || payload.img || "").trim(),
    showOnHome: Boolean(payload.showOnHome),
    status,
    createdByUid: actor.uid,
    createdByEmail: actor.email,
    createdAt: nowIso,
    updatedByUid: actor.uid,
    updatedAt: nowIso,
    publishedAt,
    sortOrder: typeof payload.sortOrder === "number" ? payload.sortOrder : payload.order || 0,

    id: mediaId,
    type: mediaType,
    imageUrl: (payload.publicMediaUrl || payload.imageUrl || payload.img || "").trim(),
    img: (payload.publicMediaUrl || payload.imageUrl || payload.img || "").trim(),
    caption: (payload.description || payload.caption || "").trim(),
    order: typeof payload.sortOrder === "number" ? payload.sortOrder : payload.order || 0,
    date: new Date(nowIso).toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" })
  };

  const row = mediaItemToRow(newDoc);

  // 1. Authoritative write to Google Sheets MediaItems
  if (shouldUseMockDriver()) {
    mockSheetsStore!.MediaItems.push(row);
  } else {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "MediaItems!A:S",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] }
    });
  }

  // Invalidate cache immediately on write
  invalidateMediaCache();

  // 2. Append to ActivityLog
  let auditLogged = false;
  let auditWarning: string | undefined;

  try {
    await createAuditLog({
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: "MEDIA_CREATED",
      module: "MEDIA_CENTER",
      segment: category,
      recordId: mediaId,
      recordTitle: newDoc.title,
      changesSummary: { title: newDoc.title, category, mediaType, status: newDoc.status },
      result: "SUCCESS",
      requestId: actor.requestId
    });
    auditLogged = true;
  } catch (auditErr: any) {
    console.error("[MediaService] Entity saved to MediaItems, but ActivityLog write failed:", auditErr);
    auditWarning = "Media item was saved to MediaItems, but audit logging to ActivityLog failed.";
  }

  return {
    success: true,
    item: newDoc,
    auditLogged,
    warning: auditWarning
  };
}

export async function updateMediaItem(
  mediaId: string,
  updates: Partial<MediaItemDocument>,
  actor: ActorContext
): Promise<{ success: boolean; item: MediaItemDocument; auditLogged: boolean; warning?: string }> {
  // Concurrency safety: find row index live directly before update
  let rowIndex = -1; // 1-indexed in sheet
  let existingRow: string[] | null = null;

  if (shouldUseMockDriver()) {
    const idx = mockSheetsStore!.MediaItems.findIndex((r, i) => i > 0 && r[0] === mediaId);
    if (idx === -1) {
      throw new Error(`Media item with ID '${mediaId}' not found in MediaItems`);
    }
    rowIndex = idx + 1; // 1-indexed
    existingRow = mockSheetsStore!.MediaItems[idx];
  } else {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    const colRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "MediaItems!A:A"
    });
    const colA = colRes.data.values || [];
    const foundIdx = colA.findIndex((r, i) => i > 0 && r[0] === mediaId);
    if (foundIdx === -1) {
      throw new Error(`Media item with ID '${mediaId}' not found in MediaItems`);
    }
    rowIndex = foundIdx + 1; // 1-indexed

    const rowRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `MediaItems!A${rowIndex}:S${rowIndex}`
    });
    existingRow = rowRes.data.values?.[0] || [];
  }

  const existingDoc = parseMediaItemRow(existingRow);
  const nowIso = new Date().toISOString();

  const newStatus = (updates.status || existingDoc.status) as MediaItemDocument["status"];
  let publishedAt = existingDoc.publishedAt;
  if (newStatus === "PUBLISHED" && (!publishedAt || existingDoc.status !== "PUBLISHED")) {
    publishedAt = nowIso;
  }

  const updatedDoc: MediaItemDocument = {
    ...existingDoc,
    category: updates.category ? updates.category.toUpperCase().replace(/\s+/g, "_") : existingDoc.category,
    mediaType: updates.mediaType || updates.type || existingDoc.mediaType,
    title: updates.title !== undefined ? updates.title.trim() : existingDoc.title,
    description:
      updates.description !== undefined
        ? updates.description.trim()
        : updates.caption !== undefined
        ? updates.caption.trim()
        : existingDoc.description,
    driveFileId: updates.driveFileId !== undefined ? updates.driveFileId.trim() : existingDoc.driveFileId,
    driveFileName: updates.driveFileName !== undefined ? updates.driveFileName.trim() : existingDoc.driveFileName,
    driveViewUrl: updates.driveViewUrl !== undefined ? updates.driveViewUrl.trim() : existingDoc.driveViewUrl,
    publicMediaUrl:
      updates.publicMediaUrl !== undefined
        ? updates.publicMediaUrl.trim()
        : updates.imageUrl || updates.img || existingDoc.publicMediaUrl,
    thumbnailUrl:
      updates.thumbnailUrl !== undefined
        ? updates.thumbnailUrl.trim()
        : updates.imageUrl || updates.img || existingDoc.thumbnailUrl,
    showOnHome: updates.showOnHome !== undefined ? Boolean(updates.showOnHome) : existingDoc.showOnHome,
    status: newStatus,
    updatedByUid: actor.uid,
    updatedAt: nowIso,
    publishedAt,
    sortOrder: typeof updates.sortOrder === "number" ? updates.sortOrder : updates.order ?? existingDoc.sortOrder,

    // Aliases
    id: mediaId,
    type: updates.mediaType || updates.type || existingDoc.mediaType,
    imageUrl:
      updates.publicMediaUrl || updates.imageUrl || updates.img || existingDoc.publicMediaUrl,
    img: updates.publicMediaUrl || updates.imageUrl || updates.img || existingDoc.publicMediaUrl,
    caption: updates.description || updates.caption || existingDoc.description,
    order: typeof updates.sortOrder === "number" ? updates.sortOrder : updates.order ?? existingDoc.sortOrder,
    date: existingDoc.date
  };

  const updatedRow = mediaItemToRow(updatedDoc);

  // Write back to sheet targeting exact row
  if (shouldUseMockDriver()) {
    mockSheetsStore!.MediaItems[rowIndex - 1] = updatedRow;
  } else {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `MediaItems!A${rowIndex}:S${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [updatedRow] }
    });
  }

  invalidateMediaCache();

  let auditLogged = false;
  let auditWarning: string | undefined;

  try {
    await createAuditLog({
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: "MEDIA_UPDATED",
      module: "MEDIA_CENTER",
      segment: updatedDoc.category,
      recordId: mediaId,
      recordTitle: updatedDoc.title,
      changesSummary: updates,
      result: "SUCCESS",
      requestId: actor.requestId
    });
    auditLogged = true;
  } catch (auditErr: any) {
    console.error("[MediaService] Media updated, but ActivityLog append failed:", auditErr);
    auditWarning = "Media item was updated in MediaItems, but audit logging to ActivityLog failed.";
  }

  return {
    success: true,
    item: updatedDoc,
    auditLogged,
    warning: auditWarning
  };
}

/**
 * SOFT DELETION ONLY:
 * Sets status = 'DELETED', showOnHome = FALSE, updates updatedAt and updatedByUid.
 * Never calls deleteDimension to physically delete rows.
 */
export async function deleteMediaItem(
  mediaId: string,
  actor: ActorContext
): Promise<{ success: boolean; auditLogged: boolean; warning?: string }> {
  const result = await updateMediaItem(
    mediaId,
    {
      status: "DELETED",
      showOnHome: false
    },
    actor
  );

  return {
    success: true,
    auditLogged: result.auditLogged,
    warning: result.warning
  };
}

// ==========================================
// SOCIAL CHANNELS CRUD (SHEETS AUTHORITATIVE)
// ==========================================

export async function getSocialChannels(options: {
  onlyEnabled?: boolean;
  showOnHomeOnly?: boolean;
  includeDeleted?: boolean;
} = {}): Promise<SocialChannelDocument[]> {
  const now = Date.now();
  let allChannels: SocialChannelDocument[];

  if (socialCache && now - socialCache.timestamp < CACHE_TTL_MS) {
    allChannels = socialCache.data;
  } else {
    let rows: string[][] = [];
    if (shouldUseMockDriver()) {
      rows = mockSheetsStore!.SocialChannels.slice(1);
    } else {
      const sheets = getSheetsClient();
      const spreadsheetId = getSpreadsheetId();
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "SocialChannels!A2:N"
      });
      rows = res.data.values || [];
    }

    allChannels = rows.map(parseSocialChannelRow).filter((c) => Boolean(c.channelId));
    socialCache = { data: allChannels, timestamp: now };
  }

  let filtered = allChannels;

  // Exclude soft-deleted by default
  if (!options.includeDeleted) {
    filtered = filtered.filter((c) => c.status !== "DELETED");
  }

  // Filter enabled
  if (options.onlyEnabled) {
    filtered = filtered.filter((c) => c.enabled === true);
  }

  // Filter homepage
  if (options.showOnHomeOnly) {
    filtered = filtered.filter((c) => c.showOnHome === true && c.enabled === true);
  }

  // Sort by homepagePosition (1-4) or sortOrder
  filtered.sort((a, b) => {
    if (a.homepagePosition !== b.homepagePosition) return a.homepagePosition - b.homepagePosition;
    return a.sortOrder - b.sortOrder;
  });

  return filtered;
}

export async function getSocialChannelById(channelId: string): Promise<SocialChannelDocument | null> {
  const channels = await getSocialChannels({ includeDeleted: true });
  return channels.find((c) => c.channelId === channelId) || null;
}

export async function createSocialChannel(
  payload: Partial<SocialChannelDocument>,
  actor: ActorContext
): Promise<{ success: boolean; channel: SocialChannelDocument; auditLogged: boolean; warning?: string }> {
  if (!payload.platform || !payload.displayName) {
    throw new Error("Social channel platform and displayName are required");
  }

  const channelId = payload.channelId || `soc_${Date.now()}`;
  const nowIso = new Date().toISOString();

  const newDoc: SocialChannelDocument = {
    channelId,
    platform: payload.platform.trim().toUpperCase(),
    displayName: (payload.displayName || payload.name || "").trim(),
    url: (payload.url || "").trim(),
    enabled: payload.enabled !== false,
    showOnHome: Boolean(payload.showOnHome),
    homepagePosition: typeof payload.homepagePosition === "number" ? payload.homepagePosition : 0,
    sortOrder: typeof payload.sortOrder === "number" ? payload.sortOrder : payload.order || 0,
    createdByUid: actor.uid,
    createdByEmail: actor.email,
    createdAt: nowIso,
    updatedByUid: actor.uid,
    updatedAt: nowIso,
    status: (payload.status as any) || "ACTIVE",

    id: channelId,
    name: (payload.displayName || payload.name || "").trim(),
    handle: (payload.displayName || payload.name || "").trim(),
    followers: "Verified",
    color: "text-blue-600",
    order: payload.sortOrder || payload.homepagePosition || 0
  };

  const row = socialChannelToRow(newDoc);

  if (shouldUseMockDriver()) {
    mockSheetsStore!.SocialChannels.push(row);
  } else {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "SocialChannels!A:N",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] }
    });
  }

  invalidateSocialCache();

  let auditLogged = false;
  let auditWarning: string | undefined;

  try {
    await createAuditLog({
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: "SOCIAL_CHANNEL_CREATED",
      module: "SOCIAL_HUB",
      segment: "SOCIAL_HUB",
      recordId: channelId,
      recordTitle: newDoc.displayName,
      changesSummary: { displayName: newDoc.displayName, platform: newDoc.platform, url: newDoc.url },
      result: "SUCCESS",
      requestId: actor.requestId
    });
    auditLogged = true;
  } catch (auditErr: any) {
    console.error("[SocialService] Channel created, but ActivityLog append failed:", auditErr);
    auditWarning = "Channel created in SocialChannels, but audit logging failed.";
  }

  return {
    success: true,
    channel: newDoc,
    auditLogged,
    warning: auditWarning
  };
}

export async function updateSocialChannel(
  channelId: string,
  updates: Partial<SocialChannelDocument>,
  actor: ActorContext
): Promise<{ success: boolean; channel: SocialChannelDocument; auditLogged: boolean; warning?: string }> {
  let rowIndex = -1;
  let existingRow: string[] | null = null;

  if (shouldUseMockDriver()) {
    const idx = mockSheetsStore!.SocialChannels.findIndex((r, i) => i > 0 && r[0] === channelId);
    if (idx === -1) {
      throw new Error(`Social channel with ID '${channelId}' not found in SocialChannels`);
    }
    rowIndex = idx + 1;
    existingRow = mockSheetsStore!.SocialChannels[idx];
  } else {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    const colRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "SocialChannels!A:A"
    });
    const colA = colRes.data.values || [];
    const foundIdx = colA.findIndex((r, i) => i > 0 && r[0] === channelId);
    if (foundIdx === -1) {
      throw new Error(`Social channel with ID '${channelId}' not found in SocialChannels`);
    }
    rowIndex = foundIdx + 1;

    const rowRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `SocialChannels!A${rowIndex}:N${rowIndex}`
    });
    existingRow = rowRes.data.values?.[0] || [];
  }

  const existingDoc = parseSocialChannelRow(existingRow);
  const nowIso = new Date().toISOString();

  const updatedDoc: SocialChannelDocument = {
    ...existingDoc,
    platform: updates.platform ? updates.platform.trim().toUpperCase() : existingDoc.platform,
    displayName:
      updates.displayName !== undefined
        ? updates.displayName.trim()
        : updates.name !== undefined
        ? updates.name.trim()
        : existingDoc.displayName,
    url: updates.url !== undefined ? updates.url.trim() : existingDoc.url,
    enabled: updates.enabled !== undefined ? Boolean(updates.enabled) : existingDoc.enabled,
    showOnHome: updates.showOnHome !== undefined ? Boolean(updates.showOnHome) : existingDoc.showOnHome,
    homepagePosition:
      typeof updates.homepagePosition === "number" ? updates.homepagePosition : existingDoc.homepagePosition,
    sortOrder:
      typeof updates.sortOrder === "number"
        ? updates.sortOrder
        : updates.order !== undefined
        ? updates.order
        : existingDoc.sortOrder,
    updatedByUid: actor.uid,
    updatedAt: nowIso,
    status: (updates.status as any) || existingDoc.status,

    id: channelId,
    name: updates.displayName || updates.name || existingDoc.displayName,
    handle: updates.displayName || updates.name || existingDoc.displayName,
    followers: existingDoc.followers,
    color: existingDoc.color,
    order: updates.sortOrder ?? existingDoc.sortOrder
  };

  const updatedRow = socialChannelToRow(updatedDoc);

  if (shouldUseMockDriver()) {
    mockSheetsStore!.SocialChannels[rowIndex - 1] = updatedRow;
  } else {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `SocialChannels!A${rowIndex}:N${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [updatedRow] }
    });
  }

  invalidateSocialCache();

  let auditLogged = false;
  let auditWarning: string | undefined;

  try {
    await createAuditLog({
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: "SOCIAL_CHANNEL_UPDATED",
      module: "SOCIAL_HUB",
      segment: "SOCIAL_HUB",
      recordId: channelId,
      recordTitle: updatedDoc.displayName,
      changesSummary: updates,
      result: "SUCCESS",
      requestId: actor.requestId
    });
    auditLogged = true;
  } catch (auditErr: any) {
    console.error("[SocialService] Channel updated, but ActivityLog failed:", auditErr);
    auditWarning = "Channel updated, but ActivityLog append failed.";
  }

  return {
    success: true,
    channel: updatedDoc,
    auditLogged,
    warning: auditWarning
  };
}

/**
 * SOFT DELETION ONLY:
 * Sets status = 'DELETED', enabled = FALSE, showOnHome = FALSE. Never calls deleteDimension.
 */
export async function deleteSocialChannel(
  channelId: string,
  actor: ActorContext
): Promise<{ success: boolean; auditLogged: boolean; warning?: string }> {
  const result = await updateSocialChannel(
    channelId,
    {
      status: "DELETED",
      enabled: false,
      showOnHome: false
    },
    actor
  );

  return {
    success: true,
    auditLogged: result.auditLogged,
    warning: result.warning
  };
}

// ==========================================
// SEGMENT PERMISSIONS (SHEETS AUTHORITATIVE)
// ==========================================

export async function getSegmentPermissions(): Promise<MediaPermissionDocument[]> {
  const now = Date.now();
  if (permissionsCache && now - permissionsCache.timestamp < CACHE_TTL_MS) {
    return permissionsCache.data;
  }

  let rows: string[][] = [];
  if (shouldUseMockDriver()) {
    rows = mockSheetsStore!.MediaPermissions.slice(1);
  } else {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "MediaPermissions!A2:M"
    });
    rows = res.data.values || [];
  }

  const grants = rows.map(parseMediaPermissionRow).filter((p) => Boolean(p.permissionId));
  permissionsCache = { data: grants, timestamp: now };
  return grants;
}

export async function grantSegmentPermission(
  payload: {
    userUid: string;
    userEmail: string;
    segment: string;
    canRead?: boolean;
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
  },
  actor: ActorContext
): Promise<{ success: boolean; permission: MediaPermissionDocument }> {
  const segment = payload.segment.toUpperCase().replace(/\s+/g, "_");
  if (!VALID_MEDIA_SEGMENTS.includes(segment as any)) {
    throw new Error(
      `Invalid segment '${segment}'. Must be one of: ${VALID_MEDIA_SEGMENTS.join(", ")}`
    );
  }

  const permissionId = `perm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const nowIso = new Date().toISOString();

  const doc: MediaPermissionDocument = {
    permissionId,
    userUid: payload.userUid.trim(),
    userEmail: payload.userEmail.trim().toLowerCase(),
    segment,
    canRead: payload.canRead !== false,
    canCreate: Boolean(payload.canCreate),
    canEdit: Boolean(payload.canEdit),
    canDelete: Boolean(payload.canDelete),
    grantedByUid: actor.uid,
    grantedByEmail: actor.email,
    grantedAt: nowIso,
    updatedAt: nowIso,
    status: "ACTIVE"
  };

  const row = mediaPermissionToRow(doc);

  if (shouldUseMockDriver()) {
    mockSheetsStore!.MediaPermissions.push(row);
  } else {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "MediaPermissions!A:M",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] }
    });
  }

  invalidatePermissionsCache();

  await createAuditLog({
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: "PERMISSION_GRANTED",
    module: "MEDIA_CENTER",
    segment,
    recordId: permissionId,
    recordTitle: `${payload.userEmail} -> ${segment}`,
    changesSummary: { segment, rights: { read: doc.canRead, create: doc.canCreate, edit: doc.canEdit, delete: doc.canDelete } },
    result: "SUCCESS",
    requestId: actor.requestId
  });

  return { success: true, permission: doc };
}

/**
 * REVOCATION PRESERVES HISTORY:
 * Updates status to 'REVOKED' and sets updatedAt. Never physically deletes row.
 */
export async function revokeSegmentPermission(
  permissionId: string,
  actor: ActorContext
): Promise<{ success: boolean }> {
  let rowIndex = -1;
  let existingRow: string[] | null = null;

  if (shouldUseMockDriver()) {
    const idx = mockSheetsStore!.MediaPermissions.findIndex((r, i) => i > 0 && r[0] === permissionId);
    if (idx === -1) {
      throw new Error(`Permission grant '${permissionId}' not found in MediaPermissions`);
    }
    rowIndex = idx + 1;
    existingRow = mockSheetsStore!.MediaPermissions[idx];
  } else {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    const colRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "MediaPermissions!A:A"
    });
    const colA = colRes.data.values || [];
    const foundIdx = colA.findIndex((r, i) => i > 0 && r[0] === permissionId);
    if (foundIdx === -1) {
      throw new Error(`Permission grant '${permissionId}' not found in MediaPermissions`);
    }
    rowIndex = foundIdx + 1;

    const rowRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `MediaPermissions!A${rowIndex}:M${rowIndex}`
    });
    existingRow = rowRes.data.values?.[0] || [];
  }

  const existing = parseMediaPermissionRow(existingRow);
  const nowIso = new Date().toISOString();

  const updated: MediaPermissionDocument = {
    ...existing,
    status: "REVOKED",
    updatedAt: nowIso
  };

  const updatedRow = mediaPermissionToRow(updated);

  if (shouldUseMockDriver()) {
    mockSheetsStore!.MediaPermissions[rowIndex - 1] = updatedRow;
  } else {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `MediaPermissions!A${rowIndex}:M${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [updatedRow] }
    });
  }

  invalidatePermissionsCache();

  await createAuditLog({
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: "PERMISSION_REVOKED",
    module: "MEDIA_CENTER",
    segment: existing.segment,
    recordId: permissionId,
    recordTitle: `${existing.userEmail} -> ${existing.segment}`,
    changesSummary: { status: "REVOKED" },
    result: "SUCCESS",
    requestId: actor.requestId
  });

  return { success: true };
}

/**
 * Checks whether user has segment permission.
 * Super Admins retain global override.
 */
export async function checkUserSegmentPermission(
  user: { uid?: string; email?: string; role?: string },
  segment: string,
  action: "read" | "create" | "edit" | "delete" = "read"
): Promise<boolean> {
  if (!user) return false;

  const role = (user.role || "").toUpperCase();
  if (role === UserRole.SUPER_ADMIN || role === "SUPER_ADMIN" || role === "SUPERADMIN") {
    return true;
  }

  const userEmail = (user.email || "").toLowerCase().trim();
  const userUid = user.uid || "";
  const normalizedSegment = segment.toUpperCase().replace(/\s+/g, "_");

  const grants = await getSegmentPermissions();

  const activeGrants = grants.filter(
    (g) =>
      g.status === "ACTIVE" &&
      g.segment === normalizedSegment &&
      ((userEmail && g.userEmail.toLowerCase() === userEmail) || (userUid && g.userUid === userUid))
  );

  if (activeGrants.length === 0) {
    return false;
  }

  switch (action) {
    case "read":
      return activeGrants.some((g) => g.canRead);
    case "create":
      return activeGrants.some((g) => g.canCreate);
    case "edit":
      return activeGrants.some((g) => g.canEdit);
    case "delete":
      return activeGrants.some((g) => g.canDelete);
    default:
      return false;
  }
}

/**
 * Static baseline permission matrix for UI display only
 */
export function getMediaPermissions() {
  return [
    {
      role: UserRole.SUPER_ADMIN,
      description: "Universal control across all segments, Google Drive OAuth, and Sheets permissions",
      canRead: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canGrant: true
    },
    {
      role: UserRole.ADMIN,
      description: "Administrative access subject to segment-specific grants in MediaPermissions tab",
      canRead: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canGrant: false
    },
    {
      role: UserRole.MEDIA_MANAGER,
      description: "Dedicated manager for assigned media segments in MediaPermissions tab",
      canRead: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canGrant: false
    },
    {
      role: UserRole.CONTENT_MANAGER,
      description: "Content creator with draft creation permissions for assigned segments",
      canRead: true,
      canCreate: true,
      canEdit: false,
      canDelete: false,
      canGrant: false
    },
    {
      role: UserRole.VIEWER,
      description: "Read-only access to published media assets",
      canRead: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canGrant: false
    }
  ];
}
