import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createTestDb } from "../testDb";
import { createTestApp } from "../testApp";

describe("Settings routes", () => {
  let app: ReturnType<typeof createTestApp>;
  let token: string;

  beforeEach(async () => {
    const { db } = createTestDb();
    app = createTestApp(db);

    const reg = await request(app).post("/api/auth/register").send({
      email: "user@example.com",
      password: "password123",
    });
    token = reg.body.token;
  });

  describe("GET /api/settings", () => {
    it("returns default markup coefficient of 1.8 and default delivery cost of 20", async () => {
      const res = await request(app)
        .get("/api/settings")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.markupCoefficient).toBe(1.8);
      expect(res.body.defaultDeliveryCost).toBe(20);
    });

    it("returns 401 without token", async () => {
      const res = await request(app).get("/api/settings");
      expect(res.status).toBe(401);
    });
  });

  describe("PUT /api/settings", () => {
    it("updates markup coefficient", async () => {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send({ markupCoefficient: 2.5 });

      expect(res.status).toBe(200);
      expect(res.body.markupCoefficient).toBe(2.5);
    });

    it("persists the new coefficient for subsequent requests", async () => {
      await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send({ markupCoefficient: 3.0 });

      const get = await request(app)
        .get("/api/settings")
        .set("Authorization", `Bearer ${token}`);

      expect(get.body.markupCoefficient).toBe(3.0);
    });

    it("updates default delivery cost", async () => {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send({ defaultDeliveryCost: 50 });

      expect(res.status).toBe(200);
      expect(res.body.defaultDeliveryCost).toBe(50);
    });

    it("persists new delivery cost", async () => {
      await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send({ defaultDeliveryCost: 35 });

      const get = await request(app)
        .get("/api/settings")
        .set("Authorization", `Bearer ${token}`);

      expect(get.body.defaultDeliveryCost).toBe(35);
    });

    it("returns 400 for negative delivery cost", async () => {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send({ defaultDeliveryCost: -5 });

      expect(res.status).toBe(400);
    });

    it("returns 400 for negative coefficient", async () => {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send({ markupCoefficient: -1 });

      expect(res.status).toBe(400);
    });

    it("new coefficient affects recommended price calculation", async () => {
      // Update markup to 3.0
      await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${token}`)
        .send({ markupCoefficient: 3.0 });

      // Create component and product
      const comp = await request(app)
        .post("/api/components")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Comp", batchQuantity: 10, batchTotalCost: 100, deliveryCost: 0 });
      // unitCost = 10

      const product = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Продукт",
          components: JSON.stringify([{ componentId: comp.body.id, quantity: 5 }]),
        });
      // totalCost = 50, recommendedPrice = 50 * 3.0 = 150

      expect(product.body.recommendedPrice).toBeCloseTo(150);
    });
  });
});
