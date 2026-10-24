/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { google, drive_v3 } from "googleapis";
import crypto from "crypto";
import { Readable } from "stream";
import { getMongoClient, getMongoDbName } from "./mongodb";

export const DEFAULT_DRIVE_FOLDER_ID = "1gIQLW7nwr2ZwZMDlFicWD9aGTn7MX9hh";

const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || "", "hex");

// ==========================================
// MIME TYPE ALLOWLISTS AND SIZE LIMITS
// ==========================================

export const ALLOWED_MIME_TYPES = {
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
} as const;

export type AllowedMimeType = keyof typeof ALLOWED_MIME_TYPES;

export function sanitizeFileName(name: string): string {
  if (!name || typeof name !== "string") return "media_file";
  // Remove path traversal, directory separators, control chars
  const base = name.replace(/[/\\?%*:|"<>]/g, "_").trim();
  const cleaned = base.replace(/\.\.+/g, ".").replace(/^\.+/, "");
  return (cleaned || "media_file").substring(0, 100);
}

// ==========================================
// ERROR DEFINITIONS
// ==========================================

export class DriveIntegrationError extends Error {
  statusCode: number;
  details?: Record<string, any>;
  constructor(message = "Google Drive integration error", statusCode = 503, details?: Record<string, any>) {
    super(message);
    this.name = "DriveIntegrationError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

// ==========================================
// IN-MEMORY MOCK DRIVE STORE FOR TESTS
// ==========================================

interface MockDriveFile {
  mediaId: string;
  name: string;
  mimeType: string;
  size: number;
  parents: string[];
  properties: Record<string, string>;
  appProperties: Record<string, string>;
  driveFileId: string;
  uploaded: boolean;
  trashed: boolean;
  content: Buffer;
}

const mockDriveFiles = new Map<string, MockDriveFile>();
let mockDriveActive = false;

export function initMockDriveStore(seedFiles?: MockDriveFile[]) {
  mockDriveActive = true;
  mockDriveFiles.clear();
  if (seedFiles) {
    for (const f of seedFiles) {
      mockDriveFiles.set(f.mediaId, f);
    }
  }
}

export function clearMockDriveStore() {
  mockDriveActive = false;
  mockDriveFiles.clear();
}

export function isMockDriveActive(): boolean {
  return mockDriveActive;
}

export function getMockDriveFilesMap(): Map<string, MockDriveFile> {
  return mockDriveFiles;
}

// ==========================================
// OAUTH TRANSACTIONS (CSRF PROTECTION)
// ==========================================

export const createOAuthTransaction = async (uid: string, state: string) => {
  const client = await getMongoClient();
  if (!client) {
    throw new Error("MongoDB client unavailable");
  }
  const db = client.db(getMongoDbName());
  const hashedState = crypto.createHash("sha256").update(state).digest("hex");
  await db.collection("oauth_transactions").insertOne({
    stateHash: hashedState,
    uid,
    expires: new Date(Date.now() + 600000), // 10 mins
    used: false
  });
  return state;
};

export const consumeOAuthTransaction = async (state: string) => {
  const client = await getMongoClient();
  if (!client) {
    throw new Error("MongoDB client unavailable");
  }
  const db = client.db(getMongoDbName());
  const hashedState = crypto.createHash("sha256").update(state).digest("hex");
  
  const result = await db.collection("oauth_transactions").findOneAndUpdate(
    { stateHash: hashedState, used: false, expires: { $gt: new Date() } },
    { $set: { used: true } },
    { returnDocument: "after" }
  );
  
  return result?.uid || null;
};

// ==========================================
// TOKEN ENCRYPTION / DECRYPTION (AES-256-GCM)
// ==========================================

export const encryptToken = (token: string) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
};

export const decryptToken = (encryptedToken: string) => {
  const [iv, authTag, encrypted] = encryptedToken.split(":");
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(authTag, "hex"));
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

// ==========================================
// DETERMINISTIC DRIVE INTEGRATION SELECTOR
// ==========================================

/**
 * Deterministically resolves the authorized Google Drive integration credentials.
 * - When called in public context (no UID), resolves the designated active integration.
 * - Never accepts arbitrary client-supplied UIDs from public callers.
 * - Fails with explicit configuration error if no integration or ambiguous primary integrations exist.
 */
export const getActiveDriveCredentials = async (specificUid?: string) => {
  if (isMockDriveActive()) {
    return {
      uid: specificUid || "mock-super-admin",
      refreshToken: encryptToken("mock-refresh-token"),
      isPrimary: true,
      active: true
    };
  }

  const client = await getMongoClient();
  if (!client) {
    throw new DriveIntegrationError("Database unavailable for Drive credential resolution", 503);
  }
  const db = client.db(getMongoDbName());

  if (specificUid) {
    const creds = await db.collection("integration_credentials").findOne({ uid: specificUid });
    if (!creds || !creds.refreshToken) {
      throw new DriveIntegrationError(`No authorized Drive credentials found for user UID '${specificUid}'`, 403);
    }
    return creds;
  }

  // General server-side selector (for uploads and public streaming)
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

  // Multiple records exist: check for single unambiguous primary record
  const primary = credentials.filter((c) => c.isPrimary === true);
  if (primary.length === 1) {
    return primary[0];
  }

  throw new DriveIntegrationError(
    "Multiple Google Drive integrations found with ambiguous primary selection. An authorized Super Admin must re-authenticate to establish the active primary integration.",
    503
  );
};

export const getDriveOAuthClient = async (uid?: string) => {
  const creds = await getActiveDriveCredentials(uid);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_DRIVE_CLIENT_ID,
    process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    `${process.env.SITE_URL}/api/admin/drive/callback`
  );

  oauth2Client.setCredentials({ refresh_token: decryptToken(creds.refreshToken) });
  return { oauth2Client, creds };
};

export const getDriveClient = async (uid?: string): Promise<drive_v3.Drive> => {
  const { oauth2Client } = await getDriveOAuthClient(uid);
  return google.drive({ version: "v3", auth: oauth2Client });
};

// ==========================================
// PICKER ACCESS TOKEN (SHORT-LIVED)
// ==========================================

export const getShortLivedPickerToken = async (uid?: string) => {
  if (isMockDriveActive()) {
    return {
      accessToken: "mock_picker_access_token_" + Date.now(),
      apiKey: process.env.GOOGLE_PICKER_API_KEY || "mock-picker-api-key",
      projectNumber: process.env.GOOGLE_CLOUD_PROJECT_NUMBER || "mock-project-number",
      folderId: DEFAULT_DRIVE_FOLDER_ID,
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
    folderId: DEFAULT_DRIVE_FOLDER_ID,
    expiresIn: 3600
  };
};

// ==========================================
// RESUMABLE UPLOAD SESSION INITIATION
// ==========================================

export interface ResumableSessionOptions {
  mediaId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  category: string;
  uploadedByUid: string;
  uploadedByEmail: string;
  folderId?: string; // Optional client-supplied parameter, strictly overridden by DEFAULT_DRIVE_FOLDER_ID
}

export const createResumableUploadSession = async (options: ResumableSessionOptions) => {
  // Enforce configured personal folder: client input is strictly ignored
  const targetFolderId = DEFAULT_DRIVE_FOLDER_ID;
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

  // Google Drive v3 Resumable Upload Session initiation
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

// ==========================================
// UPLOAD VERIFICATION & FINALIZATION
// ==========================================

export interface VerifyUploadedFileInput {
  mediaId: string;
  fileId?: string;
  expectedFolderId?: string;
}

export interface VerifiedDriveFile {
  fileId: string;
  fileName: string;
  mimeType: string;
  size: number;
  driveViewUrl: string;
}

export const verifyUploadedDriveFile = async (query: VerifyUploadedFileInput): Promise<VerifiedDriveFile> => {
  const targetFolderId = query.expectedFolderId || DEFAULT_DRIVE_FOLDER_ID;

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
  let fileData: drive_v3.Schema$File | null = null;

  if (query.fileId) {
    try {
      const res = await drive.files.get({
        fileId: query.fileId,
        fields: "id, name, mimeType, size, parents, properties, appProperties, webViewLink, trashed"
      });
      fileData = res.data;
    } catch (err: any) {
      throw new DriveIntegrationError(`Unable to retrieve file with ID '${query.fileId}' from Google Drive: ${err.message}`, 404);
    }
  } else {
    // Search by mediaId in properties and designated parent folder
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

  // Verify parent folder
  if (!fileData.parents || !fileData.parents.includes(targetFolderId)) {
    throw new DriveIntegrationError("Uploaded file does not reside in the designated parent folder", 403);
  }

  // Verify mediaId property association
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

// ==========================================
// FILE DELETION (CLEANUP / ROLLBACK)
// ==========================================

export const deleteDriveFile = async (fileId: string): Promise<boolean> => {
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
  } catch (err: any) {
    console.error(`[DriveAuth] Warning: Failed to delete Drive file '${fileId}':`, err.message);
    return false;
  }
};

// ==========================================
// MEDIA STREAMING WITH HTTP RANGE SUPPORT
// ==========================================

export interface StreamResult {
  status: 200 | 206;
  stream: Readable;
  headers: Record<string, string>;
}

export const streamDriveFile = async (fileId: string, rangeHeader?: string): Promise<StreamResult> => {
  if (!fileId) {
    throw new DriveIntegrationError("Missing Drive file ID for streaming", 400);
  }

  if (isMockDriveActive()) {
    let found: MockDriveFile | null = null;
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
    const totalSize = buffer.length;

    if (rangeHeader) {
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

        const chunk = buffer.subarray(start, end + 1);
        return {
          status: 206,
          stream: Readable.from(chunk),
          headers: {
            "Content-Type": found.mimeType || "application/octet-stream",
            "Content-Length": String(chunk.length),
            "Content-Range": `bytes ${start}-${end}/${totalSize}`,
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
        "Content-Length": String(totalSize),
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
      const driveRes = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "stream", headers: { Range: `bytes=${start}-${end}` } }
      );

      return {
        status: 206,
        stream: driveRes.data as unknown as Readable,
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
    stream: driveRes.data as unknown as Readable,
    headers: {
      "Content-Type": mimeType,
      ...(totalSize > 0 ? { "Content-Length": String(totalSize) } : {}),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=86400"
    }
  };
};
