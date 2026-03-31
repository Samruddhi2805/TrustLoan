import { connectToDatabase } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const client = await connectToDatabase();
    const transactions = await client.db("trustloan").collection("transactions")
      .find({}).sort({ timestamp: -1 }).limit(100).toArray();
      
    console.log(`📡 [API] Fetched ${transactions.length} recent transactions for logging`);
    
    return res.status(200).json(transactions);
  } catch (error) {
    console.error("❌ [API] Transactions Fetch Error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
