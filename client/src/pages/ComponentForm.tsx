import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { componentsApi, categoriesApi, suppliersApi } from "../api/components";
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

  const { data: existing } = useQuery({
    queryKey: ["component", id],
    queryFn: () => componentsApi.get(Number(id)),
    enabled: isEdit,
  });

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });
  const { data: suppliers = [] } = useQuery({ queryKey: ["suppliers"], queryFn: suppliersApi.list });

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [batchQty, setBatchQty] = useState("");
  const [batchCost, setBatchCost] = useState("");
  const [deliveryCost, setDeliveryCost] = useState("20");
  const [showDelete, setShowDelete] = useState(false);

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

  const mutation = useMutation({
    mutationFn: (fd: FormData) =>
      isEdit ? componentsApi.update(Number(id), fd) : componentsApi.create(fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["components"] });
      navigate("/components");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => componentsApi.remove(Number(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["components"] });
      navigate("/components");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("name", name);
    fd.append("batchQuantity", batchQty);
    fd.append("batchTotalCost", batchCost);
    fd.append("deliveryCost", deliveryCost);
    if (categoryId !== null) fd.append("categoryId", String(categoryId));
    if (supplierId !== null) fd.append("supplierId", String(supplierId));
    if (photo) fd.append("photo", photo);
    mutation.mutate(fd);
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

  return (
    <AppShell>
      <PageHeader
        title={isEdit ? t("components.edit") : t("components.add")}
        backHref="/components"
        actions={
          isEdit ? (
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
          <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3">
            <p className="text-sm text-primary-700">{t("components.unitCost")}</p>
            <p className="text-2xl font-bold text-primary-800">
              {unitCostPreview} <span className="text-sm font-normal">{t("common.currency")}</span>
            </p>
            <p className="text-xs text-primary-600 mt-0.5">{t("components.unitCostHint")}</p>
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={mutation.isPending}
          className="mt-2"
        >
          {t("common.save")}
        </Button>

        {mutation.error && (
          <p className="text-sm text-red-600 text-center">
            {(mutation.error as any).response?.data?.error ?? t("common.error")}
          </p>
        )}
      </form>

      {/* Delete confirmation */}
      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title={t("components.deleteConfirm")}
      >
        <div className="flex gap-3 mt-2">
          <Button variant="secondary" fullWidth onClick={() => setShowDelete(false)}>
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
