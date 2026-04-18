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

  // PUT /api/suppliers/:id
  router.put("/:id", (req: AuthRequest, res: Response): void => {
    const id = Number(req.params.id);
    const { name } = req.body as { name?: string };
    if (!name?.trim()) {
      res.status(400).json({ error: "Назва постачальника обов'язкова" });
      return;
    }

    const row = db
      .select()
      .from(schema.suppliers)
      .where(and(eq(schema.suppliers.id, id), eq(schema.suppliers.userId, req.userId!)))
      .get();
    if (!row) {
      res.status(404).json({ error: "Постачальника не знайдено" });
      return;
    }

    const duplicate = db
      .select()
      .from(schema.suppliers)
      .where(and(eq(schema.suppliers.name, name.trim()), eq(schema.suppliers.userId, req.userId!)))
      .get();
    if (duplicate && duplicate.id !== id) {
      res.status(409).json({ error: "Постачальник з такою назвою вже існує" });
      return;
    }

    db.update(schema.suppliers).set({ name: name.trim() }).where(eq(schema.suppliers.id, id)).run();
    res.json({ id, name: name.trim() });
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

    const usage = db
      .select()
      .from(schema.components)
      .where(eq(schema.components.supplierId, id))
      .get();
    if (usage) {
      res.status(409).json({ error: "Постачальник використовується в складових і не може бути видалений" });
      return;
    }

    db.delete(schema.suppliers).where(eq(schema.suppliers.id, id)).run();
    res.status(204).send();
  });

  return router;
}
