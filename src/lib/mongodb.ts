import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
let client: MongoClient | null = null;

export async function getMongoClient() {
  if (!uri) return null;
  
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to MongoDB via Admin URL");
  }
  
  return client;
}

export async function getCollection(dbName: string, collectionName: string) {
  const client = await getMongoClient();
  if (!client) return null;
  return client.db(dbName).collection(collectionName);
}
