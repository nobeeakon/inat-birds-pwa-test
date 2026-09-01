import { createContext, useContext, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
} from "@mui/material";

import {
  LANGUAGES,
  LANGUAGE_LABELS,
  getStoredLanguage,
  setStoredLanguage,
  type Language,
} from "@/language";

const LanguageContext = createContext<{
  currentLanguage: Language | null;
  openLanguageSelector: () => void;
}>({
  currentLanguage: null,
  openLanguageSelector: () => {
    throw new Error("openLanguageSelector not implemented");
  },
});

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguageContext = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error(
      "useLanguageContext must be used within a LanguageContext.Provider"
    );
  }
  return context;
};

/**
 * Owns the language choice and the selector that sets it. The selector opens by itself
 * on first load, when nothing is stored yet, and afterwards only when asked to.
 */
const LanguageContextProvider = ({ children }: { children: ReactNode }) => {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<Language | null>(
    getStoredLanguage
  );
  const [isSelectorRequested, setIsSelectorRequested] = useState(false);

  const hasChosenLanguage = currentLanguage !== null;
  const isSelectorOpen = isSelectorRequested || !hasChosenLanguage;

  const onSelectLanguage = (language: Language) => {
    setStoredLanguage(language);
    setCurrentLanguage(language);
    setIsSelectorRequested(false);
    i18n.changeLanguage(language);
  };

  const value = {
    currentLanguage,
    openLanguageSelector: () => setIsSelectorRequested(true),
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
      <Dialog
        open={isSelectorOpen}
        // The first choice has to be made; later ones can be backed out of
        onClose={
          hasChosenLanguage ? () => setIsSelectorRequested(false) : undefined
        }
        aria-labelledby="language-selector-title"
      >
        <DialogTitle id="language-selector-title">
          {t("selectLanguage")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1, minWidth: 220 }}>
            {LANGUAGES.map((language) => (
              <Button
                key={language}
                onClick={() => onSelectLanguage(language)}
                variant={
                  language === currentLanguage ? "contained" : "outlined"
                }
                size="large"
                fullWidth
              >
                {LANGUAGE_LABELS[language]}
              </Button>
            ))}
          </Stack>
        </DialogContent>
      </Dialog>
    </LanguageContext.Provider>
  );
};

export default LanguageContextProvider;
