import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import uk from "../locales/uk";

i18n.use(initReactI18next).init({
  lng: "uk",
  fallbackLng: "uk",
  resources: {
    uk: { translation: uk },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
