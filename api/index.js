var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/types.ts
var init_types = __esm({
  "src/types.ts"() {
  }
});

// src/lib/mediaService.ts
var mediaService_exports = {};
__export(mediaService_exports, {
  DEFAULT_DRIVE_FOLDER_ID: () => DEFAULT_DRIVE_FOLDER_ID,
  DEFAULT_SPREADSHEET_ID: () => DEFAULT_SPREADSHEET_ID,
  EXPECTED_ACTIVITY_LOG_HEADERS: () => EXPECTED_ACTIVITY_LOG_HEADERS,
  EXPECTED_MEDIA_ITEMS_HEADERS: () => EXPECTED_MEDIA_ITEMS_HEADERS,
  EXPECTED_MEDIA_PERMISSIONS_HEADERS: () => EXPECTED_MEDIA_PERMISSIONS_HEADERS,
  EXPECTED_SOCIAL_CHANNELS_HEADERS: () => EXPECTED_SOCIAL_CHANNELS_HEADERS,
  REQUIRED_TABS: () => REQUIRED_TABS,
  SchemaMismatchError: () => SchemaMismatchError,
  SheetsUnavailableError: () => SheetsUnavailableError,
  VALID_MEDIA_SEGMENTS: () => VALID_MEDIA_SEGMENTS,
  checkUserSegmentPermission: () => checkUserSegmentPermission,
  clearMockSheetsStore: () => clearMockSheetsStore,
  createAuditLog: () => createAuditLog2,
  createMediaItem: () => createMediaItem,
  createSocialChannel: () => createSocialChannel,
  deleteMediaItem: () => deleteMediaItem,
  deleteSocialChannel: () => deleteSocialChannel,
  getGoogleAuth: () => getGoogleAuth,
  getMediaActivityLogs: () => getMediaActivityLogs,
  getMediaItemById: () => getMediaItemById,
  getMediaItems: () => getMediaItems,
  getMediaPermissions: () => getMediaPermissions,
  getSegmentPermissions: () => getSegmentPermissions,
  getSheetsClient: () => getSheetsClient,
  getSocialChannelById: () => getSocialChannelById,
  getSocialChannels: () => getSocialChannels,
  getSpreadsheetId: () => getSpreadsheetId,
  grantSegmentPermission: () => grantSegmentPermission,
  initMockSheetsStore: () => initMockSheetsStore,
  invalidateAllMediaCaches: () => invalidateAllMediaCaches,
  invalidateMediaCache: () => invalidateMediaCache,
  invalidatePermissionsCache: () => invalidatePermissionsCache,
  invalidateSocialCache: () => invalidateSocialCache,
  isMockStoreActive: () => isMockStoreActive,
  isSheetsConfigured: () => isSheetsConfigured,
  revokeSegmentPermission: () => revokeSegmentPermission,
  sanitizePublicMediaItem: () => sanitizePublicMediaItem,
  updateMediaItem: () => updateMediaItem,
  updateSocialChannel: () => updateSocialChannel,
  validateSpreadsheet: () => validateSpreadsheet
});
import { google } from "googleapis";
function invalidateMediaCache() {
  mediaCache = null;
}
function invalidateSocialCache() {
  socialCache = null;
}
function invalidatePermissionsCache() {
  permissionsCache = null;
}
function invalidateAllMediaCaches() {
  mediaCache = null;
  socialCache = null;
  permissionsCache = null;
}
function initMockSheetsStore(customSeed) {
  mockSheetsStore = {
    MediaItems: [[...EXPECTED_MEDIA_ITEMS_HEADERS]],
    SocialChannels: [[...EXPECTED_SOCIAL_CHANNELS_HEADERS]],
    MediaPermissions: [[...EXPECTED_MEDIA_PERMISSIONS_HEADERS]],
    ActivityLog: [[...EXPECTED_ACTIVITY_LOG_HEADERS]],
    ...customSeed
  };
  invalidateAllMediaCaches();
}
function clearMockSheetsStore() {
  mockSheetsStore = null;
  invalidateAllMediaCaches();
}
function isMockStoreActive() {
  return mockSheetsStore !== null;
}
function shouldUseMockDriver() {
  return mockSheetsStore !== null;
}
async function validateSpreadsheet() {
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
  const existingTabs = (meta.data.sheets?.map((s) => s.properties?.title) || []).filter(Boolean);
  const missingTabs = REQUIRED_TABS.filter((t) => !existingTabs.includes(t));
  if (missingTabs.length > 0) {
    throw new SchemaMismatchError(`Missing required spreadsheet tabs: ${missingTabs.join(", ")}`, {
      missingTabs
    });
  }
  const headerMismatches = {};
  const expectedMap = {
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
function parseBooleanCell(val) {
  if (typeof val === "boolean") return val;
  if (!val) return false;
  const s = String(val).trim().toUpperCase();
  return s === "TRUE" || s === "1" || s === "YES";
}
function parseMediaItemRow(row) {
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
  const status = ["PUBLISHED", "DRAFT", "ARCHIVED", "DELETED"].includes(rawStatus) ? rawStatus : "DRAFT";
  const createdByUid = String(row[12] || "").trim();
  const createdByEmail = String(row[13] || "").trim();
  const createdAt = String(row[14] || (/* @__PURE__ */ new Date()).toISOString()).trim();
  const updatedByUid = String(row[15] || "").trim();
  const updatedAt = String(row[16] || createdAt).trim();
  const publishedAt = String(row[17] || "").trim();
  const sortOrder = parseInt(String(row[18] || "0"), 10) || 0;
  const displayImage = publicMediaUrl || thumbnailUrl || driveViewUrl || "";
  const displayDate = publishedAt ? new Date(publishedAt).toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" }) : new Date(createdAt).toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });
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
    videoUrl: mediaType === "VIDEO" ? publicMediaUrl || driveViewUrl : void 0,
    linkUrl: publicMediaUrl || driveViewUrl || void 0
  };
}
function sanitizePublicMediaItem(item) {
  const streamUrl = `/api/public/media/stream/${item.mediaId}`;
  return {
    mediaId: item.mediaId,
    category: item.category,
    mediaType: item.mediaType,
    title: item.title,
    description: item.description,
    driveFileId: "",
    // Hidden from public callers
    driveFileName: "",
    // Hidden from public callers
    driveViewUrl: "",
    // Hidden from public callers
    publicMediaUrl: streamUrl,
    thumbnailUrl: item.thumbnailUrl || streamUrl,
    showOnHome: item.showOnHome,
    status: item.status,
    createdAt: item.createdAt,
    publishedAt: item.publishedAt,
    sortOrder: item.sortOrder,
    // Aliases
    id: item.mediaId,
    type: item.mediaType,
    imageUrl: item.thumbnailUrl || streamUrl,
    img: item.thumbnailUrl || streamUrl,
    caption: item.description,
    order: item.sortOrder,
    date: item.date,
    videoUrl: item.mediaType === "VIDEO" ? streamUrl : void 0,
    linkUrl: streamUrl
  };
}
function mediaItemToRow(m) {
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
function parseSocialChannelRow(row) {
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
  const createdAt = String(row[10] || (/* @__PURE__ */ new Date()).toISOString()).trim();
  const updatedByUid = String(row[11] || "").trim();
  const updatedAt = String(row[12] || createdAt).trim();
  const rawStatus = String(row[13] || "ACTIVE").trim().toUpperCase();
  const status = rawStatus === "DELETED" ? "DELETED" : "ACTIVE";
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
function socialChannelToRow(c) {
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
function parseMediaPermissionRow(row) {
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
function mediaPermissionToRow(p) {
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
function parseActivityLogRow(row) {
  let changes = {};
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
    module: String(row[6] || "").toUpperCase() === "SOCIAL_HUB" ? "SOCIAL_HUB" : "MEDIA_CENTER",
    segment: String(row[7] || ""),
    recordId: String(row[8] || ""),
    recordTitle: String(row[9] || ""),
    changesSummary: changes,
    result: String(row[11] || "SUCCESS").toUpperCase(),
    requestId: String(row[12] || "")
  };
}
function activityLogToRow(a) {
  const summaryStr = typeof a.changesSummary === "string" ? a.changesSummary : JSON.stringify(a.changesSummary || {});
  return [
    a.activityId || `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    a.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
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
async function createAuditLog2(entry) {
  const activityId = entry.activityId || `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const timestamp = entry.timestamp || (/* @__PURE__ */ new Date()).toISOString();
  const fullEntry = {
    ...entry,
    activityId,
    timestamp,
    result: entry.result || "SUCCESS"
  };
  const row = activityLogToRow(fullEntry);
  if (shouldUseMockDriver()) {
    mockSheetsStore.ActivityLog.push(row);
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
  } catch (err) {
    console.error("[ActivityLog] Failed to append audit row to Google Sheets ActivityLog:", err);
    throw new Error(`Failed to persist audit log to ActivityLog: ${err.message || String(err)}`);
  }
}
async function getMediaActivityLogs(options = {}) {
  const limit = Math.min(options.limit || 50, 200);
  let rows = [];
  if (shouldUseMockDriver()) {
    rows = mockSheetsStore.ActivityLog.slice(1);
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
  if (options.segment && options.actorRole !== "SUPER_ADMIN" /* SUPER_ADMIN */ && options.actorRole !== "super_admin") {
    entries = entries.filter((e) => e.segment === options.segment);
  }
  entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return entries.slice(0, limit);
}
async function getMediaItems(options = {}) {
  const now = Date.now();
  let allItems;
  if (mediaCache && now - mediaCache.timestamp < CACHE_TTL_MS2) {
    allItems = mediaCache.data;
  } else {
    let rows = [];
    if (shouldUseMockDriver()) {
      rows = mockSheetsStore.MediaItems.slice(1);
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
  let filtered = allItems;
  if (!options.includeDeleted) {
    filtered = filtered.filter((item) => item.status !== "DELETED");
  }
  if (options.status && options.status !== "ALL") {
    filtered = filtered.filter((item) => item.status === options.status);
  }
  if (options.showOnHomeOnly) {
    filtered = filtered.filter((item) => item.showOnHome === true && item.status === "PUBLISHED");
  }
  if (options.category && options.category !== "ALL" && options.category !== "ALL MEDIA") {
    const targetCat = options.category.toUpperCase().replace(/\s+/g, "_");
    filtered = filtered.filter((item) => {
      const itemCat = item.category.toUpperCase().replace(/\s+/g, "_");
      return itemCat === targetCat || item.category.toUpperCase() === options.category.toUpperCase();
    });
  }
  if (options.mediaType && options.mediaType !== "ALL") {
    filtered = filtered.filter((item) => item.mediaType === options.mediaType.toUpperCase());
  }
  if (options.search) {
    const q = options.search.trim().toLowerCase();
    filtered = filtered.filter(
      (item) => item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    );
  }
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
async function getMediaItemById(mediaId) {
  const { items } = await getMediaItems({ limit: 1e3, includeDeleted: true });
  return items.find((item) => item.mediaId === mediaId) || null;
}
async function createMediaItem(payload, actor) {
  if (!payload.title || !payload.title.trim()) {
    throw new Error("Media title is required");
  }
  const mediaId = payload.mediaId || `m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const category = (payload.category || "PHOTO_GALLERY").toUpperCase().replace(/\s+/g, "_");
  const mediaType = (payload.mediaType || payload.type || "PHOTO").toUpperCase();
  const status = payload.status || "DRAFT";
  const publishedAt = status === "PUBLISHED" ? payload.publishedAt || nowIso : "";
  const newDoc = {
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
  if (shouldUseMockDriver()) {
    mockSheetsStore.MediaItems.push(row);
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
  invalidateMediaCache();
  let auditLogged = false;
  let auditWarning;
  try {
    await createAuditLog2({
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
  } catch (auditErr) {
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
async function updateMediaItem(mediaId, updates, actor) {
  let rowIndex = -1;
  let existingRow = null;
  if (shouldUseMockDriver()) {
    const idx = mockSheetsStore.MediaItems.findIndex((r, i) => i > 0 && r[0] === mediaId);
    if (idx === -1) {
      throw new Error(`Media item with ID '${mediaId}' not found in MediaItems`);
    }
    rowIndex = idx + 1;
    existingRow = mockSheetsStore.MediaItems[idx];
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
    rowIndex = foundIdx + 1;
    const rowRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `MediaItems!A${rowIndex}:S${rowIndex}`
    });
    existingRow = rowRes.data.values?.[0] || [];
  }
  const existingDoc = parseMediaItemRow(existingRow);
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const newStatus = updates.status || existingDoc.status;
  let publishedAt = existingDoc.publishedAt;
  if (newStatus === "PUBLISHED" && (!publishedAt || existingDoc.status !== "PUBLISHED")) {
    publishedAt = nowIso;
  }
  const updatedDoc = {
    ...existingDoc,
    category: updates.category ? updates.category.toUpperCase().replace(/\s+/g, "_") : existingDoc.category,
    mediaType: updates.mediaType || updates.type || existingDoc.mediaType,
    title: updates.title !== void 0 ? updates.title.trim() : existingDoc.title,
    description: updates.description !== void 0 ? updates.description.trim() : updates.caption !== void 0 ? updates.caption.trim() : existingDoc.description,
    driveFileId: updates.driveFileId !== void 0 ? updates.driveFileId.trim() : existingDoc.driveFileId,
    driveFileName: updates.driveFileName !== void 0 ? updates.driveFileName.trim() : existingDoc.driveFileName,
    driveViewUrl: updates.driveViewUrl !== void 0 ? updates.driveViewUrl.trim() : existingDoc.driveViewUrl,
    publicMediaUrl: updates.publicMediaUrl !== void 0 ? updates.publicMediaUrl.trim() : updates.imageUrl || updates.img || existingDoc.publicMediaUrl,
    thumbnailUrl: updates.thumbnailUrl !== void 0 ? updates.thumbnailUrl.trim() : updates.imageUrl || updates.img || existingDoc.thumbnailUrl,
    showOnHome: updates.showOnHome !== void 0 ? Boolean(updates.showOnHome) : existingDoc.showOnHome,
    status: newStatus,
    updatedByUid: actor.uid,
    updatedAt: nowIso,
    publishedAt,
    sortOrder: typeof updates.sortOrder === "number" ? updates.sortOrder : updates.order ?? existingDoc.sortOrder,
    // Aliases
    id: mediaId,
    type: updates.mediaType || updates.type || existingDoc.mediaType,
    imageUrl: updates.publicMediaUrl || updates.imageUrl || updates.img || existingDoc.publicMediaUrl,
    img: updates.publicMediaUrl || updates.imageUrl || updates.img || existingDoc.publicMediaUrl,
    caption: updates.description || updates.caption || existingDoc.description,
    order: typeof updates.sortOrder === "number" ? updates.sortOrder : updates.order ?? existingDoc.sortOrder,
    date: existingDoc.date
  };
  const updatedRow = mediaItemToRow(updatedDoc);
  if (shouldUseMockDriver()) {
    mockSheetsStore.MediaItems[rowIndex - 1] = updatedRow;
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
  let auditWarning;
  try {
    await createAuditLog2({
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
  } catch (auditErr) {
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
async function deleteMediaItem(mediaId, actor) {
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
async function getSocialChannels(options = {}) {
  const now = Date.now();
  let allChannels;
  if (socialCache && now - socialCache.timestamp < CACHE_TTL_MS2) {
    allChannels = socialCache.data;
  } else {
    let rows = [];
    if (shouldUseMockDriver()) {
      rows = mockSheetsStore.SocialChannels.slice(1);
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
  if (!options.includeDeleted) {
    filtered = filtered.filter((c) => c.status !== "DELETED");
  }
  if (options.onlyEnabled) {
    filtered = filtered.filter((c) => c.enabled === true);
  }
  if (options.showOnHomeOnly) {
    filtered = filtered.filter((c) => c.showOnHome === true && c.enabled === true);
  }
  filtered.sort((a, b) => {
    if (a.homepagePosition !== b.homepagePosition) return a.homepagePosition - b.homepagePosition;
    return a.sortOrder - b.sortOrder;
  });
  return filtered;
}
async function getSocialChannelById(channelId) {
  const channels = await getSocialChannels({ includeDeleted: true });
  return channels.find((c) => c.channelId === channelId) || null;
}
async function createSocialChannel(payload, actor) {
  if (!payload.platform || !payload.displayName) {
    throw new Error("Social channel platform and displayName are required");
  }
  const channelId = payload.channelId || `soc_${Date.now()}`;
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const newDoc = {
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
    status: payload.status || "ACTIVE",
    id: channelId,
    name: (payload.displayName || payload.name || "").trim(),
    handle: (payload.displayName || payload.name || "").trim(),
    followers: "Verified",
    color: "text-blue-600",
    order: payload.sortOrder || payload.homepagePosition || 0
  };
  const row = socialChannelToRow(newDoc);
  if (shouldUseMockDriver()) {
    mockSheetsStore.SocialChannels.push(row);
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
  let auditWarning;
  try {
    await createAuditLog2({
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
  } catch (auditErr) {
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
async function updateSocialChannel(channelId, updates, actor) {
  let rowIndex = -1;
  let existingRow = null;
  if (shouldUseMockDriver()) {
    const idx = mockSheetsStore.SocialChannels.findIndex((r, i) => i > 0 && r[0] === channelId);
    if (idx === -1) {
      throw new Error(`Social channel with ID '${channelId}' not found in SocialChannels`);
    }
    rowIndex = idx + 1;
    existingRow = mockSheetsStore.SocialChannels[idx];
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
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const updatedDoc = {
    ...existingDoc,
    platform: updates.platform ? updates.platform.trim().toUpperCase() : existingDoc.platform,
    displayName: updates.displayName !== void 0 ? updates.displayName.trim() : updates.name !== void 0 ? updates.name.trim() : existingDoc.displayName,
    url: updates.url !== void 0 ? updates.url.trim() : existingDoc.url,
    enabled: updates.enabled !== void 0 ? Boolean(updates.enabled) : existingDoc.enabled,
    showOnHome: updates.showOnHome !== void 0 ? Boolean(updates.showOnHome) : existingDoc.showOnHome,
    homepagePosition: typeof updates.homepagePosition === "number" ? updates.homepagePosition : existingDoc.homepagePosition,
    sortOrder: typeof updates.sortOrder === "number" ? updates.sortOrder : updates.order !== void 0 ? updates.order : existingDoc.sortOrder,
    updatedByUid: actor.uid,
    updatedAt: nowIso,
    status: updates.status || existingDoc.status,
    id: channelId,
    name: updates.displayName || updates.name || existingDoc.displayName,
    handle: updates.displayName || updates.name || existingDoc.displayName,
    followers: existingDoc.followers,
    color: existingDoc.color,
    order: updates.sortOrder ?? existingDoc.sortOrder
  };
  const updatedRow = socialChannelToRow(updatedDoc);
  if (shouldUseMockDriver()) {
    mockSheetsStore.SocialChannels[rowIndex - 1] = updatedRow;
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
  let auditWarning;
  try {
    await createAuditLog2({
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
  } catch (auditErr) {
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
async function deleteSocialChannel(channelId, actor) {
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
async function getSegmentPermissions() {
  const now = Date.now();
  if (permissionsCache && now - permissionsCache.timestamp < CACHE_TTL_MS2) {
    return permissionsCache.data;
  }
  let rows = [];
  if (shouldUseMockDriver()) {
    rows = mockSheetsStore.MediaPermissions.slice(1);
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
async function grantSegmentPermission(payload, actor) {
  const segment = payload.segment.toUpperCase().replace(/\s+/g, "_");
  if (!VALID_MEDIA_SEGMENTS.includes(segment)) {
    throw new Error(
      `Invalid segment '${segment}'. Must be one of: ${VALID_MEDIA_SEGMENTS.join(", ")}`
    );
  }
  const permissionId = `perm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const doc = {
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
    mockSheetsStore.MediaPermissions.push(row);
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
  await createAuditLog2({
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
async function revokeSegmentPermission(permissionId, actor) {
  let rowIndex = -1;
  let existingRow = null;
  if (shouldUseMockDriver()) {
    const idx = mockSheetsStore.MediaPermissions.findIndex((r, i) => i > 0 && r[0] === permissionId);
    if (idx === -1) {
      throw new Error(`Permission grant '${permissionId}' not found in MediaPermissions`);
    }
    rowIndex = idx + 1;
    existingRow = mockSheetsStore.MediaPermissions[idx];
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
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const updated = {
    ...existing,
    status: "REVOKED",
    updatedAt: nowIso
  };
  const updatedRow = mediaPermissionToRow(updated);
  if (shouldUseMockDriver()) {
    mockSheetsStore.MediaPermissions[rowIndex - 1] = updatedRow;
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
  await createAuditLog2({
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
async function checkUserSegmentPermission(user, segment, action = "read") {
  if (!user) return false;
  const role = (user.role || "").toUpperCase();
  if (role === "SUPER_ADMIN" /* SUPER_ADMIN */ || role === "SUPER_ADMIN" || role === "SUPERADMIN") {
    return true;
  }
  const userEmail = (user.email || "").toLowerCase().trim();
  const userUid = user.uid || "";
  const normalizedSegment = segment.toUpperCase().replace(/\s+/g, "_");
  const grants = await getSegmentPermissions();
  const activeGrants = grants.filter(
    (g) => g.status === "ACTIVE" && g.segment === normalizedSegment && (userEmail && g.userEmail.toLowerCase() === userEmail || userUid && g.userUid === userUid)
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
function getMediaPermissions() {
  return [
    {
      role: "SUPER_ADMIN" /* SUPER_ADMIN */,
      description: "Universal control across all segments, Google Drive OAuth, and Sheets permissions",
      canRead: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canGrant: true
    },
    {
      role: "ADMIN" /* ADMIN */,
      description: "Administrative access subject to segment-specific grants in MediaPermissions tab",
      canRead: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canGrant: false
    },
    {
      role: "MEDIA_MANAGER" /* MEDIA_MANAGER */,
      description: "Dedicated manager for assigned media segments in MediaPermissions tab",
      canRead: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canGrant: false
    },
    {
      role: "CONTENT_MANAGER" /* CONTENT_MANAGER */,
      description: "Content creator with draft creation permissions for assigned segments",
      canRead: true,
      canCreate: true,
      canEdit: false,
      canDelete: false,
      canGrant: false
    },
    {
      role: "VIEWER" /* VIEWER */,
      description: "Read-only access to published media assets",
      canRead: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canGrant: false
    }
  ];
}
var DEFAULT_SPREADSHEET_ID, DEFAULT_DRIVE_FOLDER_ID, REQUIRED_TABS, VALID_MEDIA_SEGMENTS, EXPECTED_MEDIA_ITEMS_HEADERS, EXPECTED_SOCIAL_CHANNELS_HEADERS, EXPECTED_MEDIA_PERMISSIONS_HEADERS, EXPECTED_ACTIVITY_LOG_HEADERS, SheetsUnavailableError, SchemaMismatchError, CACHE_TTL_MS2, mediaCache, socialCache, permissionsCache, getSpreadsheetId, isSheetsConfigured, getGoogleAuth, getSheetsClient, mockSheetsStore;
var init_mediaService = __esm({
  "src/lib/mediaService.ts"() {
    init_types();
    DEFAULT_SPREADSHEET_ID = "1VgR34P0CJNweC4lsuRUHTN2z3BCHaV0fdBgAAozNOWo";
    DEFAULT_DRIVE_FOLDER_ID = "1gIQLW7nwr2ZwZMDlFicWD9aGTn7MX9hh";
    REQUIRED_TABS = ["MediaItems", "SocialChannels", "MediaPermissions", "ActivityLog"];
    VALID_MEDIA_SEGMENTS = [
      "PHOTO_GALLERY",
      "VIDEO_GALLERY",
      "PRESS_RELEASES",
      "NEWS_COVERAGE",
      "INTERVIEWS",
      "SOCIAL_HUB"
    ];
    EXPECTED_MEDIA_ITEMS_HEADERS = [
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
    ];
    EXPECTED_SOCIAL_CHANNELS_HEADERS = [
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
    ];
    EXPECTED_MEDIA_PERMISSIONS_HEADERS = [
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
    ];
    EXPECTED_ACTIVITY_LOG_HEADERS = [
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
    ];
    SheetsUnavailableError = class extends Error {
      constructor(message = "Google Sheets service unavailable") {
        super(message);
        this.name = "SheetsUnavailableError";
        this.statusCode = 503;
      }
    };
    SchemaMismatchError = class extends Error {
      constructor(message, details = {}) {
        super(message);
        this.name = "SchemaMismatchError";
        this.statusCode = 500;
        this.details = details;
      }
    };
    CACHE_TTL_MS2 = 2e4;
    mediaCache = null;
    socialCache = null;
    permissionsCache = null;
    getSpreadsheetId = () => {
      return process.env.GOOGLE_SHEET_ID || DEFAULT_SPREADSHEET_ID;
    };
    isSheetsConfigured = () => {
      return Boolean(
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY
      );
    };
    getGoogleAuth = () => {
      if (!isSheetsConfigured()) {
        return null;
      }
      return new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        scopes: ["https://www.googleapis.com/auth/spreadsheets"]
      });
    };
    getSheetsClient = () => {
      const auth = getGoogleAuth();
      if (!auth) {
        throw new SheetsUnavailableError(
          "Google Sheets credentials unconfigured. Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY."
        );
      }
      return google.sheets({ version: "v4", auth });
    };
    mockSheetsStore = null;
  }
});

// src/serverApp.ts
import express from "express";
import cookieParser from "cookie-parser";
import { GoogleGenAI } from "@google/genai";
import { google as google3 } from "googleapis";
import rateLimit from "express-rate-limit";
import crypto2 from "crypto";

// src/lib/mongodb.ts
import { MongoClient } from "mongodb";
var DEFAULT_CLUSTER_HOST = "cluster0.lqdmdvr.mongodb.net";
var DEFAULT_DATABASE_NAME = "chintadaravikumar";
var OBSOLETE_CLUSTER_HOST = "cluster0.wvy2yis.mongodb.net";
function getMongoDbName() {
  const customDb = process.env.MONGODB_DB_NAME?.trim();
  if (customDb && customDb !== "Party") return customDb;
  return DEFAULT_DATABASE_NAME;
}
function getMongoUri() {
  const username = process.env.MONGODB_USERNAME?.trim();
  const password = process.env.MONGODB_PASSWORD?.trim();
  const host = process.env.MONGODB_CLUSTER_HOST?.trim() || DEFAULT_CLUSTER_HOST;
  const db = getMongoDbName();
  if (username && password) {
    const encodedUser = encodeURIComponent(username);
    const encodedPass = encodeURIComponent(password);
    return `mongodb+srv://${encodedUser}:${encodedPass}@${host}/${db}?retryWrites=true&w=majority`;
  }
  const rawUri = process.env.MONGODB_URI?.trim();
  if (rawUri) {
    if (password && (rawUri.includes("<password>") || rawUri.includes("<db_password>"))) {
      const encodedPass = encodeURIComponent(password);
      return rawUri.replace(/<password>|<db_password>/g, encodedPass);
    }
    if (rawUri.includes(OBSOLETE_CLUSTER_HOST)) {
      return null;
    }
    return rawUri;
  }
  const testUri = process.env.MONGODB_TEST_URI?.trim();
  if (testUri && db === "chintadaravikumar_test") {
    return testUri;
  }
  return null;
}
function sanitizeErrorMessage(message) {
  if (!message) return "Unknown database error";
  return message.replace(/\/\/[^:]+:[^@]+@/g, "//***:***@").replace(/password=[^&]+/gi, "password=***");
}
function getMongoClusterHost() {
  const hostEnv = process.env.MONGODB_CLUSTER_HOST?.trim();
  if (hostEnv) return hostEnv;
  const uri = getMongoUri();
  if (!uri) return DEFAULT_CLUSTER_HOST;
  try {
    const parsed = new URL(uri);
    return parsed.hostname;
  } catch {
    const match = uri.match(/@([^/?#]+)/);
    return match ? match[1] : DEFAULT_CLUSTER_HOST;
  }
}
var client = null;
var currentConnectedUri = null;
async function getMongoClient(forceReconnect = false) {
  const uri = getMongoUri();
  if (!uri) {
    if (client) {
      await client.close().catch(() => {
      });
      client = null;
      currentConnectedUri = null;
    }
    return null;
  }
  if (client && (forceReconnect || currentConnectedUri !== uri)) {
    try {
      await client.close().catch(() => {
      });
    } finally {
      client = null;
      currentConnectedUri = null;
    }
  }
  if (!client) {
    const maxPoolSize = parseInt(process.env.MONGODB_MAX_POOL_SIZE || "5", 10);
    const minPoolSize = parseInt(process.env.MONGODB_MIN_POOL_SIZE || "0", 10);
    const newClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5e3,
      connectTimeoutMS: 1e4,
      maxPoolSize,
      minPoolSize,
      family: 4
    });
    try {
      await newClient.connect();
      const targetDb = getMongoDbName();
      await newClient.db(targetDb).command({ ping: 1 });
      client = newClient;
      currentConnectedUri = uri;
      console.log(`[MongoDB] Connected successfully to database: ${targetDb}`);
    } catch (err) {
      await newClient.close().catch(() => {
      });
      client = null;
      currentConnectedUri = null;
      const sanitizedErr = sanitizeErrorMessage(err.message);
      console.error(`[MongoDB] Connection failed: ${sanitizedErr}`);
      throw new Error(sanitizedErr);
    }
  }
  return client;
}
async function getCollection(collectionName, dbName) {
  const targetDb = dbName || getMongoDbName();
  const activeClient = await getMongoClient();
  if (!activeClient) return null;
  return activeClient.db(targetDb).collection(collectionName);
}
async function checkMongoHealth() {
  const uri = getMongoUri();
  const dbName = getMongoDbName();
  const cluster = getMongoClusterHost();
  if (!uri) {
    return {
      status: "disconnected",
      database: dbName,
      cluster,
      message: "MongoDB credentials not configured. Please set MONGODB_USERNAME & MONGODB_PASSWORD (or MONGODB_URI) in Secrets or environment."
    };
  }
  const startTime = Date.now();
  try {
    const activeClient = await getMongoClient();
    if (!activeClient) {
      return {
        status: "disconnected",
        database: dbName,
        cluster,
        message: "MongoClient could not be initialized"
      };
    }
    await activeClient.db(dbName).command({ ping: 1 });
    const latencyMs = Date.now() - startTime;
    let collections = [];
    try {
      const collectionInfos = await activeClient.db(dbName).listCollections().toArray();
      collections = collectionInfos.map((c) => c.name);
    } catch {
    }
    return {
      status: "connected",
      database: dbName,
      cluster,
      latencyMs,
      collections,
      hasSiteSettings: collections.includes("site_settings")
    };
  } catch (err) {
    const sanitizedError = sanitizeErrorMessage(err.message);
    return {
      status: "error",
      database: dbName,
      cluster,
      error: sanitizedError
    };
  }
}

// src/lib/homeService.ts
var SITE_SETTINGS_COLLECTION = "site_settings";
var HOME_SECTIONS_COLLECTION = "home_sections";
var DEFAULT_SITE_SETTINGS = {
  slug: "global",
  siteName: "Chintada Ravi Kumar Official Portal",
  siteTitle: "Chintada Ravi Kumar | Member of Legislative Assembly",
  tagline: "People First \u2022 Development Always",
  leaderName: "Chintada Ravi Kumar",
  constituency: "Ramanayapeta / Constituency",
  contactEmail: "office@chintadaravikumar.in",
  helpline: "1902",
  officeAddress: "MLA Camp Office, Main Road, Ramanayapeta, Andhra Pradesh",
  logoText: "MLA",
  socialLinks: {
    facebook: "https://facebook.com/chintadaravikumar",
    twitter: "https://twitter.com/chintadaravi",
    instagram: "https://instagram.com/chintadaravikumar",
    youtube: "https://youtube.com/@chintadaravikumar",
    whatsapp: "https://wa.me/919999999999"
  },
  announcement: {
    enabled: true,
    text: "Prajadarbar held every Saturday at the Camp Office from 9:00 AM to 1:00 PM.",
    link: "/contact"
  },
  navLinks: [
    { name: "Home", nameTe: "\u0C39\u0C4B\u0C2E\u0C4D", path: "/", order: 0, isVisible: true },
    { name: "About", nameTe: "\u0C17\u0C41\u0C30\u0C3F\u0C02\u0C1A\u0C3F", path: "/about", order: 1, isVisible: true },
    { name: "Vision", nameTe: "\u0C26\u0C43\u0C37\u0C4D\u0C1F\u0C3F", path: "/vision", order: 2, isVisible: true },
    { name: "Activities", nameTe: "\u0C15\u0C3E\u0C30\u0C4D\u0C2F\u0C15\u0C32\u0C3E\u0C2A\u0C3E\u0C32\u0C41", path: "/activities", order: 3, isVisible: true },
    { name: "Development", nameTe: "\u0C05\u0C2D\u0C3F\u0C35\u0C43\u0C26\u0C4D\u0C27\u0C3F", path: "/development", order: 4, isVisible: true },
    { name: "Public Voice", nameTe: "\u0C2A\u0C4D\u0C30\u0C1C\u0C3E \u0C17\u0C4A\u0C02\u0C24\u0C41\u0C15", path: "/public-voice", order: 5, isVisible: true },
    { name: "Cadre Corner", nameTe: "\u0C15\u0C4D\u0C2F\u0C3E\u0C21\u0C30\u0C4D \u0C15\u0C3E\u0C30\u0C4D\u0C28\u0C30\u0C4D", path: "/cadre-corner", order: 6, isVisible: true },
    { name: "Media", nameTe: "\u0C2E\u0C40\u0C21\u0C3F\u0C2F\u0C3E", path: "/media-center", order: 7, isVisible: true },
    { name: "Contact", nameTe: "\u0C38\u0C02\u0C2A\u0C4D\u0C30\u0C26\u0C3F\u0C02\u0C1A\u0C02\u0C21\u0C3F", path: "/contact", order: 8, isVisible: true },
    { name: "Volunteer", nameTe: "\u0C35\u0C3E\u0C32\u0C02\u0C1F\u0C40\u0C30\u0C4D", path: "/volunteer", order: 9, isVisible: true }
  ],
  footer: {
    platformTitle: "MLA Public Representative Portal",
    platformDescription: "A unified administrative interface for citizen engagement, transparent governance, and hyper-local service delivery for the people.",
    copyrightText: "\xA9 2026 Office of Chintada Ravi Kumar, MLA. All rights reserved."
  },
  updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
  updatedBy: "system"
};
var DEFAULT_HOME_SECTIONS = [
  {
    sectionId: "hero",
    title: "Main Hero Banner",
    subtitle: "Hero presentation with leader photo, slogans, and daily highlights",
    order: 0,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "CONTENT_MANAGER"],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "system",
    data: {
      title: "PEOPLE FIRST",
      subtitle: "DEVELOPMENT ALWAYS",
      leaderTitle: "An Educated | Energetic | Hardworking Leader",
      subtext: "Working for the People, With the People",
      leaderPhotoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=1200",
      activitiesCtaText: "Latest Activities",
      activitiesCtaLink: "/activities",
      publicVoiceCtaText: "People's Voice",
      publicVoiceCtaLink: "/public-voice",
      socialFollowText: "Follow us on",
      socialPlatforms: [
        { name: "youtube", url: "https://youtube.com" },
        { name: "facebook", url: "https://facebook.com" },
        { name: "instagram", url: "https://instagram.com" },
        { name: "twitter", url: "https://twitter.com" },
        { name: "whatsapp", url: "https://whatsapp.com" }
      ],
      highlightsCardTitle: "Today's Highlights",
      highlightsItems: [
        { id: "h1", icon: "MapPin", text: "3 Village Visits", sub: "Ramanayapeta" },
        { id: "h2", icon: "Users", text: "2 Public Meetings", sub: "Mandal Center" },
        { id: "h3", icon: "Clock", text: "Review Meeting", sub: "Evening 5 PM" }
      ],
      fullScheduleCtaText: "Full Schedule",
      fullScheduleCtaLink: "/activities"
    }
  },
  {
    sectionId: "stats",
    title: "Key Impact Statistics",
    subtitle: "Quantitative achievements and milestone metrics",
    order: 1,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "CONTENT_MANAGER"],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "system",
    data: {
      stats: [
        { id: "s1", label: "Villages Visited", labelTe: "\u0C38\u0C02\u0C26\u0C30\u0C4D\u0C36\u0C3F\u0C02\u0C1A\u0C3F\u0C28 \u0C17\u0C4D\u0C30\u0C3E\u0C2E\u0C3E\u0C32\u0C41", value: "500+", icon: "MapPin", color: "text-green-600", bg: "bg-green-50" },
        { id: "s2", label: "Public Meetings", labelTe: "\u0C2C\u0C39\u0C3F\u0C30\u0C02\u0C17 \u0C38\u0C2D\u0C32\u0C41", value: "1000+", icon: "Users", color: "text-blue-600", bg: "bg-blue-50" },
        { id: "s3", label: "Issues Resolved", labelTe: "\u0C2A\u0C30\u0C3F\u0C37\u0C4D\u0C15\u0C30\u0C3F\u0C02\u0C1A\u0C2C\u0C21\u0C3F\u0C28 \u0C38\u0C2E\u0C38\u0C4D\u0C2F\u0C32\u0C41", value: "2000+", icon: "CheckCircle", color: "text-amber-600", bg: "bg-amber-50" },
        { id: "s4", label: "Active Volunteers", labelTe: "\u0C15\u0C4D\u0C30\u0C3F\u0C2F\u0C3E\u0C36\u0C40\u0C32 \u0C35\u0C3E\u0C32\u0C02\u0C1F\u0C40\u0C30\u0C4D\u0C32\u0C41", value: "15K+", icon: "Heart", color: "text-purple-600", bg: "bg-purple-50" },
        { id: "s5", label: "People Benefited", labelTe: "\u0C2A\u0C4D\u0C30\u0C1C\u0C32\u0C41 \u0C2A\u0C4D\u0C30\u0C2F\u0C4B\u0C1C\u0C28\u0C02 \u0C2A\u0C4A\u0C02\u0C26\u0C3E\u0C30\u0C41", value: "3L+", icon: "Heart", color: "text-red-500", bg: "bg-red-50" },
        { id: "s6", label: "Social Media Followers", labelTe: "\u0C38\u0C4B\u0C37\u0C32\u0C4D \u0C2E\u0C40\u0C21\u0C3F\u0C2F\u0C3E \u0C2B\u0C3E\u0C32\u0C4B\u0C35\u0C30\u0C4D\u0C38\u0C4D", value: "1M+", icon: "ThumbsUp", color: "text-blue-500", bg: "bg-blue-50" }
      ]
    }
  },
  {
    sectionId: "about_leader",
    title: "Leader's Profile",
    subtitle: "Biographical overview and core leadership principles",
    order: 2,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "CONTENT_MANAGER"],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "system",
    data: {
      title: "Leader's Profile",
      titleTe: "\u0C28\u0C3E\u0C2F\u0C15\u0C41\u0C21\u0C3F \u0C2A\u0C4D\u0C30\u0C4A\u0C2B\u0C48\u0C32\u0C4D",
      imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800",
      imageAlt: "Chintada Ravi Kumar MLA",
      bullets: [
        { key: "academic", label: "Academic Excellence", labelTe: "\u0C35\u0C3F\u0C26\u0C4D\u0C2F\u0C3E \u0C28\u0C48\u0C2A\u0C41\u0C23\u0C4D\u0C2F\u0C02" },
        { key: "grassroots", label: "Grassroots Connection", labelTe: "\u0C05\u0C1F\u0C4D\u0C1F\u0C21\u0C41\u0C17\u0C41 \u0C38\u0C4D\u0C25\u0C3E\u0C2F\u0C3F \u0C38\u0C02\u0C2C\u0C02\u0C27\u0C02" },
        { key: "social", label: "Social Transformation", labelTe: "\u0C38\u0C3E\u0C2E\u0C3E\u0C1C\u0C3F\u0C15 \u0C2E\u0C3E\u0C30\u0C4D\u0C2A\u0C41" },
        { key: "party", label: "Party Visionary", labelTe: "\u0C2A\u0C3E\u0C30\u0C4D\u0C1F\u0C40 \u0C35\u0C3F\u0C1C\u0C28\u0C30\u0C40" },
        { key: "constituency", label: "Constituency Focus", labelTe: "\u0C28\u0C3F\u0C2F\u0C4B\u0C1C\u0C15\u0C35\u0C30\u0C4D\u0C17 \u0C26\u0C43\u0C37\u0C4D\u0C1F\u0C3F" },
        { key: "committed", label: "Committed Leadership", labelTe: "\u0C15\u0C1F\u0C4D\u0C1F\u0C41\u0C2C\u0C21\u0C3F \u0C09\u0C28\u0C4D\u0C28 \u0C28\u0C3E\u0C2F\u0C15\u0C24\u0C4D\u0C35\u0C02" }
      ],
      ctaText: "Full Biography",
      ctaLink: "/about"
    }
  },
  {
    sectionId: "our_vision",
    title: "Our Vision",
    subtitle: "Constituency master plan and core focus pillars",
    order: 3,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "RESEARCH_MANAGER"],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "system",
    data: {
      title: "Our Vision",
      visions: [
        { id: "v1", title: "Education For All", titleTe: "\u0C05\u0C02\u0C26\u0C30\u0C3F\u0C15\u0C40 \u0C35\u0C3F\u0C26\u0C4D\u0C2F", icon: "GraduationCap", color: "text-blue-600", bg: "bg-blue-50" },
        { id: "v2", title: "Agriculture & Farmers", titleTe: "\u0C35\u0C4D\u0C2F\u0C35\u0C38\u0C3E\u0C2F\u0C02 & \u0C30\u0C48\u0C24\u0C41\u0C32\u0C41", icon: "Sprout", color: "text-green-600", bg: "bg-green-50" },
        { id: "v3", title: "Youth Employment", titleTe: "\u0C2F\u0C41\u0C35\u0C24 \u0C09\u0C2A\u0C3E\u0C27\u0C3F", icon: "Briefcase", color: "text-amber-600", bg: "bg-amber-50" },
        { id: "v4", title: "Women Empowerment", titleTe: "\u0C2E\u0C39\u0C3F\u0C33\u0C3E \u0C38\u0C3E\u0C27\u0C3F\u0C15\u0C3E\u0C30\u0C24", icon: "Venus", color: "text-pink-600", bg: "bg-pink-50" },
        { id: "v5", title: "Healthcare For All", titleTe: "\u0C05\u0C02\u0C26\u0C30\u0C3F\u0C15\u0C40 \u0C06\u0C30\u0C4B\u0C17\u0C4D\u0C2F\u0C02", icon: "Heart", color: "text-red-600", bg: "bg-red-50" },
        { id: "v6", title: "Infrastructure Dev", titleTe: "\u0C2E\u0C4C\u0C32\u0C3F\u0C15 \u0C38\u0C26\u0C41\u0C2A\u0C3E\u0C2F\u0C3E\u0C32\u0C41", icon: "Zap", color: "text-indigo-600", bg: "bg-indigo-50" },
        { id: "v7", title: "Clean Water For All", titleTe: "\u0C2A\u0C30\u0C3F\u0C36\u0C41\u0C2D\u0C4D\u0C30\u0C2E\u0C48\u0C28 \u0C24\u0C3E\u0C17\u0C41\u0C28\u0C40\u0C30\u0C41", icon: "Waves", color: "text-cyan-600", bg: "bg-cyan-50" },
        { id: "v8", title: "Transparent Governance", titleTe: "\u0C2A\u0C3E\u0C30\u0C26\u0C30\u0C4D\u0C36\u0C15 \u0C2A\u0C3E\u0C32\u0C28", icon: "ShieldCheck", color: "text-slate-800", bg: "bg-slate-100" }
      ],
      manifestoCtaText: "View Full Manifesto",
      manifestoCtaLink: "/vision"
    }
  },
  {
    sectionId: "leadership_journey",
    title: "Leadership Journey",
    subtitle: "Milestones from grassroots activist to Member of Legislative Assembly",
    order: 4,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "CONTENT_MANAGER"],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "system",
    data: {
      title: "Our Journey",
      viewAllText: "Explore Implementation",
      viewAllLink: "/vision",
      milestones: [
        {
          year: "1992",
          title: "Youth Welfare Movement",
          desc: "The journey began with a simple gathering of admirers transformed into a powerful social service movement dedicated to grassroots community support and identifying local needs.",
          image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800"
        },
        {
          year: "2001",
          title: "Civil Service Organization",
          desc: "Evolving into a structured service organization. This phase focused on formal grievance redressal systems and systematic welfare distribution across the constituency.",
          image: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=800"
        },
        {
          year: "2009",
          title: "People's Movement",
          desc: "A true testament to leadership, the movement gained political momentum, advocating for transparent governance and sustainable rural infrastructure development.",
          image: "https://images.unsplash.com/photo-1524178232363-1fb28f74b0cd?auto=format&fit=crop&q=80&w=800"
        },
        {
          year: "2016",
          title: "Legislative Vision",
          desc: "Proposed the 'Integrated Village Growth' model which became a benchmark for development. Focused on primary education and digital empowerment for rural youth.",
          image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800"
        },
        {
          year: "2024",
          title: "Constituency Transformation",
          desc: "Currently leading the charge in Ramanayapeta with state-of-the-art infrastructure projects, digital public libraries, and direct citizen link portals.",
          image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800"
        }
      ]
    }
  },
  {
    sectionId: "daily_activities",
    title: "Daily Activities",
    subtitle: "Routine schedule, constituency rounds, and recent activity logs",
    order: 5,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "CONTENT_MANAGER"],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "system",
    data: {
      title: "Daily Activities",
      slots: [
        { time: "Morning", activity: "Village Visits", icon: "MapPin" },
        { time: "Afternoon", activity: "Public Interactions", icon: "Heart" },
        { time: "Evening", activity: "Meetings", icon: "Users" },
        { time: "Night", activity: "Review & Planning", icon: "Zap" }
      ],
      galleryImages: [
        "https://picsum.photos/seed/act1/400/400",
        "https://picsum.photos/seed/act2/400/400",
        "https://picsum.photos/seed/act3/400/400"
      ],
      ctaText: "View Today's Full Activities",
      ctaLink: "/activities"
    }
  },
  {
    sectionId: "monthly_activities",
    title: "Monthly Activities & Report",
    subtitle: "Aggregated monthly metrics and performance logs",
    order: 6,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "CONTENT_MANAGER"],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "system",
    data: {
      title: "Monthly Activities",
      monthLabel: "Current Month 2026",
      stats: [
        { label: "Village Visits", count: 48, icon: "MapPin" },
        { label: "Public Meetings", count: 16, icon: "Users" },
        { label: "Welfare Programs", count: 12, icon: "Heart" },
        { label: "Youth Programs", count: 8, icon: "Zap" },
        { label: "Party Strengthening", count: 20, icon: "Users" }
      ]
    }
  },
  {
    sectionId: "development_projects",
    title: "Constituency Development Projects",
    subtitle: "Active infrastructure projects and delivery progress indicators",
    order: 7,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "CONTENT_MANAGER"],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "system",
    data: {
      title: "District Transformation",
      viewAllText: "Launch Dashboard",
      viewAllLink: "/development",
      workflowSteps: [
        { label: "Identify", icon: "Search" },
        { label: "Plan", icon: "FileText" },
        { label: "Execute", icon: "Zap" },
        { label: "Monitor", icon: "Activity" }
      ],
      projects: [
        { id: "p1", name: "Roads", category: "Infrastructure", progress: 75, color: "bg-green-500", imageSeed: "road", description: "All-weather connectivity across rural habitations" },
        { id: "p2", name: "Water", category: "Public Utilities", progress: 60, color: "bg-blue-500", imageSeed: "water", description: "Piped drinking water distribution pipeline" },
        { id: "p3", name: "Schools", category: "Education", progress: 80, color: "bg-amber-500", imageSeed: "school", description: "Modern classrooms, digital labs, and sanitation facilities" },
        { id: "p4", name: "Hospitals", category: "Healthcare", progress: 70, color: "bg-red-500", imageSeed: "hospital", description: "Primary Health Center upgrades and 24/7 emergency service" },
        { id: "p5", name: "Employment", category: "Livelihood", progress: 65, color: "bg-purple-500", imageSeed: "work", description: "Skill training centers and rural youth placement drives" }
      ]
    }
  },
  {
    sectionId: "peoples_voice",
    title: "People's Voice & Redressal",
    subtitle: "Public interaction and grievance resolution gateway",
    order: 8,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "PUBLIC_RELATIONS_MANAGER"],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "system",
    data: {
      title: "People's Voice",
      services: [
        { id: "pv1", label: "Submit Grievance", sub: "We are here to listen & help", icon: "ShieldAlert", link: "/public-voice" },
        { id: "pv2", label: "Give Suggestions", sub: "Your ideas, Our Future", icon: "Activity", link: "/public-voice" },
        { id: "pv3", label: "Success Stories", sub: "Real Stories, Real Change", icon: "UserCheck", link: "/public-voice" },
        { id: "pv4", label: "Track Your Request", sub: "Know the status of your request", icon: "Search", link: "/public-voice" }
      ]
    }
  },
  {
    sectionId: "cadre_corner",
    title: "Cadre Corner",
    subtitle: "Dedicated space for party workers, booth committees, and wings",
    order: 9,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "CADRE_MANAGER"],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "system",
    data: {
      title: "Cadre Corner",
      wings: [
        { id: "w1", label: "Youth Wing", icon: "Users", color: "text-orange-600" },
        { id: "w2", label: "Women Wing", icon: "Venus", color: "text-pink-600" },
        { id: "w3", label: "Student Wing", icon: "GraduationCap", color: "text-blue-600" },
        { id: "w4", label: "BC Wing", icon: "Briefcase", color: "text-amber-600" },
        { id: "w5", label: "SC/ST Wing", icon: "ShieldAlert", color: "text-red-600" },
        { id: "w6", label: "Minority Wing", icon: "Heart", color: "text-purple-600" },
        { id: "w7", label: "Booth Committees", icon: "Building2", color: "text-slate-800" },
        { id: "w8", label: "Mandal Teams", icon: "UserCheck", color: "text-green-600" }
      ],
      ctaText: "Join the Cadre",
      ctaLink: "/cadre-corner"
    }
  },
  {
    sectionId: "media_center",
    title: "Media Center",
    subtitle: "Photo galleries, video clips, press releases, and news items",
    order: 10,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "MEDIA_MANAGER"],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "system",
    data: {
      title: "Media Center",
      tabs: ["Photo Gallery", "Video Gallery", "Press Releases", "News Coverage", "Interviews"],
      activeTabDefault: "Photo Gallery",
      items: [
        { id: "m1", title: "Development Review Meeting", category: "Photo Gallery", imageUrl: "https://picsum.photos/seed/med1/600/400", date: "May 2024" },
        { id: "m2", title: "Constituency Village Visit", category: "Photo Gallery", imageUrl: "https://picsum.photos/seed/med2/600/400", date: "May 2024" },
        { id: "m3", title: "Youth Career Guidance Camp", category: "Photo Gallery", imageUrl: "https://picsum.photos/seed/med3/600/400", date: "April 2024" },
        { id: "m4", title: "Water Scheme Inauguration", category: "Photo Gallery", imageUrl: "https://picsum.photos/seed/med4/600/400", date: "April 2024" }
      ],
      ctaText: "View All Media",
      ctaLink: "/media-center"
    }
  },
  {
    sectionId: "social_hub",
    title: "Social Media Hub",
    subtitle: "Official social media channels and handle links",
    order: 11,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "MEDIA_MANAGER"],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "system",
    data: {
      title: "Social Media Hub",
      platforms: [
        { name: "YouTube", handle: "@chintadaravikumar", url: "https://youtube.com/@chintadaravikumar", followers: "250K+", color: "text-red-600" },
        { name: "Facebook", handle: "/chintadaravikumar", url: "https://facebook.com/chintadaravikumar", followers: "500K+", color: "text-blue-600" },
        { name: "Instagram", handle: "@chintadaravikumar", url: "https://instagram.com/chintadaravikumar", followers: "320K+", color: "text-pink-600" },
        { name: "Twitter / X", handle: "@chintadaravi", url: "https://twitter.com/chintadaravi", followers: "180K+", color: "text-sky-500" }
      ]
    }
  },
  {
    sectionId: "upcoming_events",
    title: "Upcoming Events",
    subtitle: "Public meetings, village tours, and upcoming constituency events",
    order: 12,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "EVENT_MANAGER"],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "system",
    data: {
      title: "Upcoming Events",
      events: [
        { id: "e1", day: "25", month: "MAY", title: "Village Visit", location: "Ramanayapeta", time: "09:00 AM" },
        { id: "e2", day: "26", month: "MAY", title: "Public Meeting", location: "Siddapuram", time: "06:00 PM" },
        { id: "e3", day: "28", month: "MAY", title: "Welfare Program", location: "Government School", time: "10:00 AM" }
      ],
      ctaText: "View Full Calendar",
      ctaLink: "/activities"
    }
  },
  {
    sectionId: "volunteer_contact",
    title: "Volunteer & Contact",
    subtitle: "Volunteer enrollment form and constituency office contact info",
    order: 13,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "VOLUNTEER_MANAGER"],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "system",
    data: {
      volunteerTitle: "Join as Volunteer",
      volunteerSubtitle: "Be part of the grassroots team working for real progress",
      volunteerCtaText: "Register Now",
      volunteerCtaLink: "/volunteer",
      contactTitle: "Contact Us",
      officeName: "Constituency Camp Office",
      officeAddress: "Main Road, Ramanayapeta, Andhra Pradesh",
      phone: "+91 891 2345678",
      helpline: "1902 (Toll Free)",
      email: "office@chintadaravikumar.in"
    }
  },
  {
    sectionId: "about_page",
    title: "About Page Content",
    subtitle: "Complete biography, mission, values, and credentials",
    order: 14,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "CONTENT_MANAGER"],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "system",
    data: {
      pageTitle: "Our District Core",
      pageSubtitle: "Founded on the principles of transparency and development, we work tirelessly to serve every citizen in the district.",
      missionTitle: "Our Mission",
      missionText: '"To bridge the gap between governance and citizens using technology and human-centric policies, ensuring sustainable development across all mandals."',
      heroImageUrl: "https://images.unsplash.com/photo-1541802645635-11f2286a7482?auto=format&fit=crop&q=80&w=1200"
    }
  },
  {
    sectionId: "vision_page",
    title: "Vision Page Content",
    subtitle: "Strategic manifesto and core focus pillars",
    order: 15,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "RESEARCH_MANAGER"],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "system",
    data: {
      pageTitle: "Vision for a Better Tomorrow",
      pageSubtitle: "Building a prosperous, inclusive, and sustainable constituency through innovation, integrity, and hard work."
    }
  },
  {
    sectionId: "activities_page",
    title: "Activities Page Content",
    subtitle: "Ground presence, recent activity logs, and event schedules",
    order: 16,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "CONTENT_MANAGER"],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "system",
    data: {
      pageTitle: "Leadership in Action",
      pageSubtitle: "Ground presence, public meetings, and grassroots interactions across the constituency.",
      recentLogs: [
        { date: "June 15, 2026", title: "Review Meeting on Water Projects", desc: "Met with engineers to discuss the pipeline progress in eastern villages." },
        { date: "June 14, 2026", title: "Inauguration of New Community Center", desc: "Gram Panchayat facility opened for public use in Mandal Town." },
        { date: "June 12, 2026", title: "Palle Baata - Village Visit Program", desc: "Walking with people to understand local grievances firsthand." }
      ]
    }
  },
  {
    sectionId: "development_page",
    title: "Development Page Content",
    subtitle: "Development metrics hub, capital deployment, and sector progress",
    order: 17,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "RESEARCH_MANAGER"],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "system",
    data: {
      pageTitle: "Development Metrics Hub",
      pageSubtitle: "Transparency in every brick and drop. Tracking the transformation of our constituency across key sectors.",
      activeSites: "154",
      capitalDeployed: "\u20B91.4B",
      successRate: "98%",
      sectors: [
        { name: "Infrastructure & Roads", progress: 85, projects: 12 },
        { name: "Water & Sanitation", progress: 64, projects: 8 },
        { name: "Healthcare Facilities", progress: 92, projects: 5 },
        { name: "Education & Schools", progress: 78, projects: 15 },
        { name: "Agriculture & Allied", progress: 56, projects: 20 },
        { name: "Housing Projects", progress: 42, projects: 10 }
      ],
      capitalAllocation: [
        { label: "Infrastructure", val: "45%" },
        { label: "Healthcare", val: "25%" },
        { label: "Digital Literacy", val: "20%" }
      ],
      growthIndexText: "Quarterly assessment shows a 12% increase in rural connectivity and 18% improvement in public health accessibility."
    }
  },
  {
    sectionId: "media_page",
    title: "Media Center Page Content",
    subtitle: "Communication hub, press releases, video gallery, photo archives, and reports",
    order: 18,
    enabled: true,
    assignedRoles: ["SUPER_ADMIN", "MEDIA_MANAGER"],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: "system",
    data: {
      pageTitle: "Media Center",
      pageSubtitle: "Communication hub, press releases, video gallery, photo archive, and official reports.",
      items: [
        { id: "m1", type: "VIDEO", title: "Quarterly Townhall Highlights", date: "June 10, 2026", img: "https://images.unsplash.com/photo-1475721027785-f74dea9f2672?auto=format&fit=crop&q=80&w=1200", category: "VIDEO GALLERY" },
        { id: "m2", type: "PRESS", title: "New Health Initiative Launch", date: "June 08, 2026", img: "https://images.unsplash.com/photo-1576085898323-218337e3e43c?auto=format&fit=crop&q=80&w=1200", category: "PRESS RELEASES" },
        { id: "m3", type: "PHOTO", title: "District Sports Meet 2026", date: "June 05, 2026", img: "https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&q=80&w=1200", category: "PHOTO ARCHIVE" },
        { id: "m4", type: "VIDEO", title: "Weekly Development Vlog #12", date: "June 01, 2026", img: "https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&q=80&w=1200", category: "VIDEO GALLERY" },
        { id: "m5", type: "PRESS", title: "Bypass Road Contract Signed", date: "May 28, 2026", img: "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80&w=1200", category: "PRESS RELEASES" },
        { id: "m6", type: "PHOTO", title: "School Renovation Tour", date: "May 25, 2026", img: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1200", category: "PHOTO ARCHIVE" }
      ]
    }
  }
];
var CACHE_TTL_MS = 30 * 1e3;
var cache = {
  payload: null,
  settings: null,
  timestamp: 0
};
function invalidateHomeCache() {
  cache.payload = null;
  cache.settings = null;
  cache.timestamp = 0;
}
async function getSiteSettings() {
  if (cache.settings && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return cache.settings;
  }
  const col = await getCollection(SITE_SETTINGS_COLLECTION);
  if (!col) {
    return DEFAULT_SITE_SETTINGS;
  }
  const existing = await col.findOne({ slug: "global" });
  if (existing) {
    const { _id, ...rest } = existing;
    const settings = {
      _id: _id.toString(),
      ...rest
    };
    cache.settings = settings;
    return settings;
  }
  await col.updateOne(
    { slug: "global" },
    { $set: { ...DEFAULT_SITE_SETTINGS, updatedAt: (/* @__PURE__ */ new Date()).toISOString() } },
    { upsert: true }
  );
  cache.settings = DEFAULT_SITE_SETTINGS;
  return DEFAULT_SITE_SETTINGS;
}
async function updateSiteSettings(updates, updatedBy) {
  const col = await getCollection(SITE_SETTINGS_COLLECTION);
  if (!col) {
    throw new Error("MongoDB connection unavailable");
  }
  const payload = {
    ...updates,
    slug: "global",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedBy: updatedBy || "admin"
  };
  await col.updateOne({ slug: "global" }, { $set: payload }, { upsert: true });
  invalidateHomeCache();
  return getSiteSettings();
}
async function getAllHomeSections(includeDisabled = false) {
  const col = await getCollection(HOME_SECTIONS_COLLECTION);
  if (!col) {
    return DEFAULT_HOME_SECTIONS.filter((s) => includeDisabled || s.enabled);
  }
  const query = includeDisabled ? {} : { enabled: true };
  const docs = await col.find(query).sort({ order: 1 }).toArray();
  if (docs.length === 0) {
    return DEFAULT_HOME_SECTIONS.filter((s) => includeDisabled || s.enabled);
  }
  return docs.map((doc) => {
    const { _id, ...rest } = doc;
    return {
      _id: _id.toString(),
      ...rest
    };
  });
}
async function getHomeSectionById(sectionId) {
  const col = await getCollection(HOME_SECTIONS_COLLECTION);
  if (!col) {
    return DEFAULT_HOME_SECTIONS.find((s) => s.sectionId === sectionId) || null;
  }
  const doc = await col.findOne({ sectionId });
  if (!doc) {
    return DEFAULT_HOME_SECTIONS.find((s) => s.sectionId === sectionId) || null;
  }
  const { _id, ...rest } = doc;
  return {
    _id: _id.toString(),
    ...rest
  };
}
async function updateHomeSection(sectionId, updates, updatedBy) {
  const col = await getCollection(HOME_SECTIONS_COLLECTION);
  if (!col) {
    throw new Error("MongoDB connection unavailable");
  }
  const existing = await getHomeSectionById(sectionId);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const mergedPayload = {
    ...existing,
    ...updates,
    sectionId,
    updatedAt: now,
    updatedBy: updatedBy || "admin"
  };
  delete mergedPayload._id;
  await col.updateOne(
    { sectionId },
    { $set: mergedPayload },
    { upsert: true }
  );
  invalidateHomeCache();
  const updated = await getHomeSectionById(sectionId);
  if (!updated) {
    throw new Error(`Failed to retrieve updated section: ${sectionId}`);
  }
  return updated;
}
async function getPublicHomePayload() {
  if (cache.payload && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return cache.payload;
  }
  const [settings, sections] = await Promise.all([
    getSiteSettings(),
    getAllHomeSections(false)
  ]);
  const payload = {
    settings,
    sections,
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
    source: "mongodb"
  };
  cache.payload = payload;
  cache.timestamp = Date.now();
  return payload;
}
async function seedInitialHomeData(force = false) {
  const dbName = getMongoDbName();
  const settingsCol = await getCollection(SITE_SETTINGS_COLLECTION);
  const sectionsCol = await getCollection(HOME_SECTIONS_COLLECTION);
  if (!settingsCol || !sectionsCol) {
    throw new Error(`Cannot connect to database '${dbName}' for seeding.`);
  }
  let settingsSeeded = false;
  let sectionsCount = 0;
  const existingSettings = await settingsCol.findOne({ slug: "global" });
  if (!existingSettings || force) {
    await settingsCol.updateOne(
      { slug: "global" },
      { $set: { ...DEFAULT_SITE_SETTINGS, updatedAt: (/* @__PURE__ */ new Date()).toISOString(), updatedBy: "seeder" } },
      { upsert: true }
    );
    settingsSeeded = true;
  }
  const existingSectionsCount = await sectionsCol.countDocuments();
  if (existingSectionsCount === 0 || force) {
    if (force) {
      await sectionsCol.deleteMany({});
    }
    for (const section of DEFAULT_HOME_SECTIONS) {
      await sectionsCol.updateOne(
        { sectionId: section.sectionId },
        {
          $set: {
            ...section,
            updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
            updatedBy: "seeder"
          }
        },
        { upsert: true }
      );
      sectionsCount++;
    }
  } else {
    sectionsCount = existingSectionsCount;
  }
  invalidateHomeCache();
  return {
    settingsSeeded,
    sectionsCount,
    message: `Database '${dbName}' seeded successfully. ${sectionsCount} sections active.`
  };
}

// src/lib/authMiddleware.ts
init_types();
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// src/types/homeCms.ts
var ALL_HOMEPAGE_SECTION_IDS = [
  "hero",
  "stats",
  "about_leader",
  "our_vision",
  "leadership_journey",
  "daily_activities",
  "monthly_activities",
  "yearly_report",
  "development_projects",
  "peoples_voice",
  "cadre_corner",
  "media_center",
  "social_hub",
  "upcoming_events",
  "volunteer_contact",
  "about_page",
  "vision_page",
  "activities_page",
  "development_page",
  "media_page"
];

// src/lib/userService.ts
init_types();
var DB_NAME = process.env.MONGODB_DB_NAME || "chintadaravikumar";
var USERS_COLLECTION = "admin_users";
var AUDIT_LOGS_COLLECTION = "audit_logs";
function getSuperAdminAllowlist() {
  const envEmails = (process.env.SUPER_ADMIN_EMAILS || process.env.SUPER_ADMIN_EMAIL || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return Array.from(new Set(envEmails));
}
function getSuperAdminUidAllowlist() {
  const envUids = (process.env.SUPER_ADMIN_UIDS || process.env.SUPER_ADMIN_UID || "").split(",").map((u) => u.trim()).filter(Boolean);
  return Array.from(new Set(envUids));
}
function isSuperAdminEmail(email) {
  if (!email) return false;
  const allowlist = getSuperAdminAllowlist();
  if (allowlist.length === 0) return false;
  return allowlist.includes(email.toLowerCase().trim());
}
function isSuperAdminUid(uid) {
  if (!uid) return false;
  const allowlist = getSuperAdminUidAllowlist();
  if (allowlist.length === 0) return false;
  return allowlist.includes(uid.trim());
}
function isSuperAdmin(identity) {
  if (!identity) return false;
  if (identity.emailVerified !== void 0 && !identity.emailVerified) {
    return false;
  }
  if (identity.uid && isSuperAdminUid(identity.uid)) return true;
  if (identity.email && isSuperAdminEmail(identity.email)) return true;
  return false;
}
async function createAuditLog(log) {
  try {
    const client2 = await getMongoClient();
    if (!client2) {
      console.warn("[AuditLog] MongoDB client unavailable for audit persistence");
      return { timestamp: (/* @__PURE__ */ new Date()).toISOString(), ...log };
    }
    const db = client2.db(DB_NAME);
    const col = db.collection(AUDIT_LOGS_COLLECTION);
    const doc = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
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
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      ...log
    };
  }
}
async function getAuditLogs(limitCount = 50) {
  try {
    const client2 = await getMongoClient();
    if (!client2) return [];
    const db = client2.db(DB_NAME);
    const col = db.collection(AUDIT_LOGS_COLLECTION);
    const results = await col.find({}).sort({ timestamp: -1 }).limit(limitCount).toArray();
    return results.map((r) => ({
      ...r,
      _id: r._id?.toString()
    }));
  } catch (err) {
    console.error("[AuditLog] Failed to read audit logs:", err);
    return [];
  }
}
async function syncGoogleUser(params) {
  const client2 = await getMongoClient();
  if (!client2) {
    throw new Error("Database connection unavailable.");
  }
  const db = client2.db(DB_NAME);
  const col = db.collection(USERS_COLLECTION);
  const email = params.email.toLowerCase().trim();
  const isEmailVerified = Boolean(params.emailVerified);
  const isSA = isEmailVerified && isSuperAdmin({ email, uid: params.uid, emailVerified: isEmailVerified });
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const existingByUid = await col.findOne({ uid: params.uid });
  const existingByEmail = await col.findOne({ email });
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
    const superAdminDoc = {
      uid: params.uid,
      // Strictly bound to verified Firebase UID
      email,
      displayName: params.displayName || existing?.displayName || "Super Admin",
      photoURL: params.photoURL || existing?.photoURL || `https://ui-avatars.com/api/?name=Super+Admin&background=001D3D&color=fff`,
      role: "SUPER_ADMIN" /* SUPER_ADMIN */,
      status: "APPROVED" /* APPROVED */,
      permissions: ["*"],
      assignedSections: [...ALL_HOMEPAGE_SECTION_IDS],
      lastLogin: now,
      updatedAt: now
    };
    if (!existing) {
      const fullDoc = {
        ...superAdminDoc,
        createdAt: now,
        notes: "Authorized Super Admin provisioned via verified Google sign-in"
      };
      await col.insertOne(fullDoc);
      await createAuditLog({
        actorUid: params.uid,
        actorEmail: email,
        actorRole: "SUPER_ADMIN" /* SUPER_ADMIN */,
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
        actorRole: "SUPER_ADMIN" /* SUPER_ADMIN */,
        action: "SUPER_ADMIN_VERIFIED_SIGN_IN",
        targetEntity: "admin_users",
        targetId: email,
        details: { uid: params.uid, email },
        ipAddress: params.ipAddress
      });
      return { ...existing, ...superAdminDoc };
    }
  }
  if (existing) {
    const updates = {
      uid: params.uid,
      // Keep verified UID in sync
      lastLogin: now,
      displayName: params.displayName || existing.displayName,
      photoURL: params.photoURL || existing.photoURL,
      updatedAt: now
    };
    if (params.requestedRole && existing.status === "PENDING" /* PENDING */) {
      updates.requestedRole = String(params.requestedRole).slice(0, 100);
    }
    if (params.requestNotes && existing.status === "PENDING" /* PENDING */) {
      updates.requestNotes = String(params.requestNotes).slice(0, 500);
    }
    await col.updateOne({ _id: existing._id }, { $set: updates });
    return { ...existing, ...updates };
  } else {
    const newDoc = {
      uid: params.uid,
      email,
      displayName: params.displayName || email.split("@")[0].toUpperCase(),
      photoURL: params.photoURL || `https://ui-avatars.com/api/?name=${email}&background=004B8D&color=fff`,
      role: "VIEWER" /* VIEWER */,
      // STRICT SAFE DEFAULT
      status: "PENDING" /* PENDING */,
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
async function getUserByUid(uid) {
  try {
    const client2 = await getMongoClient();
    if (!client2) return null;
    const db = client2.db(DB_NAME);
    const col = db.collection(USERS_COLLECTION);
    const user = await col.findOne({ uid });
    if (!user) return null;
    return { ...user, _id: user._id?.toString() };
  } catch (err) {
    console.error("[Auth] Error fetching user by UID:", err);
    return null;
  }
}
async function getAllUsers(filter) {
  try {
    const client2 = await getMongoClient();
    if (!client2) return [];
    const db = client2.db(DB_NAME);
    const col = db.collection(USERS_COLLECTION);
    const query = {};
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
async function updateUser(targetUid, updates, actor) {
  const client2 = await getMongoClient();
  if (!client2) {
    throw new Error("Database connection unavailable.");
  }
  const db = client2.db(DB_NAME);
  const col = db.collection(USERS_COLLECTION);
  if (!isSuperAdmin(actor)) {
    throw new Error("Only an authorized Super Admin can update team member permissions.");
  }
  const existing = await col.findOne({ uid: targetUid });
  if (!existing) {
    throw new Error(`User with UID '${targetUid}' not found.`);
  }
  if (isSuperAdmin({ email: existing.email, uid: existing.uid })) {
    if (updates.role && updates.role !== "SUPER_ADMIN" /* SUPER_ADMIN */) {
      throw new Error("Primary Super Admin account role cannot be changed.");
    }
    if (updates.status && updates.status !== "APPROVED" /* APPROVED */) {
      throw new Error("Primary Super Admin account cannot be suspended or rejected.");
    }
  }
  if (updates.role === "SUPER_ADMIN" /* SUPER_ADMIN */ && !isSuperAdmin({ email: existing.email, uid: existing.uid })) {
    throw new Error("Cannot assign Super Admin role to an account that is not on the trusted Super Admin allowlist.");
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const safeUpdates = {
    ...updates,
    updatedAt: now
  };
  if (updates.status === "APPROVED" /* APPROVED */ && existing.status !== "APPROVED" /* APPROVED */) {
    safeUpdates.approvedBy = actor.email;
    safeUpdates.approvedAt = now;
  }
  await col.updateOne({ uid: targetUid }, { $set: safeUpdates });
  await createAuditLog({
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: updates.status === "APPROVED" /* APPROVED */ ? "USER_APPROVED" : "USER_UPDATED",
    targetEntity: "admin_users",
    targetId: existing.email,
    details: {
      targetEmail: existing.email,
      changes: safeUpdates
    },
    ipAddress: actor.ipAddress
  });
  const updated = await col.findOne({ uid: targetUid });
  return { ...updated, _id: updated._id?.toString() };
}
async function deleteUser(targetUid, actor) {
  const client2 = await getMongoClient();
  if (!client2) {
    throw new Error("Database connection unavailable.");
  }
  const db = client2.db(DB_NAME);
  const col = db.collection(USERS_COLLECTION);
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

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "gen-lang-client-0873496318",
  appId: "1:846766419061:web:670534ad2d10b359665c3c",
  apiKey: "AIzaSyAVt73rg0rJlrfJPLIbRkp0Tz-yziobVc8",
  authDomain: "gen-lang-client-0873496318.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-226b6725-a152-4c53-a5f4-5d3db1f90902",
  storageBucket: "gen-lang-client-0873496318.firebasestorage.app",
  messagingSenderId: "846766419061",
  measurementId: ""
};

// src/lib/authMiddleware.ts
var firebaseAdminApp = getApps().length === 0 ? initializeApp({ projectId: firebase_applet_config_default.projectId }) : getApps()[0];
var adminAuth = getAuth(firebaseAdminApp);
var SECTION_PERMISSIONS_MAP = {
  hero: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CONTENT_MANAGER" /* CONTENT_MANAGER */],
  stats: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CONTENT_MANAGER" /* CONTENT_MANAGER */],
  about_leader: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CONTENT_MANAGER" /* CONTENT_MANAGER */],
  our_vision: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "RESEARCH_MANAGER" /* RESEARCH_MANAGER */],
  leadership_journey: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CONTENT_MANAGER" /* CONTENT_MANAGER */],
  daily_activities: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CONTENT_MANAGER" /* CONTENT_MANAGER */, "OFFICE_MANAGER" /* OFFICE_MANAGER */],
  monthly_activities: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CONTENT_MANAGER" /* CONTENT_MANAGER */],
  yearly_report: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CONTENT_MANAGER" /* CONTENT_MANAGER */],
  development_projects: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CONTENT_MANAGER" /* CONTENT_MANAGER */],
  peoples_voice: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "PUBLIC_RELATIONS_MANAGER" /* PUBLIC_RELATIONS_MANAGER */],
  cadre_corner: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CADRE_MANAGER" /* CADRE_MANAGER */],
  media_center: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "MEDIA_MANAGER" /* MEDIA_MANAGER */],
  social_hub: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "MEDIA_MANAGER" /* MEDIA_MANAGER */],
  upcoming_events: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "EVENT_MANAGER" /* EVENT_MANAGER */],
  volunteer_contact: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "VOLUNTEER_MANAGER" /* VOLUNTEER_MANAGER */],
  about_page: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CONTENT_MANAGER" /* CONTENT_MANAGER */],
  vision_page: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "RESEARCH_MANAGER" /* RESEARCH_MANAGER */],
  activities_page: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CONTENT_MANAGER" /* CONTENT_MANAGER */],
  development_page: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CONTENT_MANAGER" /* CONTENT_MANAGER */],
  media_page: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "MEDIA_MANAGER" /* MEDIA_MANAGER */]
};
var MAX_CACHE_SIZE = 500;
var tokenCache = /* @__PURE__ */ new Map();
function pruneTokenCache() {
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
async function verifyFirebaseIdToken(token) {
  if (!token || typeof token !== "string" || token.trim() === "") {
    return null;
  }
  const trimmedToken = token.trim();
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
    const decoded = await adminAuth.verifyIdToken(trimmedToken);
    if (!decoded || !decoded.uid) {
      return null;
    }
    const verified = {
      uid: decoded.uid,
      email: (decoded.email || "").toLowerCase().trim(),
      email_verified: Boolean(decoded.email_verified),
      displayName: decoded.name || decoded.displayName || void 0,
      exp: decoded.exp
    };
    const now = Date.now();
    const tokenExpMs = decoded.exp ? decoded.exp * 1e3 : now;
    const remainingLifetimeMs = tokenExpMs - now;
    const maxTtlMs = Math.min(10 * 60 * 1e3, remainingLifetimeMs);
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
    return null;
  }
}
async function resolveAuthUser(req) {
  let token = null;
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
  if (!verified.email_verified) {
    console.warn(`[Auth] Rejected unverified email token for: ${verified.email}`);
    return null;
  }
  const email = verified.email.toLowerCase().trim();
  if (isSuperAdmin({ email, uid: verified.uid, emailVerified: verified.email_verified })) {
    const mongoUser2 = await getUserByUid(verified.uid);
    if (mongoUser2 && mongoUser2.email.toLowerCase().trim() !== email) {
      console.error(`[Auth] UID / Email binding conflict for Super Admin: ${email} vs ${mongoUser2.email}`);
      return null;
    }
    return {
      uid: verified.uid,
      email,
      displayName: verified.displayName || mongoUser2?.displayName || "Super Admin",
      role: "SUPER_ADMIN" /* SUPER_ADMIN */,
      status: "APPROVED" /* APPROVED */,
      permissions: ["*"],
      assignedSections: [...ALL_HOMEPAGE_SECTION_IDS]
    };
  }
  const mongoUser = await getUserByUid(verified.uid);
  if (!mongoUser) {
    return {
      uid: verified.uid,
      email,
      displayName: verified.displayName,
      role: "VIEWER" /* VIEWER */,
      status: "PENDING" /* PENDING */,
      permissions: [],
      assignedSections: []
    };
  }
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
    assignedSections: mongoUser.assignedSections || []
  };
}
function canUserEditSection(user, sectionId) {
  if (!user) return false;
  if (user.status !== "APPROVED" /* APPROVED */) return false;
  if (user.role === "SUPER_ADMIN" /* SUPER_ADMIN */ && isSuperAdmin({ email: user.email, uid: user.uid })) return true;
  if (user.permissions && user.permissions.includes("*")) return true;
  if (user.assignedSections && user.assignedSections.includes(sectionId)) return true;
  const allowedRoles = SECTION_PERMISSIONS_MAP[sectionId] || [];
  return allowedRoles.includes(user.role);
}
async function requireAuth(req, res, next) {
  try {
    const user = await resolveAuthUser(req);
    if (!user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "A valid Google / Firebase Authorization Bearer token must be provided."
      });
    }
    if (user.status !== "APPROVED" /* APPROVED */) {
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
async function requireSuperAdmin(req, res, next) {
  try {
    const user = await resolveAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
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
async function requireAdminOrSuperAdmin(req, res, next) {
  try {
    const user = await resolveAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (user.status !== "APPROVED" /* APPROVED */) {
      return res.status(403).json({ error: "Access Pending Approval" });
    }
    const isSA = isSuperAdmin(user);
    if (!isSA && user.role !== "ADMIN" /* ADMIN */) {
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
async function requireSectionEditPermission(req, res, next) {
  try {
    const user = await resolveAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (user.status !== "APPROVED" /* APPROVED */) {
      return res.status(403).json({ error: "Access Pending Approval" });
    }
    const sectionId = req.params.sectionId;
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
async function requireMediaAccess(req, res, next) {
  try {
    const user = await resolveAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (user.status !== "APPROVED" /* APPROVED */ && !isSuperAdmin(user)) {
      try {
        const { getSegmentPermissions: getSegmentPermissions2 } = await Promise.resolve().then(() => (init_mediaService(), mediaService_exports));
        const grants = await getSegmentPermissions2();
        const hasGrant = grants.some(
          (g) => g.status === "ACTIVE" && (user.email && g.userEmail.toLowerCase() === user.email.toLowerCase() || user.uid && g.userUid === user.uid)
        );
        if (!hasGrant) {
          return res.status(403).json({ error: "Access Pending Approval" });
        }
      } catch {
        return res.status(403).json({ error: "Access Pending Approval" });
      }
    }
    let hasAccess = isSuperAdmin(user) || user.role === "ADMIN" /* ADMIN */ || user.role === "MEDIA_MANAGER" /* MEDIA_MANAGER */ || canUserEditSection(user, "media_center") || canUserEditSection(user, "media_page") || canUserEditSection(user, "social_hub") || user.permissions && (user.permissions.includes("*") || user.permissions.includes("media:*"));
    if (!hasAccess) {
      try {
        const { getSegmentPermissions: getSegmentPermissions2 } = await Promise.resolve().then(() => (init_mediaService(), mediaService_exports));
        const grants = await getSegmentPermissions2();
        hasAccess = grants.some(
          (g) => g.status === "ACTIVE" && (user.email && g.userEmail.toLowerCase() === user.email.toLowerCase() || user.uid && g.userUid === user.uid)
        );
      } catch {
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
function requireSegmentAccess(segmentOrResolver, action = "read") {
  return async (req, res, next) => {
    try {
      const user = await resolveAuthUser(req);
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (user.status !== "APPROVED" /* APPROVED */ && !isSuperAdmin(user)) {
        try {
          const { getSegmentPermissions: getSegmentPermissions2 } = await Promise.resolve().then(() => (init_mediaService(), mediaService_exports));
          const grants = await getSegmentPermissions2();
          const hasGrant = grants.some(
            (g) => g.status === "ACTIVE" && (user.email && g.userEmail.toLowerCase() === user.email.toLowerCase() || user.uid && g.userUid === user.uid)
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
        segment = req.body?.category || req.query?.category || req.params?.category || "PHOTO_GALLERY";
      }
      const { checkUserSegmentPermission: checkUserSegmentPermission2 } = await Promise.resolve().then(() => (init_mediaService(), mediaService_exports));
      const hasPermission = await checkUserSegmentPermission2(user, segment, action);
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
var SUBMISSION_PERMISSIONS_MAP = {
  contact: {
    roles: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "OFFICE_MANAGER" /* OFFICE_MANAGER */, "PUBLIC_RELATIONS_MANAGER" /* PUBLIC_RELATIONS_MANAGER */, "OUTREACH_MANAGER" /* OUTREACH_MANAGER */],
    permissions: ["submissions:contact", "contact", "submissions:*"],
    sections: ["volunteer_contact"]
  },
  volunteer: {
    roles: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "VOLUNTEER_MANAGER" /* VOLUNTEER_MANAGER */, "OUTREACH_MANAGER" /* OUTREACH_MANAGER */],
    permissions: ["submissions:volunteer", "volunteer", "submissions:*"],
    sections: ["volunteer_contact"]
  },
  cadre: {
    roles: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "CADRE_MANAGER" /* CADRE_MANAGER */, "OFFICE_MANAGER" /* OFFICE_MANAGER */],
    permissions: ["submissions:cadre", "cadre", "submissions:*"],
    sections: ["cadre_corner"]
  },
  grievances: {
    // Highly confidential: restricted to Super Admin, Admin, and designated Office Manager / Approval Authority
    roles: ["SUPER_ADMIN" /* SUPER_ADMIN */, "ADMIN" /* ADMIN */, "OFFICE_MANAGER" /* OFFICE_MANAGER */, "APPROVAL_AUTHORITY" /* APPROVAL_AUTHORITY */],
    permissions: ["submissions:grievances", "grievances", "submissions:*"],
    sections: ["peoples_voice"]
  }
};
function canUserAccessSubmissionType(user, submissionType, action = "read") {
  if (!user) return false;
  if (user.status !== "APPROVED" /* APPROVED */) return false;
  if (user.role === "SUPER_ADMIN" /* SUPER_ADMIN */ && isSuperAdmin({ email: user.email, uid: user.uid })) {
    return true;
  }
  if (user.permissions && user.permissions.includes("*")) {
    return true;
  }
  const typeConfig = SUBMISSION_PERMISSIONS_MAP[submissionType];
  if (!typeConfig) {
    return false;
  }
  if (user.permissions && user.permissions.some((p) => typeConfig.permissions.includes(p))) {
    return true;
  }
  if (user.assignedSections && user.assignedSections.some((s) => typeConfig.sections.includes(s))) {
    return true;
  }
  if (action === "notes") {
    if (user.role === "ADMIN" /* ADMIN */ || user.role === "APPROVAL_AUTHORITY" /* APPROVAL_AUTHORITY */) {
      return true;
    }
    return false;
  }
  return typeConfig.roles.includes(user.role);
}
function requireSubmissionAccess(action = "read") {
  return async (req, res, next) => {
    try {
      const user = await resolveAuthUser(req);
      if (!user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "A valid Google / Firebase Authorization Bearer token must be provided."
        });
      }
      if (user.status !== "APPROVED" /* APPROVED */) {
        return res.status(403).json({
          error: "Access Pending Approval",
          status: user.status,
          message: "Your account is awaiting Super Admin clearance before accessing submissions."
        });
      }
      const type = req.params.type;
      const validTypes = ["contact", "volunteer", "cadre", "grievances"];
      if (!validTypes.includes(type)) {
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

// src/serverApp.ts
init_mediaService();

// src/lib/driveAuth.ts
import { google as google2 } from "googleapis";
import crypto from "crypto";
import { Readable } from "stream";
var DEFAULT_DRIVE_FOLDER_ID2 = "1gIQLW7nwr2ZwZMDlFicWD9aGTn7MX9hh";
var ALGORITHM = "aes-256-gcm";
var ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || "", "hex");
var ALLOWED_MIME_TYPES = {
  // Images (max 25MB)
  "image/jpeg": { ext: [".jpg", ".jpeg"], maxSize: 25 * 1024 * 1024, type: "PHOTO" },
  "image/png": { ext: [".png"], maxSize: 25 * 1024 * 1024, type: "PHOTO" },
  "image/webp": { ext: [".webp"], maxSize: 25 * 1024 * 1024, type: "PHOTO" },
  "image/gif": { ext: [".gif"], maxSize: 25 * 1024 * 1024, type: "PHOTO" },
  // Videos (max 100MB)
  "video/mp4": { ext: [".mp4"], maxSize: 100 * 1024 * 1024, type: "VIDEO" },
  "video/webm": { ext: [".webm"], maxSize: 100 * 1024 * 1024, type: "VIDEO" },
  "video/quicktime": { ext: [".mov"], maxSize: 100 * 1024 * 1024, type: "VIDEO" },
  // Documents (max 25MB)
  "application/pdf": { ext: [".pdf"], maxSize: 25 * 1024 * 1024, type: "REPORT" }
};
function sanitizeFileName(name) {
  if (!name || typeof name !== "string") return "media_file";
  const base = name.replace(/[/\\?%*:|"<>]/g, "_").trim();
  const cleaned = base.replace(/\.\.+/g, ".").replace(/^\.+/, "");
  return (cleaned || "media_file").substring(0, 100);
}
var DriveIntegrationError = class extends Error {
  constructor(message = "Google Drive integration error", statusCode = 503, details) {
    super(message);
    this.name = "DriveIntegrationError";
    this.statusCode = statusCode;
    this.details = details;
  }
};
var mockDriveFiles = /* @__PURE__ */ new Map();
var mockDriveActive = false;
function isMockDriveActive() {
  return mockDriveActive;
}
var createOAuthTransaction = async (uid, state) => {
  const client2 = await getMongoClient();
  if (!client2) {
    throw new Error("MongoDB client unavailable");
  }
  const db = client2.db(getMongoDbName());
  const hashedState = crypto.createHash("sha256").update(state).digest("hex");
  await db.collection("oauth_transactions").insertOne({
    stateHash: hashedState,
    uid,
    expires: new Date(Date.now() + 6e5),
    // 10 mins
    used: false
  });
  return state;
};
var consumeOAuthTransaction = async (state) => {
  const client2 = await getMongoClient();
  if (!client2) {
    throw new Error("MongoDB client unavailable");
  }
  const db = client2.db(getMongoDbName());
  const hashedState = crypto.createHash("sha256").update(state).digest("hex");
  const result = await db.collection("oauth_transactions").findOneAndUpdate(
    { stateHash: hashedState, used: false, expires: { $gt: /* @__PURE__ */ new Date() } },
    { $set: { used: true } },
    { returnDocument: "after" }
  );
  return result?.uid || null;
};
var encryptToken = (token) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
};
var decryptToken = (encryptedToken) => {
  const [iv, authTag, encrypted] = encryptedToken.split(":");
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(authTag, "hex"));
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
var getActiveDriveCredentials = async (specificUid) => {
  if (isMockDriveActive()) {
    return {
      uid: specificUid || "mock-super-admin",
      refreshToken: encryptToken("mock-refresh-token"),
      isPrimary: true,
      active: true
    };
  }
  const client2 = await getMongoClient();
  if (!client2) {
    throw new DriveIntegrationError("Database unavailable for Drive credential resolution", 503);
  }
  const db = client2.db(getMongoDbName());
  if (specificUid) {
    const creds = await db.collection("integration_credentials").findOne({ uid: specificUid });
    if (!creds || !creds.refreshToken) {
      throw new DriveIntegrationError(`No authorized Drive credentials found for user UID '${specificUid}'`, 403);
    }
    return creds;
  }
  const credentials = await db.collection("integration_credentials").find({ active: { $ne: false } }).toArray();
  if (credentials.length === 0) {
    throw new DriveIntegrationError(
      "No authorized Google Drive integration found. An authorized Super Admin must connect Google Drive in Settings/Media Center.",
      503
    );
  }
  if (credentials.length === 1) {
    return credentials[0];
  }
  const primary = credentials.filter((c) => c.isPrimary === true);
  if (primary.length === 1) {
    return primary[0];
  }
  throw new DriveIntegrationError(
    "Multiple Google Drive integrations found with ambiguous primary selection. An authorized Super Admin must re-authenticate to establish the active primary integration.",
    503
  );
};
var getDriveOAuthClient = async (uid) => {
  const creds = await getActiveDriveCredentials(uid);
  const oauth2Client = new google2.auth.OAuth2(
    process.env.GOOGLE_DRIVE_CLIENT_ID,
    process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    `${process.env.SITE_URL}/api/admin/drive/callback`
  );
  oauth2Client.setCredentials({ refresh_token: decryptToken(creds.refreshToken) });
  return { oauth2Client, creds };
};
var getDriveClient = async (uid) => {
  const { oauth2Client } = await getDriveOAuthClient(uid);
  return google2.drive({ version: "v3", auth: oauth2Client });
};
var getShortLivedPickerToken = async (uid) => {
  if (isMockDriveActive()) {
    return {
      accessToken: "mock_picker_access_token_" + Date.now(),
      apiKey: process.env.GOOGLE_PICKER_API_KEY || "mock-picker-api-key",
      projectNumber: process.env.GOOGLE_CLOUD_PROJECT_NUMBER || "mock-project-number",
      folderId: DEFAULT_DRIVE_FOLDER_ID2,
      expiresIn: 3600
    };
  }
  const { oauth2Client } = await getDriveOAuthClient(uid);
  const tokenRes = await oauth2Client.getAccessToken();
  const token = tokenRes.token;
  if (!token) {
    throw new DriveIntegrationError("Failed to obtain short-lived access token from Google OAuth", 502);
  }
  return {
    accessToken: token,
    apiKey: process.env.GOOGLE_PICKER_API_KEY || "",
    projectNumber: process.env.GOOGLE_CLOUD_PROJECT_NUMBER || "",
    folderId: DEFAULT_DRIVE_FOLDER_ID2,
    expiresIn: 3600
  };
};
var createResumableUploadSession = async (options) => {
  const targetFolderId = DEFAULT_DRIVE_FOLDER_ID2;
  const sanitized = sanitizeFileName(options.fileName);
  if (isMockDriveActive()) {
    const mockFileId = "mock_file_" + options.mediaId;
    mockDriveFiles.set(options.mediaId, {
      mediaId: options.mediaId,
      name: sanitized,
      mimeType: options.mimeType,
      size: options.fileSize,
      parents: [targetFolderId],
      properties: { mediaId: options.mediaId, category: options.category },
      appProperties: { mediaId: options.mediaId, category: options.category, uploadedBy: options.uploadedByEmail },
      driveFileId: mockFileId,
      uploaded: false,
      trashed: false,
      content: Buffer.alloc(Math.min(options.fileSize, 64 * 1024), "A")
    });
    return {
      uploadUrl: `https://mock.drive.google.com/upload/${options.mediaId}?session=sess_${Date.now()}`,
      mediaId: options.mediaId,
      expiresIn: 3600
    };
  }
  const { oauth2Client } = await getDriveOAuthClient(options.uploadedByUid);
  const tokenRes = await oauth2Client.getAccessToken();
  const token = tokenRes.token;
  if (!token) {
    throw new DriveIntegrationError("Failed to retrieve OAuth access token for resumable upload creation", 502);
  }
  const metadata = {
    name: sanitized,
    parents: [targetFolderId],
    properties: {
      mediaId: options.mediaId,
      category: options.category,
      uploadedByUid: options.uploadedByUid
    },
    appProperties: {
      mediaId: options.mediaId,
      category: options.category,
      uploadedByUid: options.uploadedByUid,
      uploadedByEmail: options.uploadedByEmail
    }
  };
  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Upload-Content-Type": options.mimeType,
      "X-Upload-Content-Length": String(options.fileSize),
      "Content-Type": "application/json; charset=UTF-8"
    },
    body: JSON.stringify(metadata)
  });
  if (!response.ok) {
    const errText = await response.text();
    console.error("[DriveAuth] Resumable upload session error:", response.status, errText);
    throw new DriveIntegrationError(`Failed to initiate Drive resumable upload: ${response.statusText}`, 502);
  }
  const uploadUrl = response.headers.get("Location") || response.headers.get("location");
  if (!uploadUrl) {
    throw new DriveIntegrationError("Google Drive omitted resumable session Location header", 502);
  }
  return {
    uploadUrl,
    mediaId: options.mediaId,
    expiresIn: 3600
  };
};
var verifyUploadedDriveFile = async (query) => {
  const targetFolderId = query.expectedFolderId || DEFAULT_DRIVE_FOLDER_ID2;
  if (isMockDriveActive()) {
    const mock = mockDriveFiles.get(query.mediaId);
    if (!mock) {
      throw new DriveIntegrationError(`No uploaded Drive file found for mediaId '${query.mediaId}'`, 404);
    }
    if (mock.trashed) {
      throw new DriveIntegrationError("Uploaded file is in trash and cannot be verified", 400);
    }
    if (!mock.parents.includes(targetFolderId)) {
      throw new DriveIntegrationError("Uploaded file does not reside in the designated parent folder", 403);
    }
    mock.uploaded = true;
    return {
      fileId: mock.driveFileId,
      fileName: mock.name,
      mimeType: mock.mimeType,
      size: mock.size,
      driveViewUrl: `https://drive.google.com/file/d/${mock.driveFileId}/view`
    };
  }
  const drive = await getDriveClient();
  let fileData = null;
  if (query.fileId) {
    try {
      const res = await drive.files.get({
        fileId: query.fileId,
        fields: "id, name, mimeType, size, parents, properties, appProperties, webViewLink, trashed"
      });
      fileData = res.data;
    } catch (err) {
      throw new DriveIntegrationError(`Unable to retrieve file with ID '${query.fileId}' from Google Drive: ${err.message}`, 404);
    }
  } else {
    const searchRes = await drive.files.list({
      q: `properties has { key='mediaId' and value='${query.mediaId}' } and '${targetFolderId}' in parents and trashed = false`,
      fields: "files(id, name, mimeType, size, parents, properties, appProperties, webViewLink, trashed)",
      pageSize: 5
    });
    if (searchRes.data.files && searchRes.data.files.length > 0) {
      fileData = searchRes.data.files[0];
    }
  }
  if (!fileData || !fileData.id) {
    throw new DriveIntegrationError(`Uploaded file could not be found or verified for mediaId '${query.mediaId}'`, 404);
  }
  if (fileData.trashed) {
    throw new DriveIntegrationError("Uploaded file is in trash and cannot be verified", 400);
  }
  if (!fileData.parents || !fileData.parents.includes(targetFolderId)) {
    throw new DriveIntegrationError("Uploaded file does not reside in the designated parent folder", 403);
  }
  const boundMediaId = fileData.properties?.mediaId || fileData.appProperties?.mediaId;
  if (boundMediaId && boundMediaId !== query.mediaId) {
    throw new DriveIntegrationError("Uploaded file mediaId property mismatch", 403);
  }
  return {
    fileId: fileData.id,
    fileName: fileData.name || "media_file",
    mimeType: fileData.mimeType || "application/octet-stream",
    size: Number(fileData.size || 0),
    driveViewUrl: fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view`
  };
};
var deleteDriveFile = async (fileId) => {
  if (!fileId) return false;
  if (isMockDriveActive()) {
    for (const [key, val] of mockDriveFiles.entries()) {
      if (val.driveFileId === fileId) {
        mockDriveFiles.delete(key);
        return true;
      }
    }
    return true;
  }
  try {
    const drive = await getDriveClient();
    await drive.files.delete({ fileId });
    return true;
  } catch (err) {
    console.error(`[DriveAuth] Warning: Failed to delete Drive file '${fileId}':`, err.message);
    return false;
  }
};
var streamDriveFile = async (fileId, rangeHeader) => {
  if (!fileId) {
    throw new DriveIntegrationError("Missing Drive file ID for streaming", 400);
  }
  if (isMockDriveActive()) {
    let found = null;
    for (const val of mockDriveFiles.values()) {
      if (val.driveFileId === fileId) {
        found = val;
        break;
      }
    }
    if (!found) {
      throw new DriveIntegrationError(`Drive file '${fileId}' not found in storage`, 404);
    }
    if (found.trashed) {
      throw new DriveIntegrationError("Drive file has been trashed", 404);
    }
    const buffer = found.content || Buffer.from("MOCK MEDIA STREAM DATA FOR " + fileId);
    const totalSize2 = buffer.length;
    if (rangeHeader) {
      const matches = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
      if (matches) {
        let start = matches[1] ? parseInt(matches[1], 10) : 0;
        let end = matches[2] ? parseInt(matches[2], 10) : totalSize2 - 1;
        if (matches[1] === "" && matches[2] !== "") {
          start = totalSize2 - parseInt(matches[2], 10);
          end = totalSize2 - 1;
        }
        if (isNaN(start) || isNaN(end) || start >= totalSize2 || end >= totalSize2 || start > end) {
          const rangeErr = new DriveIntegrationError("Requested Range Not Satisfiable", 416, { totalSize: totalSize2 });
          throw rangeErr;
        }
        const chunk = buffer.subarray(start, end + 1);
        return {
          status: 206,
          stream: Readable.from(chunk),
          headers: {
            "Content-Type": found.mimeType || "application/octet-stream",
            "Content-Length": String(chunk.length),
            "Content-Range": `bytes ${start}-${end}/${totalSize2}`,
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=86400"
          }
        };
      }
    }
    return {
      status: 200,
      stream: Readable.from(buffer),
      headers: {
        "Content-Type": found.mimeType || "application/octet-stream",
        "Content-Length": String(totalSize2),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400"
      }
    };
  }
  const drive = await getDriveClient();
  const meta = await drive.files.get({
    fileId,
    fields: "id, name, mimeType, size, trashed"
  });
  if (meta.data.trashed) {
    throw new DriveIntegrationError("Drive file has been trashed", 404);
  }
  const totalSize = Number(meta.data.size || 0);
  const mimeType = meta.data.mimeType || "application/octet-stream";
  if (rangeHeader && totalSize > 0) {
    const matches = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
    if (matches) {
      let start = matches[1] ? parseInt(matches[1], 10) : 0;
      let end = matches[2] ? parseInt(matches[2], 10) : totalSize - 1;
      if (matches[1] === "" && matches[2] !== "") {
        start = totalSize - parseInt(matches[2], 10);
        end = totalSize - 1;
      }
      if (isNaN(start) || isNaN(end) || start >= totalSize || end >= totalSize || start > end) {
        const rangeErr = new DriveIntegrationError("Requested Range Not Satisfiable", 416, { totalSize });
        throw rangeErr;
      }
      const chunkLength = end - start + 1;
      const driveRes2 = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "stream", headers: { Range: `bytes=${start}-${end}` } }
      );
      return {
        status: 206,
        stream: driveRes2.data,
        headers: {
          "Content-Type": mimeType,
          "Content-Length": String(chunkLength),
          "Content-Range": `bytes ${start}-${end}/${totalSize}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=86400"
        }
      };
    }
  }
  const driveRes = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );
  return {
    status: 200,
    stream: driveRes.data,
    headers: {
      "Content-Type": mimeType,
      ...totalSize > 0 ? { "Content-Length": String(totalSize) } : {},
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=86400"
    }
  };
};

// src/serverApp.ts
var getGoogleAuth2 = () => {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return null;
  }
  return new google3.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://googleapis.com/auth/spreadsheets"]
  });
};
function createServerApp() {
  const app2 = express();
  app2.set("trust proxy", 1);
  app2.use(express.json());
  app2.use(cookieParser());
  app2.use("/api/admin", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });
  const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10);
  const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || "10", 10);
  const publicSubmissionLimiter = rateLimit({
    windowMs: rateLimitWindowMs,
    max: rateLimitMax,
    standardHeaders: true,
    // Draft-6 RateLimit-* headers
    legacyHeaders: false,
    // Disable X-RateLimit-* headers
    statusCode: 429,
    message: {
      error: "Too Many Requests",
      message: "Too many submission attempts from your IP address. Please wait a few minutes before trying again."
    },
    validate: { trustProxy: false }
  });
  const genAI = process.env.GEMINI_API_KEY ? new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } }
  }) : null;
  app2.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app2.get("/api/health/mongodb", async (_req, res) => {
    try {
      const health = await checkMongoHealth();
      if (health.status === "error") {
        return res.status(503).json(health);
      }
      if (health.status === "disconnected") {
        return res.json(health);
      }
      res.json(health);
    } catch (err) {
      const rawError = err.message || "Unknown error";
      const sanitized = rawError.replace(/\/\/[^:]+:[^@]+@/g, "//***:***@");
      res.status(500).json({ status: "error", error: sanitized });
    }
  });
  app2.post("/api/auth/sync", async (req, res) => {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : req.headers["x-firebase-token"] ? String(req.headers["x-firebase-token"]).trim() : null;
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }
      const verified = await verifyFirebaseIdToken(token);
      if (!verified || !verified.email) {
        return res.status(401).json({ error: "Invalid or expired Firebase ID token" });
      }
      if (!verified.email_verified) {
        return res.status(403).json({ error: "Email address must be verified by Google before accessing this system" });
      }
      const user = await syncGoogleUser({
        uid: verified.uid,
        email: verified.email,
        emailVerified: verified.email_verified,
        displayName: req.body?.displayName || verified.displayName,
        photoURL: req.body?.photoURL,
        requestedRole: req.body?.requestedRole,
        requestNotes: req.body?.requestNotes,
        ipAddress: req.ip
      });
      res.json({ success: true, user });
    } catch (err) {
      console.error("[API] Error in /api/auth/sync:", err);
      res.status(500).json({ error: err.message || "Failed to sync user" });
    }
  });
  app2.get("/api/auth/me", async (req, res) => {
    try {
      const user = await resolveAuthUser(req);
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.json({ user });
    } catch (err) {
      console.error("[API] Error in /api/auth/me:", err);
      res.status(500).json({ error: "Failed to resolve authenticated profile" });
    }
  });
  app2.get("/api/admin/users", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const filter = {
        status: req.query.status,
        search: req.query.search
      };
      const users = await getAllUsers(filter);
      res.json({ users, total: users.length });
    } catch (err) {
      console.error("[API] Error fetching admin users:", err);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  app2.put("/api/admin/users/:uid", requireSuperAdmin, async (req, res) => {
    try {
      const targetUid = req.params.uid;
      const updates = req.body;
      const actor = {
        uid: req.user.uid,
        email: req.user.email,
        role: req.user.role,
        ipAddress: req.ip
      };
      const updated = await updateUser(targetUid, updates, actor);
      res.json({ success: true, user: updated });
    } catch (err) {
      console.error("[API] Error updating user:", err);
      res.status(400).json({ error: err.message || "Failed to update user" });
    }
  });
  app2.delete("/api/admin/users/:uid", requireSuperAdmin, async (req, res) => {
    try {
      const targetUid = req.params.uid;
      const actor = {
        uid: req.user.uid,
        email: req.user.email,
        role: req.user.role,
        ipAddress: req.ip
      };
      await deleteUser(targetUid, actor);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (err) {
      console.error("[API] Error deleting user:", err);
      res.status(400).json({ error: err.message || "Failed to delete user" });
    }
  });
  app2.get("/api/admin/audit-logs", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const logs = await getAuditLogs(limit);
      res.json({ logs, total: logs.length });
    } catch (err) {
      console.error("[API] Error fetching audit logs:", err);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });
  app2.post("/api/admin/ai-insights", requireAdminOrSuperAdmin, async (req, res) => {
    if (!genAI) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }
    try {
      const { analyticsData, reportType } = req.body;
      const model = "gemini-2.5-flash";
      const prompt = `Analyze the following district portal analytics data and generate a ${reportType} report with insights on engagement, volunteer growth, and content performance. Suggest improvements for the homepage and CTAs.

Analytics Data:
${JSON.stringify(analyticsData, null, 2)}`;
      const { text } = await genAI.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });
      res.json({ report: text });
    } catch (error) {
      console.error("AI Insight Error:", error);
      res.status(500).json({ error: "Failed to generate AI report" });
    }
  });
  app2.post("/api/grievances", async (req, res) => {
    const { grievance } = req.body;
    const auth = getGoogleAuth2();
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!auth || !sheetId) {
      console.log("Google Sheets not configured, skipping sync");
      return res.json({ success: true, message: "Grievance saved (Sheets sync skipped)" });
    }
    try {
      const sheets = google3.sheets({ version: "v4", auth });
      const values = [
        [
          grievance?.trackingNumber || "",
          new Date(grievance?.createdAt?.seconds * 1e3 || Date.now()).toLocaleString(),
          grievance?.category || "",
          grievance?.subject || "",
          grievance?.description || "",
          grievance?.isAnonymous ? "Yes" : "No",
          grievance?.status || ""
        ]
      ];
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: "A:G",
        valueInputOption: "USER_ENTERED",
        requestBody: { values }
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Google Sheets Sync Error:", error);
      res.status(500).json({ error: "Failed to sync to Google Sheets" });
    }
  });
  app2.get("/api/public/home", async (_req, res) => {
    try {
      const data = await getPublicHomePayload();
      res.json(data);
    } catch (err) {
      console.error("[API] Error fetching public home data:", err);
      res.status(500).json({ error: "Failed to load home page content" });
    }
  });
  app2.get("/api/public/site-settings", async (_req, res) => {
    try {
      const settings = await getSiteSettings();
      res.json(settings);
    } catch (err) {
      console.error("[API] Error fetching site settings:", err);
      res.status(500).json({ error: "Failed to load site settings" });
    }
  });
  app2.get("/api/public/about", async (_req, res) => {
    try {
      const section = await getHomeSectionById("about_page");
      res.json(section || { data: {} });
    } catch (err) {
      console.error("[API] Error fetching public about data:", err);
      res.status(500).json({ error: "Failed to load about page content" });
    }
  });
  app2.get("/api/public/vision", async (_req, res) => {
    try {
      const visionSection = await getHomeSectionById("our_vision");
      const visionPageSection = await getHomeSectionById("vision_page");
      res.json({
        visionPage: visionPageSection?.data || {},
        visionSection: visionSection?.data || {}
      });
    } catch (err) {
      console.error("[API] Error fetching public vision data:", err);
      res.status(500).json({ error: "Failed to load vision page content" });
    }
  });
  app2.get("/api/public/activities", async (_req, res) => {
    try {
      const section = await getHomeSectionById("activities_page");
      res.json(section || { data: {} });
    } catch (err) {
      console.error("[API] Error fetching public activities data:", err);
      res.status(500).json({ error: "Failed to load activities page content" });
    }
  });
  app2.get("/api/public/development", async (_req, res) => {
    try {
      const section = await getHomeSectionById("development_page");
      res.json(section || { data: {} });
    } catch (err) {
      console.error("[API] Error fetching public development data:", err);
      res.status(500).json({ error: "Failed to load development page content" });
    }
  });
  app2.get("/api/public/media", async (_req, res) => {
    try {
      const section = await getHomeSectionById("media_page");
      let authoritativeItems;
      try {
        const { items } = await getMediaItems({
          status: "PUBLISHED",
          showOnHomeOnly: true,
          limit: 12
        });
        authoritativeItems = items;
      } catch (sheetErr) {
        console.error("[API] Authoritative Sheets fetch failed for homepage media:", sheetErr);
        return res.status(503).json({
          error: "Service Unavailable",
          message: "Authoritative media storage is temporarily unavailable"
        });
      }
      const mergedSection = {
        ...section || { sectionId: "media_page", name: "Media Center", enabled: true },
        data: {
          ...section?.data || {},
          items: authoritativeItems.map(sanitizePublicMediaItem)
        }
      };
      res.json(mergedSection);
    } catch (err) {
      console.error("[API] Error fetching public media data:", err);
      res.status(500).json({ error: "Failed to load media page content" });
    }
  });
  app2.get("/api/public/media/items", async (req, res) => {
    try {
      const { category, type, search, limit, offset } = req.query;
      const result = await getMediaItems({
        category,
        mediaType: type,
        status: "PUBLISHED",
        search,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
        includeDeleted: false
      });
      res.json({
        ...result,
        items: result.items.map(sanitizePublicMediaItem)
      });
    } catch (err) {
      console.error("[API] Error fetching public media items:", err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to load media items" });
    }
  });
  app2.get("/api/public/media/items/:id", async (req, res) => {
    try {
      const item = await getMediaItemById(req.params.id);
      if (!item || item.status !== "PUBLISHED") {
        return res.status(404).json({ error: "Media item not found or not published" });
      }
      res.json({ item: sanitizePublicMediaItem(item) });
    } catch (err) {
      console.error("[API] Error fetching public media item:", err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to load media item" });
    }
  });
  app2.get("/api/public/media/stream/:opaqueId", async (req, res) => {
    try {
      const item = await getMediaItemById(req.params.opaqueId);
      if (!item || item.status !== "PUBLISHED") {
        return res.status(404).json({ error: "Media item not found or not published" });
      }
      if (!item.driveFileId) {
        return res.status(404).json({ error: "Media file unavailable in storage" });
      }
      const streamResult = await streamDriveFile(item.driveFileId, req.headers.range);
      for (const [key, value] of Object.entries(streamResult.headers)) {
        res.setHeader(key, value);
      }
      res.status(streamResult.status);
      streamResult.stream.pipe(res);
    } catch (err) {
      if (err.statusCode === 416) {
        res.status(416);
        if (err.details?.totalSize) {
          res.setHeader("Content-Range", `bytes */${err.details.totalSize}`);
        }
        return res.end();
      }
      console.error("[API] Error streaming public media:", err.message);
      const status = err.statusCode || 500;
      res.status(status).json({
        error: err.statusCode === 404 ? "Media file not found" : "Failed to stream media"
      });
    }
  });
  app2.get("/api/public/social/channels", async (req, res) => {
    try {
      const showOnHome = req.query.home === "true";
      const channels = await getSocialChannels({
        onlyEnabled: true,
        showOnHomeOnly: showOnHome,
        includeDeleted: false
      });
      const resultChannels = showOnHome ? channels.slice(0, 4) : channels;
      res.json({ channels: resultChannels });
    } catch (err) {
      console.error("[API] Error fetching public social channels:", err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to load social channels" });
    }
  });
  app2.get("/api/public/social", async (req, res) => {
    try {
      const showOnHome = req.query.home === "true" || req.query.limit === "4";
      const channels = await getSocialChannels({
        onlyEnabled: true,
        showOnHomeOnly: showOnHome,
        includeDeleted: false
      });
      const resultChannels = showOnHome ? channels.slice(0, 4) : channels;
      res.json({ channels: resultChannels });
    } catch (err) {
      console.error("[API] Error fetching public social hub:", err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to load social hub" });
    }
  });
  app2.get("/api/admin/media/items", requireMediaAccess, async (req, res) => {
    try {
      const user = req.user;
      const { category, type, status, search, limit, offset, includeDeleted } = req.query;
      if (!isSuperAdmin(user)) {
        if (category) {
          const hasPerm = await checkUserSegmentPermission(user, category, "read");
          if (!hasPerm) {
            return res.status(403).json({
              error: "Forbidden",
              message: `Account '${user.email}' lacks 'read' permission for media segment '${category}'.`
            });
          }
        } else {
          const grants = await getSegmentPermissions();
          const userGrants = grants.filter(
            (g) => g.status === "ACTIVE" && g.canRead && (user.email && g.userEmail.toLowerCase() === user.email.toLowerCase() || user.uid && g.userUid === user.uid)
          );
          if (userGrants.length === 0) {
            return res.status(403).json({
              error: "Forbidden",
              message: `Account '${user.email}' lacks read permission for any media segment.`
            });
          }
          const allowedSegments = userGrants.map((g) => g.segment);
          const result2 = await getMediaItems({
            category,
            mediaType: type,
            status,
            search,
            limit: 1e3,
            includeDeleted: includeDeleted === "true"
          });
          const filteredItems = result2.items.filter((item) => allowedSegments.includes(item.category));
          const offsetNum = offset ? parseInt(offset, 10) : 0;
          const limitNum = limit ? parseInt(limit, 10) : 50;
          return res.json({
            items: filteredItems.slice(offsetNum, offsetNum + limitNum),
            total: filteredItems.length
          });
        }
      }
      const result = await getMediaItems({
        category,
        mediaType: type,
        status,
        search,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
        includeDeleted: includeDeleted === "true"
      });
      res.json(result);
    } catch (err) {
      console.error("[API] Error fetching admin media items:", err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to load media items" });
    }
  });
  app2.get("/api/admin/media/items/:id", requireMediaAccess, async (req, res) => {
    try {
      const item = await getMediaItemById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Media item not found" });
      }
      const user = req.user;
      if (!isSuperAdmin(user)) {
        const hasPerm = await checkUserSegmentPermission(user, item.category, "read");
        if (!hasPerm) {
          return res.status(403).json({
            error: "Forbidden",
            message: `Account '${user.email}' lacks 'read' permission for media segment '${item.category}'.`
          });
        }
      }
      res.json({ item });
    } catch (err) {
      console.error("[API] Error fetching media item:", err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to load media item" });
    }
  });
  app2.post(
    "/api/admin/media/items",
    requireMediaAccess,
    requireSegmentAccess((req) => req.body?.category || "PHOTO_GALLERY", "create"),
    async (req, res) => {
      try {
        const user = req.user;
        const {
          title,
          type,
          mediaType,
          category,
          description,
          caption,
          imageUrl,
          img,
          publicMediaUrl,
          thumbnailUrl,
          driveFileId,
          driveFileName,
          driveViewUrl,
          date,
          status,
          sortOrder,
          order,
          showOnHome
        } = req.body;
        if (!title || typeof title !== "string" || !title.trim()) {
          return res.status(400).json({ error: "A valid title is required" });
        }
        const resolvedType = mediaType || type;
        if (!resolvedType || typeof resolvedType !== "string" || !resolvedType.trim()) {
          return res.status(400).json({ error: "A valid media type (e.g. PHOTO, VIDEO, PRESS, REPORT) is required" });
        }
        const result = await createMediaItem(
          {
            title,
            mediaType: resolvedType,
            category,
            description: description || caption,
            publicMediaUrl: publicMediaUrl || imageUrl || img,
            thumbnailUrl: thumbnailUrl || imageUrl || img,
            driveFileId,
            driveFileName,
            driveViewUrl,
            status,
            sortOrder: sortOrder ?? order,
            showOnHome: Boolean(showOnHome)
          },
          {
            uid: user.uid,
            email: user.email,
            role: user.role,
            name: user.displayName,
            ipAddress: req.ip,
            requestId: req.headers["x-request-id"] || void 0
          }
        );
        if (result.warning) {
          return res.status(207).json({
            success: true,
            partialSuccess: true,
            item: result.item,
            warning: result.warning,
            auditLogged: result.auditLogged
          });
        }
        res.status(201).json({ success: true, item: result.item, auditLogged: result.auditLogged });
      } catch (err) {
        console.error("[API] Error creating media item:", err);
        const status = err.statusCode || 500;
        res.status(status).json({ error: err.message || "Failed to create media item" });
      }
    }
  );
  app2.post(
    "/api/admin/media/upload",
    requireMediaAccess,
    requireSegmentAccess((req) => req.body?.category || "PHOTO_GALLERY", "create"),
    async (req, res) => {
      try {
        const user = req.user;
        const {
          category,
          title,
          description,
          filename,
          fileName,
          mimeType,
          fileSize,
          declaredSize,
          showOnHome,
          sortOrder,
          order
        } = req.body;
        const effectiveName = (filename || fileName || "").trim();
        const effectiveSize = Number(fileSize || declaredSize || 0);
        if (!title || typeof title !== "string" || !title.trim()) {
          return res.status(400).json({ error: "Title is required" });
        }
        if (title.trim().length > 200) {
          return res.status(400).json({ error: "Title cannot exceed 200 characters" });
        }
        const categoryUpper = String(category || "PHOTO_GALLERY").trim().toUpperCase().replace(/\s+/g, "_");
        if (!VALID_MEDIA_SEGMENTS.includes(categoryUpper)) {
          return res.status(400).json({
            error: "Invalid category",
            message: `Category must be one of: ${VALID_MEDIA_SEGMENTS.join(", ")}`
          });
        }
        if (!mimeType || !(mimeType in ALLOWED_MIME_TYPES)) {
          return res.status(400).json({
            error: "Unsupported MIME type",
            message: `Allowed MIME types: ${Object.keys(ALLOWED_MIME_TYPES).join(", ")}`
          });
        }
        const mimeRule = ALLOWED_MIME_TYPES[mimeType];
        if (effectiveSize <= 0) {
          return res.status(400).json({ error: "File size must be greater than 0 bytes" });
        }
        if (effectiveSize > mimeRule.maxSize) {
          return res.status(400).json({
            error: "File size exceeds limit",
            message: `Maximum allowed size for ${mimeType} is ${Math.round(mimeRule.maxSize / (1024 * 1024))} MB`
          });
        }
        const sanitizedFileName = sanitizeFileName(effectiveName || `upload_${Date.now()}`);
        const mediaId = `med_${Date.now()}_${crypto2.randomBytes(4).toString("hex")}`;
        let session;
        try {
          session = await createResumableUploadSession({
            mediaId,
            fileName: sanitizedFileName,
            mimeType,
            fileSize: effectiveSize,
            category: categoryUpper,
            uploadedByUid: user.uid,
            uploadedByEmail: user.email
          });
        } catch (driveErr) {
          console.error("[API] Failed to create Drive upload session:", driveErr);
          const status = driveErr.statusCode || 502;
          return res.status(status).json({
            error: "Drive Upload Initiation Failed",
            message: driveErr.message
          });
        }
        try {
          await createMediaItem(
            {
              mediaId,
              category: categoryUpper,
              mediaType: mimeRule.type,
              title: title.trim(),
              description: description ? String(description).trim() : "",
              driveFileId: "",
              // Empty until verified at completion
              driveFileName: sanitizedFileName,
              driveViewUrl: "",
              publicMediaUrl: `/api/public/media/stream/${mediaId}`,
              thumbnailUrl: "",
              showOnHome: Boolean(showOnHome),
              status: "DRAFT",
              // Uploads strictly begin in DRAFT status
              sortOrder: sortOrder ?? order ?? 0
            },
            {
              uid: user.uid,
              email: user.email,
              role: user.role,
              name: user.displayName,
              ipAddress: req.ip,
              requestId: req.headers["x-request-id"] || void 0
            }
          );
        } catch (sheetErr) {
          console.error("[API] Failed to record draft in Google Sheets:", sheetErr);
          return res.status(sheetErr.statusCode || 503).json({
            error: "Service Unavailable",
            message: "Failed to persist draft media record to Google Sheets"
          });
        }
        res.setHeader("Cache-Control", "no-store");
        res.status(201).json({
          success: true,
          mediaId,
          uploadUrl: session.uploadUrl,
          headers: {
            "Content-Type": mimeType
          },
          expiresIn: session.expiresIn,
          message: "Resumable upload session created. Upload bytes directly to uploadUrl, then call /complete."
        });
      } catch (err) {
        console.error("[API] Unexpected error in /api/admin/media/upload:", err);
        const status = err.statusCode || 500;
        res.status(status).json({ error: err.message || "Failed to initiate media upload" });
      }
    }
  );
  app2.post("/api/admin/media/upload/:mediaId/complete", requireMediaAccess, async (req, res) => {
    const actorContext = {
      uid: req.user.uid,
      email: req.user.email,
      role: req.user.role,
      name: req.user.displayName,
      ipAddress: req.ip,
      requestId: req.headers["x-request-id"] || void 0
    };
    try {
      const user = req.user;
      const existing = await getMediaItemById(req.params.mediaId);
      if (!existing) {
        return res.status(404).json({ error: "Media record not found" });
      }
      if (!isSuperAdmin(user)) {
        const hasPerm = await checkUserSegmentPermission(user, existing.category, "create");
        if (!hasPerm) {
          return res.status(403).json({
            error: "Forbidden",
            message: `Account '${user.email}' lacks create permission for media segment '${existing.category}'.`
          });
        }
        const isCreator = existing.createdByUid && existing.createdByUid === user.uid || existing.createdByEmail && existing.createdByEmail.toLowerCase() === user.email.toLowerCase();
        if (!isCreator && user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
          return res.status(403).json({
            error: "Forbidden",
            message: "Only the initiating creator or an administrator can finalize this upload."
          });
        }
      }
      if (existing.status === "DELETED") {
        return res.status(400).json({ error: "Cannot finalize a deleted upload record" });
      }
      if (existing.driveFileId && existing.status !== "DRAFT") {
        return res.json({
          success: true,
          item: existing,
          message: "Upload has already been finalized."
        });
      }
      let verified;
      try {
        verified = await verifyUploadedDriveFile({
          mediaId: existing.mediaId,
          fileId: req.body?.driveFileId,
          expectedFolderId: DEFAULT_DRIVE_FOLDER_ID2
        });
      } catch (driveErr) {
        console.error("[API] Drive file verification failed during upload finalization:", driveErr);
        return res.status(driveErr.statusCode || 400).json({
          error: "Drive Verification Failed",
          message: driveErr.message
        });
      }
      try {
        const result = await updateMediaItem(
          existing.mediaId,
          {
            driveFileId: verified.fileId,
            driveFileName: verified.fileName,
            driveViewUrl: verified.driveViewUrl,
            publicMediaUrl: `/api/public/media/stream/${existing.mediaId}`,
            status: "DRAFT"
            // Stays in DRAFT until explicitly published by user
          },
          actorContext
        );
        res.json({
          success: true,
          item: result.item,
          auditLogged: result.auditLogged,
          warning: result.warning,
          message: "Drive upload verified and finalized. Media record is saved in DRAFT status."
        });
      } catch (persistErr) {
        console.error("[API] Sheets persistence failed during finalization. Executing safe rollback:", persistErr);
        const driveDeleted = await deleteDriveFile(verified.fileId);
        let sheetDeleted = false;
        try {
          await deleteMediaItem(existing.mediaId, actorContext);
          sheetDeleted = true;
        } catch {
        }
        return res.status(503).json({
          error: "Finalization Persistence Failed",
          message: "Failed to persist verified media metadata to Google Sheets. Safe rollback executed.",
          cleanup: {
            driveFileDeleted: driveDeleted,
            draftSoftDeleted: sheetDeleted
          }
        });
      }
    } catch (err) {
      console.error("[API] Unexpected error in /api/admin/media/upload/:mediaId/complete:", err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to finalize upload" });
    }
  });
  app2.post("/api/admin/media/upload/:mediaId/cancel", requireMediaAccess, async (req, res) => {
    const actorContext = {
      uid: req.user.uid,
      email: req.user.email,
      role: req.user.role,
      name: req.user.displayName,
      ipAddress: req.ip,
      requestId: req.headers["x-request-id"] || void 0
    };
    try {
      const user = req.user;
      const existing = await getMediaItemById(req.params.mediaId);
      if (!existing) {
        return res.status(404).json({ error: "Media record not found" });
      }
      if (!isSuperAdmin(user)) {
        const hasPerm = await checkUserSegmentPermission(user, existing.category, "edit");
        if (!hasPerm) {
          return res.status(403).json({
            error: "Forbidden",
            message: `Account '${user.email}' lacks edit permission for media segment '${existing.category}'.`
          });
        }
      }
      if (existing.driveFileId) {
        await deleteDriveFile(existing.driveFileId);
      }
      await deleteMediaItem(existing.mediaId, actorContext);
      res.json({
        success: true,
        message: "Upload cancelled, associated Drive file removed, and draft soft-deleted."
      });
    } catch (err) {
      console.error("[API] Error cancelling upload:", err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to cancel upload" });
    }
  });
  app2.put("/api/admin/media/items/:id", requireMediaAccess, async (req, res) => {
    try {
      const user = req.user;
      const existing = await getMediaItemById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Media item not found" });
      }
      if (!isSuperAdmin(user)) {
        const hasEditPerm = await checkUserSegmentPermission(user, existing.category, "edit");
        if (!hasEditPerm) {
          return res.status(403).json({
            error: "Forbidden",
            message: `Account '${user.email}' lacks 'edit' permission for media segment '${existing.category}'.`
          });
        }
        if (req.body?.category) {
          const targetCat = req.body.category.toUpperCase().replace(/\s+/g, "_");
          if (targetCat !== existing.category) {
            const hasTargetPerm = await checkUserSegmentPermission(user, targetCat, "edit");
            if (!hasTargetPerm) {
              return res.status(403).json({
                error: "Forbidden",
                message: `Account '${user.email}' lacks 'edit' permission for destination media segment '${targetCat}'.`
              });
            }
          }
        }
      }
      const result = await updateMediaItem(
        req.params.id,
        req.body,
        {
          uid: user.uid,
          email: user.email,
          role: user.role,
          ipAddress: req.ip,
          requestId: req.headers["x-request-id"] || void 0
        }
      );
      if (result.warning) {
        return res.status(207).json({
          success: true,
          partialSuccess: true,
          item: result.item,
          warning: result.warning,
          auditLogged: result.auditLogged
        });
      }
      res.json({ success: true, item: result.item, auditLogged: result.auditLogged });
    } catch (err) {
      console.error("[API] Error updating media item:", err);
      const status = err.message?.includes("not found") ? 404 : err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to update media item" });
    }
  });
  app2.delete("/api/admin/media/items/:id", requireMediaAccess, async (req, res) => {
    try {
      const user = req.user;
      const existing = await getMediaItemById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Media item not found" });
      }
      if (!isSuperAdmin(user)) {
        const hasDeletePerm = await checkUserSegmentPermission(user, existing.category, "delete");
        if (!hasDeletePerm) {
          return res.status(403).json({
            error: "Forbidden",
            message: `Account '${user.email}' lacks 'delete' permission for media segment '${existing.category}'.`
          });
        }
      }
      const result = await deleteMediaItem(
        req.params.id,
        {
          uid: user.uid,
          email: user.email,
          role: user.role,
          ipAddress: req.ip,
          requestId: req.headers["x-request-id"] || void 0
        }
      );
      res.json({
        success: true,
        message: "Media item soft-deleted successfully (row preserved in MediaItems)",
        auditLogged: result.auditLogged,
        warning: result.warning
      });
    } catch (err) {
      console.error("[API] Error deleting media item:", err);
      const status = err.message?.includes("not found") ? 404 : err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to delete media item" });
    }
  });
  app2.get(
    "/api/admin/social/channels",
    requireMediaAccess,
    requireSegmentAccess("SOCIAL_HUB", "read"),
    async (req, res) => {
      try {
        const includeDeleted = req.query.includeDeleted === "true";
        const channels = await getSocialChannels({ includeDeleted });
        res.json({ channels });
      } catch (err) {
        console.error("[API] Error fetching admin social channels:", err);
        const status = err.statusCode || 500;
        res.status(status).json({ error: err.message || "Failed to load social channels" });
      }
    }
  );
  app2.get(
    "/api/admin/social/channels/:id",
    requireMediaAccess,
    requireSegmentAccess("SOCIAL_HUB", "read"),
    async (req, res) => {
      try {
        const channel = await getSocialChannelById(req.params.id);
        if (!channel) {
          return res.status(404).json({ error: "Social channel not found" });
        }
        res.json({ channel });
      } catch (err) {
        console.error("[API] Error fetching social channel:", err);
        const status = err.statusCode || 500;
        res.status(status).json({ error: err.message || "Failed to load social channel" });
      }
    }
  );
  app2.post(
    "/api/admin/social/channels",
    requireMediaAccess,
    requireSegmentAccess("SOCIAL_HUB", "create"),
    async (req, res) => {
      try {
        const user = req.user;
        const { name, displayName, platform, url, enabled, showOnHome, homepagePosition, sortOrder, order } = req.body;
        const finalName = displayName || name;
        if (!finalName || typeof finalName !== "string" || !finalName.trim()) {
          return res.status(400).json({ error: "Channel display name is required" });
        }
        const result = await createSocialChannel(
          {
            displayName: finalName,
            platform: platform || "OTHER",
            url: url || "",
            enabled: enabled !== false,
            showOnHome: Boolean(showOnHome),
            homepagePosition: homepagePosition || 0,
            sortOrder: sortOrder ?? order ?? 0
          },
          {
            uid: user.uid,
            email: user.email,
            role: user.role,
            ipAddress: req.ip,
            requestId: req.headers["x-request-id"] || void 0
          }
        );
        res.status(201).json({
          success: true,
          channel: result.channel,
          auditLogged: result.auditLogged,
          warning: result.warning
        });
      } catch (err) {
        console.error("[API] Error creating social channel:", err);
        const status = err.statusCode || 500;
        res.status(status).json({ error: err.message || "Failed to create social channel" });
      }
    }
  );
  app2.put(
    "/api/admin/social/channels/:id",
    requireMediaAccess,
    requireSegmentAccess("SOCIAL_HUB", "edit"),
    async (req, res) => {
      try {
        const user = req.user;
        const result = await updateSocialChannel(
          req.params.id,
          req.body,
          {
            uid: user.uid,
            email: user.email,
            role: user.role,
            ipAddress: req.ip,
            requestId: req.headers["x-request-id"] || void 0
          }
        );
        res.json({
          success: true,
          channel: result.channel,
          auditLogged: result.auditLogged,
          warning: result.warning
        });
      } catch (err) {
        console.error("[API] Error updating social channel:", err);
        const status = err.message?.includes("not found") ? 404 : err.statusCode || 500;
        res.status(status).json({ error: err.message || "Failed to update social channel" });
      }
    }
  );
  app2.delete(
    "/api/admin/social/channels/:id",
    requireMediaAccess,
    requireSegmentAccess("SOCIAL_HUB", "delete"),
    async (req, res) => {
      try {
        const user = req.user;
        const result = await deleteSocialChannel(
          req.params.id,
          {
            uid: user.uid,
            email: user.email,
            role: user.role,
            ipAddress: req.ip,
            requestId: req.headers["x-request-id"] || void 0
          }
        );
        res.json({
          success: true,
          message: "Social channel soft-deleted successfully (row preserved in SocialChannels)",
          auditLogged: result.auditLogged,
          warning: result.warning
        });
      } catch (err) {
        console.error("[API] Error deleting social channel:", err);
        const status = err.message?.includes("not found") ? 404 : err.statusCode || 500;
        res.status(status).json({ error: err.message || "Failed to delete social channel" });
      }
    }
  );
  app2.get("/api/admin/media/permissions", requireMediaAccess, async (_req, res) => {
    try {
      const grants = await getSegmentPermissions();
      res.json({
        matrix: getMediaPermissions(),
        grants: grants.filter((g) => g.status === "ACTIVE")
      });
    } catch (err) {
      console.error("[API] Error fetching permissions:", err);
      res.json({ matrix: getMediaPermissions(), grants: [] });
    }
  });
  app2.post("/api/admin/media/permissions/grant", requireSuperAdmin, async (req, res) => {
    try {
      const user = req.user;
      const { userUid, userEmail, segment, canRead, canCreate, canEdit, canDelete } = req.body;
      if (!userEmail || !segment) {
        return res.status(400).json({ error: "userEmail and segment are required" });
      }
      const result = await grantSegmentPermission(
        { userUid: userUid || "", userEmail, segment, canRead, canCreate, canEdit, canDelete },
        { uid: user.uid, email: user.email, role: user.role, ipAddress: req.ip }
      );
      res.status(201).json(result);
    } catch (err) {
      console.error("[API] Error granting permission:", err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to grant segment permission" });
    }
  });
  app2.delete("/api/admin/media/permissions/:id", requireSuperAdmin, async (req, res) => {
    try {
      const user = req.user;
      const result = await revokeSegmentPermission(req.params.id, {
        uid: user.uid,
        email: user.email,
        role: user.role,
        ipAddress: req.ip
      });
      res.json({ success: true, message: "Permission grant revoked (status set to REVOKED in MediaPermissions)" });
    } catch (err) {
      console.error("[API] Error revoking permission:", err);
      const status = err.message?.includes("not found") ? 404 : err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to revoke permission" });
    }
  });
  app2.get("/api/admin/media/activity", requireMediaAccess, async (req, res) => {
    try {
      const user = req.user;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
      const segment = req.query.segment;
      if (!isSuperAdmin(user)) {
        if (segment) {
          const hasPerm = await checkUserSegmentPermission(user, segment, "read");
          if (!hasPerm) {
            return res.status(403).json({
              error: "Forbidden",
              message: `Account '${user.email}' lacks 'read' permission for media segment '${segment}'.`
            });
          }
        } else {
          const grants = await getSegmentPermissions();
          const userGrants = grants.filter(
            (g) => g.status === "ACTIVE" && g.canRead && (user.email && g.userEmail.toLowerCase() === user.email.toLowerCase() || user.uid && g.userUid === user.uid)
          );
          if (userGrants.length === 0) {
            return res.status(403).json({
              error: "Forbidden",
              message: `Account '${user.email}' lacks read permission for any media segment.`
            });
          }
          const allowedSegments = userGrants.map((g) => g.segment);
          const logs2 = await getMediaActivityLogs({
            limit: 200,
            actorRole: user.role,
            actorUid: user.uid
          });
          const filteredLogs = logs2.filter((l) => !l.segment || allowedSegments.includes(l.segment));
          return res.json({ logs: filteredLogs.slice(0, limit) });
        }
      }
      const logs = await getMediaActivityLogs({
        limit,
        segment,
        actorRole: user.role,
        actorUid: user.uid
      });
      res.json({ logs });
    } catch (err) {
      console.error("[API] Error fetching media activity logs:", err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || "Failed to load media activity logs" });
    }
  });
  app2.get("/api/admin/media/sheets/status", requireMediaAccess, async (_req, res) => {
    try {
      const configured = isSheetsConfigured();
      if (!configured) {
        return res.json({
          configured: false,
          message: "Google Sheets integration is not configured. Missing GOOGLE_SHEET_ID or service account key."
        });
      }
      const status = await validateSpreadsheet();
      res.json({
        configured: true,
        ...status
      });
    } catch (err) {
      res.json({
        configured: true,
        valid: false,
        error: err.message,
        details: err.details
      });
    }
  });
  app2.post("/api/admin/media/sync", requireMediaAccess, async (_req, res) => {
    try {
      invalidateAllMediaCaches();
      const configured = isSheetsConfigured();
      let health = { configured };
      if (configured) {
        health = await validateSpreadsheet();
      }
      res.json({
        success: true,
        message: "Media in-memory caches purged. Google Sheets authoritative state verified.",
        health
      });
    } catch (err) {
      console.error("[API] Error in media sync/health check:", err);
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || "Spreadsheet validation failed" });
    }
  });
  app2.get("/api/admin/home/sections", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const sections = await getAllHomeSections(true);
      const enriched = sections.map((section) => ({
        ...section,
        canEdit: canUserEditSection(user, section.sectionId)
      }));
      res.json({ sections: enriched, total: enriched.length });
    } catch (err) {
      console.error("[API] Error fetching admin home sections:", err);
      res.status(500).json({ error: "Failed to fetch home sections" });
    }
  });
  app2.get("/api/admin/home/sections/:sectionId", requireAuth, async (req, res) => {
    try {
      const section = await getHomeSectionById(req.params.sectionId);
      if (!section) {
        return res.status(404).json({ error: "Section not found" });
      }
      res.json(section);
    } catch (err) {
      console.error("[API] Error fetching home section:", err);
      res.status(500).json({ error: "Failed to fetch home section" });
    }
  });
  app2.put("/api/admin/home/sections/:sectionId", requireSectionEditPermission, async (req, res) => {
    try {
      const sectionId = req.params.sectionId;
      const updates = req.body;
      const updatedBy = req.user?.email || req.user?.uid || "admin";
      const updated = await updateHomeSection(sectionId, updates, updatedBy);
      await createAuditLog({
        actorUid: req.user.uid,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: "SECTION_UPDATED",
        targetEntity: "home_sections",
        targetId: sectionId,
        details: { sectionId, changes: Object.keys(updates) },
        ipAddress: req.ip
      });
      res.json({ success: true, section: updated });
    } catch (err) {
      console.error("[API] Error updating home section:", err);
      res.status(500).json({ error: err.message || "Failed to update section" });
    }
  });
  app2.put("/api/admin/site-settings", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const updates = req.body;
      const updatedBy = req.user?.email || req.user?.uid || "admin";
      const settings = await updateSiteSettings(updates, updatedBy);
      await createAuditLog({
        actorUid: req.user.uid,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: "SITE_SETTINGS_UPDATED",
        targetEntity: "site_settings",
        targetId: "global",
        details: { changes: Object.keys(updates) },
        ipAddress: req.ip
      });
      res.json({ success: true, settings });
    } catch (err) {
      console.error("[API] Error updating site settings:", err);
      res.status(500).json({ error: err.message || "Failed to update site settings" });
    }
  });
  app2.post("/api/admin/home/seed", requireSuperAdmin, async (req, res) => {
    try {
      const force = req.body?.force === true;
      const result = await seedInitialHomeData(force);
      await createAuditLog({
        actorUid: req.user.uid,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: "HOME_DATA_SEEDED",
        targetEntity: "home_sections",
        targetId: "all",
        details: { force, sectionsCount: result.sectionsCount },
        ipAddress: req.ip
      });
      res.json({ success: true, ...result });
    } catch (err) {
      console.error("[API] Error seeding home data:", err);
      res.status(500).json({ error: err.message || "Failed to seed home data" });
    }
  });
  app2.post("/api/public/contact", publicSubmissionLimiter, async (req, res) => {
    try {
      const { fullName, mobile, subject, message } = req.body;
      if (!fullName || !mobile || !message) {
        return res.status(400).json({ error: "Missing required fields: fullName, mobile, message" });
      }
      const client2 = await getMongoClient();
      if (!client2) {
        return res.status(500).json({ error: "Database not connected" });
      }
      const db = client2.db(process.env.MONGODB_DB_NAME || "chintadaravikumar");
      const trackingNumber = `CNT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const doc = {
        trackingNumber,
        fullName: String(fullName).trim(),
        mobile: String(mobile).trim(),
        subject: String(subject || "General Inquiry").trim(),
        message: String(message).trim(),
        status: "RECEIVED",
        createdAt: /* @__PURE__ */ new Date()
      };
      await db.collection("contact_inquiries").insertOne(doc);
      res.json({ success: true, trackingNumber });
    } catch (err) {
      console.error("[API] Error saving contact inquiry:", err);
      res.status(500).json({ error: "Failed to submit contact inquiry" });
    }
  });
  app2.post("/api/public/volunteer", publicSubmissionLimiter, async (req, res) => {
    try {
      const { fullName, email, mobile, mandal, skills, experience } = req.body;
      if (!fullName || !mobile || !email) {
        return res.status(400).json({ error: "Missing required fields: fullName, email, mobile" });
      }
      const client2 = await getMongoClient();
      if (!client2) {
        return res.status(500).json({ error: "Database not connected" });
      }
      const db = client2.db(process.env.MONGODB_DB_NAME || "chintadaravikumar");
      const trackingNumber = `VOL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const doc = {
        trackingNumber,
        fullName: String(fullName).trim(),
        email: String(email).trim(),
        mobile: String(mobile).trim(),
        mandal: String(mandal || "").trim(),
        skills: skills || [],
        experience: String(experience || "").trim(),
        status: "PENDING",
        createdAt: /* @__PURE__ */ new Date()
      };
      await db.collection("volunteer_applications").insertOne(doc);
      res.json({ success: true, trackingNumber });
    } catch (err) {
      console.error("[API] Error saving volunteer application:", err);
      res.status(500).json({ error: "Failed to submit volunteer application" });
    }
  });
  app2.post("/api/public/cadre", publicSubmissionLimiter, async (req, res) => {
    try {
      const { fullName, workerId, mobile, mandal, position } = req.body;
      if (!fullName || !mobile) {
        return res.status(400).json({ error: "Missing required fields: fullName, mobile" });
      }
      const client2 = await getMongoClient();
      if (!client2) {
        return res.status(500).json({ error: "Database not connected" });
      }
      const db = client2.db(process.env.MONGODB_DB_NAME || "chintadaravikumar");
      const trackingNumber = `CDR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const doc = {
        trackingNumber,
        fullName: String(fullName).trim(),
        workerId: String(workerId || "").trim(),
        mobile: String(mobile).trim(),
        mandal: String(mandal || "").trim(),
        position: String(position || "").trim(),
        status: "PENDING",
        createdAt: /* @__PURE__ */ new Date()
      };
      await db.collection("cadre_applications").insertOne(doc);
      res.json({ success: true, trackingNumber });
    } catch (err) {
      console.error("[API] Error saving cadre application:", err);
      res.status(500).json({ error: "Failed to submit cadre application" });
    }
  });
  app2.post("/api/public/grievances", publicSubmissionLimiter, async (req, res) => {
    try {
      const { fullName, mobile, subject, category, description } = req.body;
      if (!fullName || !mobile || !description) {
        return res.status(400).json({ error: "Missing required fields: fullName, mobile, description" });
      }
      const client2 = await getMongoClient();
      if (!client2) {
        return res.status(500).json({ error: "Database not connected" });
      }
      const db = client2.db(process.env.MONGODB_DB_NAME || "chintadaravikumar");
      const trackingNumber = `GRV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const doc = {
        trackingNumber,
        fullName: String(fullName).trim(),
        mobile: String(mobile).trim(),
        subject: String(subject || "Public Grievance").trim(),
        category: String(category || "General").trim(),
        description: String(description).trim(),
        status: "RECEIVED",
        notes: [],
        createdAt: /* @__PURE__ */ new Date()
      };
      await db.collection("grievances").insertOne(doc);
      res.json({ success: true, trackingNumber });
    } catch (err) {
      console.error("[API] Error saving grievance:", err);
      res.status(500).json({ error: "Failed to submit grievance" });
    }
  });
  const COLLECTION_MAP = {
    contact: "contact_inquiries",
    volunteer: "volunteer_applications",
    cadre: "cadre_applications",
    grievances: "grievances"
  };
  app2.get("/api/admin/submissions/:type", requireSubmissionAccess("read"), async (req, res) => {
    try {
      const type = req.params.type;
      const collectionName = COLLECTION_MAP[type];
      if (!collectionName) {
        return res.status(400).json({ error: "Invalid submission type" });
      }
      const client2 = await getMongoClient();
      if (!client2) {
        return res.status(500).json({ error: "Database not connected" });
      }
      const db = client2.db(process.env.MONGODB_DB_NAME || "chintadaravikumar");
      const items = await db.collection(collectionName).find({}).sort({ createdAt: -1 }).toArray();
      res.json({ submissions: items });
    } catch (err) {
      console.error("[API] Error fetching submissions:", err);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });
  app2.get("/api/admin/submissions/:type/:id", requireSubmissionAccess("read"), async (req, res) => {
    try {
      const type = req.params.type;
      const id = req.params.id;
      const collectionName = COLLECTION_MAP[type];
      if (!collectionName) {
        return res.status(400).json({ error: "Invalid submission type" });
      }
      const client2 = await getMongoClient();
      if (!client2) {
        return res.status(500).json({ error: "Database not connected" });
      }
      const db = client2.db(process.env.MONGODB_DB_NAME || "chintadaravikumar");
      const { ObjectId } = await import("mongodb");
      let queryFilter = { trackingNumber: id };
      try {
        if (ObjectId.isValid(id)) {
          queryFilter = { $or: [{ _id: new ObjectId(id) }, { trackingNumber: id }] };
        }
      } catch {
      }
      const item = await db.collection(collectionName).findOne(queryFilter);
      if (!item) {
        return res.status(404).json({ error: "Submission not found" });
      }
      res.json({ submission: item });
    } catch (err) {
      console.error("[API] Error fetching individual submission:", err);
      res.status(500).json({ error: "Failed to fetch submission details" });
    }
  });
  app2.put("/api/admin/submissions/:type/:id", requireSubmissionAccess("write"), async (req, res) => {
    try {
      const type = req.params.type;
      const id = req.params.id;
      const collectionName = COLLECTION_MAP[type];
      if (!collectionName) {
        return res.status(400).json({ error: "Invalid submission type" });
      }
      const updates = req.body || {};
      const client2 = await getMongoClient();
      if (!client2) {
        return res.status(500).json({ error: "Database not connected" });
      }
      const db = client2.db(process.env.MONGODB_DB_NAME || "chintadaravikumar");
      const { ObjectId } = await import("mongodb");
      let queryFilter = { trackingNumber: id };
      try {
        if (ObjectId.isValid(id)) {
          queryFilter = { $or: [{ _id: new ObjectId(id) }, { trackingNumber: id }] };
        }
      } catch {
      }
      const allowedStatuses = ["RECEIVED", "UNDER_REVIEW", "ASSIGNED", "RESOLVED", "CLOSED", "PENDING", "APPROVED", "REJECTED"];
      const updateData = { updatedAt: /* @__PURE__ */ new Date() };
      if (updates.status && allowedStatuses.includes(String(updates.status).trim())) {
        updateData.status = String(updates.status).trim();
      }
      if (updates.assignedTo !== void 0) {
        updateData.assignedTo = String(updates.assignedTo || "").trim();
      }
      if (updates.note && typeof updates.note === "string" && updates.note.trim()) {
        const noteText = updates.note.trim();
        await db.collection(collectionName).updateOne(queryFilter, {
          $push: {
            notes: {
              text: noteText,
              author: req.user?.email || "admin",
              createdAt: /* @__PURE__ */ new Date()
            }
          },
          $set: updateData
        });
      } else {
        await db.collection(collectionName).updateOne(queryFilter, { $set: updateData });
      }
      await createAuditLog({
        actorUid: req.user.uid,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: "SUBMISSION_UPDATED",
        targetEntity: collectionName,
        targetId: id,
        details: { type, changes: Object.keys(updateData).filter((k) => k !== "updatedAt") },
        ipAddress: req.ip
      });
      res.json({ success: true });
    } catch (err) {
      console.error("[API] Error updating submission:", err);
      res.status(500).json({ error: "Failed to update submission" });
    }
  });
  app2.get("/api/public/config", (_req, res) => {
    res.json({
      pickerApiKey: process.env.GOOGLE_PICKER_API_KEY,
      projectNumber: process.env.GOOGLE_CLOUD_PROJECT_NUMBER
    });
  });
  app2.get("/api/admin/drive/picker-token", requireSuperAdmin, async (req, res) => {
    try {
      const tokenData = await getShortLivedPickerToken(req.user.uid);
      res.setHeader("Cache-Control", "no-store");
      res.json(tokenData);
    } catch (err) {
      console.error("[API] Error generating picker token:", err.message);
      const status = err.statusCode || 500;
      res.status(status).json({
        error: "Picker Token Generation Failed",
        message: err.message
      });
    }
  });
  app2.get("/api/admin/drive/auth", requireSuperAdmin, async (req, res) => {
    const state = crypto2.randomBytes(32).toString("hex");
    const secureState = await createOAuthTransaction(req.user.uid, state);
    res.cookie("oauth_state", secureState, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 6e5,
      path: "/api/admin/drive/callback"
    });
    const oauth2Client = new google3.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      `${process.env.SITE_URL}/api/admin/drive/callback`
    );
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/drive.file"],
      state: secureState
    });
    res.json({ authUrl });
  });
  app2.get("/api/admin/drive/callback", async (req, res) => {
    const { code, state, error } = req.query;
    const cookieState = req.cookies.oauth_state;
    if (error) {
      res.clearCookie("oauth_state", { path: "/api/admin/drive/callback" });
      return res.status(400).json({ error });
    }
    if (!state || state !== cookieState) {
      return res.status(403).json({ error: "Invalid state" });
    }
    const uid = await consumeOAuthTransaction(state);
    res.clearCookie("oauth_state", { path: "/api/admin/drive/callback" });
    if (!uid) return res.status(403).json({ error: "Expired or invalid transaction" });
    try {
      const user = await getUserByUid(uid);
      if (!user || user.role !== "SUPER_ADMIN") {
        return res.status(403).json({ error: "Unauthorized" });
      }
      const oauth2Client = new google3.auth.OAuth2(
        process.env.GOOGLE_DRIVE_CLIENT_ID,
        process.env.GOOGLE_DRIVE_CLIENT_SECRET,
        `${process.env.SITE_URL}/api/admin/drive/callback`
      );
      const { tokens } = await oauth2Client.getToken(code);
      const client2 = await getMongoClient();
      if (!client2) {
        throw new Error("Database unavailable for credential persistence");
      }
      const db = client2.db(getMongoDbName());
      await db.collection("integration_credentials").updateMany({}, { $set: { isPrimary: false } });
      if (tokens.refresh_token) {
        await db.collection("integration_credentials").updateOne(
          { uid },
          {
            $set: {
              refreshToken: encryptToken(tokens.refresh_token),
              updatedAt: /* @__PURE__ */ new Date(),
              isPrimary: true,
              active: true,
              email: user.email || ""
            }
          },
          { upsert: true }
        );
      } else {
        const existing = await db.collection("integration_credentials").findOne({ uid });
        if (!existing?.refreshToken) {
          throw new Error("No refresh token received and no existing credentials found");
        }
        await db.collection("integration_credentials").updateOne(
          { uid },
          {
            $set: {
              updatedAt: /* @__PURE__ */ new Date(),
              isPrimary: true,
              active: true,
              email: user.email || ""
            }
          }
        );
      }
      res.redirect("/admin/media");
    } catch (err) {
      res.status(500).json({ error: "Failed to finalize connection" });
    }
  });
  app2.all("/api/*", (req, res) => {
    res.status(404).json({
      error: "Not Found",
      message: `Cannot ${req.method} ${req.path}`,
      path: req.path
    });
  });
  return app2;
}
var app = createServerApp();
var serverApp_default = app;

// src/api.ts
function handler(req, res) {
  if (req.url && !req.url.startsWith("/api")) {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }
  return serverApp_default(req, res);
}
export {
  handler as default
};
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Source entry point for Vercel Serverless Function (Express API).
 * Bundled by esbuild into api/index.js for zero-dependency-resolution production runtime.
 */
