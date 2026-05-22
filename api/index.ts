import express from "express";
import fs from "fs";
import path from "path";

const app = express();
app.use(express.json());

const LOCAL_DATA_FILE = path.join(process.cwd(), "data.json");
const TMP_DATA_FILE = "/tmp/data.json";

// Helper to determine compile/write safety for localized data
const get_data_filepath = () => {
  try {
    if (!fs.existsSync(TMP_DATA_FILE)) {
      if (fs.existsSync(LOCAL_DATA_FILE)) {
        const content = fs.readFileSync(LOCAL_DATA_FILE, "utf-8");
        fs.writeFileSync(TMP_DATA_FILE, content);
      } else {
        fs.writeFileSync(TMP_DATA_FILE, JSON.stringify({}, null, 2));
      }
    }
    return TMP_DATA_FILE;
  } catch (e) {
    return LOCAL_DATA_FILE;
  }
};

const readData = () => {
  try {
    const filePath = get_data_filepath();
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    try {
      if (fs.existsSync(LOCAL_DATA_FILE)) {
        const content = fs.readFileSync(LOCAL_DATA_FILE, "utf-8");
        return JSON.parse(content);
      }
    } catch (err) {}
    return {};
  }
};

const writeData = (data: any) => {
  try {
    const filePath = get_data_filepath();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error("Write error:", e);
    // Ephemeral in-memory fallback
    globalThis.ephemeralData = data;
    return false;
  }
};

// Handle optional memory fallback globally
declare global {
  var ephemeralData: any;
}

// API Routes
app.get("/api/data", (req, res) => {
  if (globalThis.ephemeralData) {
    return res.json(globalThis.ephemeralData);
  }
  res.json(readData());
});

app.post("/api/data", (req, res) => {
  const { password, data } = req.body;
  if (password !== (process.env.ADMIN_PASSWORD || "admin123")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  writeData(data);
  res.json({ success: true });
});

export default app;
