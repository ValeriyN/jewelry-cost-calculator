import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { componentsApi, categoriesApi } from "../api/components";
import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/layout/PageHeader";
import ComponentCard from "../components/features/ComponentCard";
import Button from "../components/ui/Button";

export default function Components() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);

  const { data: components = [], isLoading } = useQuery({
    queryKey: ["components", { search, categoryFilter }],
    queryFn: () =>
      componentsApi.list({
        search: search || undefined,
        category: categoryFilter ?? undefined,
      }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
  });

  return (
    <AppShell>
      <PageHeader
        title={t("components.title")}
        actions={
          <Button size="sm" onClick={() => navigate("/components/new")}>
            + {t("components.add")}
          </Button>
        }
      />

      <div className="px-4 py-3 space-y-3">
        {/* Search */}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("components.search")}
          className="w-full px-4 py-2.5 text-base sm:text-sm rounded-xl border border-surface-600 bg-surface-700 text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setCategoryFilter(null)}
              className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-full border font-medium transition-colors ${
                categoryFilter === null
                  ? "bg-primary-600 border-primary-600 text-white"
                  : "bg-surface-700 border-surface-600 text-surface-300"
              }`}
            >
              Всі
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id === categoryFilter ? null : cat.id)}
                className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-full border font-medium transition-colors ${
                  categoryFilter === cat.id
                    ? "bg-primary-600 border-primary-600 text-white"
                    : "bg-surface-700 border-surface-600 text-surface-300"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : components.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <svg className="w-16 h-16 text-surface-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <p className="text-surface-400">{t("components.empty")}</p>
          <Button className="mt-4" onClick={() => navigate("/components/new")}>
            {t("components.add")}
          </Button>
        </div>
      ) : (
        <div className="px-4 grid grid-cols-2 gap-3 pb-4">
          {components.map((comp) => (
            <ComponentCard
              key={comp.id}
              component={comp}
              onClick={() => navigate(`/components/${comp.id}/edit`)}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
