import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'en' | 'pt';

interface LanguageStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      lang: 'en',
      setLang: (lang) => set({ lang }),
      toggle: () => set({ lang: get().lang === 'en' ? 'pt' : 'en' }),
    }),
    { name: 'strava-lang' }
  )
);
