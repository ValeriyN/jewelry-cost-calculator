import type { Component } from "@jewelry/shared";
import { useTranslation } from "react-i18next";

interface Props {
  component: Component;
  onClick?: () => void;
  selectionMode?: boolean;
  selected?: boolean;
}

export default function ComponentCard({ component, onClick, selectionMode, selected }: Props) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative w-full text-left rounded-2xl overflow-hidden border
        transition-all active:scale-95
        ${
          selected
            ? "border-primary-500 ring-2 ring-primary-400 shadow-lg glow-gold bg-surface-800"
            : "border-surface-600 shadow-lg bg-surface-800 hover:border-surface-500 hover:bg-surface-700/60"
        }
      `}
    >
      {/* Photo */}
      <div className="aspect-square w-full bg-surface-700">
        {component.photoPath ? (
          <img
            src={`/uploads/${component.photoPath}`}
            alt={component.name}
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

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold text-surface-100 truncate">{component.name}</p>
        {component.categoryName && (
          <span className="inline-block mt-1 text-xs bg-surface-700 text-surface-300 px-2 py-0.5 rounded-full truncate max-w-full">
            {component.categoryName}
          </span>
        )}
        <p className="mt-2">
          <span className="inline-block bg-primary-600/20 text-primary-300 px-2 py-0.5 rounded-lg text-base font-bold">
            {component.unitCost.toFixed(2)} {t("common.currency")}
          </span>
        </p>
        <p className="text-xs text-surface-400 mt-0.5">{t("components.unitCost")}</p>
      </div>

      {/* Selection checkmark */}
      {selectionMode && selected && (
        <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center shadow glow-gold-sm">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
}
