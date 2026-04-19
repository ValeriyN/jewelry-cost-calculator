import { Router, Response } from "express";
import { eq } from "drizzle-orm";
import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";
import { requireAuth, AuthRequest } from "../middleware/auth";

export default function createSettingsRouter(db: BetterSQLite3Database<typeof schema>) {
  const router = Router();
  router.use(requireAuth);

  // GET /api/settings
  router.get("/", (req: AuthRequest, res: Response): void => {
    const user = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.userId!))
      .get();
    if (!user) {
      res.status(404).json({ error: "Користувача не знайдено" });
      return;
    }
    res.json({ markupCoefficient: user.markupCoefficient, defaultDeliveryCost: user.defaultDeliveryCost });
  });

  // PUT /api/settings
  router.put("/", (req: AuthRequest, res: Response): void => {
    const { markupCoefficient, defaultDeliveryCost } = req.body as {
      markupCoefficient?: number;
      defaultDeliveryCost?: number;
    };

    const updates: Partial<typeof schema.users.$inferInsert> = {};

    if (markupCoefficient !== undefined) {
      if (isNaN(Number(markupCoefficient)) || Number(markupCoefficient) <= 0) {
        res.status(400).json({ error: "Коефіцієнт має бути більше 0" });
        return;
      }
      updates.markupCoefficient = Number(markupCoefficient);
    }

    if (defaultDeliveryCost !== undefined) {
      if (isNaN(Number(defaultDeliveryCost)) || Number(defaultDeliveryCost) < 0) {
        res.status(400).json({ error: "Вартість доставки не може бути від'ємною" });
        return;
      }
      updates.defaultDeliveryCost = Number(defaultDeliveryCost);
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "Немає даних для оновлення" });
      return;
    }

    db.update(schema.users).set(updates).where(eq(schema.users.id, req.userId!)).run();

    const user = db.select().from(schema.users).where(eq(schema.users.id, req.userId!)).get()!;
    res.json({ markupCoefficient: user.markupCoefficient, defaultDeliveryCost: user.defaultDeliveryCost });
  });

  return router;
}
