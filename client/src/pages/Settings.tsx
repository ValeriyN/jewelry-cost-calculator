import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { settingsApi } from "../api/settings";
import { useAuthStore } from "../store/authStore";
import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/layout/PageHeader";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function Settings() {
  const { t } = useTranslation();
  const { user, logout, updateUser } = useAuthStore();
  const [coefficient, setCoefficient] = useState("");
  const [saved, setSaved] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsApi.get,
  });

  useEffect(() => {
    if (settings) {
      setCoefficient(String(settings.markupCoefficient));
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: () => settingsApi.update(Number(coefficient)),
    onSuccess: (data) => {
      updateUser({ markupCoefficient: data.markupCoefficient });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  return (
    <AppShell>
      <PageHeader title={t("settings.title")} />

      <div className="px-4 py-6 space-y-6">
        {/* User info */}
        <div className="bg-white rounded-2xl border border-gray-200 px-4 py-4">
          <p className="text-xs text-gray-500 mb-1">Акаунт</p>
          <p className="text-sm font-medium text-gray-900">{user?.email}</p>
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
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600">
              Приклад: собівартість 100 грн → ціна{" "}
              <span className="font-semibold text-gray-900">
                {(100 * Number(coefficient)).toFixed(2)} грн
              </span>
            </div>
          )}

          <Button
            fullWidth
            onClick={() => updateMutation.mutate()}
            loading={updateMutation.isPending}
            disabled={!coefficient || isNaN(Number(coefficient)) || Number(coefficient) <= 0}
          >
            {saved ? `✓ ${t("settings.saved")}` : t("settings.save")}
          </Button>
        </div>

        {/* Logout */}
        <Button variant="secondary" fullWidth onClick={logout}>
          {t("auth.logout")}
        </Button>
      </div>
    </AppShell>
  );
}
