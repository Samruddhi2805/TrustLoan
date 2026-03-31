import { connectToDatabase } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { user_id, income, existingEMI, newEMI, expenses } = req.body;

    // 1. Validation
    if (!user_id || income <= 0 || newEMI <= 0 || expenses < 0 || existingEMI < 0) {
      console.error("❌ [API] Rejected invalid/negative input", req.body);
      return res.status(400).json({ error: 'Invalid or negative inputs provided' });
    }

    // 2. Core Logic Computation
    const dti = ((existingEMI + newEMI) / income) * 100;
    const disposable = income - (existingEMI + newEMI + expenses);
    const disposablePct = (disposable / income) * 100;

    let advice = 'CAUTION';
    let reasons = [];

    if (dti > 50 || disposablePct < 10 || disposable < 0) {
      advice = 'DO NOT TAKE';
      if (dti > 50) reasons.push("Extremely high DTI > 50%");
      if (disposablePct < 10) reasons.push("Disposable income is critically low (<10%)");
      if (disposable < 0) reasons.push("Negative cash flow detected");
    } else if (dti < 30 && disposablePct > 30) {
      advice = 'SAFE';
      reasons.push("Healthy EMI burden (DTI < 30%)");
      reasons.push("Strong living buffer (> 30%)");
      reasons.push("Adequate financial stability");
    } else {
      reasons.push("Moderate EMI burden");
      reasons.push("Average financial buffer");
      reasons.push("Budget strictly to manage risks");
    }

    // Ensure 3 reasons for output mapping
    while (reasons.length < 3) reasons.push("General financial diligence recommended");

    // 3. Database Insertion
    console.log(`🔌 [API] Connecting to persistent database for ${user_id}...`);
    const client = await connectToDatabase();
    const db = client.db("trustloan");

    // Persist User
    await db.collection("users").updateOne(
      { user_id },
      { $setOnInsert: { created_at: new Date() } },
      { upsert: true }
    );

    // Create Transaction Record
    const tx = {
      user_id,
      timestamp: new Date(),
      income, existingEMI, newEMI, expenses,
      dti: parseFloat(dti.toFixed(2)),
      disposable_income: parseFloat(disposable.toFixed(2)),
      advice,
      reasons
    };

    const insertRes = await db.collection("transactions").insertOne(tx);
    console.log(`✅ [API] Transaction stored internally: ${insertRes.insertedId}`);

    // 4. Return Output
    return res.status(200).json(tx);

  } catch (error) {
    console.error("❌ [API] Critical Analyzer Error:", error);
    return res.status(500).json({ error: 'Internal Database Synchronization Error' });
  }
}
