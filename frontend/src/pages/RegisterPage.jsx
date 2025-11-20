import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import '../styles/AuthPages.css';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://wellaging-production-99c2.up.railway.app'
  : 'http://localhost:5000';

function RegisterPage() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setErrorMessage(t('auth.fillAllFields'));
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage(t('auth.passwordsNotMatch'));
      return;
    }
    
    if (formData.password.length < 6) {
      setErrorMessage(t('auth.passwordMinLength'));
      return;
    }
    
    setLoadingMessage(t('auth.registering'));
    setIsLoading(true);
    
    try {
      console.log('📝 Attempting registration for:', formData.email);
      console.log('🌐 API URL:', `${API_BASE_URL}/api/usuarios/registro`);
      
      const response = await fetch(`${API_BASE_URL}/api/usuarios/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.name,
          email: formData.email,
          contrasena: formData.password
        }),
      });
      
      const data = await response.json();
      console.log('📥 Registration response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || t('auth.registrationError'));
      }
      
      console.log('✅ User registered successfully:', data.nombre);
      
      setTimeout(() => {
        setLoadingMessage(t('auth.registerSuccess'));
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      if (error.message.includes('Failed to fetch')) {
        setErrorMessage(t('auth.connectionError'));
      } else {
        setErrorMessage(error.message);
      }
      
      setIsLoading(false);
    }
  };

  const handleReturnHome = (e) => {
    e.preventDefault();
    setLoadingMessage(t('loading.refreshing'));
    setIsLoading(true);
    
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="fullscreen-loader-container">
        <div className="loader"></div>
        <p className="loading-text">{loadingMessage}</p>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{t('auth.register')}</h2>
        {errorMessage && (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">{t('auth.name')}</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t('auth.name')}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('auth.email')}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t('auth.password')}
              required
              minLength="6"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder={t('auth.confirmPassword')}
              required
              minLength="6"
            />
          </div>
          
          <button type="submit" className="auth-submit-button">
            {t('auth.register')}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>{t('auth.alreadyHaveAccount')} <Link to="/login">{t('nav.login')}</Link></p>
          <a href="/" onClick={handleReturnHome}>{t('auth.returnHome')}</a>
        </div>
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          position: 'fixed', 
          bottom: '10px', 
          right: '10px', 
          background: 'rgba(0,0,0,0.8)', 
          color: 'white', 
          padding: '10px', 
          borderRadius: '5px',
          fontSize: '12px'
        }}>
          API: {API_BASE_URL}
        </div>
      )}
    </div>
  );
}

export default RegisterPage;