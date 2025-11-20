import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

export const LanguageSelector = () => {
  const { language, setLanguage } = useTranslation();

  return (
    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="form-select" style={{ width: 'auto', cursor: 'pointer' }}>
      <option value="en">🇺🇸 English</option>
      <option value="es">🇪🇸 Español</option>
    </select>
  );
};