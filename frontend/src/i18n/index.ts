import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { bn, en } from './translations';

export const LANG_KEY = 'agrojatra-lang';
export type Lang = 'en' | 'bn';

const stored = (localStorage.getItem(LANG_KEY) as Lang) || 'en';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, bn: { translation: bn } },
  lng: stored,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnObjects: true,
});

function applyLang(lang: Lang) {
  document.documentElement.lang = lang;
}
applyLang(stored);

export function setLanguage(lang: Lang) {
  localStorage.setItem(LANG_KEY, lang);
  i18n.changeLanguage(lang);
  applyLang(lang);
}

export default i18n;
