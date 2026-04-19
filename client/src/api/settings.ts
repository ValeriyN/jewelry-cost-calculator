import api from "../lib/axios";
import type { Settings } from "@jewelry/shared";

export const settingsApi = {
  get: () => api.get<Settings>("/settings").then((r) => r.data),
  update: (patch: Partial<Settings>) =>
    api.put<Settings>("/settings", patch).then((r) => r.data),
};
