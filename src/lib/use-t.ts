import { useTranslation } from "react-i18next";

/**
 * Lightweight helper for inline bilingual strings.
 * Usage: const tt = useT(); tt("Hallo", "Hello")
 */
export function useT() {
  const { i18n } = useTranslation();
  const en = (i18n.language || "de").toLowerCase().startsWith("en");
  return (de: string, eng: string) => (en ? eng : de);
}

export function isEN(lang: string | undefined) {
  return (lang || "de").toLowerCase().startsWith("en");
}
