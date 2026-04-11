import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { productsApi } from "../api/products";
import axios from "axios";

export default function PublicProduct() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["public-product", token],
    queryFn: () =>
      axios.get(`/api/public/${token}`).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-xl font-semibold text-gray-700">Продукт не знайдено</h1>
        <p className="text-gray-500 text-sm mt-2">Посилання недійсне або було відкликано</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="max-w-lg mx-auto bg-white min-h-dvh shadow-sm">
        {/* Photo */}
        {product.photoPath && (
          <div className="aspect-video w-full bg-gray-100">
            <img
              src={`/uploads/${product.photoPath}`}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="px-5 py-5">
          {/* Name */}
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>

          {/* Recommended price — the main call to action */}
          <div className="mt-4 bg-primary-50 rounded-2xl px-5 py-4">
            <p className="text-sm text-primary-600 font-medium">{t("share.price")}</p>
            <p className="text-3xl font-bold text-primary-700 mt-1">
              {product.recommendedPrice.toFixed(2)}{" "}
              <span className="text-xl font-normal">грн</span>
            </p>
          </div>

          {/* Composition */}
          {product.components.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">{t("share.composition")}</h2>
              <div className="space-y-2">
                {product.components.map((comp: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-700">{comp.componentName}</span>
                    <span className="text-sm text-gray-500">
                      {comp.quantity} {t("common.pieces")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
