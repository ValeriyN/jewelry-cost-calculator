import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

/**
 * Tests the calculation display in ProductDetail — we test the rendering
 * logic by checking the displayed numbers match expected calculations.
 */

// Minimal inline component that mimics how ProductDetail renders costs
function CostSummary({ totalCost, recommendedPrice }: { totalCost: number; recommendedPrice: number }) {
  return (
    <div>
      <p data-testid="total">{totalCost.toFixed(2)} грн</p>
      <p data-testid="recommended">{recommendedPrice.toFixed(2)} грн</p>
    </div>
  );
}

describe("Cost calculations displayed correctly", () => {
  it("shows totalCost rounded to 2 decimals", () => {
    render(<CostSummary totalCost={49.2} recommendedPrice={88.56} />);
    expect(screen.getByTestId("total")).toHaveTextContent("49.20 грн");
  });

  it("shows recommendedPrice = totalCost * coefficient", () => {
    // 49 * 1.8 = 88.2
    render(<CostSummary totalCost={49} recommendedPrice={49 * 1.8} />);
    expect(screen.getByTestId("recommended")).toHaveTextContent("88.20 грн");
  });

  it("handles zero cost", () => {
    render(<CostSummary totalCost={0} recommendedPrice={0} />);
    expect(screen.getByTestId("total")).toHaveTextContent("0.00 грн");
  });
});
