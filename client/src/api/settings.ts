import api from "../lib/axios";
import type { Settings } from "@jewelry/shared";

export const settingsApi = {
  get: () => api.get<Settings>("/settings").then((r) => r.data),
  update: (markupCoefficient: number) =>
    api.put<Settings>("/settings", { markupCoefficient }).then((r) => r.data),
};
