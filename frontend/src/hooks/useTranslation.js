// src/hooks/useTranslation.js
import { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  
  if (!context) {
    throw new Error('useTranslation must be used within LanguageProvider');
  }

  const { language, setLanguage, translations } = context;

  const t = (key) => {
    if (!key) return '';
    
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key; // Retorna la clave si no encuentra la traducción
      }
    }
    
    return value || key;
  };

  return { t, language, setLanguage };
};