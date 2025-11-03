import * as Localization from "expo-localization";
import * as SecureStore from "expo-secure-store";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ICU from "i18next-icu";

import en from "./locales/en.json";
import sl from "./locales/sl.json";

const resources = { en: { translation: en }, sl: { translation: sl } };
const STORE_KEY = "traversium_lang";

const detectDeviceLang = () => {
  const code =
    (Array.isArray(Localization.locales) && Localization.locales[0]?.languageCode) ||
    (Localization.locale && Localization.locale.split("-")[0]) ||
    "en";
  return resources[code] ? code : "en";
};

export async function getStoredLanguage() {
  try {
    const v = await SecureStore.getItemAsync(STORE_KEY);
    if (v && resources[v]) return v;
  } catch {}
  return null;
}

export async function setStoredLanguage(lang) {
  try { await SecureStore.setItemAsync(STORE_KEY, lang); } catch {}
}

i18n
  .use(new ICU())
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v3",
    resources,
    lng: detectDeviceLang(),
    fallbackLng: "en",
    interpolation: { escapeValue: false }
  });

getStoredLanguage().then((lang) => {
  if (lang && lang !== i18n.language) i18n.changeLanguage(lang);
});

export default i18n;
