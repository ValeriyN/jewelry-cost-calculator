import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import { settingsApi } from "../api/settings";
import { categoriesApi, suppliersApi, componentsApi } from "../api/components";
import { authApi } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/layout/PageHeader";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

function EditableList({
  items,
  emptyText,
  onRename,
  onDelete,
  renameError,
  renameLoading,
  deleteLoading,
}: {
  items: { id: number; name: string }[];
  emptyText: string;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  renameError?: string | null;
  renameLoading?: boolean;
  deleteLoading?: boolean;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const { t } = useTranslation();

  return (
    <div className="bg-surface-800 rounded-2xl border border-surface-600 overflow-hidden">
      {items.length === 0 && (
        <p className="px-4 py-3 text-sm text-surface-400">{emptyText}</p>
      )}
      {items.map((item, i) => (
        <div
          key={item.id}
          className={`flex items-center gap-2 px-4 py-3 ${
            i < items.length - 1 ? "border-b border-surface-700" : ""
          }`}
        >
          {editingId === item.id ? (
            <>
              <input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { onRename(item.id, editingName); setEditingId(null); }
                  if (e.key === "Escape") setEditingId(null);
                }}
                className="flex-1 bg-surface-700 border border-primary-400 rounded-lg px-3 py-1.5 text-base sm:text-sm text-surface-100 focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => { onRename(item.id, editingName); setEditingId(null); }}
                disabled={renameLoading || !editingName.trim()}
                className="text-primary-400 disabled:opacity-40 p-1"
                aria-label="Зберегти"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="text-surface-400 p-1"
                aria-label="Скасувати"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {renameError && (
                <span className="text-xs text-red-400">{renameError}</span>
              )}
            </>
          ) : (
            <>
              <span className="flex-1 text-sm text-surface-100">{item.name}</span>
              <button
                onClick={() => { setEditingId(item.id); setEditingName(item.name); }}
                className="p-1.5 text-surface-400 hover:text-surface-200"
                aria-label="Перейменувати"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(item.id)}
                disabled={deleteLoading}
                className="p-1.5 text-surface-400 hover:text-red-400"
                aria-label="Видалити"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Settings() {
  const { t } = useTranslation();
  const { user, logout, updateUser } = useAuthStore();
  const qc = useQueryClient();
  const [coefficient, setCoefficient] = useState("");
  const [deliveryCost, setDeliveryCost] = useState("");
  const [saved, setSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [deletingSupplierId, setDeletingSupplierId] = useState<number | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [suppliersOpen, setSuppliersOpen] = useState(false);

  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: settingsApi.get });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });
  const { data: suppliers = [] } = useQuery({ queryKey: ["suppliers"], queryFn: suppliersApi.list });

  const renameCategoryMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => categoriesApi.update(id, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["components"] });
    },
    onError: () => {},
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["components"] });
      setDeletingCategoryId(null);
    },
    onError: () => {},
  });

  const renameSupplierMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => suppliersApi.update(id, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      qc.invalidateQueries({ queryKey: ["components"] });
    },
    onError: () => {},
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: (id: number) => suppliersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      qc.invalidateQueries({ queryKey: ["components"] });
      setDeletingSupplierId(null);
    },
    onError: () => {},
  });

  const changePasswordMutation = useMutation({
    mutationFn: () => authApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
      setPasswordSuccess(true);
      setChangePasswordOpen(false);
      setTimeout(() => setPasswordSuccess(false), 3000);
    },
    onError: (err: any) => {
      setPasswordError(err?.response?.data?.error ?? t("common.error"));
    },
  });

  const handleExportComponents = async () => {
    setExporting(true);
    try {
      const components = await componentsApi.list();
      const rows = components.map((c) => ({
        [t("components.name")]: c.name,
        [t("components.category")]: c.categoryName ?? "",
        [t("components.supplier")]: c.supplierName ?? "",
        [t("components.unitCost")]: c.unitCost,
        [t("components.usedQuantity")]: c.usedQuantity,
        [t("components.availableQuantity")]: c.availableQuantity,
        Date: new Date(c.createdAt.replace(" ", "T") + "Z").toLocaleDateString("uk-UA"),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, t("components.title"));
      XLSX.writeFile(wb, `components_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordError(t("auth.passwordMismatch"));
      return;
    }
    changePasswordMutation.mutate();
  };

  useEffect(() => {
    if (settings) {
      setCoefficient(String(settings.markupCoefficient));
      setDeliveryCost(String(settings.defaultDeliveryCost));
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (patch: { markupCoefficient?: number; defaultDeliveryCost?: number }) =>
      settingsApi.update(patch),
    onSuccess: (data) => {
      updateUser({ markupCoefficient: data.markupCoefficient, defaultDeliveryCost: data.defaultDeliveryCost });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  useEffect(() => {
    if (!settings) return;
    const value = Number(coefficient);
    if (!coefficient || isNaN(value) || value <= 0) return;
    if (value === settings.markupCoefficient) return;
    const timer = setTimeout(() => { updateMutation.mutate({ markupCoefficient: value }); }, 800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coefficient]);

  useEffect(() => {
    if (!settings) return;
    const value = Number(deliveryCost);
    if (deliveryCost === "" || isNaN(value) || value < 0) return;
    if (value === settings.defaultDeliveryCost) return;
    const timer = setTimeout(() => { updateMutation.mutate({ defaultDeliveryCost: value }); }, 800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryCost]);

  return (
    <AppShell>
      <PageHeader title={t("settings.title")} />

      <div className="px-4 py-6 space-y-6">
        {/* User info */}
        <div className="bg-surface-800 rounded-2xl border border-surface-600 px-4 py-4">
          <p className="text-xs text-surface-400 mb-1">Акаунт</p>
          <p className="text-sm font-medium text-surface-100">{user?.email}</p>
          <button
            onClick={() => { setChangePasswordOpen((o) => !o); setPasswordError(null); setPasswordSuccess(false); }}
            className="mt-2 text-xs text-primary-400 hover:text-primary-300"
          >
            {t("auth.changePassword")}
          </button>
          {passwordSuccess && (
            <p className="mt-2 text-xs text-primary-400">✓ {t("auth.passwordChanged")}</p>
          )}
          {changePasswordOpen && (
            <form onSubmit={handleChangePassword} className="mt-3 space-y-3">
              <Input
                label={t("auth.currentPassword")}
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                label={t("auth.newPassword")}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                label={t("auth.confirmPassword")}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {passwordError && (
                <p className="text-sm text-red-400">{passwordError}</p>
              )}
              <Button type="submit" fullWidth loading={changePasswordMutation.isPending}>
                {t("auth.changePassword")}
              </Button>
            </form>
          )}
        </div>

        {/* Markup coefficient */}
        <div className="space-y-3">
          <Input
            label={t("settings.markupCoefficient")}
            type="number"
            min="0.01"
            step="0.1"
            value={coefficient}
            onChange={(e) => setCoefficient(e.target.value)}
            hint={t("settings.markupHint")}
          />
{updateMutation.isPending ? (
            <p className="text-xs text-surface-400 text-right">Збереження…</p>
          ) : saved ? (
            <p className="text-xs text-primary-400 text-right">✓ Збережено</p>
          ) : null}
        </div>

        {/* Default delivery cost */}
        <div className="space-y-3">
          <Input
            label={t("settings.defaultDeliveryCost")}
            type="number"
            min="0"
            step="1"
            value={deliveryCost}
            onChange={(e) => setDeliveryCost(e.target.value)}
            hint={t("settings.defaultDeliveryCostHint")}
          />
        </div>

        {/* Export components */}
        <Button variant="secondary" fullWidth loading={exporting} onClick={handleExportComponents}>
          {t("settings.exportComponents")}
        </Button>

        {/* Categories */}
        <div className="space-y-2">
          <button
            onClick={() => setCategoriesOpen((o) => !o)}
            className="w-full flex items-center justify-between text-sm font-medium text-surface-200"
          >
            <span>Категорії складових</span>
            <span className="flex items-center gap-1.5 text-surface-400">
              <span className="text-xs">{categories.length}</span>
              <svg className={`w-4 h-4 transition-transform ${categoriesOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
          {categoriesOpen && (
            <EditableList
              items={categories}
              emptyText="Немає категорій"
              onRename={(id, name) => renameCategoryMutation.mutate({ id, name })}
              onDelete={(id) => { setDeletingCategoryId(id); deleteCategoryMutation.reset(); }}
              renameError={(renameCategoryMutation.error as any)?.response?.data?.error}
              renameLoading={renameCategoryMutation.isPending}
            />
          )}
        </div>

        {/* Suppliers */}
        <div className="space-y-2">
          <button
            onClick={() => setSuppliersOpen((o) => !o)}
            className="w-full flex items-center justify-between text-sm font-medium text-surface-200"
          >
            <span>Постачальники</span>
            <span className="flex items-center gap-1.5 text-surface-400">
              <span className="text-xs">{suppliers.length}</span>
              <svg className={`w-4 h-4 transition-transform ${suppliersOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
          {suppliersOpen && (
            <EditableList
              items={suppliers}
              emptyText="Немає постачальників"
              onRename={(id, name) => renameSupplierMutation.mutate({ id, name })}
              onDelete={(id) => { setDeletingSupplierId(id); deleteSupplierMutation.reset(); }}
              renameError={(renameSupplierMutation.error as any)?.response?.data?.error}
              renameLoading={renameSupplierMutation.isPending}
            />
          )}
        </div>

        {/* Delete category confirm */}
        <Modal
          open={deletingCategoryId !== null}
          onClose={() => { setDeletingCategoryId(null); deleteCategoryMutation.reset(); }}
          title="Видалити категорію?"
        >
          <p className="text-sm text-surface-300 mb-4">
            Складові цієї категорії залишаться без категорії.
          </p>
          {deleteCategoryMutation.error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg mb-3">
              {(deleteCategoryMutation.error as any).response?.data?.error ?? t("common.error")}
            </p>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => { setDeletingCategoryId(null); deleteCategoryMutation.reset(); }}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              fullWidth
              loading={deleteCategoryMutation.isPending}
              onClick={() => deletingCategoryId !== null && deleteCategoryMutation.mutate(deletingCategoryId)}
            >
              {t("common.delete")}
            </Button>
          </div>
        </Modal>

        {/* Delete supplier confirm */}
        <Modal
          open={deletingSupplierId !== null}
          onClose={() => { setDeletingSupplierId(null); deleteSupplierMutation.reset(); }}
          title="Видалити постачальника?"
        >
          <p className="text-sm text-surface-300 mb-4">
            Складові цього постачальника залишаться без постачальника.
          </p>
          {deleteSupplierMutation.error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg mb-3">
              {(deleteSupplierMutation.error as any).response?.data?.error ?? t("common.error")}
            </p>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => { setDeletingSupplierId(null); deleteSupplierMutation.reset(); }}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              fullWidth
              loading={deleteSupplierMutation.isPending}
              onClick={() => deletingSupplierId !== null && deleteSupplierMutation.mutate(deletingSupplierId)}
            >
              {t("common.delete")}
            </Button>
          </div>
        </Modal>

        {/* Logout */}
        <Button variant="danger" fullWidth onClick={logout}>
          {t("auth.logout")}
        </Button>
      </div>
    </AppShell>
  );
}
