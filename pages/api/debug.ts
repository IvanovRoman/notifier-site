import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const diagnostics = {
    // Check env vars presence
    env: {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID
        ? `✅ set (${process.env.FIREBASE_PROJECT_ID})`
        : "❌ MISSING",
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL
        ? `✅ set (${process.env.FIREBASE_CLIENT_EMAIL})`
        : "❌ MISSING",
      FIREBASE_PRIVATE_KEY: privateKey
        ? `✅ set (${privateKey.length} chars)`
        : "❌ MISSING",
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY
        ? "✅ set"
        : "❌ MISSING",
      NEXT_PUBLIC_FIREBASE_VAPID_KEY: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        ? "✅ set"
        : "❌ MISSING",
    },
    // Check private key format
    privateKeyDiagnostics: privateKey
      ? {
          startsWithBegin: privateKey.startsWith("-----BEGIN"),
          endsWithEnd: privateKey.includes("-----END"),
          hasNewlines: privateKey.includes("\n"),
          hasLiteralBackslashN: privateKey.includes("\\n"),
          hasQuotes: privateKey.startsWith('"') || privateKey.endsWith('"'),
          firstChars: JSON.stringify(privateKey.substring(0, 30)),
          lastChars: JSON.stringify(privateKey.substring(privateKey.length - 30)),
          totalLength: privateKey.length,
        }
      : "N/A",
    nodeVersion: process.version,
    // Try Firebase Admin init
    firebaseAdmin: "not tested",
  };

  // Try to initialize Firebase Admin
  try {
    const { db } = await import("../../lib/firebase-admin");
    // Try a simple Firestore read
    await db.collection("tokens").limit(1).get();
    diagnostics.firebaseAdmin = "✅ working — Firestore connected";
  } catch (error: unknown) {
    const err = error as Error;
    diagnostics.firebaseAdmin = `❌ ${err.message}`;
  }

  res.status(200).json(diagnostics);
}