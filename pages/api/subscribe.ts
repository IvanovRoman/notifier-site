import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebase-admin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token, action } = req.body;

  if (!token || !action) {
    return res.status(400).json({ error: "Missing token or action" });
  }

  try {
    const tokensRef = db.collection("tokens");

    // Find existing token document
    const snapshot = await tokensRef.where("token", "==", token).limit(1).get();

    if (action === "subscribe") {
      if (snapshot.empty) {
        await tokensRef.add({
          token,
          createdAt: new Date().toISOString(),
        });
      }
      return res.status(200).json({ success: true, message: "Subscribed" });
    }

    if (action === "unsubscribe") {
      if (!snapshot.empty) {
        snapshot.forEach((doc) => {
          doc.ref.delete();
        });
      }
      return res.status(200).json({ success: true, message: "Unsubscribed" });
    }

    return res.status(400).json({ error: "Invalid action. Use 'subscribe' or 'unsubscribe'" });
  } catch (error) {
    console.error("Subscribe error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}