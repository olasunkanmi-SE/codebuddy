import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import de from "./de.json";
import en from "./en.json";
import es from "./es.json";
import fr from "./fr.json";
import ja from "./ja.json";
import yo from "./yo.json";
import zhCN from "./zh-cn.json";

i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
    es: { translation: es },
    fr: { translation: fr },
    ja: { translation: ja },
    yo: { translation: yo },
    "zh-cn": { translation: zhCN },
  },
  lng: "en",
  fallbackLng: "en",
  lowerCaseLng: true,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
