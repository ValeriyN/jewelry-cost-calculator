import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { settingsApi } from "../api/settings";
import { categoriesApi } from "../api/components";
import { useAuthStore } from "../store/authStore";
import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/layout/PageHeader";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

export default function Settings() {
  const { t } = useTranslation();
  const { user, logout, updateUser } = useAuthStore();
  const qc = useQueryClient();
  const [coefficient, setCoefficient] = useState("");
  const [saved, setSaved] = useState(false);

  // Categories state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsApi.get,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      categoriesApi.update(id, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["components"] });
      setEditingId(null);
    },
    onError: () => {},
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["components"] });
      setDeletingId(null);
    },
    onError: () => {},
  });

  useEffect(() => {
    if (settings) {
      setCoefficient(String(settings.markupCoefficient));
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (value: number) => settingsApi.update(value),
    onSuccess: (data) => {
      updateUser({ markupCoefficient: data.markupCoefficient });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  // Auto-save coefficient (debounced 800ms)
  useEffect(() => {
    if (!settings) return;
    const value = Number(coefficient);
    if (!coefficient || isNaN(value) || value <= 0) return;
    if (value === settings.markupCoefficient) return;

    const timer = setTimeout(() => {
      updateMutation.mutate(value);
    }, 800);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coefficient]);

  return (
    <AppShell>
      <PageHeader title={t("settings.title")} />

      <div className="px-4 py-6 space-y-6">
        {/* User info */}
        <div className="bg-surface-800 rounded-2xl border border-surface-600 px-4 py-4">
          <p className="text-xs text-surface-400 mb-1">Акаунт</p>
          <p className="text-sm font-medium text-surface-100">{user?.email}</p>
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

          {/* Live preview */}
          {coefficient && !isNaN(Number(coefficient)) && (
            <div className="bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 text-sm text-surface-300">
              Приклад: собівартість 100 грн → ціна{" "}
              <span className="font-semibold text-primary-400">
                {(100 * Number(coefficient)).toFixed(2)} грн
              </span>
            </div>
          )}

          {updateMutation.isPending ? (
            <p className="text-xs text-surface-400 text-right">Збереження…</p>
          ) : saved ? (
            <p className="text-xs text-primary-400 text-right">✓ Збережено</p>
          ) : null}
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-surface-200">
            Категорії складових
          </p>
          <div className="bg-surface-800 rounded-2xl border border-surface-600 overflow-hidden">
            {categories.length === 0 && (
              <p className="px-4 py-3 text-sm text-surface-400">Немає категорій</p>
            )}
            {categories.map((cat, i) => (
              <div
                key={cat.id}
                className={`flex items-center gap-2 px-4 py-3 ${
                  i < categories.length - 1 ? "border-b border-surface-700" : ""
                }`}
              >
                {editingId === cat.id ? (
                  <>
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") renameMutation.mutate({ id: cat.id, name: editingName });
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="flex-1 bg-surface-700 border border-primary-400 rounded-lg px-3 py-1.5 text-sm text-surface-100 focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => renameMutation.mutate({ id: cat.id, name: editingName })}
                      disabled={renameMutation.isPending || !editingName.trim()}
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
                    {renameMutation.error && (
                      <span className="text-xs text-red-400">
                        {(renameMutation.error as any).response?.data?.error ?? t("common.error")}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-surface-100">{cat.name}</span>
                    <button
                      onClick={() => { setEditingId(cat.id); setEditingName(cat.name); renameMutation.reset(); }}
                      className="p-1.5 text-surface-400 hover:text-surface-200"
                      aria-label="Перейменувати"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => { setDeletingId(cat.id); deleteCategoryMutation.reset(); }}
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
        </div>

        {/* Delete category confirm */}
        <Modal
          open={deletingId !== null}
          onClose={() => { setDeletingId(null); deleteCategoryMutation.reset(); }}
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
            <Button variant="secondary" fullWidth onClick={() => { setDeletingId(null); deleteCategoryMutation.reset(); }}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              fullWidth
              loading={deleteCategoryMutation.isPending}
              onClick={() => deletingId !== null && deleteCategoryMutation.mutate(deletingId)}
            >
              {t("common.delete")}
            </Button>
          </div>
        </Modal>

        {/* Logout */}
        <Button variant="secondary" fullWidth onClick={logout}>
          {t("auth.logout")}
        </Button>
      </div>
    </AppShell>
  );
}
