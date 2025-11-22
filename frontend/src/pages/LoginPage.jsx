import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import '../styles/AuthPages.css';
import { authAPI } from '../config/api';

function LoginPage() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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

    if (!formData.email || !formData.password) {
      setErrorMessage(t('auth.fillAllFields'));
      return;
    }

    setLoadingMessage(t('auth.loggingIn'));
    setIsLoading(true);

    try {
      console.log('🔑 Attempting login for:', formData.email);
      
      const data = await authAPI.login(formData);
      
      console.log('📥 Login response:', data);
      console.log('✅ Login successful for user:', data.nombre);

      if (!data.token) {
        throw new Error(t('auth.noTokenReceived'));
      }

      const userData = {
        id: data.id,
        nombre: data.nombre,
        email: data.email,
        token: data.token
      };

      console.log('💾 Saving user data to sessionStorage:', userData);
      
      sessionStorage.setItem('user', JSON.stringify(userData));
      
      const savedData = sessionStorage.getItem('user');
      console.log('✅ Verification - Data saved in sessionStorage:', savedData ? 'YES' : 'NO');
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log('🔍 Parsed saved data has token:', !!parsedData.token);
      }

      setLoadingMessage(t('auth.loginSuccess'));
      
      setTimeout(() => {
        console.log('🚀 Redirecting to home page...');
        navigate('/', { replace: true });
      }, 1000);

    } catch (error) {
      console.error('❌ Login error:', error);
      setErrorMessage(error.message);
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

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/auth/google";
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{t('nav.login')}</h2>
        {errorMessage && (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleSubmit}>
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
            />
          </div>

          <button type="submit" className="auth-submit-button">
            {t('auth.login')}
          </button>

          <div style={{ 
            textAlign: 'center',
            margin: '15px 0',
            color: '#888',
            fontWeight: 'bold'
          }}>
            or
          </div>

          <a
            className="auth-google-button"
            href="http://localhost:5000/auth/google"
          >
            <img
              src="/google-icon.png"
              alt="Google"
              style={{ width: '20px', height: '20px' }}
            />
            Login with your Google account
          </a>

          
        </form>

        <div className="auth-footer">
          <p>{t('auth.dontHaveAccount')} <Link to="/register">{t('nav.signup')}</Link></p>
          <a href="/" onClick={handleReturnHome}>{t('auth.returnHome')}</a>
        </div>
      </div>
      
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
        Environment: {process.env.NODE_ENV || 'development'}
        <br />
        Using: Centralized API Config
      </div>
    </div>
  );
}

export default LoginPage;