import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { Component } from "@jewelry/shared";
import { componentsApi, categoriesApi } from "../api/components";
import { productsApi } from "../api/products";
import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/layout/PageHeader";
import ComponentCard from "../components/features/ComponentCard";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import PhotoUpload from "../components/ui/PhotoUpload";

type Step = "name" | "components";

interface SelectedComponent {
  component: Component;
  quantity: number;
}

export default function ProductForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [step, setStep] = useState<Step>("name");
  const [productName, setProductName] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [selected, setSelected] = useState<SelectedComponent[]>([]);
  const [pickerComponent, setPickerComponent] = useState<Component | null>(null);
  const [qtyInput, setQtyInput] = useState("1");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);

  const { data: components = [] } = useQuery({
    queryKey: ["components", { search, categoryFilter }],
    queryFn: () => componentsApi.list({ search: search || undefined, category: categoryFilter ?? undefined }),
  });

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });

  const createMutation = useMutation({
    mutationFn: (fd: FormData) => productsApi.create(fd),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      navigate(`/products/${data.id}`);
    },
  });

  const totalCost = selected.reduce(
    (sum, s) => sum + s.component.unitCost * s.quantity,
    0
  );

  const handleComponentTap = (comp: Component) => {
    const existing = selected.find((s) => s.component.id === comp.id);
    if (existing) {
      // If already selected, open modal to edit quantity
      setPickerComponent(comp);
      setQtyInput(String(existing.quantity));
    } else {
      setPickerComponent(comp);
      setQtyInput("1");
    }
  };

  const handleAddComponent = () => {
    if (!pickerComponent) return;
    const qty = Number(qtyInput);
    if (qty <= 0) return;

    setSelected((prev) => {
      const idx = prev.findIndex((s) => s.component.id === pickerComponent.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: qty };
        return updated;
      }
      return [...prev, { component: pickerComponent, quantity: qty }];
    });
    setPickerComponent(null);
  };

  const handleRemoveSelected = (compId: number) => {
    setSelected((prev) => prev.filter((s) => s.component.id !== compId));
  };

  const handleSave = () => {
    const fd = new FormData();
    fd.append("name", productName.trim());
    fd.append(
      "components",
      JSON.stringify(selected.map((s) => ({ componentId: s.component.id, quantity: s.quantity })))
    );
    if (photo) fd.append("photo", photo);
    createMutation.mutate(fd);
  };

  if (step === "name") {
    return (
      <AppShell>
        <PageHeader title={t("products.add")} backHref="/products" />
        <div className="px-4 py-6 space-y-6">
          <PhotoUpload label={t("products.photo")} onChange={setPhoto} />
          <Input
            label={t("products.name")}
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Напр. Браслет «Весняний»"
            autoFocus
          />
          <Button
            fullWidth
            size="lg"
            onClick={() => setStep("components")}
            disabled={!productName.trim()}
          >
            {t("common.next")} →
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={productName}
        backHref="#"
        actions={
          selected.length > 0 ? (
            <Button size="sm" onClick={handleSave} loading={createMutation.isPending}>
              {t("products.save")}
            </Button>
          ) : undefined
        }
      />

      {/* Running total bar */}
      {selected.length > 0 && (
        <div className="bg-primary-600/10 border-b border-primary-500/20 px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-primary-400">
            {selected.length} скл. · {totalCost.toFixed(2)} {t("common.currency")}
          </span>
          <button
            className="text-xs text-primary-400 underline"
            onClick={() => setStep("name")}
          >
            Переглянути список
          </button>
        </div>
      )}

      {/* Selected components chip strip */}
      {selected.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-none">
          {selected.map((s) => (
            <div
              key={s.component.id}
              className="flex-shrink-0 flex items-center gap-1 bg-primary-600/15 text-primary-300 text-xs rounded-full px-3 py-1"
            >
              <span>{s.component.name} ×{s.quantity}</span>
              <button
                onClick={() => handleRemoveSelected(s.component.id)}
                className="ml-1 text-primary-400 hover:text-primary-200"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="px-4 py-2 space-y-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("components.search")}
          className="w-full px-4 py-2.5 text-base sm:text-sm rounded-xl border border-surface-600 bg-surface-700 text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setCategoryFilter(null)}
              className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-full border font-medium ${
                categoryFilter === null ? "bg-primary-600 text-white border-primary-600" : "bg-surface-700 border-surface-600 text-surface-300"
              }`}
            >
              Всі
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id === categoryFilter ? null : cat.id)}
                className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-full border font-medium ${
                  categoryFilter === cat.id ? "bg-primary-600 text-white border-primary-600" : "bg-surface-700 border-surface-600 text-surface-300"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Component grid */}
      <div className="px-4 grid grid-cols-2 gap-3 pb-4">
        {components.map((comp) => {
          const sel = selected.find((s) => s.component.id === comp.id);
          return (
            <ComponentCard
              key={comp.id}
              component={comp}
              selectionMode
              selected={Boolean(sel)}
              onClick={() => handleComponentTap(comp)}
            />
          );
        })}
      </div>

      {/* Quantity modal */}
      <Modal
        open={Boolean(pickerComponent)}
        onClose={() => setPickerComponent(null)}
        title={pickerComponent?.name}
      >
        <div className="space-y-4">
          <Input
            label={t("products.quantity")}
            type="number"
            min="0.01"
            step="any"
            value={qtyInput}
            onChange={(e) => setQtyInput(e.target.value)}
            autoFocus
          />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setPickerComponent(null)}>
              {t("common.cancel")}
            </Button>
            <Button fullWidth onClick={handleAddComponent}>
              {t("products.addComponent")}
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
