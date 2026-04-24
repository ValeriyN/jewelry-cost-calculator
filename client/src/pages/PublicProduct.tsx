import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import axios from "axios";

export default function PublicProduct() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const [activePhoto, setActivePhoto] = useState(0);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["public-product", token],
    queryFn: () => axios.get(`/api/public/${token}`).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface-950">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-surface-950 px-6 text-center">
        <svg className="w-16 h-16 text-surface-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-xl font-semibold text-surface-200">Продукт не знайдено</h1>
        <p className="text-surface-400 text-sm mt-2">Посилання недійсне або було відкликано</p>
      </div>
    );
  }

  const photos: any[] = product.photos ?? [];

  return (
    <div className="min-h-dvh bg-surface-950">
      <div className="max-w-lg mx-auto bg-surface-900 min-h-dvh">

        {/* Main photo */}
        {photos.length > 0 && (
          <div>
            <div className="w-full aspect-square bg-surface-800 overflow-hidden">
              <img
                src={`/uploads/${photos[activePhoto].photoPath}`}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Thumbnail strip — only shown when multiple photos */}
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-none px-4 py-3">
                {photos.map((photo: any, idx: number) => (
                  <button
                    key={photo.id}
                    onClick={() => setActivePhoto(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      idx === activePhoto ? "border-primary-500" : "border-transparent"
                    }`}
                  >
                    <img
                      src={`/uploads/${photo.photoPath}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="px-5 py-5 space-y-5">
          {/* Name */}
          <h1 className="text-2xl font-bold text-surface-100">{product.name}</h1>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-surface-300 leading-relaxed">{product.description}</p>
          )}

          {/* Recommended price */}
          <div className="bg-primary-600/10 border border-primary-500/20 rounded-2xl px-5 py-4">
            <p className="text-sm text-primary-400 font-medium">{t("share.price")}</p>
            <p className="text-3xl font-bold text-primary-400 mt-1 drop-shadow-[0_0_12px_rgba(167,139,250,0.5)]">
              {product.recommendedPrice.toFixed(2)}{" "}
              <span className="text-xl font-normal">грн</span>
            </p>
          </div>

          {/* Composition */}
          {product.components.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-surface-200 mb-3">{t("share.composition")}</h2>
              <div className="space-y-0">
                {product.components.map((comp: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center py-2.5 border-b border-surface-700">
                    <span className="text-sm text-surface-200">{comp.componentName}</span>
                    <span className="text-sm text-surface-400">{comp.quantity} {t("common.pieces")}</span>
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
