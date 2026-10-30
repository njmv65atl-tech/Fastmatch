import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";
import pt from "./locales/pt.json";

export const LANGUAGE_STORAGE_KEY = "@fastmatch_selected_language";

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const AVAILABLE_LANGUAGES: SupportedLanguage[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
];

export const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  pt: { translation: pt },
};

i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

/**
 * Loads the user's saved language preference from AsyncStorage.
 */
export const initLanguage = async (): Promise<string> => {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && resources[saved as keyof typeof resources]) {
      await i18n.changeLanguage(saved);
      return saved;
    }
  } catch (error) {
    console.log("[i18n] Failed to load saved language", error);
  }
  return "en";
};

/**
 * Changes active language and persists choice in AsyncStorage.
 */
export const setAppLanguage = async (code: string): Promise<void> => {
  try {
    if (resources[code as keyof typeof resources]) {
      await i18n.changeLanguage(code);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
      console.log(`[i18n] Language changed to: ${code}`);
    }
  } catch (error) {
    console.log("[i18n] Failed to persist language", error);
  }
};

export default i18n;
