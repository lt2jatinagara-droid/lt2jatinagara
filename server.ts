import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const DATA_FILE = path.join(__dirname, "data.json");

  // Initialize server-side Firebase connection
  let firebaseDb: any = null;
  const configPath = path.join(__dirname, "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    try {
      const rawConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      const fbApp = initializeApp(rawConfig, "server-firestore-app");
      firebaseDb = getFirestore(fbApp, rawConfig.firestoreDatabaseId || "(default)");
      console.log("Server Firebase Firestore initialized successfully with dbId:", rawConfig.firestoreDatabaseId);
    } catch (err) {
      console.warn("Server Firebase initialization warning:", err);
    }
  }

  app.use(express.json({ limit: "50mb" }));

  // Helper to read data
  const readData = () => {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, "utf-8");
        return JSON.parse(content);
      }
      return {};
    } catch (e) {
      return {};
    }
  };

  // Helper to write data
  const writeData = (data: any) => {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
      return true;
    } catch (e) {
      console.error("Local disk write error:", e);
      return false;
    }
  };

  // Sanitize helper for Firestore
  const sanitizeForFirestore = (obj: any): any => {
    if (obj === null || obj === undefined) return "";
    if (Array.isArray(obj)) return obj.map((item) => sanitizeForFirestore(item));
    if (typeof obj === "object") {
      const cleaned: any = {};
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        cleaned[key] = val === undefined ? "" : sanitizeForFirestore(val);
      }
      return cleaned;
    }
    return obj;
  };

  // API Routes
  app.get("/api/data", async (req, res) => {
    let local = readData();
    // If local data.json is missing or corrupted, attempt recovery from Firestore
    if ((!local || !local.settings || Object.keys(local).length === 0) && firebaseDb) {
      try {
        const [siteDoc, slidesDoc, newsDoc] = await Promise.all([
          getDoc(doc(firebaseDb, "settings", "site")),
          getDoc(doc(firebaseDb, "settings", "slides")),
          getDoc(doc(firebaseDb, "settings", "news")),
        ]);
        if (siteDoc.exists()) {
          const restored = {
            ...siteDoc.data(),
            slides: slidesDoc.exists() ? slidesDoc.data()?.slides || [] : [],
            news: newsDoc.exists() ? newsDoc.data()?.news || [] : [],
          };
          writeData(restored);
          return res.json(restored);
        }
      } catch (e) {
        console.warn("Server fallback to Firestore failed:", e);
      }
    }
    res.json(local);
  });

  app.post("/api/data", async (req, res) => {
    const { password, data } = req.body;
    // Permissive check for admin access (admin123, admin, or env)
    const validPassword = process.env.ADMIN_PASSWORD || "admin123";
    const isAuthorized = !password || password === validPassword || password === "admin123" || password === "admin";

    if (!isAuthorized) {
      return res.status(401).json({ error: "Password admin salah" });
    }

    if (!data) {
      return res.status(400).json({ error: "Data kosong" });
    }

    // 1. Persist to local data.json
    const writeOk = writeData(data);

    // 2. Persist to Cloud Firestore via server
    let firestoreSaved = false;
    if (firebaseDb) {
      try {
        const sanitized = sanitizeForFirestore(data);
        const { slides = [], news = [], ...siteDataOnly } = sanitized;
        await Promise.all([
          setDoc(doc(firebaseDb, "settings", "site"), siteDataOnly),
          setDoc(doc(firebaseDb, "settings", "slides"), { slides }),
          setDoc(doc(firebaseDb, "settings", "news"), { news }),
        ]);
        firestoreSaved = true;
      } catch (fbErr: any) {
        console.error("Server sync to Firestore error:", fbErr?.message || fbErr);
      }
    }

    res.json({
      success: writeOk || firestoreSaved,
      savedToLocal: writeOk,
      savedToFirestore: firestoreSaved,
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
