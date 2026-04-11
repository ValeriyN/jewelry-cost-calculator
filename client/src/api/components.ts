import api from "../lib/axios";
import type { Component, Category, Supplier } from "@jewelry/shared";

export const componentsApi = {
  list: (params?: { category?: number; supplier?: number; search?: string }) =>
    api.get<Component[]>("/components", { params }).then((r) => r.data),

  get: (id: number) => api.get<Component>(`/components/${id}`).then((r) => r.data),

  create: (formData: FormData) =>
    api.post<Component>("/components", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  update: (id: number, formData: FormData) =>
    api.put<Component>(`/components/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  remove: (id: number) => api.delete(`/components/${id}`),
};

export const categoriesApi = {
  list: () => api.get<Category[]>("/categories").then((r) => r.data),
  create: (name: string) => api.post<Category>("/categories", { name }).then((r) => r.data),
};

export const suppliersApi = {
  list: () => api.get<Supplier[]>("/suppliers").then((r) => r.data),
  create: (name: string) => api.post<Supplier>("/suppliers", { name }).then((r) => r.data),
};
