// src/context/LanguageContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import enTranslations from '../locales/en.json';
import esTranslations from '../locales/es.json';

export const LanguageContext = createContext();

const translations = {
  en: enTranslations,
  es: esTranslations
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Obtener idioma guardado o usar español por defecto
    return localStorage.getItem('language') || 'es';
  });

  useEffect(() => {
    // Guardar idioma cuando cambie
    localStorage.setItem('language', language);
  }, [language]);

  const value = {
    language,
    setLanguage,
    translations: translations[language]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};