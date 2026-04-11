import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";
import { requireAuth, AuthRequest } from "../middleware/auth";

const SALT_ROUNDS = 12;

function signToken(userId: number): string {
  const secret = process.env.JWT_SECRET ?? "dev-secret";
  return jwt.sign({ userId }, secret, { expiresIn: "30d" });
}

export default function createAuthRouter(db: BetterSQLite3Database<typeof schema>) {
  const router = Router();

  // POST /api/auth/register
  router.post("/register", async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ error: "Email та пароль обов'язкові" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Пароль має містити щонайменше 6 символів" });
      return;
    }

    const existing = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase()))
      .get();
    if (existing) {
      res.status(409).json({ error: "Користувач з таким email вже існує" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [user] = db
      .insert(schema.users)
      .values({ email: email.toLowerCase(), passwordHash })
      .returning()
      .all();

    const token = signToken(user.id);
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        markupCoefficient: user.markupCoefficient,
        createdAt: user.createdAt,
      },
    });
  });

  // POST /api/auth/login
  router.post("/login", async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ error: "Email та пароль обов'язкові" });
      return;
    }

    const user = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase()))
      .get();
    if (!user) {
      res.status(401).json({ error: "Невірний email або пароль" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Невірний email або пароль" });
      return;
    }

    const token = signToken(user.id);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        markupCoefficient: user.markupCoefficient,
        createdAt: user.createdAt,
      },
    });
  });

  // GET /api/auth/me
  router.get("/me", requireAuth, (req: AuthRequest, res: Response): void => {
    const user = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.userId!))
      .get();
    if (!user) {
      res.status(404).json({ error: "Користувача не знайдено" });
      return;
    }
    res.json({
      id: user.id,
      email: user.email,
      markupCoefficient: user.markupCoefficient,
      createdAt: user.createdAt,
    });
  });

  return router;
}
