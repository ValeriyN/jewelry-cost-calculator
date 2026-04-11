import { Router, Response } from "express";
import { eq, and } from "drizzle-orm";
import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";
import { requireAuth, AuthRequest } from "../middleware/auth";

export default function createSuppliersRouter(db: BetterSQLite3Database<typeof schema>) {
  const router = Router();
  router.use(requireAuth);

  // GET /api/suppliers
  router.get("/", (req: AuthRequest, res: Response): void => {
    const rows = db
      .select()
      .from(schema.suppliers)
      .where(eq(schema.suppliers.userId, req.userId!))
      .all();
    res.json(rows.map((r) => ({ id: r.id, name: r.name })));
  });

  // POST /api/suppliers
  router.post("/", (req: AuthRequest, res: Response): void => {
    const { name } = req.body as { name?: string };
    if (!name?.trim()) {
      res.status(400).json({ error: "Назва постачальника обов'язкова" });
      return;
    }

    const existing = db
      .select()
      .from(schema.suppliers)
      .where(
        and(
          eq(schema.suppliers.name, name.trim()),
          eq(schema.suppliers.userId, req.userId!)
        )
      )
      .get();

    if (existing) {
      res.status(200).json({ id: existing.id, name: existing.name });
      return;
    }

    const [row] = db
      .insert(schema.suppliers)
      .values({ name: name.trim(), userId: req.userId! })
      .returning()
      .all();
    res.status(201).json({ id: row.id, name: row.name });
  });

  // DELETE /api/suppliers/:id
  router.delete("/:id", (req: AuthRequest, res: Response): void => {
    const id = Number(req.params.id);
    const row = db
      .select()
      .from(schema.suppliers)
      .where(
        and(eq(schema.suppliers.id, id), eq(schema.suppliers.userId, req.userId!))
      )
      .get();

    if (!row) {
      res.status(404).json({ error: "Постачальника не знайдено" });
      return;
    }

    db.delete(schema.suppliers).where(eq(schema.suppliers.id, id)).run();
    res.status(204).send();
  });

  return router;
}
