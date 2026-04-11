import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createTestDb } from "../testDb";
import { createTestApp } from "../testApp";

async function setup() {
  const { db } = createTestDb();
  const app = createTestApp(db);

  const reg = await request(app).post("/api/auth/register").send({
    email: "user@example.com",
    password: "password123",
  });
  const token = reg.body.token as string;

  // Create two components
  const c1 = await request(app)
    .post("/api/components")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Намистина", batchQuantity: 100, batchTotalCost: 200, deliveryCost: 20 });
  // unitCost = (200+20)/100 = 2.2

  const c2 = await request(app)
    .post("/api/components")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Замок", batchQuantity: 10, batchTotalCost: 50, deliveryCost: 0 });
  // unitCost = (50+0)/10 = 5

  return { app, token, comp1: c1.body, comp2: c2.body };
}

describe("Products routes", () => {
  describe("POST /api/products", () => {
    it("creates a product and returns calculated totals", async () => {
      const { app, token, comp1, comp2 } = await setup();

      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Браслет",
          components: JSON.stringify([
            { componentId: comp1.id, quantity: 20 }, // 20 * 2.2 = 44
            { componentId: comp2.id, quantity: 1 },  // 1 * 5 = 5
          ]),
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Браслет");
      expect(res.body.totalCost).toBeCloseTo(49); // 44 + 5
      expect(res.body.recommendedPrice).toBeCloseTo(49 * 1.8);
      expect(res.body.components).toHaveLength(2);
    });

    it("creates product without components", async () => {
      const { app, token } = await setup();

      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Порожній продукт" });

      expect(res.status).toBe(201);
      expect(res.body.totalCost).toBe(0);
      expect(res.body.components).toHaveLength(0);
    });

    it("returns 400 when name is missing", async () => {
      const { app, token } = await setup();
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({ components: "[]" });
      expect(res.status).toBe(400);
    });

    it("snapshots unit cost at creation time", async () => {
      const { app, token, comp1 } = await setup();

      // Create product
      const product = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Тест",
          components: JSON.stringify([{ componentId: comp1.id, quantity: 10 }]),
        });

      const snapshotCost = product.body.components[0].unitCostSnapshot;

      // Now update the component price
      await request(app)
        .put(`/api/components/${comp1.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ batchTotalCost: "9999", deliveryCost: "0" });

      // Fetch product again — snapshot should be unchanged
      const fetched = await request(app)
        .get(`/api/products/${product.body.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(fetched.body.components[0].unitCostSnapshot).toBeCloseTo(snapshotCost);
    });
  });

  describe("Category breakdown", () => {
    it("groups component costs by category", async () => {
      const { app, token } = await setup();
      const { db } = createTestDb();
      // Use the existing app that already has auth

      // Create category
      const cat = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Намистини" });

      // Create categorized component
      const comp = await request(app)
        .post("/api/components")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Намистина червона",
          categoryId: cat.body.id,
          batchQuantity: 50,
          batchTotalCost: 100,
          deliveryCost: 0,
        }); // unitCost = 2

      const product = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Намисто",
          components: JSON.stringify([{ componentId: comp.body.id, quantity: 30 }]),
        });

      expect(product.body.categoryBreakdown).toHaveLength(1);
      expect(product.body.categoryBreakdown[0].categoryName).toBe("Намистини");
      expect(product.body.categoryBreakdown[0].totalCost).toBeCloseTo(60);
    });
  });

  describe("Share token", () => {
    it("generates a share token", async () => {
      const { app, token, comp1 } = await setup();

      const product = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Прикраса" });

      const share = await request(app)
        .post(`/api/products/${product.body.id}/share`)
        .set("Authorization", `Bearer ${token}`);

      expect(share.status).toBe(200);
      expect(share.body.shareToken).toBeDefined();
      expect(share.body.shareUrl).toContain(share.body.shareToken);
    });

    it("revokes share token", async () => {
      const { app, token } = await setup();

      const product = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Прикраса" });

      await request(app)
        .post(`/api/products/${product.body.id}/share`)
        .set("Authorization", `Bearer ${token}`);

      const revoke = await request(app)
        .delete(`/api/products/${product.body.id}/share`)
        .set("Authorization", `Bearer ${token}`);

      expect(revoke.status).toBe(204);

      const fetched = await request(app)
        .get(`/api/products/${product.body.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(fetched.body.shareToken).toBeNull();
    });
  });
});
