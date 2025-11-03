import React, { createContext, useContext, useEffect, useState } from "react";
import i18n, { setStoredLanguage, getStoredLanguage } from "../i18n";

const LocaleCtx = createContext({ lang: "en", setLang: () => {} });

export function LocaleProvider({ children }) {
  const [lang, setLangState] = useState(i18n.language || "en");

  useEffect(() => {
    let on = true;
    getStoredLanguage().then((stored) => {
      if (!on) return;
      if (stored && stored !== lang) {
        i18n.changeLanguage(stored);
        setLangState(stored);
      }
    });
    return () => { on = false; };
  }, []);

  const setLang = async (next) => {
    if (!next || next === lang) return;
    await setStoredLanguage(next);
    await i18n.changeLanguage(next);
    setLangState(next);
  };

  return (
    <LocaleCtx.Provider value={{ lang, setLang }}>
      {children}
    </LocaleCtx.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleCtx);
}
