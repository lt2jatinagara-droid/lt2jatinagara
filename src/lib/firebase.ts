import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const metaEnv = (import.meta as any).env || {};

const config = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfig.measurementId,
};

const app = initializeApp(config);

// Retrieve and sanitize the Database ID to prevent Realtime Database URL misconfiguration
let rawDatabaseId = metaEnv.VITE_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || "(default)";

if (typeof rawDatabaseId !== 'string') {
  rawDatabaseId = "(default)";
}

let databaseId = rawDatabaseId.trim();

// Check for URLs or invalid characters (slashes, colons, protocols, dots, etc.)
if (
  databaseId.includes('://') || 
  databaseId.includes('.') || 
  databaseId.includes('/') || 
  databaseId.startsWith('http')
) {
  console.warn("Detected invalid/URL-like Firebase Database ID:", databaseId);
  // Fallback to the authentic database ID from config if it's clean, otherwise default to "(default)"
  const cleanConfigId = firebaseConfig.firestoreDatabaseId;
  if (cleanConfigId && !cleanConfigId.includes('/') && !cleanConfigId.includes('.')) {
    databaseId = cleanConfigId;
  } else {
    databaseId = "(default)";
  }
}

// Extra check: must only contain valid characters
const validDbIdRegex = /^[a-z0-9-_()]+$/i;
if (!validDbIdRegex.test(databaseId)) {
  console.warn("Database ID does not match valid Firestore identifier format. Defaulting to (default).");
  databaseId = "(default)";
}

// Initialize with standard getFirestore to prevent IndexedDB Transaction failures in restricted sandbox iframes
export const db = getFirestore(app, databaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

