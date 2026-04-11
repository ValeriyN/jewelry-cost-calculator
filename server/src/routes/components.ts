import { Router, Response } from "express";
import { eq, and, like, getTableColumns } from "drizzle-orm";
import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { calcUnitCost } from "../lib/calculations";
import fs from "fs";
import path from "path";

function formatComponent(
  row: typeof schema.components.$inferSelect & {
    categoryName: string | null;
    supplierName: string | null;
  }
) {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    supplierId: row.supplierId,
    supplierName: row.supplierName,
    photoPath: row.photoPath,
    batchQuantity: row.batchQuantity,
    batchTotalCost: row.batchTotalCost,
    deliveryCost: row.deliveryCost,
    unitCost: row.unitCost,
    createdAt: row.createdAt,
  };
}

export default function createComponentsRouter(db: BetterSQLite3Database<typeof schema>) {
  const router = Router();
  router.use(requireAuth);

  // GET /api/components
  router.get("/", (req: AuthRequest, res: Response): void => {
    const { category, supplier, search } = req.query as Record<string, string | undefined>;

    let query = db
      .select({
        ...getTableColumns(schema.components),
        categoryName: schema.categories.name,
        supplierName: schema.suppliers.name,
      })
      .from(schema.components)
      .leftJoin(schema.categories, eq(schema.components.categoryId, schema.categories.id))
      .leftJoin(schema.suppliers, eq(schema.components.supplierId, schema.suppliers.id))
      .where(eq(schema.components.userId, req.userId!))
      .$dynamic();

    if (category) {
      query = query.where(eq(schema.components.categoryId, Number(category)));
    }
    if (supplier) {
      query = query.where(eq(schema.components.supplierId, Number(supplier)));
    }
    if (search) {
      query = query.where(like(schema.components.name, `%${search}%`));
    }

    const rows = query.all();
    res.json(rows.map(formatComponent));
  });

  // POST /api/components
  router.post("/", upload.single("photo"), (req: AuthRequest, res: Response): void => {
    const { name, categoryId, supplierId, batchQuantity, batchTotalCost, deliveryCost } =
      req.body as Record<string, string | undefined>;

    if (!name?.trim()) {
      res.status(400).json({ error: "Назва складової обов'язкова" });
      return;
    }
    const qty = Number(batchQuantity);
    const cost = Number(batchTotalCost);
    const delivery = deliveryCost !== undefined ? Number(deliveryCost) : 20;

    if (!qty || qty <= 0) {
      res.status(400).json({ error: "Кількість у партії має бути більше 0" });
      return;
    }
    if (isNaN(cost) || cost < 0) {
      res.status(400).json({ error: "Загальна вартість партії некоректна" });
      return;
    }

    const unitCost = calcUnitCost(cost, delivery, qty);
    const photoPath = req.file ? req.file.filename : null;

    const [row] = db
      .insert(schema.components)
      .values({
        name: name.trim(),
        categoryId: categoryId ? Number(categoryId) : null,
        supplierId: supplierId ? Number(supplierId) : null,
        photoPath,
        batchQuantity: qty,
        batchTotalCost: cost,
        deliveryCost: delivery,
        unitCost,
        userId: req.userId!,
      })
      .returning()
      .all();

    const full = db
      .select({
        ...getTableColumns(schema.components),
        categoryName: schema.categories.name,
        supplierName: schema.suppliers.name,
      })
      .from(schema.components)
      .leftJoin(schema.categories, eq(schema.components.categoryId, schema.categories.id))
      .leftJoin(schema.suppliers, eq(schema.components.supplierId, schema.suppliers.id))
      .where(eq(schema.components.id, row.id))
      .get()!;

    res.status(201).json(formatComponent(full));
  });

  // GET /api/components/:id
  router.get("/:id", (req: AuthRequest, res: Response): void => {
    const id = Number(req.params.id);
    const row = db
      .select({
        ...getTableColumns(schema.components),
        categoryName: schema.categories.name,
        supplierName: schema.suppliers.name,
      })
      .from(schema.components)
      .leftJoin(schema.categories, eq(schema.components.categoryId, schema.categories.id))
      .leftJoin(schema.suppliers, eq(schema.components.supplierId, schema.suppliers.id))
      .where(and(eq(schema.components.id, id), eq(schema.components.userId, req.userId!)))
      .get();

    if (!row) {
      res.status(404).json({ error: "Складову не знайдено" });
      return;
    }
    res.json(formatComponent(row));
  });

  // PUT /api/components/:id
  router.put("/:id", upload.single("photo"), (req: AuthRequest, res: Response): void => {
    const id = Number(req.params.id);
    const existing = db
      .select()
      .from(schema.components)
      .where(and(eq(schema.components.id, id), eq(schema.components.userId, req.userId!)))
      .get();

    if (!existing) {
      res.status(404).json({ error: "Складову не знайдено" });
      return;
    }

    const { name, categoryId, supplierId, batchQuantity, batchTotalCost, deliveryCost } =
      req.body as Record<string, string | undefined>;

    const qty = batchQuantity !== undefined ? Number(batchQuantity) : existing.batchQuantity;
    const cost = batchTotalCost !== undefined ? Number(batchTotalCost) : existing.batchTotalCost;
    const delivery = deliveryCost !== undefined ? Number(deliveryCost) : existing.deliveryCost;

    if (qty <= 0) {
      res.status(400).json({ error: "Кількість у партії має бути більше 0" });
      return;
    }

    const unitCost = calcUnitCost(cost, delivery, qty);

    let photoPath = existing.photoPath;
    if (req.file) {
      if (existing.photoPath) {
        const oldPath = path.join(
          process.env.UPLOADS_DIR ?? "./data/uploads",
          existing.photoPath
        );
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      photoPath = req.file.filename;
    }

    db.update(schema.components)
      .set({
        name: name?.trim() ?? existing.name,
        categoryId:
          categoryId !== undefined
            ? categoryId
              ? Number(categoryId)
              : null
            : existing.categoryId,
        supplierId:
          supplierId !== undefined
            ? supplierId
              ? Number(supplierId)
              : null
            : existing.supplierId,
        photoPath,
        batchQuantity: qty,
        batchTotalCost: cost,
        deliveryCost: delivery,
        unitCost,
      })
      .where(eq(schema.components.id, id))
      .run();

    const full = db
      .select({
        ...getTableColumns(schema.components),
        categoryName: schema.categories.name,
        supplierName: schema.suppliers.name,
      })
      .from(schema.components)
      .leftJoin(schema.categories, eq(schema.components.categoryId, schema.categories.id))
      .leftJoin(schema.suppliers, eq(schema.components.supplierId, schema.suppliers.id))
      .where(eq(schema.components.id, id))
      .get()!;

    res.json(formatComponent(full));
  });

  // DELETE /api/components/:id
  router.delete("/:id", (req: AuthRequest, res: Response): void => {
    const id = Number(req.params.id);
    const row = db
      .select()
      .from(schema.components)
      .where(and(eq(schema.components.id, id), eq(schema.components.userId, req.userId!)))
      .get();

    if (!row) {
      res.status(404).json({ error: "Складову не знайдено" });
      return;
    }

    if (row.photoPath) {
      const filePath = path.join(
        process.env.UPLOADS_DIR ?? "./data/uploads",
        row.photoPath
      );
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    db.delete(schema.components).where(eq(schema.components.id, id)).run();
    res.status(204).send();
  });

  return router;
}
