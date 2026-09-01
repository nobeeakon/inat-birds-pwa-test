import { storage } from "@/storage/storage";
import { LOCAL_STORAGE_KEY } from "@/constants";

export const LANGUAGES = ["en", "es"] as const;

export type Language = (typeof LANGUAGES)[number];

/** Applied until the user picks one, and when the stored value is unusable. */
export const FALLBACK_LANGUAGE: Language = "en";

/** Native names, deliberately untranslated: each option is read by its own speakers. */
export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  es: "Español",
};

export const isLanguage = (value: unknown): value is Language =>
  typeof value === "string" && (LANGUAGES as readonly string[]).includes(value);

/**
 * The language the user picked, or null when they have not picked one yet, which is
 * what makes the selector show up on first load.
 */
export const getStoredLanguage = (): Language | null => {
  const storedLanguage = storage.get<string>(LOCAL_STORAGE_KEY.language);
  return isLanguage(storedLanguage) ? storedLanguage : null;
};

export const setStoredLanguage = (language: Language): void => {
  storage.set(LOCAL_STORAGE_KEY.language, language);
};
