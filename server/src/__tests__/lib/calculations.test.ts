import { describe, it, expect } from "vitest";
import {
  calcUnitCost,
  calcProductTotal,
  calcRecommendedPrice,
  calcCategoryBreakdown,
} from "../../lib/calculations";

describe("calcUnitCost", () => {
  it("calculates (batchCost + delivery) / qty", () => {
    expect(calcUnitCost(500, 20, 100)).toBeCloseTo(5.2);
  });

  it("works with zero delivery cost", () => {
    expect(calcUnitCost(300, 0, 30)).toBeCloseTo(10);
  });

  it("throws when quantity is zero", () => {
    expect(() => calcUnitCost(100, 20, 0)).toThrow();
  });

  it("throws when quantity is negative", () => {
    expect(() => calcUnitCost(100, 20, -5)).toThrow();
  });
});

describe("calcProductTotal", () => {
  it("sums all component lines", () => {
    const lines = [
      { unitCostSnapshot: 5, quantity: 10, categoryId: 1, categoryName: "Намистини" },
      { unitCostSnapshot: 20, quantity: 2, categoryId: 2, categoryName: "Замки" },
    ];
    expect(calcProductTotal(lines)).toBeCloseTo(90);
  });

  it("returns 0 for empty list", () => {
    expect(calcProductTotal([])).toBe(0);
  });
});

describe("calcRecommendedPrice", () => {
  it("multiplies by coefficient", () => {
    expect(calcRecommendedPrice(100, 1.8)).toBeCloseTo(180);
  });

  it("works with custom coefficient", () => {
    expect(calcRecommendedPrice(50, 2.5)).toBeCloseTo(125);
  });
});

describe("calcCategoryBreakdown", () => {
  it("groups by category and sorts by totalCost desc", () => {
    const lines = [
      { unitCostSnapshot: 5, quantity: 4, categoryId: 1, categoryName: "Намистини" },
      { unitCostSnapshot: 10, quantity: 3, categoryId: 2, categoryName: "Замки" },
      { unitCostSnapshot: 2, quantity: 2, categoryId: 1, categoryName: "Намистини" },
    ];
    const result = calcCategoryBreakdown(lines);
    expect(result).toHaveLength(2);
    // Намистини: 5*4 + 2*2 = 24, Замки: 10*3 = 30 → Замки first
    expect(result[0].categoryName).toBe("Замки");
    expect(result[0].totalCost).toBeCloseTo(30);
    expect(result[1].categoryName).toBe("Намистини");
    expect(result[1].totalCost).toBeCloseTo(24);
  });

  it("handles null category (uncategorized)", () => {
    const lines = [
      { unitCostSnapshot: 10, quantity: 1, categoryId: null, categoryName: null },
      { unitCostSnapshot: 5, quantity: 2, categoryId: null, categoryName: null },
    ];
    const result = calcCategoryBreakdown(lines);
    expect(result).toHaveLength(1);
    expect(result[0].categoryId).toBeNull();
    expect(result[0].totalCost).toBeCloseTo(20);
  });
});
