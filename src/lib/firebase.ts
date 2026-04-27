import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup as fbSignInWithPopup, 
  onAuthStateChanged as fbOnAuthStateChanged, 
  signOut as fbSignOut 
} from "firebase/auth";
import { 
  getFirestore, 
  doc as fbDoc, 
  getDoc as fbGetDoc, 
  setDoc as fbSetDoc, 
  onSnapshot as fbOnSnapshot 
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const isConfigValid = firebaseConfig && (firebaseConfig as any).apiKey;

const app = isConfigValid 
  ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)) 
  : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const googleProvider = new GoogleAuthProvider();

export const doc = (database: any, ...pathSegments: string[]) => {
  if (!database) return null;
  return fbDoc(database, pathSegments[0], ...pathSegments.slice(1));
};

export const signInWithPopup = async (a: any, p: any) => {
  if (!app || !auth) {
    console.error("Firebase Auth not initialized. Configuration missing.");
    return null;
  }
  return fbSignInWithPopup(auth, p);
};

export const onAuthStateChanged = (a: any, callback: any) => {
  if (!app || !auth) return () => {};
  return fbOnAuthStateChanged(auth, callback);
};

export const signOut = async (a: any) => {
  if (!app || !auth) return;
  return fbSignOut(auth);
};

export const onSnapshot = (ref: any, callback: any, errorCallback?: any) => {
  if (!app || !db || !ref) return () => {};
  return fbOnSnapshot(ref, callback, errorCallback);
};

export const getDoc = async (ref: any) => {
  if (!app || !db || !ref) return { exists: () => false };
  return fbGetDoc(ref);
};

export const setDoc = async (ref: any, data: any) => {
  if (!app || !db || !ref) {
    throw new Error("Penyimpanan Cloud tidak aktif. Silakan konfigurasi Firebase.");
  }
  return fbSetDoc(ref, data);
};
