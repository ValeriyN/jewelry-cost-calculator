/**
 * Core business logic calculations — pure functions, easy to test and reuse in React Native.
 */

export function calcUnitCost(
  batchTotalCost: number,
  deliveryCost: number,
  batchQuantity: number
): number {
  if (batchQuantity <= 0) throw new Error("Кількість у партії має бути більше 0");
  return Math.round(((batchTotalCost + deliveryCost) / batchQuantity) * 100) / 100;
}

export interface ComponentLine {
  unitCostSnapshot: number;
  quantity: number;
  categoryId: number | null;
  categoryName: string | null;
}

export function calcProductTotal(components: ComponentLine[]): number {
  return components.reduce((sum, c) => sum + c.unitCostSnapshot * c.quantity, 0);
}

export function calcRecommendedPrice(totalCost: number, markupCoefficient: number): number {
  return Math.round(totalCost * markupCoefficient);
}

export interface CategoryBreakdownItem {
  categoryId: number | null;
  categoryName: string | null;
  totalCost: number;
}

export function calcCategoryBreakdown(components: ComponentLine[]): CategoryBreakdownItem[] {
  const map = new Map<string, CategoryBreakdownItem>();

  for (const c of components) {
    const key = String(c.categoryId ?? "null");
    const existing = map.get(key);
    const lineCost = c.unitCostSnapshot * c.quantity;

    if (existing) {
      existing.totalCost += lineCost;
    } else {
      map.set(key, {
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        totalCost: lineCost,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalCost - a.totalCost);
}
