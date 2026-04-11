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
    res.json({ markupCoefficient: user.markupCoefficient });
  });

  // PUT /api/settings
  router.put("/", (req: AuthRequest, res: Response): void => {
    const { markupCoefficient } = req.body as { markupCoefficient?: number };

    if (markupCoefficient === undefined || isNaN(Number(markupCoefficient))) {
      res.status(400).json({ error: "Некоректне значення коефіцієнту" });
      return;
    }
    if (Number(markupCoefficient) <= 0) {
      res.status(400).json({ error: "Коефіцієнт має бути більше 0" });
      return;
    }

    db.update(schema.users)
      .set({ markupCoefficient: Number(markupCoefficient) })
      .where(eq(schema.users.id, req.userId!))
      .run();

    res.json({ markupCoefficient: Number(markupCoefficient) });
  });

  return router;
}
