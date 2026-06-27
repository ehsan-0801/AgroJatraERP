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

/** Merge super-admin-edited marketing copy over the built-in translations.
 *  Deep-merges and overwrites, then refreshes the UI. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyContentOverrides(data: { en?: any; bn?: any } | null | undefined) {
  if (!data) return;
  if (data.en) i18n.addResourceBundle('en', 'translation', data.en, true, true);
  if (data.bn) i18n.addResourceBundle('bn', 'translation', data.bn, true, true);
  i18n.changeLanguage(i18n.language); // force a re-render with the merged copy
}

export default i18n;
