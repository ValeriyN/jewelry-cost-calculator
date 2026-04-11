import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./db/index";

import createAuthRouter from "./routes/auth";
import createCategoriesRouter from "./routes/categories";
import createSuppliersRouter from "./routes/suppliers";
import createComponentsRouter from "./routes/components";
import createProductsRouter from "./routes/products";
import createSettingsRouter from "./routes/settings";
import createPublicRouter from "./routes/public";

const app = express();
const PORT = process.env.PORT ?? 3001;
const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:5173";

// Run migrations on startup
const migrationsFolder = path.join(__dirname, "db/migrations");
if (fs.existsSync(migrationsFolder)) {
  migrate(db, { migrationsFolder });
}

// Middleware
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
const uploadsDir = process.env.UPLOADS_DIR ?? "./data/uploads";
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

// API routes
app.use("/api/auth", createAuthRouter(db));
app.use("/api/categories", createCategoriesRouter(db));
app.use("/api/suppliers", createSuppliersRouter(db));
app.use("/api/components", createComponentsRouter(db));
app.use("/api/products", createProductsRouter(db));
app.use("/api/settings", createSettingsRouter(db));
app.use("/api/public", createPublicRouter(db));

// Serve React SPA in production
const clientBuild = path.join(__dirname, "../../client/dist");
if (fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientBuild, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
