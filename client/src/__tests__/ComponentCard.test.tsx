import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ComponentCard from "../components/features/ComponentCard";
import type { Component } from "@jewelry/shared";
import "../lib/i18n";

const mockComponent: Component = {
  id: 1,
  name: "Намистина синя",
  categoryId: 1,
  categoryName: "Намистини",
  supplierId: null,
  supplierName: null,
  photoPath: null,
  batchQuantity: 100,
  batchTotalCost: 200,
  deliveryCost: 20,
  unitCost: 2.2,
  usedQuantity: 30,
  availableQuantity: 70,
  createdAt: "2025-01-01T00:00:00",
};

describe("ComponentCard", () => {
  it("renders component name", () => {
    render(<ComponentCard component={mockComponent} />);
    expect(screen.getByText("Намистина синя")).toBeInTheDocument();
  });

  it("renders category chip", () => {
    render(<ComponentCard component={mockComponent} />);
    expect(screen.getByText("Намистини")).toBeInTheDocument();
  });

  it("renders unit cost", () => {
    render(<ComponentCard component={mockComponent} />);
    expect(screen.getByText(/2\.20/)).toBeInTheDocument();
  });

  it("shows checkmark when selected in selection mode", () => {
    const { container } = render(
      <ComponentCard component={mockComponent} selectionMode selected />
    );
    // Checkmark SVG is rendered when selected=true
    const checkmark = container.querySelector(".bg-primary-600");
    expect(checkmark).toBeInTheDocument();
  });

  it("does not show checkmark when not selected", () => {
    const { container } = render(
      <ComponentCard component={mockComponent} selectionMode selected={false} />
    );
    const checkmark = container.querySelector(".bg-primary-600");
    expect(checkmark).not.toBeInTheDocument();
  });

  it("renders placeholder when no photo", () => {
    render(<ComponentCard component={mockComponent} />);
    // SVG placeholder should be present (no img element)
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("calls onClick when tapped", async () => {
    const onClick = vi.fn();
    const { getByRole } = render(
      <ComponentCard component={mockComponent} onClick={onClick} />
    );
    getByRole("button").click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders available quantity badge", () => {
    render(<ComponentCard component={mockComponent} />);
    expect(screen.getByText(/70/)).toBeInTheDocument();
  });

  it("renders negative available quantity in red badge", () => {
    const overused = { ...mockComponent, usedQuantity: 120, availableQuantity: -20 };
    const { container } = render(<ComponentCard component={overused} />);
    const badge = container.querySelector(".bg-red-500\\/15");
    expect(badge).toBeInTheDocument();
    expect(badge?.textContent).toMatch(/-20/);
  });
});
