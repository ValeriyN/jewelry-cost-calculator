import express from "express";
import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";
import createAuthRouter from "../routes/auth";
import createCategoriesRouter from "../routes/categories";
import createSuppliersRouter from "../routes/suppliers";
import createComponentsRouter from "../routes/components";
import createProductsRouter from "../routes/products";
import createSettingsRouter from "../routes/settings";
import createPublicRouter from "../routes/public";

export function createTestApp(db: BetterSQLite3Database<typeof schema>) {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api/auth", createAuthRouter(db));
  app.use("/api/categories", createCategoriesRouter(db));
  app.use("/api/suppliers", createSuppliersRouter(db));
  app.use("/api/components", createComponentsRouter(db));
  app.use("/api/products", createProductsRouter(db));
  app.use("/api/settings", createSettingsRouter(db));
  app.use("/api/public", createPublicRouter(db));

  return app;
}
