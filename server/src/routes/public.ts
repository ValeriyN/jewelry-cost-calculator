import { Router, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";
import { calcProductTotal, calcRecommendedPrice } from "../lib/calculations";

export default function createPublicRouter(db: BetterSQLite3Database<typeof schema>) {
  const router = Router();

  // GET /api/public/:shareToken — no auth required
  router.get("/:shareToken", (req: Request, res: Response): void => {
    const { shareToken } = req.params;

    const product = db
      .select()
      .from(schema.products)
      .where(eq(schema.products.shareToken, shareToken as string))
      .get();

    if (!product) {
      res.status(404).json({ error: "Продукт не знайдено або посилання недійсне" });
      return;
    }

    const user = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, product.userId))
      .get()!;

    const lines = db
      .select({
        componentName: schema.components.name,
        quantity: schema.productComponents.quantity,
        unitCostSnapshot: schema.productComponents.unitCostSnapshot,
        categoryId: schema.components.categoryId,
      })
      .from(schema.productComponents)
      .leftJoin(schema.components, eq(schema.productComponents.componentId, schema.components.id))
      .where(eq(schema.productComponents.productId, product.id))
      .all();

    const totalCost = calcProductTotal(
      lines.map((l) => ({
        unitCostSnapshot: l.unitCostSnapshot,
        quantity: l.quantity,
        categoryId: l.categoryId ?? null,
        categoryName: null,
      }))
    );

    const photos = db
      .select({ id: schema.productPhotos.id, photoPath: schema.productPhotos.photoPath, position: schema.productPhotos.position })
      .from(schema.productPhotos)
      .where(eq(schema.productPhotos.productId, product.id))
      .all()
      .sort((a, b) => a.position - b.position);

    // Public view: NO cost details, only recommended price
    res.json({
      name: product.name,
      description: product.description,
      photos,
      recommendedPrice: product.customPrice ?? calcRecommendedPrice(totalCost, user.markupCoefficient),
      components: lines.map((l) => ({
        componentName: l.componentName,
        quantity: l.quantity,
      })),
    });
  });

  return router;
}
