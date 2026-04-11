import api from "../lib/axios";
import type { Product, ProductDetail, ShareResponse, PublicProduct } from "@jewelry/shared";

export const productsApi = {
  list: () => api.get<(Product & { totalCost: number; recommendedPrice: number; componentCount: number })[]>("/products").then((r) => r.data),

  get: (id: number) => api.get<ProductDetail>(`/products/${id}`).then((r) => r.data),

  create: (formData: FormData) =>
    api.post<ProductDetail>("/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  update: (id: number, formData: FormData) =>
    api.put<ProductDetail>(`/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  remove: (id: number) => api.delete(`/products/${id}`),

  share: (id: number) =>
    api.post<ShareResponse>(`/products/${id}/share`).then((r) => r.data),

  revokeShare: (id: number) => api.delete(`/products/${id}/share`),

  getPublic: (shareToken: string) =>
    api.get<PublicProduct>(`/public/${shareToken}`).then((r) => r.data),
};
