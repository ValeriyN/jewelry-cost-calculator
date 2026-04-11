import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createTestDb } from "../testDb";
import { createTestApp } from "../testApp";

async function registerAndLogin(
  app: ReturnType<typeof createTestApp>,
  email = "user@example.com",
  password = "password123"
) {
  const res = await request(app).post("/api/auth/register").send({ email, password });
  return res.body.token as string;
}

describe("Components routes", () => {
  let app: ReturnType<typeof createTestApp>;
  let token: string;
  let token2: string;

  beforeEach(async () => {
    const { db } = createTestDb();
    app = createTestApp(db);
    token = await registerAndLogin(app, "user1@example.com");
    token2 = await registerAndLogin(app, "user2@example.com");
  });

  function auth(t = token) {
    return { Authorization: `Bearer ${t}` };
  }

  describe("POST /api/components", () => {
    it("creates a component and returns it with calculated unitCost", async () => {
      const res = await request(app)
        .post("/api/components")
        .set(auth())
        .send({
          name: "Намистина синя",
          batchQuantity: 100,
          batchTotalCost: 200,
          deliveryCost: 20,
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Намистина синя");
      // (200 + 20) / 100 = 2.2
      expect(res.body.unitCost).toBeCloseTo(2.2);
    });

    it("uses default deliveryCost of 20 if not provided", async () => {
      const res = await request(app)
        .post("/api/components")
        .set(auth())
        .send({ name: "Дріт", batchQuantity: 50, batchTotalCost: 100 });

      expect(res.status).toBe(201);
      expect(res.body.deliveryCost).toBe(20);
      // (100 + 20) / 50 = 2.4
      expect(res.body.unitCost).toBeCloseTo(2.4);
    });

    it("returns 400 when name is missing", async () => {
      const res = await request(app)
        .post("/api/components")
        .set(auth())
        .send({ batchQuantity: 10, batchTotalCost: 50 });
      expect(res.status).toBe(400);
    });

    it("returns 400 when quantity is 0", async () => {
      const res = await request(app)
        .post("/api/components")
        .set(auth())
        .send({ name: "Test", batchQuantity: 0, batchTotalCost: 50 });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/components", () => {
    beforeEach(async () => {
      await request(app)
        .post("/api/components")
        .set(auth())
        .send({ name: "Намистина", batchQuantity: 100, batchTotalCost: 200 });
      await request(app)
        .post("/api/components")
        .set(auth())
        .send({ name: "Замок", batchQuantity: 10, batchTotalCost: 50 });
    });

    it("returns all components for authenticated user", async () => {
      const res = await request(app).get("/api/components").set(auth());
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it("user isolation: user2 cannot see user1 components", async () => {
      const res = await request(app).get("/api/components").set(auth(token2));
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });

    it("returns 401 without token", async () => {
      const res = await request(app).get("/api/components");
      expect(res.status).toBe(401);
    });
  });

  describe("PUT /api/components/:id", () => {
    it("updates component and recalculates unitCost", async () => {
      const create = await request(app)
        .post("/api/components")
        .set(auth())
        .send({ name: "Намистина", batchQuantity: 100, batchTotalCost: 200 });

      const id = create.body.id;
      const res = await request(app)
        .put(`/api/components/${id}`)
        .set(auth())
        .send({ batchTotalCost: "500", deliveryCost: "0" });

      expect(res.status).toBe(200);
      // (500 + 0) / 100 = 5
      expect(res.body.unitCost).toBeCloseTo(5);
    });

    it("returns 404 when user2 tries to update user1 component", async () => {
      const create = await request(app)
        .post("/api/components")
        .set(auth())
        .send({ name: "Test", batchQuantity: 10, batchTotalCost: 100 });

      const res = await request(app)
        .put(`/api/components/${create.body.id}`)
        .set(auth(token2))
        .send({ name: "Hacked" });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/components/:id", () => {
    it("deletes own component", async () => {
      const create = await request(app)
        .post("/api/components")
        .set(auth())
        .send({ name: "ToDelete", batchQuantity: 10, batchTotalCost: 100 });

      const del = await request(app)
        .delete(`/api/components/${create.body.id}`)
        .set(auth());
      expect(del.status).toBe(204);

      const get = await request(app)
        .get(`/api/components/${create.body.id}`)
        .set(auth());
      expect(get.status).toBe(404);
    });

    it("returns 404 when user2 tries to delete user1 component", async () => {
      const create = await request(app)
        .post("/api/components")
        .set(auth())
        .send({ name: "Test", batchQuantity: 10, batchTotalCost: 100 });

      const res = await request(app)
        .delete(`/api/components/${create.body.id}`)
        .set(auth(token2));
      expect(res.status).toBe(404);
    });
  });
});
