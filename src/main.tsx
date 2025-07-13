import { StrictMode, } from 'react'
import { createRoot } from 'react-dom/client'
import './index.scss'
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Fetch from 'i18next-fetch-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import Main from './Layout';
import { BrowserRouter, Route, Routes } from 'react-router';


i18n
  .use(Fetch)
  .use(LanguageDetector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    supportedLngs: ['en', 'de'],
    fallbackLng: "en",
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
    }
  });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <Main />
        } />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
