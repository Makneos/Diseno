import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div style={{ 
      padding: '50px', 
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(to bottom, #f8f9fa, #e9ecef)'
    }}>
      <div style={{ maxWidth: '500px' }}>
        <i className="bi bi-exclamation-triangle" style={{ fontSize: '5rem', color: '#dc3545' }}></i>
        <h1 style={{ fontSize: '3rem', marginTop: '20px' }}>404</h1>
        <h2 style={{ marginBottom: '20px' }}>{t('notFound.title')}</h2>
        <p style={{ color: '#6c757d', marginBottom: '30px' }}>
          {t('notFound.message')}
        </p>
        <button 
          onClick={() => navigate('/')}
          className="btn btn-primary btn-lg"
        >
          <i className="bi bi-house-door me-2"></i>
          {t('notFound.backHome')}
        </button>
      </div>
    </div>
  );
}

export default NotFoundPage;