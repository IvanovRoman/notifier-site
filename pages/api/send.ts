import type { NextApiRequest, NextApiResponse } from "next";
import { db, messaging } from "../../lib/firebase-admin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify API key
  const apiKey = req.headers.authorization?.replace("Bearer ", "");
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { title, body } = req.body;

  if (!body) {
    return res.status(400).json({ error: "Missing 'body' field" });
  }

  const notificationTitle = title || "Уведомление";

  try {
    // Save notification to history
    const notificationRef = await db.collection("notifications").add({
      title: notificationTitle,
      body,
      createdAt: new Date().toISOString(),
    });

    // Get all tokens
    const tokensSnapshot = await db.collection("tokens").get();
    const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);

    if (tokens.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Notification saved but no subscribers",
        notificationId: notificationRef.id,
      });
    }

    // Send push notification using data-only payload to avoid duplicate display
    const results = await messaging.sendEachForMulticast({
      tokens,
      data: {
        title: notificationTitle,
        body,
      },
    });

    // Clean up invalid tokens
    if (results.failureCount > 0) {
      const failedTokens: string[] = [];
      results.responses.forEach((response, i) => {
        if (!response.success) {
          failedTokens.push(tokens[i]);
        }
      });

      // Remove invalid tokens from Firestore
      if (failedTokens.length > 0) {
        const deletePromises = failedTokens.map(async (failedToken) => {
          const snapshot = await db
            .collection("tokens")
            .where("token", "==", failedToken)
            .limit(1)
            .get();
          snapshot.forEach((doc) => doc.ref.delete());
        });
        await Promise.all(deletePromises);
      }
    }

    return res.status(200).json({
      success: true,
      notificationId: notificationRef.id,
      sent: results.successCount,
      failed: results.failureCount,
    });
  } catch (error) {
    console.error("Send notification error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}