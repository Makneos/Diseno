import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import AuthGuard, { useAuth } from '../components/AuthGuard';
import '../styles/AuthPages.css';

function ProfilePageContent() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    setIsLoading(true);
    setLoadingMessage(t('profile.loggingOut'));
    
    setTimeout(() => {
      setLoadingMessage(t('profile.loggedOut'));
      
      setTimeout(() => {
        logout();
      }, 1000);
    }, 1000);
  };

  const handleReturnHome = (e) => {
    e.preventDefault();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="fullscreen-loader-container">
        <div className="loader"></div>
        <p className="loading-text">{loadingMessage}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fullscreen-loader-container">
        <div className="loader"></div>
        <p className="loading-text">{t('loading.loadingProfile')}</p>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card profile-card">
        <h2>{t('profile.title')}</h2>
        
        <div className="profile-avatar">
          <div className="avatar-circle">
            {user.nombre.charAt(0).toUpperCase()}
          </div>
        </div>
        
        <div className="profile-info">
          <div className="info-item">
            <label>{t('auth.name')}:</label>
            <p>{user.nombre}</p>
          </div>
          
          <div className="info-item">
            <label>{t('auth.email')}:</label>
            <p>{user.email}</p>
          </div>
          
          <div className="info-item">
            <label>{t('profile.userId')}:</label>
            <p>#{user.id}</p>
          </div>
        </div>
        
        <button 
          className="auth-submit-button logout-button"
          onClick={handleLogout}
        >
          {t('profile.logout')}
        </button>
        
        <div className="auth-footer">
          <a href="/" onClick={handleReturnHome}>{t('auth.returnHome')}</a>
        </div>
      </div>
    </div>
  );
}

function ProfilePage() {
  return (
    <AuthGuard>
      <ProfilePageContent />
    </AuthGuard>
  );
}

export default ProfilePage;