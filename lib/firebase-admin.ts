import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Clean up the private key: handle various formats
  if (privateKey) {
    privateKey = privateKey
      .replace(/\\n/g, "\n")      // convert \n literals to real newlines
      .replace(/\r\n/g, "\n")     // normalize CRLF to LF
      .replace(/\r/g, "\n")       // normalize remaining CR to LF
      .trim();
    // Strip surrounding quotes if present
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
  }

  if (!projectId || !clientEmail || !privateKey) {
    console.error(
      "Firebase Admin SDK: missing required env vars.",
      { projectId: !!projectId, clientEmail: !!clientEmail, privateKey: !!privateKey }
    );
  }

  const serviceAccount = { projectId, clientEmail, privateKey };

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully");
  } catch (initError) {
    console.error("Firebase Admin SDK initialization failed:", initError);
    throw initError;
  }
}

const db = admin.firestore();
const messaging = admin.messaging();

export { db, messaging };
