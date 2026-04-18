import { useTranslation } from "react-i18next";

interface Props {
  product: {
    id: number;
    name: string;
    photoPath: string | null;
    totalCost: number;
    recommendedPrice: number;
    componentCount: number;
    createdAt: string;
  };
  onClick: () => void;
}

export default function ProductCard({ product, onClick }: Props) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-surface-800 rounded-2xl border border-surface-600 shadow-lg overflow-hidden transition-all active:scale-95 hover:border-surface-500 hover:shadow-xl"
    >
      {/* Photo */}
      <div className="aspect-video w-full bg-surface-700">
        {product.photoPath ? (
          <img
            src={`/uploads/${product.photoPath}`}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="font-semibold text-surface-100 truncate">{product.name}</p>
        <p className="text-xs text-surface-400 mt-0.5">
          {product.componentCount} {t("products.components")} ·{" "}
          {new Date(product.createdAt.replace(" ", "T") + "Z").toLocaleDateString("uk-UA", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>

        <div className="flex justify-between items-end mt-3">
          <div>
            <p className="text-xs text-surface-400">{t("products.totalCost")}</p>
            <p className="text-sm font-semibold text-surface-200">
              {product.totalCost.toFixed(2)} {t("common.currency")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-surface-400">{t("products.recommendedPrice")}</p>
            <p className="text-lg font-bold text-primary-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]">
              {product.recommendedPrice.toFixed(2)} {t("common.currency")}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}
