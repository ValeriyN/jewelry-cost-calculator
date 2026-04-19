import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { componentsApi, categoriesApi, suppliersApi, componentProductsApi } from "../api/components";
import { useAuthStore } from "../store/authStore";
import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/layout/PageHeader";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Combobox from "../components/ui/Combobox";
import PhotoUpload from "../components/ui/PhotoUpload";
import Modal from "../components/ui/Modal";

export default function ComponentForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const { data: existing } = useQuery({
    queryKey: ["component", id],
    queryFn: () => componentsApi.get(Number(id)),
    enabled: isEdit,
  });

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });
  const { data: suppliers = [] } = useQuery({ queryKey: ["suppliers"], queryFn: suppliersApi.list });
  const { data: usedInProducts = [] } = useQuery({
    queryKey: ["component-products", id],
    queryFn: () => componentProductsApi.list(Number(id)),
    enabled: isEdit,
  });

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [batchQty, setBatchQty] = useState("");
  const [batchCost, setBatchCost] = useState("");
  const [deliveryCost, setDeliveryCost] = useState(() => String(user?.defaultDeliveryCost ?? 20));
  const [showDelete, setShowDelete] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setCategoryId(existing.categoryId);
      setSupplierId(existing.supplierId);
      setBatchQty(String(existing.batchQuantity));
      setBatchCost(String(existing.batchTotalCost));
      setDeliveryCost(String(existing.deliveryCost));
    }
  }, [existing]);

  const unitCostPreview =
    Number(batchQty) > 0
      ? ((Number(batchCost) + Number(deliveryCost)) / Number(batchQty)).toFixed(2)
      : null;

  const buildFormData = (includePhoto?: File | null) => {
    const fd = new FormData();
    fd.append("name", name);
    fd.append("batchQuantity", batchQty);
    fd.append("batchTotalCost", batchCost);
    fd.append("deliveryCost", deliveryCost);
    if (categoryId !== null) fd.append("categoryId", String(categoryId));
    if (supplierId !== null) fd.append("supplierId", String(supplierId));
    if (includePhoto) fd.append("photo", includePhoto);
    return fd;
  };

  const mutation = useMutation({
    mutationFn: (fd: FormData) =>
      isEdit ? componentsApi.update(Number(id), fd) : componentsApi.create(fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["components"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product"] });
      if (isEdit) {
        qc.invalidateQueries({ queryKey: ["component", id] });
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
      } else {
        navigate("/components");
      }
    },
  });

  // Auto-save text/numeric/select fields (debounced 800ms)
  useEffect(() => {
    if (!isEdit || !existing) return;

    const unchanged =
      name === existing.name &&
      categoryId === existing.categoryId &&
      supplierId === existing.supplierId &&
      Number(batchQty) === existing.batchQuantity &&
      Number(batchCost) === existing.batchTotalCost &&
      Number(deliveryCost) === existing.deliveryCost;

    if (unchanged) return;
    if (!name.trim() || Number(batchQty) <= 0 || isNaN(Number(batchCost))) return;

    const timer = setTimeout(() => {
      mutation.mutate(buildFormData());
    }, 800);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, categoryId, supplierId, batchQty, batchCost, deliveryCost]);

  // Auto-save photo immediately when selected
  useEffect(() => {
    if (!isEdit || !photo) return;
    mutation.mutate(buildFormData(photo));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(buildFormData(photo ?? undefined));
  };

  const handleCreateCategory = async (name: string) => {
    const cat = await categoriesApi.create(name);
    qc.invalidateQueries({ queryKey: ["categories"] });
    return cat;
  };

  const handleCreateSupplier = async (name: string) => {
    const sup = await suppliersApi.create(name);
    qc.invalidateQueries({ queryKey: ["suppliers"] });
    return sup;
  };

  const deleteMutation = useMutation({
    mutationFn: () => componentsApi.remove(Number(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["components"] });
      navigate("/components");
    },
    onError: () => {},
  });

  const saveIndicator = isEdit ? (
    mutation.isPending ? (
      <span className="text-xs text-surface-400">Збереження…</span>
    ) : justSaved ? (
      <span className="text-xs text-primary-400">✓ Збережено</span>
    ) : null
  ) : null;

  return (
    <AppShell>
      <PageHeader
        title={isEdit ? t("components.edit") : t("components.add")}
        backHref="/components"
        actions={
          isEdit ? (
            <div className="flex items-center gap-3">
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
          ) : undefined
        }
      />

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
        <PhotoUpload
          current={existing?.photoPath}
          onChange={setPhoto}
          label={t("components.photo")}
        />

        <Input
          label={t("components.name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Напр. Намистина прозора 8мм"
        />

        <div className="relative">
          <Combobox
            label={t("components.category")}
            options={categories}
            value={categoryId}
            onChange={setCategoryId}
            onCreateNew={handleCreateCategory}
            placeholder="Оберіть категорію"
          />
        </div>

        <div className="relative">
          <Combobox
            label={t("components.supplier")}
            options={suppliers}
            value={supplierId}
            onChange={setSupplierId}
            onCreateNew={handleCreateSupplier}
            placeholder="Оберіть постачальника"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t("components.batchQuantity")}
            type="number"
            min="0.01"
            step="any"
            value={batchQty}
            onChange={(e) => setBatchQty(e.target.value)}
            required
            placeholder="100"
          />
          <Input
            label={t("components.batchTotalCost")}
            type="number"
            min="0"
            step="any"
            value={batchCost}
            onChange={(e) => setBatchCost(e.target.value)}
            required
            placeholder="500"
          />
        </div>

        <Input
          label={t("components.deliveryCost")}
          type="number"
          min="0"
          step="any"
          value={deliveryCost}
          onChange={(e) => setDeliveryCost(e.target.value)}
          required
        />

        {/* Live unit cost preview */}
        {unitCostPreview && (
          <div className="bg-primary-600/10 border border-primary-500/20 rounded-xl px-4 py-3">
            <p className="text-sm text-primary-400">{t("components.unitCost")}</p>
            <p className="text-2xl font-bold text-primary-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]">
              {unitCostPreview} <span className="text-sm font-normal">{t("common.currency")}</span>
            </p>
            <p className="text-xs text-primary-400/70 mt-0.5">{t("components.unitCostHint")}</p>
          </div>
        )}

        {/* Stock availability */}
        {isEdit && existing && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-surface-200">{t("components.stockTitle")}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-800 border border-surface-600 rounded-xl px-4 py-3">
                <p className="text-xs text-surface-400">{t("components.usedQuantity")}</p>
                <p className="text-xl font-bold text-surface-100">{existing.usedQuantity}</p>
                <p className="text-xs text-surface-500">{t("components.pcs")}</p>
              </div>
              <div className={`border rounded-xl px-4 py-3 ${existing.availableQuantity < 0 ? "bg-red-500/10 border-red-500/30" : "bg-surface-800 border-surface-600"}`}>
                <p className="text-xs text-surface-400">{t("components.availableQuantity")}</p>
                <p className={`text-xl font-bold ${existing.availableQuantity < 0 ? "text-red-400" : "text-surface-100"}`}>{existing.availableQuantity}</p>
                <p className="text-xs text-surface-500">{t("components.pcs")}</p>
              </div>
            </div>
          </div>
        )}

        {/* Used in products */}
        {isEdit && usedInProducts.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-surface-200">Використовується в продуктах</p>
            <div className="bg-surface-800 rounded-2xl border border-surface-600 overflow-hidden">
              {usedInProducts.map((p, idx) => (
                <Link
                  key={p.id}
                  to={`/products/${p.id}`}
                  className={`flex items-center justify-between px-4 py-3 hover:bg-surface-700 transition-colors ${
                    idx < usedInProducts.length - 1 ? "border-b border-surface-700" : ""
                  }`}
                >
                  <span className="text-sm font-medium text-primary-400">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-surface-300">×{p.quantity}</span>
                    <span className="text-xs text-surface-400">
                      {new Date(p.createdAt.replace(" ", "T") + "Z").toLocaleDateString("uk-UA", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!isEdit && (
          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={mutation.isPending}
            className="mt-2"
          >
            {t("common.save")}
          </Button>
        )}

        {mutation.error && (
          <p className="text-sm text-red-400 text-center">
            {(mutation.error as any).response?.data?.error ?? t("common.error")}
          </p>
        )}
      </form>

      {/* Delete confirmation */}
      <Modal
        open={showDelete}
        onClose={() => { setShowDelete(false); deleteMutation.reset(); }}
        title={t("components.deleteConfirm")}
      >
        {deleteMutation.error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg mb-3">
            {(deleteMutation.error as any).response?.data?.error ?? t("common.error")}
          </p>
        )}
        <div className="flex gap-3 mt-2">
          <Button variant="secondary" fullWidth onClick={() => { setShowDelete(false); deleteMutation.reset(); }}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="danger"
            fullWidth
            loading={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            {t("common.delete")}
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}
