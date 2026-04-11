import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createTestDb } from "../testDb";
import { createTestApp } from "../testApp";

describe("Auth routes", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    const { db } = createTestDb();
    app = createTestApp(db);
  });

  describe("POST /api/auth/register", () => {
    it("registers a new user and returns token + user", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe("test@example.com");
      expect(res.body.user.markupCoefficient).toBe(1.8);
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it("normalizes email to lowercase", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "Test@Example.COM",
        password: "password123",
      });
      expect(res.body.user.email).toBe("test@example.com");
    });

    it("returns 409 for duplicate email", async () => {
      await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        password: "password123",
      });
      const res = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        password: "otherpassword",
      });
      expect(res.status).toBe(409);
    });

    it("returns 400 for short password", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        password: "abc",
      });
      expect(res.status).toBe(400);
    });

    it("returns 400 when email is missing", async () => {
      const res = await request(app).post("/api/auth/register").send({
        password: "password123",
      });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/register").send({
        email: "user@example.com",
        password: "mypassword",
      });
    });

    it("returns token on valid credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "user@example.com",
        password: "mypassword",
      });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it("returns 401 on wrong password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "user@example.com",
        password: "wrong",
      });
      expect(res.status).toBe(401);
    });

    it("returns 401 on unknown email", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "nobody@example.com",
        password: "password",
      });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns user profile with valid token", async () => {
      const reg = await request(app).post("/api/auth/register").send({
        email: "me@example.com",
        password: "password123",
      });
      const token = reg.body.token;

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe("me@example.com");
    });

    it("returns 401 without token", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    it("returns 401 with invalid token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid.token.here");
      expect(res.status).toBe(401);
    });
  });
});
