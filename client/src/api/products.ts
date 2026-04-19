import api from "../lib/axios";
import type { Product, ProductDetail, ProductPhoto, ShareResponse, PublicProduct } from "@jewelry/shared";

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

  addPhotos: (id: number, files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("photos", f));
    return api.post<ProductPhoto[]>(`/products/${id}/photos`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },

  deletePhoto: (productId: number, photoId: number) =>
    api.delete(`/products/${productId}/photos/${photoId}`),

  remove: (id: number) => api.delete(`/products/${id}`),

  share: (id: number) =>
    api.post<ShareResponse>(`/products/${id}/share`).then((r) => r.data),

  revokeShare: (id: number) => api.delete(`/products/${id}/share`),

  getPublic: (shareToken: string) =>
    api.get<PublicProduct>(`/public/${shareToken}`).then((r) => r.data),
};
