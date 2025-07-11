import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/AuthPages.css';

// 🌐 API Configuration - Detecta automáticamente el entorno
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://wellaging-production-99c2.up.railway.app'  // 🚂 Railway URL
  : 'http://localhost:5000';                            // 💻 Local development

function LoginPage() {
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
      setErrorMessage('Please fill in all fields');
      return;
    }

    setLoadingMessage('Logging in...');
    setIsLoading(true);

    try {
      console.log('🔑 Attempting login for:', formData.email);
      console.log('🌐 API URL:', `${API_BASE_URL}/api/usuarios/login`);
      
      const response = await fetch(`${API_BASE_URL}/api/usuarios/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          contrasena: formData.password
        }),
      });

      const data = await response.json();
      console.log('📥 Login response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Error logging in');
      }

      console.log('✅ Login successful for user:', data.nombre);

      // ✅ CRÍTICO: Asegurar que el token se guarde correctamente
      if (!data.token) {
        throw new Error('No token received from server');
      }

      const userData = {
        id: data.id,
        nombre: data.nombre,
        email: data.email,
        token: data.token  // ← Este es el campo crítico
      };

      console.log('💾 Saving user data to sessionStorage:', userData);
      
      // Guardar en sessionStorage
      sessionStorage.setItem('user', JSON.stringify(userData));
      
      // ✅ Verificar que se guardó correctamente
      const savedData = sessionStorage.getItem('user');
      console.log('✅ Verification - Data saved in sessionStorage:', savedData ? 'YES' : 'NO');
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log('🔍 Parsed saved data has token:', !!parsedData.token);
      }

      setLoadingMessage('Login successful! Redirecting...');
      
      // ✅ Usar setTimeout para asegurar que el sessionStorage se actualice
      setTimeout(() => {
        console.log('🚀 Redirecting to home page...');
        // Usar replace: true para evitar problemas de historial
        navigate('/', { replace: true });
      }, 1000);

    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Mostrar mensaje más amigable si es error de red
      if (error.message.includes('Failed to fetch')) {
        setErrorMessage('Cannot connect to server. Please check your internet connection.');
      } else {
        setErrorMessage(error.message);
      }
      
      setIsLoading(false);
    }
  };

  const handleReturnHome = (e) => {
    e.preventDefault();
    setLoadingMessage('Returning to homepage...');
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
        <h2>Login</h2>
        {errorMessage && (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="auth-submit-button">
            Login
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Register</Link></p>
          <a href="/" onClick={handleReturnHome}>Return to main page</a>
        </div>
      </div>
      
      {/* 🔧 Debug info en desarrollo */}
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

export default LoginPage;