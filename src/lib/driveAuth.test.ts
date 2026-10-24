import "dotenv/config";
import { createOAuthTransaction, consumeOAuthTransaction } from "./driveAuth";
import { getMongoClient, getMongoDbName } from "./mongodb";
import crypto from "crypto";
import assert from "assert";

const COLLECTION = "oauth_transactions";

async function runTests() {
  console.log("Running OAuth Transaction Tests...");
  const client = await getMongoClient();
  if (!client) {
    console.error("MongoDB client is unavailable.");
    process.exit(1);
  }
  const db = client.db(getMongoDbName());

  const state1 = crypto.randomBytes(32).toString("hex");
  const state2 = crypto.randomBytes(32).toString("hex");

  try {
    // Test Case 1: Create and Consume Valid Transaction
    await createOAuthTransaction("uid-1", state1);
    const consumedUid = await consumeOAuthTransaction(state1);
    assert.strictEqual(consumedUid, "uid-1", "Valid transaction failed");
    console.log("✓ Valid transaction consumed");

    // Test Case 2: Replay Attack (Already Used)
    const consumedAgain = await consumeOAuthTransaction(state1);
    assert.strictEqual(consumedAgain, null, "Replay attack allowed");
    console.log("✓ Replay attack blocked");

    // Test Case 3: Expired Transaction
    await db.collection(COLLECTION).insertOne({
        stateHash: crypto.createHash("sha256").update(state2).digest("hex"),
        uid: "uid-2",
        expires: new Date(Date.now() - 10000), // Expired 10s ago
        used: false
    });
    const result3 = await consumeOAuthTransaction(state2);
    assert.strictEqual(result3, null, "Expired transaction consumed");
    console.log("✓ Expired transaction blocked");

    // Test Case 4: Invalid State Hash
    const result4 = await consumeOAuthTransaction("invalid-state");
    assert.strictEqual(result4, null, "Invalid state allowed");
    console.log("✓ Invalid state blocked");

    console.log("All tests passed successfully.");
  } finally {
    const hash1 = crypto.createHash("sha256").update(state1).digest("hex");
    const hash2 = crypto.createHash("sha256").update(state2).digest("hex");
    await db.collection(COLLECTION).deleteMany({ stateHash: { $in: [hash1, hash2] } }).catch(() => {});
    await client.close().catch(() => {});
  }
}

runTests().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
