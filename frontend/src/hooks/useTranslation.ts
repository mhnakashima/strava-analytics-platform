import { useLanguageStore } from '../store/useLanguageStore';
import { translations } from '../i18n/translations';

/** Returns the full typed translation object for the current language. */
export function useT() {
  const lang = useLanguageStore((s) => s.lang);
  return translations[lang];
}
