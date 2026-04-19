import { Router, Response } from "express";
import { eq, and } from "drizzle-orm";
import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { generateShareToken } from "../lib/tokens";
import {
  calcProductTotal,
  calcRecommendedPrice,
  calcCategoryBreakdown,
} from "../lib/calculations";
import fs from "fs";
import path from "path";

const UPLOADS_DIR = () => process.env.UPLOADS_DIR ?? "./data/uploads";

function deleteFile(filename: string) {
  const p = path.join(UPLOADS_DIR(), filename);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

export default function createProductsRouter(db: BetterSQLite3Database<typeof schema>) {
  function getPhotos(productId: number) {
    return db
      .select({ id: schema.productPhotos.id, photoPath: schema.productPhotos.photoPath, position: schema.productPhotos.position })
      .from(schema.productPhotos)
      .where(eq(schema.productPhotos.productId, productId))
      .all()
      .sort((a, b) => a.position - b.position);
  }

  function buildProductDetail(productId: number, userId: number) {
    const product = db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.id, productId), eq(schema.products.userId, userId)))
      .get();
    if (!product) return null;

    const user = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .get()!;

    const lines = db
      .select({
        id: schema.productComponents.id,
        componentId: schema.productComponents.componentId,
        componentName: schema.components.name,
        categoryId: schema.components.categoryId,
        categoryName: schema.categories.name,
        quantity: schema.productComponents.quantity,
        unitCostSnapshot: schema.productComponents.unitCostSnapshot,
      })
      .from(schema.productComponents)
      .leftJoin(schema.components, eq(schema.productComponents.componentId, schema.components.id))
      .leftJoin(schema.categories, eq(schema.components.categoryId, schema.categories.id))
      .where(eq(schema.productComponents.productId, productId))
      .all();

    const mapped = lines.map((l) => ({
      unitCostSnapshot: l.unitCostSnapshot,
      quantity: l.quantity,
      categoryId: l.categoryId ?? null,
      categoryName: l.categoryName ?? null,
    }));

    const totalCost = calcProductTotal(mapped);

    return {
      id: product.id,
      name: product.name,
      photos: getPhotos(productId),
      shareToken: product.shareToken,
      customPrice: product.customPrice,
      createdAt: product.createdAt,
      components: lines.map((l) => ({
        id: l.id,
        componentId: l.componentId,
        componentName: l.componentName,
        categoryId: l.categoryId ?? null,
        categoryName: l.categoryName ?? null,
        quantity: l.quantity,
        unitCostSnapshot: l.unitCostSnapshot,
        totalCost: l.unitCostSnapshot * l.quantity,
      })),
      totalCost,
      recommendedPrice: product.customPrice ?? calcRecommendedPrice(totalCost, user.markupCoefficient),
      categoryBreakdown: calcCategoryBreakdown(mapped),
    };
  }

  const router = Router();
  router.use(requireAuth);

  // GET /api/products
  router.get("/", (req: AuthRequest, res: Response): void => {
    const rows = db
      .select()
      .from(schema.products)
      .where(eq(schema.products.userId, req.userId!))
      .all();

    const user = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.userId!))
      .get()!;

    const result = rows.map((p) => {
      const lines = db
        .select({
          unitCostSnapshot: schema.productComponents.unitCostSnapshot,
          quantity: schema.productComponents.quantity,
          categoryId: schema.components.categoryId,
          categoryName: schema.categories.name,
        })
        .from(schema.productComponents)
        .leftJoin(schema.components, eq(schema.productComponents.componentId, schema.components.id))
        .leftJoin(schema.categories, eq(schema.components.categoryId, schema.categories.id))
        .where(eq(schema.productComponents.productId, p.id))
        .all();

      const totalCost = calcProductTotal(
        lines.map((l) => ({
          unitCostSnapshot: l.unitCostSnapshot,
          quantity: l.quantity,
          categoryId: l.categoryId ?? null,
          categoryName: l.categoryName ?? null,
        }))
      );

      return {
        id: p.id,
        name: p.name,
        photos: getPhotos(p.id),
        shareToken: p.shareToken,
        customPrice: p.customPrice,
        createdAt: p.createdAt,
        totalCost,
        recommendedPrice: p.customPrice ?? calcRecommendedPrice(totalCost, user.markupCoefficient),
        componentCount: lines.length,
      };
    });

    res.json(result);
  });

  // POST /api/products
  router.post("/", upload.array("photos", 10), (req: AuthRequest, res: Response): void => {
    const { name, components: componentsJson } = req.body as {
      name?: string;
      components?: string;
    };

    if (!name?.trim()) {
      res.status(400).json({ error: "Назва продукту обов'язкова" });
      return;
    }

    let componentLines: { componentId: number; quantity: number }[] = [];
    if (componentsJson) {
      try {
        componentLines = JSON.parse(componentsJson);
      } catch {
        res.status(400).json({ error: "Некоректний формат складових" });
        return;
      }
    }

    const [product] = db
      .insert(schema.products)
      .values({ name: name.trim(), userId: req.userId! })
      .returning()
      .all();

    const files = (req.files as Express.Multer.File[]) ?? [];
    files.forEach((file, idx) => {
      db.insert(schema.productPhotos)
        .values({ productId: product.id, photoPath: file.filename, position: idx })
        .run();
    });

    for (const line of componentLines) {
      const component = db
        .select()
        .from(schema.components)
        .where(and(eq(schema.components.id, line.componentId), eq(schema.components.userId, req.userId!)))
        .get();
      if (!component) continue;
      db.insert(schema.productComponents)
        .values({ productId: product.id, componentId: line.componentId, quantity: line.quantity, unitCostSnapshot: component.unitCost })
        .run();
    }

    const detail = buildProductDetail(product.id, req.userId!);
    res.status(201).json(detail);
  });

  // GET /api/products/:id
  router.get("/:id", (req: AuthRequest, res: Response): void => {
    const detail = buildProductDetail(Number(req.params.id), req.userId!);
    if (!detail) {
      res.status(404).json({ error: "Продукт не знайдено" });
      return;
    }
    res.json(detail);
  });

  // PUT /api/products/:id
  router.put("/:id", upload.array("photos", 10), (req: AuthRequest, res: Response): void => {
    const id = Number(req.params.id);
    const existing = db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.id, id), eq(schema.products.userId, req.userId!)))
      .get();

    if (!existing) {
      res.status(404).json({ error: "Продукт не знайдено" });
      return;
    }

    const { name, components: componentsJson, customPrice: customPriceRaw } = req.body as {
      name?: string;
      components?: string;
      customPrice?: string;
    };

    let customPrice: number | null | undefined;
    if (customPriceRaw === "reset") {
      customPrice = null;
    } else if (customPriceRaw !== undefined) {
      const parsed = Number(customPriceRaw);
      customPrice = isNaN(parsed) || parsed < 0 ? undefined : parsed;
    }

    db.update(schema.products)
      .set({
        name: name?.trim() ?? existing.name,
        ...(customPrice !== undefined ? { customPrice } : {}),
      })
      .where(eq(schema.products.id, id))
      .run();

    // Append new photos
    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length > 0) {
      const currentPhotos = getPhotos(id);
      const nextPosition = currentPhotos.length > 0
        ? Math.max(...currentPhotos.map((p) => p.position)) + 1
        : 0;
      files.forEach((file, idx) => {
        db.insert(schema.productPhotos)
          .values({ productId: id, photoPath: file.filename, position: nextPosition + idx })
          .run();
      });
    }

    if (componentsJson) {
      let componentLines: { componentId: number; quantity: number }[];
      try {
        componentLines = JSON.parse(componentsJson);
      } catch {
        res.status(400).json({ error: "Некоректний формат складових" });
        return;
      }

      db.delete(schema.productComponents).where(eq(schema.productComponents.productId, id)).run();

      for (const line of componentLines) {
        const component = db
          .select()
          .from(schema.components)
          .where(and(eq(schema.components.id, line.componentId), eq(schema.components.userId, req.userId!)))
          .get();
        if (!component) continue;
        db.insert(schema.productComponents)
          .values({ productId: id, componentId: line.componentId, quantity: line.quantity, unitCostSnapshot: component.unitCost })
          .run();
      }
    }

    const detail = buildProductDetail(id, req.userId!);
    res.json(detail);
  });

  // POST /api/products/:id/photos — add photos to existing product
  router.post("/:id/photos", upload.array("photos", 10), (req: AuthRequest, res: Response): void => {
    const id = Number(req.params.id);
    const product = db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.id, id), eq(schema.products.userId, req.userId!)))
      .get();

    if (!product) {
      res.status(404).json({ error: "Продукт не знайдено" });
      return;
    }

    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length === 0) {
      res.status(400).json({ error: "Немає фото для завантаження" });
      return;
    }

    const currentPhotos = getPhotos(id);
    const nextPosition = currentPhotos.length > 0
      ? Math.max(...currentPhotos.map((p) => p.position)) + 1
      : 0;

    files.forEach((file, idx) => {
      db.insert(schema.productPhotos)
        .values({ productId: id, photoPath: file.filename, position: nextPosition + idx })
        .run();
    });

    res.json(getPhotos(id));
  });

  // DELETE /api/products/:id/photos/:photoId — delete a single photo
  router.delete("/:id/photos/:photoId", (req: AuthRequest, res: Response): void => {
    const productId = Number(req.params.id);
    const photoId = Number(req.params.photoId);

    const product = db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.id, productId), eq(schema.products.userId, req.userId!)))
      .get();

    if (!product) {
      res.status(404).json({ error: "Продукт не знайдено" });
      return;
    }

    const photo = db
      .select()
      .from(schema.productPhotos)
      .where(and(eq(schema.productPhotos.id, photoId), eq(schema.productPhotos.productId, productId)))
      .get();

    if (!photo) {
      res.status(404).json({ error: "Фото не знайдено" });
      return;
    }

    deleteFile(photo.photoPath);
    db.delete(schema.productPhotos).where(eq(schema.productPhotos.id, photoId)).run();

    res.status(204).send();
  });

  // DELETE /api/products/:id
  router.delete("/:id", (req: AuthRequest, res: Response): void => {
    const id = Number(req.params.id);
    const row = db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.id, id), eq(schema.products.userId, req.userId!)))
      .get();

    if (!row) {
      res.status(404).json({ error: "Продукт не знайдено" });
      return;
    }

    const photos = getPhotos(id);
    photos.forEach((p) => deleteFile(p.photoPath));

    db.delete(schema.products).where(eq(schema.products.id, id)).run();
    res.status(204).send();
  });

  // POST /api/products/:id/share
  router.post("/:id/share", (req: AuthRequest, res: Response): void => {
    const id = Number(req.params.id);
    const product = db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.id, id), eq(schema.products.userId, req.userId!)))
      .get();

    if (!product) {
      res.status(404).json({ error: "Продукт не знайдено" });
      return;
    }

    const token = product.shareToken ?? generateShareToken();
    if (!product.shareToken) {
      db.update(schema.products).set({ shareToken: token }).where(eq(schema.products.id, id)).run();
    }

    const clientUrl = process.env.CLIENT_URL ?? "http://localhost:5173";
    res.json({ shareToken: token, shareUrl: `${clientUrl}/share/${token}` });
  });

  // DELETE /api/products/:id/share
  router.delete("/:id/share", (req: AuthRequest, res: Response): void => {
    const id = Number(req.params.id);
    const product = db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.id, id), eq(schema.products.userId, req.userId!)))
      .get();

    if (!product) {
      res.status(404).json({ error: "Продукт не знайдено" });
      return;
    }

    db.update(schema.products).set({ shareToken: null }).where(eq(schema.products.id, id)).run();
    res.status(204).send();
  });

  return router;
}
