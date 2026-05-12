import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import de from './locales/de.json'
import { LANGS } from './locales/languages'

const supportedCodes = LANGS.map((l) => l.code)
const detected = navigator.language.split('-')[0]
const lng = supportedCodes.includes(detected as (typeof supportedCodes)[number])
  ? detected
  : 'en'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
  },
  lng,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
