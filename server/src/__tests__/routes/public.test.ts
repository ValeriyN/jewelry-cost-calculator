import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createTestDb } from "../testDb";
import { createTestApp } from "../testApp";

describe("Public share route", () => {
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

  it("returns 404 for invalid share token", async () => {
    const res = await request(app).get("/api/public/nonexistent-token-xyz");
    expect(res.status).toBe(404);
  });

  it("returns public product data (no prices) for valid token", async () => {
    // Create component
    const comp = await request(app)
      .post("/api/components")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Намистина", batchQuantity: 100, batchTotalCost: 500, deliveryCost: 20 });
    // unitCost = (500+20)/100 = 5.2

    // Create product
    const product = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Браслет",
        components: JSON.stringify([{ componentId: comp.body.id, quantity: 10 }]),
      });
    // totalCost = 52, recommendedPrice = 52 * 1.8 = 93.6

    // Generate share token
    const share = await request(app)
      .post(`/api/products/${product.body.id}/share`)
      .set("Authorization", `Bearer ${token}`);

    const shareToken = share.body.shareToken;

    // Access public endpoint
    const pub = await request(app).get(`/api/public/${shareToken}`);

    expect(pub.status).toBe(200);
    expect(pub.body.name).toBe("Браслет");
    expect(pub.body.recommendedPrice).toBeCloseTo(93.6);

    // Should NOT expose cost/price details
    expect(pub.body.totalCost).toBeUndefined();
    expect(pub.body.components[0].unitCostSnapshot).toBeUndefined();
    expect(pub.body.components[0].unitCost).toBeUndefined();

    // Should expose component name and quantity
    expect(pub.body.components[0].componentName).toBe("Намистина");
    expect(pub.body.components[0].quantity).toBe(10);
  });

  it("returns 404 after share token is revoked", async () => {
    const product = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Прикраса" });

    const share = await request(app)
      .post(`/api/products/${product.body.id}/share`)
      .set("Authorization", `Bearer ${token}`);

    const shareToken = share.body.shareToken;

    // Revoke
    await request(app)
      .delete(`/api/products/${product.body.id}/share`)
      .set("Authorization", `Bearer ${token}`);

    const pub = await request(app).get(`/api/public/${shareToken}`);
    expect(pub.status).toBe(404);
  });
});
