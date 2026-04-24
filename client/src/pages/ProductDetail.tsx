import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { Component } from "@jewelry/shared";
import { componentsApi, categoriesApi } from "../api/components";
import { productsApi } from "../api/products";
import { useAuthStore } from "../store/authStore";
import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/layout/PageHeader";
import ComponentCard from "../components/features/ComponentCard";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import ProductPDF from "../lib/ProductPDF";
import { pdf } from "@react-pdf/renderer";

interface Line {
  componentId: number;
  componentName: string;
  categoryName: string | null;
  quantity: number;
  unitCostSnapshot: number;
}

export default function ProductDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.get(Number(id)),
  });

  const { data: allComponents = [] } = useQuery({
    queryKey: ["components", {}],
    queryFn: () => componentsApi.list(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
  });

  // Local editable state
  const [productName, setProductName] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [description, setDescription] = useState("");
  const [customPriceInput, setCustomPriceInput] = useState<string>("");
  const [justSaved, setJustSaved] = useState(false);

  // Editing existing component
  const [editingLine, setEditingLine] = useState<Line | null>(null);
  const [editQtyInput, setEditQtyInput] = useState("1");

  // Adding new component
  const [showPicker, setShowPicker] = useState(false);
  const [pickerComponent, setPickerComponent] = useState<Component | null>(null);
  const [pickerQtyInput, setPickerQtyInput] = useState("1");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);

  // Photo management
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  // Product delete
  const [showDelete, setShowDelete] = useState(false);

  // Sharing / PDF
  const [shareLoading, setShareLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (product) {
      setProductName(product.name);
      setDescription(product.description ?? "");
      setCustomPriceInput(product.customPrice != null ? Number(product.customPrice).toFixed(2) : "");
      setLines(
        product.components.map((c) => ({
          componentId: c.componentId!,
          componentName: c.componentName ?? "",
          categoryName: c.categoryName ?? null,
          quantity: c.quantity,
          unitCostSnapshot: c.unitCostSnapshot,
        }))
      );
    }
  }, [product]);

  const updateMutation = useMutation({
    mutationFn: (fd: FormData) => productsApi.update(Number(id), fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product", id] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["components"] });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => productsApi.remove(Number(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      navigate("/products");
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: number) => productsApi.deletePhoto(Number(id), photoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["product", id] }),
  });

  const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setPhotoUploading(true);
    try {
      const imageCompression = (await import("browser-image-compression")).default;
      const compressed = await Promise.all(
        files.map((f) => imageCompression(f, { maxSizeMB: 0.3, maxWidthOrHeight: 1280, useWebWorker: true }))
      );
      await productsApi.addPhotos(Number(id), compressed);
      qc.invalidateQueries({ queryKey: ["product", id] });
    } finally {
      setPhotoUploading(false);
    }
  };

  // Auto-save name (debounced)
  useEffect(() => {
    if (!product || productName === product.name) return;
    if (!productName.trim()) return;

    const timer = setTimeout(() => {
      const fd = new FormData();
      fd.append("name", productName.trim());
      updateMutation.mutate(fd);
    }, 800);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productName]);

  // Auto-save description (debounced)
  useEffect(() => {
    if (!product || description === (product.description ?? "")) return;
    const timer = setTimeout(() => {
      const fd = new FormData();
      fd.append("description", description);
      updateMutation.mutate(fd);
    }, 800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description]);

  // Auto-save custom price (debounced) — only when there is a valid number
  useEffect(() => {
    if (!product) return;
    if (customPriceInput === "") return; // empty = user is clearing; don't auto-reset
    const val = Number(customPriceInput);
    if (isNaN(val) || val < 0) return;
    if (val === (product.customPrice ?? null)) return;

    const timer = setTimeout(() => {
      const fd = new FormData();
      fd.append("customPrice", String(val));
      updateMutation.mutate(fd);
    }, 800);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customPriceInput]);

  const saveComponents = (newLines: Line[]) => {
    const fd = new FormData();
    fd.append("name", productName.trim() || product?.name || "");
    fd.append(
      "components",
      JSON.stringify(newLines.map((l) => ({ componentId: l.componentId, quantity: l.quantity })))
    );
    updateMutation.mutate(fd);
  };

  // Edit existing component: confirm qty change
  const handleEditConfirm = () => {
    if (!editingLine) return;
    const qty = Number(editQtyInput);
    if (qty <= 0) return;
    const updated = lines.map((l) =>
      l.componentId === editingLine.componentId ? { ...l, quantity: qty } : l
    );
    setLines(updated);
    saveComponents(updated);
    setEditingLine(null);
  };

  // Edit existing component: delete
  const handleEditDelete = () => {
    if (!editingLine) return;
    const updated = lines.filter((l) => l.componentId !== editingLine.componentId);
    setLines(updated);
    saveComponents(updated);
    setEditingLine(null);
  };

  // Picker: tap a component card
  const handlePickerTap = (comp: Component) => {
    setPickerComponent(comp);
    setPickerQtyInput("1");
  };

  // Picker: confirm add
  const handlePickerConfirm = () => {
    if (!pickerComponent) return;
    const qty = Number(pickerQtyInput);
    if (qty <= 0) return;

    const newLine: Line = {
      componentId: pickerComponent.id,
      componentName: pickerComponent.name,
      categoryName: pickerComponent.categoryName ?? null,
      quantity: qty,
      unitCostSnapshot: pickerComponent.unitCost,
    };

    const updated = (() => {
      const idx = lines.findIndex((l) => l.componentId === pickerComponent.id);
      if (idx >= 0) {
        const copy = [...lines];
        copy[idx] = newLine;
        return copy;
      }
      return [...lines, newLine];
    })();

    setLines(updated);
    saveComponents(updated);
    setPickerComponent(null);
    setShowPicker(false);
  };

  const filteredComponents = allComponents.filter((c) => {
    if (c.availableQuantity <= 0) return false;
    if (categoryFilter && c.categoryId !== categoryFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalCost = lines.reduce((sum, l) => sum + l.unitCostSnapshot * l.quantity, 0);
  const autoPrice = Math.round(totalCost * (user?.markupCoefficient ?? 1.8));
  const hasCustomPrice = customPriceInput !== "";
  const recommendedPrice = hasCustomPrice ? (Number(customPriceInput) || autoPrice) : autoPrice;

  const handleShare = async () => {
    if (!product) return;
    setShareLoading(true);
    try {
      const data = await productsApi.share(product.id);
      if (navigator.share) {
        await navigator.share({ url: data.shareUrl, title: product.name });
      } else {
        await navigator.clipboard.writeText(data.shareUrl);
        alert(t("products.linkCopied"));
      }
    } finally {
      setShareLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!product) return;
    setPdfLoading(true);
    try {
      const blob = await pdf(<ProductPDF product={product} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${product.name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setPdfLoading(false);
    }
  };

  if (isLoading || !product) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </AppShell>
    );
  }

  const saveIndicator = updateMutation.isPending ? (
    <span className="text-xs text-surface-400">Збереження…</span>
  ) : justSaved ? (
    <span className="text-xs text-primary-400">✓ Збережено</span>
  ) : null;

  return (
    <AppShell>
      <PageHeader
        title=""
        backHref="/products"
        actions={
          <div className="flex items-center gap-2">
            {saveIndicator}
            <button
              onClick={() => setShowDelete(true)}
              className="tap-target p-2 text-red-500"
              aria-label={t("common.delete")}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        }
      />

      <div className="pb-6">
        {/* Photo gallery */}
        {(product.photos.length > 0 || true) && (
          <div className="flex gap-2 overflow-x-auto px-4 pt-4 pb-2 scrollbar-none">
            {product.photos.map((photo) => (
              <div key={photo.id} className="relative flex-shrink-0 w-36 h-36 rounded-xl overflow-hidden bg-surface-700 group">
                <img
                  src={`/uploads/${photo.photoPath}`}
                  alt=""
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setLightboxPhoto(`/uploads/${photo.photoPath}`)}
                />
                <button
                  onClick={() => deletePhotoMutation.mutate(photo.id)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center"
                  aria-label={t("common.delete")}
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {/* Add photo tile */}
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={photoUploading}
              className="flex-shrink-0 w-36 h-36 rounded-xl border-2 border-dashed border-surface-600 flex flex-col items-center justify-center gap-1 text-surface-400 hover:border-primary-500 hover:text-primary-400 transition-colors disabled:opacity-50"
            >
              {photoUploading ? (
                <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs">{t("common.uploadPhoto")}</span>
                </>
              )}
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleAddPhotos}
              className="hidden"
            />
          </div>
        )}

        {/* Editable name */}
        <div className="px-4 pt-4 pb-2">
          <input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full text-xl font-bold text-surface-100 bg-transparent border-b border-transparent focus:border-primary-400 focus:outline-none pb-1 transition-colors"
            placeholder={t("products.name")}
          />
        </div>

        {/* Description */}
        <div className="px-4 pb-3">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("products.descriptionPlaceholder")}
            rows={3}
            className="w-full bg-transparent text-sm text-surface-300 placeholder:text-surface-600 focus:outline-none resize-none"
          />
        </div>

        {/* Created date */}
        <p className="px-4 pb-3 text-xs text-surface-500">
          Створено:{" "}
          {new Date(product.createdAt.replace(" ", "T") + "Z").toLocaleDateString("uk-UA", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        {/* Cost summary */}
        <div className="px-4 pb-4 grid grid-cols-2 gap-3">
          <div className="bg-surface-800 border border-surface-600 rounded-2xl p-4">
            <p className="text-xs text-surface-400">{t("products.totalCost")}</p>
            <p className="text-xl font-bold text-surface-100 mt-1">
              {totalCost.toFixed(2)}
              <span className="text-sm font-normal text-surface-400 ml-1">{t("common.currency")}</span>
            </p>
          </div>
          <div className="bg-primary-600/10 border border-primary-500/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-primary-400">{t("products.recommendedPrice")}</p>
              {hasCustomPrice && (
                <button
                  onClick={() => setCustomPriceInput("")}
                  className="text-xs text-surface-400 hover:text-surface-200 underline"
                >
                  {t("common.autoPrice")} ({autoPrice.toFixed(2)})
                </button>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <input
                type="number"
                min="0"
                step="any"
                value={customPriceInput}
                placeholder={autoPrice.toFixed(2)}
                onChange={(e) => setCustomPriceInput(e.target.value)}
                onBlur={() => { if (customPriceInput !== "" && !customPriceInput.includes(".")) { const v = Number(customPriceInput); if (!isNaN(v) && v >= 0) setCustomPriceInput(v.toFixed(2)); } }}
                onFocus={(e) => { if (!hasCustomPrice) { setCustomPriceInput(autoPrice.toFixed(2)); e.target.select(); } }}
                className="w-full bg-transparent text-xl font-bold text-primary-400 placeholder:text-primary-400/60 focus:outline-none drop-shadow-[0_0_8px_rgba(167,139,250,0.5)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-sm font-normal text-primary-400 shrink-0">{t("common.currency")}</span>
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        {product.categoryBreakdown.length > 0 && (
          <div className="mx-4 mb-3 bg-surface-800 rounded-2xl border border-surface-600 p-4">
            <h2 className="text-sm font-semibold text-surface-200 mb-3">
              {t("products.categoryBreakdown")}
            </h2>
            <div className="space-y-2">
              {product.categoryBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-surface-300">
                    {item.categoryName ?? "Без категорії"}
                  </span>
                  <span className="text-sm font-semibold text-surface-100">
                    {item.totalCost.toFixed(2)} {t("common.currency")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Components list */}
        <div className="mx-4 bg-surface-800 rounded-2xl border border-surface-600 overflow-hidden">
          <h2 className="text-sm font-semibold text-surface-200 px-4 py-3 border-b border-surface-700">
            {t("products.components")}
          </h2>
          {lines.map((line, idx) => (
            <button
              key={line.componentId}
              type="button"
              onClick={() => { setEditingLine(line); setEditQtyInput(String(line.quantity)); }}
              className={`w-full flex items-center justify-between px-4 py-3 text-left active:bg-surface-700 transition-colors ${
                idx < lines.length - 1 ? "border-b border-surface-700" : ""
              }`}
            >
              <div>
                <Link
                  to={`/components/${line.componentId}/edit`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm font-medium text-primary-400 hover:text-primary-300"
                >
                  {line.componentName}
                </Link>
                {line.categoryName && (
                  <p className="text-xs text-surface-400">{line.categoryName}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-surface-200">
                  {(line.unitCostSnapshot * line.quantity).toFixed(2)} {t("common.currency")}
                </p>
                <p className="text-xs text-surface-400">
                  {line.quantity} {t("products.pieces")} × {line.unitCostSnapshot.toFixed(2)}
                </p>
              </div>
            </button>
          ))}

          {/* Add component button */}
          <button
            type="button"
            onClick={() => { setShowPicker(true); setSearch(""); setCategoryFilter(null); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-primary-400 text-sm font-medium border-t border-surface-700 active:bg-surface-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t("products.addComponent")}
          </button>
        </div>

        {/* Actions */}
        <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={handleShare} loading={shareLoading}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {t("products.shareProduct")}
          </Button>
          <Button variant="secondary" onClick={handleExportPdf} loading={pdfLoading}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t("products.exportPdf")}
          </Button>
        </div>
      </div>

      {/* Edit component modal */}
      <Modal
        open={Boolean(editingLine)}
        onClose={() => setEditingLine(null)}
        title={editingLine?.componentName}
      >
        <div className="space-y-4">
          <Input
            label={t("products.quantity")}
            type="number"
            min="0.01"
            step="any"
            value={editQtyInput}
            onChange={(e) => setEditQtyInput(e.target.value)}
            autoFocus
          />
          {(() => {
            const comp = allComponents.find((c) => c.id === editingLine?.componentId);
            return comp && Number(editQtyInput) >= comp.availableQuantity && Number(editQtyInput) > 0 ? (
              <p className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
                {t("components.willBeOutOfStock")}
              </p>
            ) : null;
          })()}
          <div className="flex gap-3">
            <Button
              variant="danger"
              onClick={handleEditDelete}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
            <Button variant="secondary" fullWidth onClick={() => setEditingLine(null)}>
              {t("common.cancel")}
            </Button>
            <Button fullWidth onClick={handleEditConfirm}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      </Modal>

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
                  categoryFilter === null
                    ? "bg-primary-600 text-surface-950 border-primary-600"
                    : "bg-surface-700 border-surface-600 text-surface-300"
                }`}
              >
                Всі
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id === categoryFilter ? null : cat.id)}
                  className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-full border font-medium ${
                    categoryFilter === cat.id
                      ? "bg-primary-600 text-surface-950 border-primary-600"
                      : "bg-surface-700 border-surface-600 text-surface-300"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="overflow-y-auto flex-1 px-6 pb-6">
          <div className="grid grid-cols-2 gap-3">
            {filteredComponents.map((comp) => (
              <ComponentCard
                key={comp.id}
                component={comp}
                selectionMode
                selected={lines.some((l) => l.componentId === comp.id)}
                onClick={() => handlePickerTap(comp)}
              />
            ))}
          </div>
        </div>
      </Modal>

      {/* Picker qty modal */}
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
            <Button fullWidth onClick={handlePickerConfirm}>
              {t("products.addComponent")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxPhoto(null)}
        >
          <img
            src={lightboxPhoto}
            alt=""
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxPhoto(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Delete product modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title={t("products.deleteConfirm")}>
        <div className="flex gap-3 mt-2">
          <Button variant="secondary" fullWidth onClick={() => setShowDelete(false)}>
            {t("common.cancel")}
          </Button>
          <Button variant="danger" fullWidth loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
            {t("common.delete")}
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}
