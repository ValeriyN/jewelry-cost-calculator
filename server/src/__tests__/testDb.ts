/**
 * Creates an isolated in-memory SQLite database for each test suite.
 * Runs all migrations to ensure schema is up-to-date.
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "../db/schema";
import path from "path";

export function createTestDb() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const db = drizzle(sqlite, { schema });

  const migrationsFolder = path.join(__dirname, "../db/migrations");
  migrate(db, { migrationsFolder });

  return { db };
}
