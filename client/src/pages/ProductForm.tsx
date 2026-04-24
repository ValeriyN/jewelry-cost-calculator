import { useState, useRef } from "react";
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

interface SelectedComponent {
  component: Component;
  quantity: number;
}

export default function ProductForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [step, setStep] = useState<"name" | "components">("name");
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<SelectedComponent[]>([]);

  // Picker modal state
  const [showPicker, setShowPicker] = useState(false);
  const [pickerComponent, setPickerComponent] = useState<Component | null>(null);
  const [pickerQtyInput, setPickerQtyInput] = useState("1");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);

  // Edit qty modal state
  const [editComponent, setEditComponent] = useState<Component | null>(null);
  const [editQtyInput, setEditQtyInput] = useState("1");

  const { data: components = [] } = useQuery({
    queryKey: ["components", { search, categoryFilter }],
    queryFn: () => componentsApi.list({ search: search || undefined, category: categoryFilter ?? undefined }),
    enabled: showPicker,
  });

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });

  const createMutation = useMutation({
    mutationFn: (fd: FormData) => productsApi.create(fd),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["components"] });
      navigate(`/products/${data.id}`);
    },
  });

  const totalCost = selected.reduce((sum, s) => sum + s.component.unitCost * s.quantity, 0);

  const handlePickerTap = (comp: Component) => {
    const existing = selected.find((s) => s.component.id === comp.id);
    setPickerComponent(comp);
    setPickerQtyInput(existing ? String(existing.quantity) : "1");
  };

  const handleConfirmAdd = () => {
    if (!pickerComponent) return;
    const qty = Number(pickerQtyInput);
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

  const handleEditTap = (comp: Component) => {
    setEditComponent(comp);
    const existing = selected.find((s) => s.component.id === comp.id);
    setEditQtyInput(existing ? String(existing.quantity) : "1");
  };

  const handleConfirmEdit = () => {
    if (!editComponent) return;
    const qty = Number(editQtyInput);
    if (qty <= 0) {
      setSelected((prev) => prev.filter((s) => s.component.id !== editComponent.id));
    } else {
      setSelected((prev) => prev.map((s) =>
        s.component.id === editComponent.id ? { ...s, quantity: qty } : s
      ));
    }
    setEditComponent(null);
  };

  const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    const imageCompression = (await import("browser-image-compression")).default;
    const compressed = await Promise.all(
      files.map((f) => imageCompression(f, { maxSizeMB: 0.3, maxWidthOrHeight: 1280, useWebWorker: true }))
    );
    const newEntries = compressed.map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
    setPhotos((prev) => [...prev, ...newEntries]);
  };

  const handleSave = () => {
    const fd = new FormData();
    fd.append("name", productName.trim());
    if (description.trim()) fd.append("description", description.trim());
    fd.append("components", JSON.stringify(
      selected.map((s) => ({ componentId: s.component.id, quantity: s.quantity }))
    ));
    photos.forEach((p) => fd.append("photos", p.file));
    createMutation.mutate(fd);
  };

  if (step === "name") {
    return (
      <AppShell>
        <PageHeader title={t("products.add")} backHref="/products" />
        <div className="px-4 py-6 space-y-6">
          {/* Multi-photo strip */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-surface-200">{t("products.photo")}</span>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {photos.map((p, idx) => (
                <div key={idx} className="relative flex-shrink-0 w-28 h-28 rounded-xl overflow-hidden bg-surface-700 group">
                  <img src={p.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
                  >
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="flex-shrink-0 w-28 h-28 rounded-xl border-2 border-dashed border-surface-600 flex flex-col items-center justify-center gap-1 text-surface-400 hover:border-primary-500 hover:text-primary-400 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs">{t("common.uploadPhoto")}</span>
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={handleAddPhotos} className="hidden" />
            </div>
          </div>
          <Input
            label={t("products.name")}
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Напр. Браслет «Весняний»"
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-surface-200">{t("products.description")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("products.descriptionPlaceholder")}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-surface-600 bg-surface-700 text-sm text-surface-100 placeholder:text-surface-400 focus:outline-none focus:border-primary-400 resize-none"
            />
          </div>
          <Button fullWidth size="lg" onClick={() => setStep("components")} disabled={!productName.trim()}>
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

      <div className="px-4 py-4 space-y-4 pb-8">
        {/* Running total */}
        {selected.length > 0 && (
          <div className="bg-primary-600/10 border border-primary-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-primary-400">
              {selected.length} скл. · {totalCost.toFixed(2)} {t("common.currency")}
            </span>
          </div>
        )}

        {/* Selected components list */}
        {selected.length > 0 ? (
          <div className="bg-surface-800 rounded-2xl border border-surface-600 overflow-hidden">
            {selected.map((s, idx) => (
              <button
                key={s.component.id}
                onClick={() => handleEditTap(s.component)}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-surface-700 transition-colors text-left ${
                  idx < selected.length - 1 ? "border-b border-surface-700" : ""
                }`}
              >
                <span className="text-sm text-surface-100">{s.component.name}</span>
                <span className="text-sm text-surface-400">×{s.quantity}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg className="w-12 h-12 text-surface-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-surface-400 text-sm">Немає складових</p>
            <p className="text-surface-500 text-xs mt-1">Натисніть «+» щоб додати</p>
          </div>
        )}

        {/* Add component button */}
        <button
          onClick={() => setShowPicker(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-surface-600 text-surface-400 hover:border-primary-500 hover:text-primary-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium">Додати складову</span>
        </button>
      </div>

      {/* Component picker modal */}
      <Modal
        open={showPicker && !pickerComponent}
        onClose={() => setShowPicker(false)}
        className="max-h-[85vh] flex flex-col !p-0"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div>
            <h2 className="text-lg font-semibold text-surface-100">{t("products.pickComponents")}</h2>
          </div>
          <button
            onClick={() => setShowPicker(false)}
            className="tap-target px-3 py-1.5 text-sm font-medium text-primary-400 bg-primary-600/15 rounded-lg"
          >
            {t("common.done")}
          </button>
        </div>
        <div className="px-6 pb-3 space-y-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("components.search")}
            className="w-full px-4 py-2.5 text-base sm:text-sm rounded-xl border border-surface-600 bg-surface-700 text-surface-100 placeholder:text-surface-400 focus:outline-none focus:border-primary-400"
          />
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setCategoryFilter(null)}
                className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-full border font-medium ${
                  categoryFilter === null ? "bg-primary-600 text-surface-950 border-primary-600" : "bg-surface-700 border-surface-600 text-surface-300"
                }`}
              >
                Всі
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id === categoryFilter ? null : cat.id)}
                  className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-full border font-medium ${
                    categoryFilter === cat.id ? "bg-primary-600 text-surface-950 border-primary-600" : "bg-surface-700 border-surface-600 text-surface-300"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="overflow-y-auto flex-1 px-4 pb-4 grid grid-cols-2 gap-3 content-start">
          {components.filter((c) => c.availableQuantity > 0).map((comp) => (
            <ComponentCard
              key={comp.id}
              component={comp}
              selectionMode
              selected={Boolean(selected.find((s) => s.component.id === comp.id))}
              onClick={() => handlePickerTap(comp)}
            />
          ))}
        </div>
      </Modal>

      {/* Quantity confirm modal */}
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
            value={pickerQtyInput}
            onChange={(e) => setPickerQtyInput(e.target.value)}
            autoFocus
          />
          {pickerComponent && Number(pickerQtyInput) >= pickerComponent.availableQuantity && Number(pickerQtyInput) > 0 && (
            <p className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
              {t("components.willBeOutOfStock")}
            </p>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setPickerComponent(null)}>
              {t("common.cancel")}
            </Button>
            <Button fullWidth onClick={handleConfirmAdd}>
              {t("products.addComponent")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit quantity modal */}
      <Modal
        open={Boolean(editComponent)}
        onClose={() => setEditComponent(null)}
        title={editComponent?.name}
      >
        <div className="space-y-4">
          <Input
            label={t("products.quantity")}
            type="number"
            min="0"
            step="any"
            value={editQtyInput}
            onChange={(e) => setEditQtyInput(e.target.value)}
            autoFocus
          />
          <p className="text-xs text-surface-400">Введіть 0, щоб видалити складову</p>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setEditComponent(null)}>
              {t("common.cancel")}
            </Button>
            <Button fullWidth onClick={handleConfirmEdit}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
