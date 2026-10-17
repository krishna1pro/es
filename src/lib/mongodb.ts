import { MongoClient } from "mongodb";

export const DEFAULT_CLUSTER_HOST = "cluster0.lqdmdvr.mongodb.net";
export const DEFAULT_DATABASE_NAME = "chintadaravikumar";
export const OBSOLETE_CLUSTER_HOST = "cluster0.wvy2yis.mongodb.net";

export function getMongoDbName(): string {
  const customDb = process.env.MONGODB_DB_NAME?.trim();
  if (customDb && customDb !== "Party") return customDb;
  return DEFAULT_DATABASE_NAME;
}

export function getMongoUri(): string | null {
  const username = process.env.MONGODB_USERNAME?.trim();
  const password = process.env.MONGODB_PASSWORD?.trim();
  const host = process.env.MONGODB_CLUSTER_HOST?.trim() || DEFAULT_CLUSTER_HOST;
  const db = getMongoDbName();

  // Mode 1: Discrete credentials (preferred and prioritized over obsolete URI)
  if (username && password) {
    const encodedUser = encodeURIComponent(username);
    const encodedPass = encodeURIComponent(password);
    return `mongodb+srv://${encodedUser}:${encodedPass}@${host}/${db}?retryWrites=true&w=majority`;
  }

  // Mode 2: Full MONGODB_URI string
  const rawUri = process.env.MONGODB_URI?.trim();
  if (rawUri) {
    // If raw URI contains placeholder for password and MONGODB_PASSWORD is set
    if (password && (rawUri.includes("<password>") || rawUri.includes("<db_password>"))) {
      const encodedPass = encodeURIComponent(password);
      return rawUri.replace(/<password>|<db_password>/g, encodedPass);
    }

    // Check if the URI still points to the obsolete cluster with no credentials updated
    if (rawUri.includes(OBSOLETE_CLUSTER_HOST)) {
      // Obsolete URI detected; return null to prompt for new credentials
      return null;
    }

    return rawUri;
  }

  // Mode 3: Dedicated test connection string (strictly for isolated test database)
  const testUri = process.env.MONGODB_TEST_URI?.trim();
  if (testUri && db === "chintadaravikumar_test") {
    return testUri;
  }

  return null;
}

export function sanitizeMongoUri(uri?: string | null): string {
  if (!uri) return "not configured";
  return uri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@");
}

export function sanitizeErrorMessage(message: string): string {
  if (!message) return "Unknown database error";
  return message
    .replace(/\/\/[^:]+:[^@]+@/g, "//***:***@")
    .replace(/password=[^&]+/gi, "password=***");
}

export function getMongoClusterHost(): string | null {
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

let client: MongoClient | null = null;
let currentConnectedUri: string | null = null;

export async function getMongoClient(forceReconnect = false): Promise<MongoClient | null> {
  const uri = getMongoUri();
  if (!uri) {
    if (client) {
      await client.close().catch(() => {});
      client = null;
      currentConnectedUri = null;
    }
    return null;
  }

  // If URI changed or reconnection forced, safely close and reset
  if (client && (forceReconnect || currentConnectedUri !== uri)) {
    try {
      await client.close().catch(() => {});
    } finally {
      client = null;
      currentConnectedUri = null;
    }
  }

  if (!client) {
    const maxPoolSize = parseInt(process.env.MONGODB_MAX_POOL_SIZE || "5", 10);
    const minPoolSize = parseInt(process.env.MONGODB_MIN_POOL_SIZE || "0", 10);

    const newClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      maxPoolSize,
      minPoolSize,
      family: 4,
    });

    try {
      await newClient.connect();
      const targetDb = getMongoDbName();
      await newClient.db(targetDb).command({ ping: 1 });
      client = newClient;
      currentConnectedUri = uri;
      console.log(`[MongoDB] Connected successfully to database: ${targetDb}`);
    } catch (err) {
      await newClient.close().catch(() => {});
      client = null;
      currentConnectedUri = null;
      const sanitizedErr = sanitizeErrorMessage((err as Error).message);
      console.error(`[MongoDB] Connection failed: ${sanitizedErr}`);
      throw new Error(sanitizedErr);
    }
  }

  return client;
}

export async function getCollection(collectionName: string, dbName?: string) {
  const targetDb = dbName || getMongoDbName();
  const activeClient = await getMongoClient();
  if (!activeClient) return null;
  return activeClient.db(targetDb).collection(collectionName);
}

export interface MongoHealthResult {
  status: "connected" | "disconnected" | "error";
  database: string;
  cluster: string | null;
  latencyMs?: number;
  message?: string;
  error?: string;
  collections?: string[];
  hasSiteSettings?: boolean;
}

export async function checkMongoHealth(): Promise<MongoHealthResult> {
  const uri = getMongoUri();
  const dbName = getMongoDbName();
  const cluster = getMongoClusterHost();

  if (!uri) {
    return {
      status: "disconnected",
      database: dbName,
      cluster,
      message: "MongoDB credentials not configured. Please set MONGODB_USERNAME & MONGODB_PASSWORD (or MONGODB_URI) in Secrets or environment.",
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
        message: "MongoClient could not be initialized",
      };
    }

    // Ping database
    await activeClient.db(dbName).command({ ping: 1 });
    const latencyMs = Date.now() - startTime;

    // Read collection list safely (read-only metadata inspection)
    let collections: string[] = [];
    try {
      const collectionInfos = await activeClient.db(dbName).listCollections().toArray();
      collections = collectionInfos.map((c) => c.name);
    } catch {
      // Non-fatal if listCollections is restricted by role
    }

    return {
      status: "connected",
      database: dbName,
      cluster,
      latencyMs,
      collections,
      hasSiteSettings: collections.includes("site_settings"),
    };
  } catch (err) {
    const sanitizedError = sanitizeErrorMessage((err as Error).message);
    return {
      status: "error",
      database: dbName,
      cluster,
      error: sanitizedError,
    };
  }
}
