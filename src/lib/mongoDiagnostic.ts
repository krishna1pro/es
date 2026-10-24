import "dotenv/config";
import crypto from "crypto";
import { MongoClient } from "mongodb";
import { getMongoClient, getMongoDbName, getMongoUri } from "./mongodb";
import { createOAuthTransaction, consumeOAuthTransaction } from "./driveAuth";

async function runSmokeTest() {
  console.log("=== START OAUTH SMOKE TEST ===");

  // 1. Inspect getMongoClient() configuration
  const client = await getMongoClient();
  if (!client) {
    console.error("Could not obtain client from getMongoClient()");
    process.exit(1);
  }

  const configuredDbName = getMongoDbName();
  const db = client.db(configuredDbName);
  console.log("getMongoClient selected DB:", configuredDbName);

  const getMongoConfigSource = process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD
    ? "Mode 1: Discrete Credentials (MONGODB_USERNAME & MONGODB_PASSWORD)"
    : (process.env.MONGODB_URI ? "Mode 2: MONGODB_URI" : (process.env.MONGODB_TEST_URI ? "Mode 3: MONGODB_TEST_URI" : "Unknown"));
  console.log("getMongoClient connection source:", getMongoConfigSource);

  // Check connectionStatus of getMongoClient()
  try {
    const adminStatus = await client.db("admin").command({ connectionStatus: 1 });
    const user = adminStatus.authInfo?.authenticatedUsers?.[0]?.user;
    const authDb = adminStatus.authInfo?.authenticatedUsers?.[0]?.db;
    console.log(`getMongoClient authenticated user: ${user} on auth DB: ${authDb}`);
  } catch (err: any) {
    console.log("getMongoClient connectionStatus error:", err.message);
  }

  // Check driveAuth getDbUri() connection
  const driveAuthUriSource = process.env.MONGODB_TEST_URI ? "MONGODB_TEST_URI" : (process.env.MONGODB_URI ? "MONGODB_URI" : "None");
  console.log("driveAuth.ts connection source (getDbUri):", driveAuthUriSource);
  console.log("driveAuth.ts selected DB (process.env.MONGODB_DB_NAME):", process.env.MONGODB_DB_NAME || "(undefined)");

  const sameClient = false; // driveAuth creates a new MongoClient on every call
  console.log("Do both functions use same MongoClient instance?:", sameClient);

  // 2. Step 2: Using getMongoClient() connection and configured chintadaravikumar DB, create one synthetic OAuth transaction
  const state = crypto.randomBytes(32).toString("hex");
  const stateHash = crypto.createHash("sha256").update(state).digest("hex");
  const diagnosticUid = "diagnostic-smoke-uid-" + Date.now();

  console.log("\n--- Step 2: Creating synthetic OAuth transaction via getMongoClient() ---");
  console.log("Diagnostic UID:", diagnosticUid);
  console.log("Target collection:", `${configuredDbName}.oauth_transactions`);

  let insertSucceeded = false;
  try {
    const insertResult = await db.collection("oauth_transactions").insertOne({
      stateHash,
      uid: diagnosticUid,
      expires: new Date(Date.now() + 600000), // 10 mins
      used: false,
      createdAt: new Date(),
      purpose: "diagnostic-smoke-test"
    });
    console.log("Synthetic transaction insert SUCCESS. Inserted ID:", insertResult.insertedId);
    insertSucceeded = true;
  } catch (err: any) {
    console.error("Synthetic transaction insert FAILED:", {
      name: err.name,
      code: err.code,
      codeName: err.codeName,
      message: err.message,
      database: configuredDbName,
      collection: "oauth_transactions",
      operation: "insertOne"
    });
  }

  // 3. Step 3: Immediately call consumeOAuthTransaction() with the same state
  console.log("\n--- Step 3: Calling consumeOAuthTransaction() with synthetic state ---");
  try {
    const consumedUid = await consumeOAuthTransaction(state);
    console.log("First consume result UID:", consumedUid);
    const firstConsumeMatch = consumedUid === diagnosticUid;
    console.log("First consume matched expected UID?:", firstConsumeMatch);

    // Call second time to verify single-use
    const secondConsumed = await consumeOAuthTransaction(state);
    console.log("Second consume result (expect null):", secondConsumed);
    const singleUseVerified = secondConsumed === null;
    console.log("Single-use verified?:", singleUseVerified);
  } catch (err: any) {
    console.error("consumeOAuthTransaction FAILED:", {
      name: err.name,
      code: err.code,
      codeName: err.codeName,
      message: err.message,
      database: process.env.MONGODB_DB_NAME || "chintadaravikumar",
      collection: "oauth_transactions",
      operation: "findOneAndUpdate"
    });
  }

  // 4. Test createOAuthTransaction() directly to see what driveAuth.ts does
  console.log("\n--- Additional Check: Calling createOAuthTransaction() directly from driveAuth.ts ---");
  const directState = crypto.randomBytes(32).toString("hex");
  const directUid = "direct-driveAuth-uid-" + Date.now();
  try {
    const createdState = await createOAuthTransaction(directUid, directState);
    console.log("createOAuthTransaction SUCCESS. State returned:", createdState === directState);
    const consumedDirect = await consumeOAuthTransaction(directState);
    console.log("Consumed direct transaction UID match?:", consumedDirect === directUid);
  } catch (err: any) {
    console.error("createOAuthTransaction FAILED:", {
      name: err.name,
      code: err.code,
      codeName: err.codeName,
      message: err.message,
      database: process.env.MONGODB_DB_NAME,
      collection: "oauth_transactions",
      operation: "insertOne"
    });
  }

  console.log("\n=== END OAUTH SMOKE TEST ===");
}

runSmokeTest().catch((err) => {
  console.error("Smoke test error:", err);
  process.exit(1);
});

