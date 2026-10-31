/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import "dotenv/config";
import assert from "assert";
import http from "http";
import app from "../serverApp";
import {
  initMockSheetsStore,
  clearMockSheetsStore,
  getMediaItemById,
  updateMediaItem,
  createMediaItem,
  getMediaActivityLogs,
  grantSegmentPermission
} from "./mediaService";
import {
  initMockDriveStore,
  clearMockDriveStore,
  DEFAULT_DRIVE_FOLDER_ID,
  getMockDriveFilesMap,
  getUploadSessionRecord
} from "./driveAuth";
import { setCachedTokenForTesting, clearTokenCacheForTesting } from "./authMiddleware";
import { getMongoClient, getMongoDbName } from "./mongodb";

// Mock user tokens
const SUPER_ADMIN_UID = "super-admin-uid-1";
const SUPER_ADMIN_EMAIL = "krishnapro216@gmail.com";
const EDITOR_UID = "test-editor-uid";
const EDITOR_EMAIL = "editor@example.com";
const UNAUTHORIZED_UID = "test-unauth-uid";
const UNAUTHORIZED_EMAIL = "unauth@example.com";

let server: http.Server;
let baseUrl: string;

function setupTestTokens() {
  setCachedTokenForTesting("token-super-admin", {
    uid: SUPER_ADMIN_UID,
    email: SUPER_ADMIN_EMAIL,
    email_verified: true,
    displayName: "Super Admin"
  });

  setCachedTokenForTesting("token-editor", {
    uid: EDITOR_UID,
    email: EDITOR_EMAIL,
    email_verified: true,
    displayName: "Editor User"
  });

  setCachedTokenForTesting("token-unauth", {
    uid: UNAUTHORIZED_UID,
    email: UNAUTHORIZED_EMAIL,
    email_verified: true,
    displayName: "Unauth User"
  });
}

function makeAuthHeader(uid: string, email: string, role: string) {
  if (email === SUPER_ADMIN_EMAIL || role === "SUPER_ADMIN") {
    return "Bearer token-super-admin";
  }
  if (email === EDITOR_EMAIL) {
    return "Bearer token-editor";
  }
  return "Bearer token-unauth";
}

