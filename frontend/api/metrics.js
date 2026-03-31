import { connectToDatabase } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const client = await connectToDatabase();
    const db = client.db("trustloan");

    console.log("📥 [API] Fetching derived global metrics from database...");

    const totalUsers = await db.collection("users").countDocuments();
    const totalTransactions = await db.collection("transactions").countDocuments();
    
    // Aggregate strictly derived metrics via MongoDB
    const stats = await db.collection("transactions").aggregate([
      { $group: {
          _id: null,
          avgDti: { $avg: "$dti" },
          safeCount: { $sum: { $cond: [{ $eq: ["$advice", "SAFE"] }, 1, 0] } },
          cautionCount: { $sum: { $cond: [{ $eq: ["$advice", "CAUTION"] }, 1, 0] } },
          dangerCount: { $sum: { $cond: [{ $eq: ["$advice", "DO NOT TAKE"] }, 1, 0] } }
      }}
    ]).toArray();

    // Retention: users with >1 transaction
    const retentionData = await db.collection("transactions").aggregate([
      { $group: { _id: "$user_id", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    const metrics = {
      dailyActiveUsers: totalUsers,
      totalTransactions,
      retentionRatePct: totalUsers > 0 ? ((retentionData.length / totalUsers) * 100).toFixed(1) : 0,
      averageDti: stats[0]?.avgDti ? stats[0].avgDti.toFixed(2) : 0,
      distribution: {
        safe: stats[0]?.safeCount || 0,
        caution: stats[0]?.cautionCount || 0,
        danger: stats[0]?.dangerCount || 0
      }
    };

    return res.status(200).json(metrics);
  } catch (error) {
    console.error("❌ [API] Metrics Execution Error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
