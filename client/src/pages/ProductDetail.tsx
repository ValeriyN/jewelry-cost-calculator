import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { productsApi } from "../api/products";
import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/layout/PageHeader";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import ProductPDF from "../lib/ProductPDF";
import { pdf } from "@react-pdf/renderer";

export default function ProductDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [showDelete, setShowDelete] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.get(Number(id)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => productsApi.remove(Number(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      navigate("/products");
    },
  });

  const handleShare = async () => {
    if (!product) return;
    setShareLoading(true);
    try {
      const data = await productsApi.share(product.id);
      if (navigator.share) {
        await navigator.share({ url: data.shareUrl, title: product.name });
      } else {
        await navigator.clipboard.writeText(data.shareUrl);
        alert(t("products.linkCopied"));
      }
    } finally {
      setShareLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!product) return;
    setPdfLoading(true);
    try {
      const blob = await pdf(<ProductPDF product={product} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${product.name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setPdfLoading(false);
    }
  };

  if (isLoading || !product) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={product.name}
        backHref="/products"
        actions={
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
        }
      />

      <div className="pb-6">
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

        {/* Cost summary */}
        <div className="px-4 py-4 grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs text-gray-500">{t("products.totalCost")}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {product.totalCost.toFixed(2)}
              <span className="text-sm font-normal text-gray-500 ml-1">{t("common.currency")}</span>
            </p>
          </div>
          <div className="bg-primary-50 rounded-2xl p-4">
            <p className="text-xs text-primary-600">{t("products.recommendedPrice")}</p>
            <p className="text-xl font-bold text-primary-700 mt-1">
              {product.recommendedPrice.toFixed(2)}
              <span className="text-sm font-normal ml-1">{t("common.currency")}</span>
            </p>
          </div>
        </div>

        {/* Category breakdown */}
        {product.categoryBreakdown.length > 0 && (
          <div className="mx-4 bg-white rounded-2xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              {t("products.categoryBreakdown")}
            </h2>
            <div className="space-y-2">
              {product.categoryBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {item.categoryName ?? "Без категорії"}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.totalCost.toFixed(2)} {t("common.currency")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Components list */}
        <div className="mx-4 mt-3 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <h2 className="text-sm font-semibold text-gray-700 px-4 py-3 border-b border-gray-100">
            {t("products.components")}
          </h2>
          {product.components.map((comp, idx) => (
            <div
              key={comp.id}
              className={`flex items-center justify-between px-4 py-3 ${
                idx < product.components.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{comp.componentName}</p>
                {comp.categoryName && (
                  <p className="text-xs text-gray-400">{comp.categoryName}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-700">
                  {comp.totalCost.toFixed(2)} {t("common.currency")}
                </p>
                <p className="text-xs text-gray-400">
                  {comp.quantity} {t("products.pieces")} × {comp.unitCostSnapshot.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            onClick={handleShare}
            loading={shareLoading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {t("products.shareProduct")}
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportPdf}
            loading={pdfLoading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t("products.exportPdf")}
          </Button>
        </div>
      </div>

      <Modal open={showDelete} onClose={() => setShowDelete(false)} title={t("products.deleteConfirm")}>
        <div className="flex gap-3 mt-2">
          <Button variant="secondary" fullWidth onClick={() => setShowDelete(false)}>
            {t("common.cancel")}
          </Button>
          <Button variant="danger" fullWidth loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
            {t("common.delete")}
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}