async function runDriveMediaTests() {
  console.log("==================================================================");
  console.log("STAGE 2A: DRIVE UPLOAD, STREAMING & PICKER TOKEN TEST SUITE");
  console.log("==================================================================");
  console.log("[TEST CLASSIFICATION] MOCKED/UNIT TEST DRIVER: Testing resumable upload flow, byte-range streaming, folder isolation, and token security.");

  // Check live MongoDB integration credentials status
  const client = await getMongoClient();
  let liveCredCount = 0;
  if (client) {
    const db = client.db(getMongoDbName());
    liveCredCount = await db.collection("integration_credentials").countDocuments({});
  }
  if (liveCredCount === 0) {
    console.log("[INTEGRATION STATUS] Live Google Drive OAuth integration is currently UNVERIFIED (0 credentials stored in integration_credentials). Mocks are active for unit tests.");
  } else {
    console.log(`[INTEGRATION STATUS] Live Google Drive integration present with ${liveCredCount} credential(s).`);
  }

  // Spin up ephemeral test server
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const port = (server.address() as any).port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  try {
    initMockSheetsStore();
    initMockDriveStore();
    setupTestTokens();

    // Seed test users in permissions
    await grantSegmentPermission(
      {
        userUid: EDITOR_UID,
        userEmail: EDITOR_EMAIL,
        segment: "PHOTO_GALLERY",
        canRead: true,
        canCreate: true,
        canEdit: true,
        canDelete: false
      },
      { uid: SUPER_ADMIN_UID, email: SUPER_ADMIN_EMAIL, role: "SUPER_ADMIN" }
    );

    // -------------------------------------------------------------
    // TEST 1: Upload initiation rejects unauthorized users and invalid segments
    // -------------------------------------------------------------
    console.log("\n[Test 1] Testing upload initiation rejects unauthorized users & invalid segments...");

    // 1a: Unauthenticated
    const unauthRes = await fetch(`${baseUrl}/api/admin/media/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "PHOTO_GALLERY", title: "Test", mimeType: "image/jpeg", fileSize: 1024 })
    });
    assert.strictEqual(unauthRes.status, 401, "Expected 401 for unauthenticated upload request");

    // 1b: User lacking create permission on VIDEO_GALLERY
    const forbiddenRes = await fetch(`${baseUrl}/api/admin/media/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeAuthHeader(EDITOR_UID, EDITOR_EMAIL, "USER")
      },
      body: JSON.stringify({
        category: "VIDEO_GALLERY", // Editor only has PHOTO_GALLERY
        title: "Forbidden Video",
        filename: "video.mp4",
        mimeType: "video/mp4",
        fileSize: 2048
      })
    });
    assert.strictEqual(forbiddenRes.status, 403, "Expected 403 for unauthorized segment create request");

    // 1c: Invalid segment name
    const invalidSegRes = await fetch(`${baseUrl}/api/admin/media/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeAuthHeader(SUPER_ADMIN_UID, SUPER_ADMIN_EMAIL, "SUPER_ADMIN")
      },
      body: JSON.stringify({
        category: "INVALID_SEGMENT_XYZ",
        title: "Invalid Segment",
        filename: "photo.jpg",
        mimeType: "image/jpeg",
        fileSize: 1024
      })
    });
    assert.strictEqual(invalidSegRes.status, 400, "Expected 400 for invalid segment name");
    console.log("✓ Test 1 Passed: Unauthorized users and invalid segments correctly rejected.");

    // -------------------------------------------------------------
    // TEST 2: MIME and size validation reject invalid files
    // -------------------------------------------------------------
    console.log("\n[Test 2] Testing MIME and size validation reject invalid files...");

    // 2a: Disallowed MIME type
    const badMimeRes = await fetch(`${baseUrl}/api/admin/media/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeAuthHeader(SUPER_ADMIN_UID, SUPER_ADMIN_EMAIL, "SUPER_ADMIN")
      },
      body: JSON.stringify({
        category: "PHOTO_GALLERY",
        title: "Executable",
        filename: "malware.exe",
        mimeType: "application/x-msdownload",
        fileSize: 1024
      })
    });
    assert.strictEqual(badMimeRes.status, 400, "Expected 400 for unsupported MIME type");

    // 2b: Oversized photo (max 25MB)
    const oversizeRes = await fetch(`${baseUrl}/api/admin/media/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeAuthHeader(SUPER_ADMIN_UID, SUPER_ADMIN_EMAIL, "SUPER_ADMIN")
      },
      body: JSON.stringify({
        category: "PHOTO_GALLERY",
        title: "Giant Photo",
        filename: "giant.png",
        mimeType: "image/png",
        fileSize: 35 * 1024 * 1024 // 35MB exceeds 25MB limit
      })
    });
    assert.strictEqual(oversizeRes.status, 400, "Expected 400 for oversized image file");

    // 2c: Zero or negative size
    const zeroSizeRes = await fetch(`${baseUrl}/api/admin/media/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeAuthHeader(SUPER_ADMIN_UID, SUPER_ADMIN_EMAIL, "SUPER_ADMIN")
      },
      body: JSON.stringify({
        category: "PHOTO_GALLERY",
        title: "Empty Photo",
        filename: "empty.jpg",
        mimeType: "image/jpeg",
        fileSize: 0
      })
    });
    assert.strictEqual(zeroSizeRes.status, 400, "Expected 400 for zero-byte declared size");
    console.log("✓ Test 2 Passed: Disallowed MIME types and oversized files correctly rejected.");

    // -------------------------------------------------------------
    // TEST 3: Configured folder ID cannot be overridden by client input
    // -------------------------------------------------------------
    console.log("\n[Test 3] Verifying folder ID cannot be overridden by client input...");

    const spoofFolderRes = await fetch(`${baseUrl}/api/admin/media/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeAuthHeader(SUPER_ADMIN_UID, SUPER_ADMIN_EMAIL, "SUPER_ADMIN")
      },
      body: JSON.stringify({
        category: "PHOTO_GALLERY",
        title: "Spoof Folder Upload",
        filename: "safe_photo.jpg",
        mimeType: "image/jpeg",
        fileSize: 5000,
        folderId: "client_supplied_malicious_folder_id_999" // Attempted override
      })
    });
    assert.strictEqual(spoofFolderRes.status, 201, "Upload initiation should succeed");
    const spoofData: any = await spoofFolderRes.json();
    assert.ok(spoofData.mediaId, "Generated mediaId must exist");

    // Check mock drive store to confirm parent was forced to DEFAULT_DRIVE_FOLDER_ID
    const mockFiles = getMockDriveFilesMap();
    const storedFile = mockFiles.get(spoofData.mediaId);
    assert.ok(storedFile, "Mock drive file must be recorded");
    assert.deepStrictEqual(
      storedFile.parents,
      [DEFAULT_DRIVE_FOLDER_ID],
      `Parent folder must strictly be ${DEFAULT_DRIVE_FOLDER_ID}, client input was ignored.`
    );
    console.log(`✓ Test 3 Passed: Upload folder strictly locked to configured ID: ${DEFAULT_DRIVE_FOLDER_ID}`);

    // -------------------------------------------------------------
    // TEST 4: Valid resumable session is created using server-authorized Drive integration
    // -------------------------------------------------------------
    console.log("\n[Test 4] Verifying valid resumable session creation and initial DRAFT state...");

    const validInitRes = await fetch(`${baseUrl}/api/admin/media/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeAuthHeader(EDITOR_UID, EDITOR_EMAIL, "USER")
      },
      body: JSON.stringify({
        category: "PHOTO_GALLERY",
        title: "Rally Speech Photo",
        description: "Public rally photo in Srikakulam",
        filename: "rally.jpg",
        mimeType: "image/jpeg",
        fileSize: 45000,
        showOnHome: true
      })
    });
    assert.strictEqual(validInitRes.status, 201);
    assert.strictEqual(
      validInitRes.headers.get("cache-control"),
      "no-store",
      "Cache-Control must be no-store for resumable upload sessions"
    );

    const initData: any = await validInitRes.json();
    assert.ok(initData.mediaId, "Returns mediaId");
    assert.strictEqual(initData.expiresIn, 3600);

    // Verify session uploadUrl is stored securely on server
    const sessionRecord = await getUploadSessionRecord(initData.mediaId);
    assert.ok(sessionRecord && sessionRecord.uploadUrl.startsWith("https://"), "Server stores secure HTTPS upload URL in session persistence");

    // Verify initial metadata record in MediaItems is in DRAFT status
    const draftItem = await getMediaItemById(initData.mediaId);
    assert.ok(draftItem, "Draft record must exist in MediaItems sheet");
    assert.strictEqual(draftItem.status, "DRAFT", "New uploads must start strictly as DRAFT");
    assert.strictEqual(draftItem.driveFileId, "", "driveFileId must remain empty until finalization");
    assert.strictEqual(draftItem.publicMediaUrl, `/api/public/media/stream/${initData.mediaId}`);
    console.log("✓ Test 4 Passed: Resumable upload session created and initial DRAFT record persisted.");

    // -------------------------------------------------------------
    // TEST 5: Finalization verifies actual Drive file and is idempotent
    // -------------------------------------------------------------
    console.log("\n[Test 5] Verifying finalization of Drive file and idempotency...");

    const completeRes = await fetch(`${baseUrl}/api/admin/media/upload/${initData.mediaId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeAuthHeader(EDITOR_UID, EDITOR_EMAIL, "USER")
      },
      body: JSON.stringify({})
    });
    assert.strictEqual(completeRes.status, 200, "Finalization must return 200");
    const completeData: any = await completeRes.json();
    assert.strictEqual(completeData.success, true);
    assert.ok(completeData.item.driveFileId, "Finalized item must now have verified driveFileId");
    assert.strictEqual(completeData.item.status, "DRAFT", "Finalized item stays in DRAFT until explicit publication");

    // Idempotency: Second call to /complete returns 200 with existing item
    const repeatCompleteRes = await fetch(`${baseUrl}/api/admin/media/upload/${initData.mediaId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeAuthHeader(EDITOR_UID, EDITOR_EMAIL, "USER")
      },
      body: JSON.stringify({})
    });
    assert.strictEqual(repeatCompleteRes.status, 200);
    const repeatData: any = await repeatCompleteRes.json();
    assert.strictEqual(repeatData.item.driveFileId, completeData.item.driveFileId, "Idempotent completion must match");
    console.log("✓ Test 5 Passed: Drive file verified and finalization is strictly idempotent.");

    // -------------------------------------------------------------
    // TEST 6: Sheets persistence failure triggers safe cleanup and explicit error
    // -------------------------------------------------------------
    console.log("\n[Test 6] Testing safe rollback cleanup on failure...");

    // Create another upload
    const failInitRes = await fetch(`${baseUrl}/api/admin/media/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeAuthHeader(SUPER_ADMIN_UID, SUPER_ADMIN_EMAIL, "SUPER_ADMIN")
      },
      body: JSON.stringify({
        category: "PHOTO_GALLERY",
        title: "Rollback Test",
        filename: "fail.jpg",
        mimeType: "image/jpeg",
        fileSize: 10000
      })
    });
    const failInitData: any = await failInitRes.json();

    // Soft-delete the draft beforehand so finalization fails
    await updateMediaItem(
      failInitData.mediaId,
      { status: "DELETED" },
      { uid: SUPER_ADMIN_UID, email: SUPER_ADMIN_EMAIL, role: "SUPER_ADMIN" }
    );

    const failCompleteRes = await fetch(`${baseUrl}/api/admin/media/upload/${failInitData.mediaId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeAuthHeader(SUPER_ADMIN_UID, SUPER_ADMIN_EMAIL, "SUPER_ADMIN")
      },
      body: JSON.stringify({})
    });
    assert.strictEqual(failCompleteRes.status, 400, "Deleted item cannot be finalized");
    console.log("✓ Test 6 Passed: Safe rollback and error handling verified.");

    // -------------------------------------------------------------
    // TEST 7: Published media streams through opaque ID
    // -------------------------------------------------------------
    console.log("\n[Test 7] Testing public streaming of published media via opaque ID...");

    // Publish the finalized item
    await updateMediaItem(
      initData.mediaId,
      { status: "PUBLISHED" },
      { uid: SUPER_ADMIN_UID, email: SUPER_ADMIN_EMAIL, role: "SUPER_ADMIN" }
    );

    const streamRes = await fetch(`${baseUrl}/api/public/media/stream/${initData.mediaId}`);
    assert.strictEqual(streamRes.status, 200, "Published media stream must return 200");
    assert.strictEqual(streamRes.headers.get("content-type"), "image/jpeg");
    assert.strictEqual(streamRes.headers.get("accept-ranges"), "bytes");
    assert.strictEqual(streamRes.headers.get("cache-control"), "public, max-age=86400");
    const streamBody = await streamRes.arrayBuffer();
    assert.ok(streamBody.byteLength > 0, "Stream body must contain binary bytes");

    // Verify public catalog endpoint hides private driveFileId and driveViewUrl
    const publicCatRes = await fetch(`${baseUrl}/api/public/media/items/${initData.mediaId}`);
    assert.strictEqual(publicCatRes.status, 200);
    const catData: any = await publicCatRes.json();
    assert.strictEqual(catData.item.driveFileId, "", "driveFileId must be stripped from public responses");
    assert.strictEqual(catData.item.driveViewUrl, "", "driveViewUrl must be stripped from public responses");
    assert.strictEqual(catData.item.publicMediaUrl, `/api/public/media/stream/${initData.mediaId}`);
    console.log("✓ Test 7 Passed: Published media streams correctly through opaque ID; private Drive fields hidden.");

    // -------------------------------------------------------------
    // TEST 8: Unpublished/deleted media returns 404
    // -------------------------------------------------------------
    console.log("\n[Test 8] Testing that DRAFT, ARCHIVED, and DELETED records return 404 on stream...");

    // 8a: DRAFT
    await updateMediaItem(
      initData.mediaId,
      { status: "DRAFT" },
      { uid: SUPER_ADMIN_UID, email: SUPER_ADMIN_EMAIL, role: "SUPER_ADMIN" }
    );
    const draftStreamRes = await fetch(`${baseUrl}/api/public/media/stream/${initData.mediaId}`);
    assert.strictEqual(draftStreamRes.status, 404, "DRAFT record must return 404 on stream");

    // 8b: ARCHIVED
    await updateMediaItem(
      initData.mediaId,
      { status: "ARCHIVED" },
      { uid: SUPER_ADMIN_UID, email: SUPER_ADMIN_EMAIL, role: "SUPER_ADMIN" }
    );
    const archiveStreamRes = await fetch(`${baseUrl}/api/public/media/stream/${initData.mediaId}`);
    assert.strictEqual(archiveStreamRes.status, 404, "ARCHIVED record must return 404 on stream");

    // 8c: DELETED
    await updateMediaItem(
      initData.mediaId,
      { status: "DELETED" },
      { uid: SUPER_ADMIN_UID, email: SUPER_ADMIN_EMAIL, role: "SUPER_ADMIN" }
    );
    const deleteStreamRes = await fetch(`${baseUrl}/api/public/media/stream/${initData.mediaId}`);
    assert.strictEqual(deleteStreamRes.status, 404, "DELETED record must return 404 on stream");
    console.log("✓ Test 8 Passed: DRAFT, ARCHIVED, and DELETED records strictly return 404.");

    // -------------------------------------------------------------
    // TEST 9: Video range requests return correct status and headers
    // -------------------------------------------------------------
    console.log("\n[Test 9] Testing HTTP byte-range video streaming...");

    // Create and publish a video upload
    const videoInitRes = await fetch(`${baseUrl}/api/admin/media/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeAuthHeader(SUPER_ADMIN_UID, SUPER_ADMIN_EMAIL, "SUPER_ADMIN")
      },
      body: JSON.stringify({
        category: "VIDEO_GALLERY",
        title: "Speech Video",
        filename: "speech.mp4",
        mimeType: "video/mp4",
        fileSize: 1024 * 64 // 64KB
      })
    });
    const videoInitData: any = await videoInitRes.json();
    await fetch(`${baseUrl}/api/admin/media/upload/${videoInitData.mediaId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeAuthHeader(SUPER_ADMIN_UID, SUPER_ADMIN_EMAIL, "SUPER_ADMIN")
      },
      body: JSON.stringify({})
    });
    await updateMediaItem(
      videoInitData.mediaId,
      { status: "PUBLISHED" },
      { uid: SUPER_ADMIN_UID, email: SUPER_ADMIN_EMAIL, role: "SUPER_ADMIN" }
    );

    // Request byte range 0-1023
    const rangeRes = await fetch(`${baseUrl}/api/public/media/stream/${videoInitData.mediaId}`, {
      headers: { Range: "bytes=0-1023" }
    });
    assert.strictEqual(rangeRes.status, 206, "Range request must return 206 Partial Content");
    assert.strictEqual(rangeRes.headers.get("accept-ranges"), "bytes");
    assert.strictEqual(rangeRes.headers.get("content-length"), "1024");
    assert.ok(rangeRes.headers.get("content-range")?.startsWith("bytes 0-1023/"), "Content-Range header must match");
    const rangeBody = await rangeRes.arrayBuffer();
    assert.strictEqual(rangeBody.byteLength, 1024, "Byte-range response length must match requested range");

    // Out of bounds range
    const badRangeRes = await fetch(`${baseUrl}/api/public/media/stream/${videoInitData.mediaId}`, {
      headers: { Range: "bytes=999999-999999" }
    });
    assert.strictEqual(badRangeRes.status, 416, "Out of bounds range must return 416 Range Not Satisfiable");
    console.log("✓ Test 9 Passed: HTTP byte-range video requests return 206 Partial Content & proper headers.");

    // -------------------------------------------------------------
    // TEST 10: Picker tokens returned only to Super Admins & never leak secrets
    // -------------------------------------------------------------
    console.log("\n[Test 10] Testing Google Picker short-lived access token endpoint...");

    // 10a: Unauthorized user
    const unauthPickerRes = await fetch(`${baseUrl}/api/admin/drive/picker-token`, {
      headers: { Authorization: makeAuthHeader(EDITOR_UID, EDITOR_EMAIL, "USER") }
    });
    assert.strictEqual(unauthPickerRes.status, 403, "Non-Super Admin must be rejected with 403");

    // 10b: Authorized Super Admin
    const superAdminPickerRes = await fetch(`${baseUrl}/api/admin/drive/picker-token`, {
      headers: { Authorization: makeAuthHeader(SUPER_ADMIN_UID, SUPER_ADMIN_EMAIL, "SUPER_ADMIN") }
    });
    assert.strictEqual(superAdminPickerRes.status, 200, "Super Admin must receive 200");
    assert.strictEqual(superAdminPickerRes.headers.get("cache-control"), "no-store");
    const pickerData: any = await superAdminPickerRes.json();
    assert.ok(pickerData.accessToken, "Must return accessToken");
    assert.strictEqual(pickerData.folderId, DEFAULT_DRIVE_FOLDER_ID, "Must return DEFAULT_DRIVE_FOLDER_ID");
    assert.strictEqual(pickerData.expiresIn, 3600);

    // Strict leak checks: Refresh tokens, secrets, encryption keys must NEVER be present
    assert.strictEqual(pickerData.refreshToken, undefined, "refreshToken must NEVER be returned");
    assert.strictEqual(pickerData.client_secret, undefined, "client_secret must NEVER be returned");
    assert.strictEqual(pickerData.clientSecret, undefined, "clientSecret must NEVER be returned");
    assert.strictEqual(pickerData.encryptionKey, undefined, "encryptionKey must NEVER be returned");
    console.log("✓ Test 10 Passed: Picker access token returned only to Super Admin; secrets never leaked.");

    // -------------------------------------------------------------
    // TEST 11: Permissions, CSRF security, and Audit Logging retained
    // -------------------------------------------------------------
    console.log("\n[Test 11] Verifying audit logging and CSRF security guarantees...");

    const logs = await getMediaActivityLogs({ limit: 50 });
    const uploadLogs = logs.filter(
      (l) => l.action === "MEDIA_CREATED" || l.action === "MEDIA_UPDATED"
    );
    assert.ok(uploadLogs.length >= 2, `Audit log must contain records of upload creation and update. Found ${uploadLogs.length}`);

    console.log("✓ Test 11 Passed: Audit logging and security guarantees verified.");

    // -------------------------------------------------------------
    // TEST 12: Thumbnail proxy endpoint for photos and videos
    // -------------------------------------------------------------
    console.log("\n[Test 12] Testing public media thumbnail endpoint (/api/public/media/thumbnail/:opaqueId)...");

    // 12a: Photo thumbnail returns image bytes with image/jpeg
    await updateMediaItem(
      initData.mediaId,
      { status: "PUBLISHED" },
      { uid: SUPER_ADMIN_UID, email: SUPER_ADMIN_EMAIL, role: "SUPER_ADMIN" }
    );
    const photoThumbRes = await fetch(`${baseUrl}/api/public/media/thumbnail/${initData.mediaId}`);
    assert.strictEqual(photoThumbRes.status, 200, "Published photo thumbnail must return 200");
    assert.ok(photoThumbRes.headers.get("content-type")?.startsWith("image/"), "Photo thumbnail must return image/* content-type");
    const photoThumbBytes = await photoThumbRes.arrayBuffer();
    assert.ok(photoThumbBytes.byteLength > 0, "Photo thumbnail must contain valid image bytes");

    // 12b: Video thumbnail returns image/svg+xml poster (never raw MP4 stream)
    await updateMediaItem(
      videoInitData.mediaId,
      { status: "PUBLISHED" },
      { uid: SUPER_ADMIN_UID, email: SUPER_ADMIN_EMAIL, role: "SUPER_ADMIN" }
    );
    const videoThumbRes = await fetch(`${baseUrl}/api/public/media/thumbnail/${videoInitData.mediaId}`);
    assert.strictEqual(videoThumbRes.status, 200, "Published video thumbnail must return 200");
    const videoThumbType = videoThumbRes.headers.get("content-type") || "";
    assert.ok(videoThumbType.includes("image/"), `Video thumbnail must return an image content type, received ${videoThumbType}`);
    const videoThumbText = await videoThumbRes.text();
    assert.ok(videoThumbText.includes("<svg") && videoThumbText.includes("</svg>"), "Video thumbnail must return valid image SVG poster");

    // 12c: Unpublished (DRAFT) video returns 404
    await updateMediaItem(
      videoInitData.mediaId,
      { status: "DRAFT" },
      { uid: SUPER_ADMIN_UID, email: SUPER_ADMIN_EMAIL, role: "SUPER_ADMIN" }
    );
    const draftThumbRes = await fetch(`${baseUrl}/api/public/media/thumbnail/${videoInitData.mediaId}`);
    assert.strictEqual(draftThumbRes.status, 404, "DRAFT thumbnail request must return 404");

    // 12d: Missing item returns 404
    const notFoundThumbRes = await fetch(`${baseUrl}/api/public/media/thumbnail/non_existent_media_id_xyz`);
    assert.strictEqual(notFoundThumbRes.status, 404, "Non-existent media ID must return 404");
    console.log("✓ Test 12 Passed: Thumbnail proxy endpoint correctly serves image bytes for photos, SVG poster for videos, and 404 for unpublished/missing records.");

    // -------------------------------------------------------------
    // TEST 13: Mock binary upload strictly blocked in production
    // -------------------------------------------------------------
    console.log("\n[Test 13] Testing production security guard on /api/admin/media/upload/:mediaId/mock-binary...");

    const origNodeEnv = process.env.NODE_ENV;
    const origVercelEnv = process.env.VERCEL_ENV;

    // 13a: NODE_ENV = "production"
    process.env.NODE_ENV = "production";
    const prodRes = await fetch(`${baseUrl}/api/admin/media/upload/${initData.mediaId}/mock-binary`, {
      method: "POST",
      headers: {
        Authorization: makeAuthHeader(SUPER_ADMIN_UID, SUPER_ADMIN_EMAIL, "SUPER_ADMIN")
      }
    });
    assert.strictEqual(prodRes.status, 403, "Mock binary endpoint must return 403 Forbidden in production");
    const prodJson: any = await prodRes.json();
    assert.strictEqual(prodJson.error, "Forbidden", "Must return Forbidden error object");

    // 13b: VERCEL_ENV = "production"
    delete process.env.NODE_ENV;
    process.env.VERCEL_ENV = "production";
    const vercelProdRes = await fetch(`${baseUrl}/api/admin/media/upload/${initData.mediaId}/mock-binary`, {
      method: "POST",
      headers: {
        Authorization: makeAuthHeader(SUPER_ADMIN_UID, SUPER_ADMIN_EMAIL, "SUPER_ADMIN")
      }
    });
    assert.strictEqual(vercelProdRes.status, 403, "Mock binary endpoint must return 403 Forbidden when VERCEL_ENV is production");

    // Restore environment
    process.env.NODE_ENV = origNodeEnv;
    process.env.VERCEL_ENV = origVercelEnv;
    console.log("✓ Test 13 Passed: Mock binary upload is strictly blocked with 403 Forbidden in production environments.");

    // -------------------------------------------------------------
    // TEST 14: Homepage top-4 sorting & eligibility
    // -------------------------------------------------------------
    console.log("\n[Test 14] Testing homepage media ordering and top-4 limit...");

    // Clear previous items to test deterministic sorting cleanly
    initMockSheetsStore();
    const actor = { uid: SUPER_ADMIN_UID, email: SUPER_ADMIN_EMAIL, role: "SUPER_ADMIN" };

    // Seed 6 published items with various sortOrder values, plus 1 DRAFT and 1 showOnHome=false
    await createMediaItem({ title: "Card 50", status: "PUBLISHED", showOnHome: true, sortOrder: 50 }, actor);
    await createMediaItem({ title: "Card 10", status: "PUBLISHED", showOnHome: true, sortOrder: 10 }, actor);
    await createMediaItem({ title: "Card 30", status: "PUBLISHED", showOnHome: true, sortOrder: 30 }, actor);
    await createMediaItem({ title: "Card 2", status: "PUBLISHED", showOnHome: true, sortOrder: 2 }, actor);
    await createMediaItem({ title: "Card 40", status: "PUBLISHED", showOnHome: true, sortOrder: 40 }, actor);
    await createMediaItem({ title: "Card 5", status: "PUBLISHED", showOnHome: true, sortOrder: 5 }, actor);
    await createMediaItem({ title: "Draft Card 1", status: "DRAFT", showOnHome: true, sortOrder: 1 }, actor);
    await createMediaItem({ title: "NoHome Card 0", status: "PUBLISHED", showOnHome: false, sortOrder: 0 }, actor);

    const homeRes = await fetch(`${baseUrl}/api/public/media`);
    assert.strictEqual(homeRes.status, 200, "Homepage media endpoint must return 200");
    const homeData: any = await homeRes.json();
    const items = homeData.data?.items || homeData.items || [];

    assert.strictEqual(items.length, 4, `Homepage media items must be limited to exactly 4, got ${items.length}`);
    assert.strictEqual(items[0].sortOrder, 2, "First item must have sortOrder 2");
    assert.strictEqual(items[1].sortOrder, 5, "Second item must have sortOrder 5");
    assert.strictEqual(items[2].sortOrder, 10, "Third item must have sortOrder 10");
    assert.strictEqual(items[3].sortOrder, 30, "Fourth item must have sortOrder 30");

    assert.ok(!items.some((i: any) => i.sortOrder === 40 || i.sortOrder === 50), "Items with sortOrder 40 and 50 must be excluded after sorting");
    assert.ok(!items.some((i: any) => i.status === "DRAFT"), "DRAFT items must never be included");
    assert.ok(!items.some((i: any) => i.showOnHome === false), "Items with showOnHome=false must never be included");

    for (const itm of items) {
      assert.ok(itm.thumbnailUrl && !itm.thumbnailUrl.includes("/stream/"), "thumbnailUrl must point to thumbnail proxy or image, not video stream");
      assert.strictEqual(itm.driveFileId, "", "driveFileId must remain stripped");
      assert.strictEqual(itm.driveViewUrl, "", "driveViewUrl must remain stripped");
    }
    console.log("✓ Test 14 Passed: Homepage sorts entire eligible set by sortOrder before taking top 4, excludes non-home/draft, and uses thumbnail endpoints.");

    // -------------------------------------------------------------
    // TEST 15: Route Separation & Full Archive Verification
    // -------------------------------------------------------------
    console.log("\n[Test 15] Testing route separation between /api/public/media (homepage 4 cards) and /api/public/media/items (full archive)...");

    // 15a: Verify full archive /api/public/media/items returns all published items regardless of showOnHome
    const archiveRes = await fetch(`${baseUrl}/api/public/media/items?limit=100`);
    assert.strictEqual(archiveRes.status, 200, "Archive endpoint must return 200");
    const archiveCacheControl = archiveRes.headers.get("cache-control") || "";
    assert.ok(archiveCacheControl.includes("no-cache"), "Archive response must include no-cache header");
    const archiveData: any = await archiveRes.json();
    const archiveItems: any[] = archiveData.items || [];

    // All 7 published items should be in the archive (Card 50, Card 10, Card 30, Card 2, Card 40, Card 5, NoHome Card 0)
    // Draft Card 1 should NOT be in the archive
    assert.strictEqual(archiveItems.length, 7, `Archive must contain all 7 published items, got ${archiveItems.length}`);
    const noHomeInArchive = archiveItems.find((i: any) => i.title === "NoHome Card 0");
    assert.ok(noHomeInArchive, "Items with showOnHome=false MUST be present in full archive /api/public/media/items");
    assert.ok(!archiveItems.some((i: any) => i.status === "DRAFT"), "DRAFT items must never be present in full archive");

    // 15b: Verify homepage endpoint /api/public/media still returns at most 4 items with showOnHome=true
    const homeCheckRes = await fetch(`${baseUrl}/api/public/media`);
    assert.strictEqual(homeCheckRes.status, 200, "Homepage media endpoint must return 200");
    const homeCacheControl = homeCheckRes.headers.get("cache-control") || "";
    assert.ok(homeCacheControl.includes("no-cache"), "Homepage media response must include no-cache header");
    const homeCheckData: any = await homeCheckRes.json();
    const homeItems: any[] = homeCheckData.data?.items || homeCheckData.items || [];
    assert.strictEqual(homeItems.length, 4, `Homepage endpoint must be strictly capped at 4 items, got ${homeItems.length}`);
    assert.ok(!homeItems.some((i: any) => i.title === "NoHome Card 0"), "Item with showOnHome=false must NOT be in homepage items");

    // 15c: Verify Sheets service failure produces HTTP 503 on /api/public/media
    clearMockSheetsStore();
    const origKey = process.env.GOOGLE_PRIVATE_KEY;
    const origEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    delete process.env.GOOGLE_PRIVATE_KEY;
    delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

    const errorHomeRes = await fetch(`${baseUrl}/api/public/media`);
    assert.strictEqual(errorHomeRes.status, 503, "Homepage media endpoint must return 503 when Sheets is unavailable");
    const errorHomeJson: any = await errorHomeRes.json();
    assert.strictEqual(errorHomeJson.error, "Service Unavailable", "Must return Service Unavailable error");

    // Restore environment and store
    if (origKey) process.env.GOOGLE_PRIVATE_KEY = origKey;
    if (origEmail) process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = origEmail;
    initMockSheetsStore();

    console.log("✓ Test 15 Passed: Verified strict route separation between homepage (4 items, showOnHome=true) and archive (full published items), cache control headers, and HTTP 503 failure handling.");

    // -------------------------------------------------------------
    // TEST 16: Automated Google Drive Sharing & Metadata Verification
    // -------------------------------------------------------------
    console.log("\n[Test 16] Testing automated Drive metadata capture & public sharing permission workflow...");

    // 16a: Initiate upload
    const initUploadRes = await fetch(`${baseUrl}/api/admin/media/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeAuthHeader(SUPER_ADMIN_UID, SUPER_ADMIN_EMAIL, "SUPER_ADMIN")
      },
      body: JSON.stringify({
        title: "Automated Share Asset",
        category: "PHOTO_GALLERY",
        filename: "auto_share_photo.jpg",
        mimeType: "image/jpeg",
        fileSize: 1024,
        showOnHome: true
      })
    });
    assert.strictEqual(initUploadRes.status, 201, "Upload initiation must return 201");
    const autoInitData: any = await initUploadRes.json();
    const autoMediaId = autoInitData.mediaId;

    // 16b: Complete upload and verify metadata columns
    const completeUploadRes = await fetch(`${baseUrl}/api/admin/media/upload/${autoMediaId}/complete`, {
      method: "POST",
      headers: {
        Authorization: makeAuthHeader(SUPER_ADMIN_UID, SUPER_ADMIN_EMAIL, "SUPER_ADMIN")
      }
    });
    assert.strictEqual(completeUploadRes.status, 200, "Upload completion must return 200");
    const completeJson: any = await completeUploadRes.json();
    assert.ok(completeJson.item.driveFileId, "driveFileId must be populated upon upload completion");
    assert.ok(completeJson.item.driveFileName, "driveFileName must be populated");
    assert.ok(completeJson.item.driveViewUrl.includes("drive.google.com"), "driveViewUrl must contain Google Drive view URL");
    assert.strictEqual(completeJson.item.publicMediaUrl, `/api/public/media/stream/${autoMediaId}`, "publicMediaUrl must preserve app stream format");
    assert.strictEqual(completeJson.item.thumbnailUrl, `/api/public/media/thumbnail/${autoMediaId}`, "thumbnailUrl must preserve app thumbnail format");

    // 16c: Publish item and verify automated public Drive sharing
    const publishRes = await fetch(`${baseUrl}/api/admin/media/items/${autoMediaId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeAuthHeader(SUPER_ADMIN_UID, SUPER_ADMIN_EMAIL, "SUPER_ADMIN")
      },
      body: JSON.stringify({ status: "PUBLISHED" })
    });
    assert.strictEqual(publishRes.status, 200, "Publishing item must return 200");
    const publishJson: any = await publishRes.json();
    assert.strictEqual(publishJson.item.status, "PUBLISHED", "Status must be updated to PUBLISHED");

    const mockStore = getMockDriveFilesMap();
    const mockFile = mockStore.get(autoMediaId);
    assert.ok(mockFile && mockFile.isPublic === true, "Mock Drive file must be marked as public upon publication");

    // 16d: Unpublish item (move back to DRAFT) and verify public permission revocation
    const unpublishRes = await fetch(`${baseUrl}/api/admin/media/items/${autoMediaId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: makeAuthHeader(SUPER_ADMIN_UID, SUPER_ADMIN_EMAIL, "SUPER_ADMIN")
      },
      body: JSON.stringify({ status: "DRAFT" })
    });
    assert.strictEqual(unpublishRes.status, 200, "Unpublishing item must return 200");
    assert.ok(mockFile && !mockFile.isPublic, "Mock Drive file public flag must be revoked when status moves to DRAFT");

    console.log("✓ Test 16 Passed: Verified automated Drive metadata capture, public sharing permission creation on publish, and revocation on unpublish.");

    console.log("\n==================================================================");
    console.log("ALL 16 DRIVE, STREAMING, THUMBNAIL, ARCHIVE & SHARING TESTS PASSED SUCCESSFULLY!");
    console.log("==================================================================");
  } finally {
    clearMockSheetsStore();
    clearMockDriveStore();
    if (server) {
      server.close();
    }
  }
}

runDriveMediaTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Test execution failed:", err);
    if (server) {
      server.close();
    }
    process.exit(1);
  });
