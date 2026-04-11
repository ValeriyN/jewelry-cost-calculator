import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { productsApi } from "../api/products";
import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/layout/PageHeader";
import ProductCard from "../components/features/ProductCard";
import Button from "../components/ui/Button";

export default function Products() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: productsApi.list,
  });

  return (
    <AppShell>
      <PageHeader
        title={t("products.title")}
        actions={
          <Button size="sm" onClick={() => navigate("/products/new")}>
            + {t("products.add")}
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4H5z" />
          </svg>
          <p className="text-gray-500">{t("products.empty")}</p>
          <Button className="mt-4" onClick={() => navigate("/products/new")}>
            {t("products.add")}
          </Button>
        </div>
      ) : (
        <div className="px-4 py-4 space-y-3">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onClick={() => navigate(`/products/${p.id}`)}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
