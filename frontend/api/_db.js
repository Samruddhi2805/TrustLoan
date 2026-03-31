import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
let cachedClient = null;

export async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  
  if (!uri) throw new Error("Missing MONGODB_URI in environment variables. Please add it to your Vercel project settings.");
  
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  console.log("🚀 [DB] Connected to MongoDB Atlas");
  
  return client;
}
