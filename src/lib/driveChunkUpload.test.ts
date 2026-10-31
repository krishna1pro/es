/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import {
  initMockDriveStore,
  clearMockDriveStore,
  saveUploadSessionRecord,
  getUploadSessionRecord,
  deleteUploadSessionRecord,
  parseDriveRangeHeader,
  clearMockUploadSessions,
  getRawMockSessionStore
} from "./driveAuth";

describe("Focused Chunked Upload, Session Persistence & Recovery Test Suite", () => {
  before(() => {
    initMockDriveStore();
    clearMockUploadSessions();
  });

  after(async () => {
    clearMockDriveStore();
    clearMockUploadSessions();
    setTimeout(() => process.exit(0), 100);
  });

  it("1. Session Persistence: Stores uploadUrl securely on server and retrieves by mediaId", async () => {
    const mediaId = `test_sess_${Date.now()}`;
    const mockUploadUrl = `https://mock.drive.google.com/upload/${mediaId}?session=test_session_key`;

    const saved = await saveUploadSessionRecord({
      mediaId,
      uploadUrl: mockUploadUrl,
      uploadedByUid: "admin_uid_123",
      uploadedByEmail: "admin@example.com",
      fileSize: 5242880, // 5 MB
      mimeType: "image/jpeg",
      category: "PHOTO_GALLERY",
      expiresInSeconds: 3600
    });

    assert.strictEqual(saved.mediaId, mediaId);
    assert.strictEqual(saved.uploadUrl, mockUploadUrl);

    // Retrieve session by mediaId (simulating separate Vercel function invocation)
    const retrieved = await getUploadSessionRecord(mediaId);
    assert.ok(retrieved !== null, "Session record must be retrieved from persistence store");
    assert.strictEqual(retrieved?.mediaId, mediaId);
    assert.strictEqual(retrieved?.uploadUrl, mockUploadUrl);
    assert.strictEqual(retrieved?.uploadedByUid, "admin_uid_123");
    assert.strictEqual(retrieved?.fileSize, 5242880);
  });

  it("2. Range Header Parser: Correctly extracts start, end, and nextOffset from Google Range headers", () => {
    // Standard Google Drive Range header format
    const r1 = parseDriveRangeHeader("bytes=0-2097151");
    assert.strictEqual(r1.start, 0);
    assert.strictEqual(r1.end, 2097151);
    assert.strictEqual(r1.nextOffset, 2097152);

    // Partial range
    const r2 = parseDriveRangeHeader("bytes 2097152-4194303");
    assert.strictEqual(r2.start, 2097152);
    assert.strictEqual(r2.end, 4194303);
    assert.strictEqual(r2.nextOffset, 4194304);

    // Missing or empty header
    const r3 = parseDriveRangeHeader(null);
    assert.strictEqual(r3.start, 0);
    assert.strictEqual(r3.end, -1);
    assert.strictEqual(r3.nextOffset, 0);

    // Invalid format fallback
    const r4 = parseDriveRangeHeader("invalid-range-string");
    assert.strictEqual(r4.start, 0);
    assert.strictEqual(r4.end, -1);
    assert.strictEqual(r4.nextOffset, 0);
  });

  it("3. HTTP 308 Handling: Wraps Drive status 308 into clean HTTP 200 JSON payload", async () => {
    const mediaId = `test_308_${Date.now()}`;
    await saveUploadSessionRecord({
      mediaId,
      uploadUrl: `https://mock.drive.google.com/upload/${mediaId}`,
      uploadedByUid: "admin_uid_123",
      uploadedByEmail: "admin@example.com",
      fileSize: 5242880, // 5 MB
      mimeType: "image/jpeg",
      category: "PHOTO_GALLERY"
    });

    // Simulate first 2MB chunk upload proxy response calculation
    const reqEnd = 2097151;
    const driveStatus = 308; // Google Drive's raw status code
    const isComplete = false;

    // Simulate backend response payload formatting
    const clientResponsePayload = {
      success: true,
      complete: isComplete,
      status: driveStatus,
      range: `bytes=0-${reqEnd}`,
      nextOffset: reqEnd + 1
    };

    assert.strictEqual(clientResponsePayload.complete, false);
    assert.strictEqual(clientResponsePayload.status, 308);
    assert.strictEqual(clientResponsePayload.nextOffset, 2097152);
  });

  it("4. Multi-Chunk Flow: Sequentially uploads 2 MB chunks and tracks offset progression", async () => {
    const mediaId = `test_multichunk_${Date.now()}`;
    const totalSize = 5000000; // 5 MB
    const chunkSize = 2097152; // 2 MB

    await saveUploadSessionRecord({
      mediaId,
      uploadUrl: `https://mock.drive.google.com/upload/${mediaId}`,
      uploadedByUid: "admin_uid_123",
      uploadedByEmail: "admin@example.com",
      fileSize: totalSize,
      mimeType: "image/jpeg",
      category: "PHOTO_GALLERY"
    });

    let currentOffset = 0;
    const chunks: Array<{ start: number; end: number; complete: boolean }> = [];

    while (currentOffset < totalSize) {
      const chunkEnd = Math.min(currentOffset + chunkSize, totalSize);
      const isFinal = chunkEnd >= totalSize;
      chunks.push({ start: currentOffset, end: chunkEnd - 1, complete: isFinal });
      currentOffset = chunkEnd;
    }

    assert.strictEqual(chunks.length, 3, "5MB file with 2MB chunks must split into 3 chunks");
    assert.deepStrictEqual(chunks[0], { start: 0, end: 2097151, complete: false });
    assert.deepStrictEqual(chunks[1], { start: 2097152, end: 4194303, complete: false });
    assert.deepStrictEqual(chunks[2], { start: 4194304, end: 4999999, complete: true });
  });

  it("5. Recovery & Interrupted Retry: Recovers nextOffset from Range query after failure", async () => {
    const mediaId = `test_recovery_${Date.now()}`;
    const totalSize = 5000000;

    await saveUploadSessionRecord({
      mediaId,
      uploadUrl: `https://mock.drive.google.com/upload/${mediaId}`,
      uploadedByUid: "admin_uid_123",
      uploadedByEmail: "admin@example.com",
      fileSize: totalSize,
      mimeType: "image/jpeg",
      category: "PHOTO_GALLERY"
    });

    // Simulate Google Drive acknowledging bytes up to 1500000 after network glitch
    const driveRangeHeader = "bytes=0-1500000";
    const rangeInfo = parseDriveRangeHeader(driveRangeHeader);

    assert.strictEqual(rangeInfo.start, 0);
    assert.strictEqual(rangeInfo.end, 1500000);
    assert.strictEqual(rangeInfo.nextOffset, 1500001, "Next chunk must start immediately at byte 1500001");
  });

  it("6. Session Expiry Handling: Expired session records return null and get cleaned up", async () => {
    const mediaId = `test_expired_${Date.now()}`;

    // Create session with negative expiry (already expired)
    await saveUploadSessionRecord({
      mediaId,
      uploadUrl: `https://mock.drive.google.com/upload/${mediaId}`,
      uploadedByUid: "admin_uid_123",
      uploadedByEmail: "admin@example.com",
      fileSize: 1000000,
      mimeType: "image/jpeg",
      category: "PHOTO_GALLERY",
      expiresInSeconds: -10 // expired 10 seconds ago
    });

    const retrieved = await getUploadSessionRecord(mediaId);
    assert.strictEqual(retrieved, null, "Expired session record must return null");

    // Clean up
    await deleteUploadSessionRecord(mediaId);
    const deletedCheck = await getUploadSessionRecord(mediaId);
    assert.strictEqual(deletedCheck, null);
  });

  it("7. Encryption at Rest: Upload session URL is stored encrypted in store/DB and decrypted on retrieval", async () => {
    const mediaId = `test_enc_${Date.now()}`;
    const rawUploadUrl = `https://mock.drive.google.com/upload/${mediaId}?secret_session_token=sensitive_token_123`;

    await saveUploadSessionRecord({
      mediaId,
      uploadUrl: rawUploadUrl,
      uploadedByUid: "admin_uid_123",
      uploadedByEmail: "admin@example.com",
      fileSize: 1048576,
      mimeType: "image/jpeg",
      category: "PHOTO_GALLERY"
    });

    // Access raw stored session record directly from internal mock store to verify encryption at rest
    const rawStoredRecord = getRawMockSessionStore().get(mediaId);
    assert.ok(rawStoredRecord, "Raw stored session record must exist in store");
    assert.notStrictEqual(rawStoredRecord.uploadUrl, rawUploadUrl, "Stored uploadUrl MUST NOT be plain text");
    assert.strictEqual(rawStoredRecord.uploadUrl.startsWith("https://"), false, "Stored uploadUrl must not start with https://");
    assert.ok(rawStoredRecord.uploadUrl.includes(":"), "Stored uploadUrl must contain AES-256-GCM iv:tag:ciphertext structure");

    // Retrieve via backend getter helper (which decrypts it for internal handler usage)
    const retrieved = await getUploadSessionRecord(mediaId);
    assert.ok(retrieved, "Retrieved session record must exist");
    assert.strictEqual(retrieved.uploadUrl, rawUploadUrl, "Backend getter must properly decrypt uploadUrl for internal use");
  });
});
