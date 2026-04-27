import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const DATA_FILE = path.join(__dirname, "data.json");

  app.use(express.json());

  // Helper to read data
  const readData = () => {
    try {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(content);
    } catch (e) {
      return {};
    }
  };

  // Helper to write data
  const writeData = (data: any) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  };

  // API Routes
  app.get("/api/data", (req, res) => {
    res.json(readData());
  });

  app.post("/api/data", (req, res) => {
    const { password, data } = req.body;
    // Simple admin password check
    if (password !== (process.env.ADMIN_PASSWORD || "admin123")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    writeData(data);
    res.json({ success: true });
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
