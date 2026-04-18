import { Router, Response } from "express";
import { eq, and } from "drizzle-orm";
import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";
import { requireAuth, AuthRequest } from "../middleware/auth";

export default function createCategoriesRouter(db: BetterSQLite3Database<typeof schema>) {
  const router = Router();
  router.use(requireAuth);

  // GET /api/categories
  router.get("/", (req: AuthRequest, res: Response): void => {
    const rows = db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.userId, req.userId!))
      .all();
    res.json(rows.map((r) => ({ id: r.id, name: r.name })));
  });

  // POST /api/categories
  router.post("/", (req: AuthRequest, res: Response): void => {
    const { name } = req.body as { name?: string };
    if (!name?.trim()) {
      res.status(400).json({ error: "Назва категорії обов'язкова" });
      return;
    }

    const existing = db
      .select()
      .from(schema.categories)
      .where(
        and(
          eq(schema.categories.name, name.trim()),
          eq(schema.categories.userId, req.userId!)
        )
      )
      .get();

    if (existing) {
      res.status(200).json({ id: existing.id, name: existing.name });
      return;
    }

    const [row] = db
      .insert(schema.categories)
      .values({ name: name.trim(), userId: req.userId! })
      .returning()
      .all();
    res.status(201).json({ id: row.id, name: row.name });
  });

  // PUT /api/categories/:id
  router.put("/:id", (req: AuthRequest, res: Response): void => {
    const id = Number(req.params.id);
    const { name } = req.body as { name?: string };

    if (!name?.trim()) {
      res.status(400).json({ error: "Назва категорії обов'язкова" });
      return;
    }

    const row = db
      .select()
      .from(schema.categories)
      .where(and(eq(schema.categories.id, id), eq(schema.categories.userId, req.userId!)))
      .get();

    if (!row) {
      res.status(404).json({ error: "Категорію не знайдено" });
      return;
    }

    const duplicate = db
      .select()
      .from(schema.categories)
      .where(
        and(
          eq(schema.categories.name, name.trim()),
          eq(schema.categories.userId, req.userId!)
        )
      )
      .get();

    if (duplicate && duplicate.id !== id) {
      res.status(409).json({ error: "Категорія з такою назвою вже існує" });
      return;
    }

    db.update(schema.categories)
      .set({ name: name.trim() })
      .where(eq(schema.categories.id, id))
      .run();

    res.json({ id, name: name.trim() });
  });

  // DELETE /api/categories/:id
  router.delete("/:id", (req: AuthRequest, res: Response): void => {
    const id = Number(req.params.id);
    const row = db
      .select()
      .from(schema.categories)
      .where(
        and(eq(schema.categories.id, id), eq(schema.categories.userId, req.userId!))
      )
      .get();

    if (!row) {
      res.status(404).json({ error: "Категорію не знайдено" });
      return;
    }

    db.delete(schema.categories).where(eq(schema.categories.id, id)).run();
    res.status(204).send();
  });

  return router;
}
