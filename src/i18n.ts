import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { FALLBACK_LANGUAGE, getStoredLanguage } from "./language";

// Import translation files
import en from "./locales/en.json";
import es from "./locales/es.json";

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: {
      en: {
        translation: en,
      },
      es: {
        translation: es,
      },
    },
    // Until the user picks a language the selector is shown over whatever this renders,
    // so the choice is theirs rather than a guess we then have to correct
    lng: getStoredLanguage() ?? FALLBACK_LANGUAGE,
    fallbackLng: FALLBACK_LANGUAGE, // fallback language if translation is missing
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
