import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/AuthPages.css';

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoadingMessage('Logging...');
    setIsLoading(true);
    
    // Simulación de llamada a API o servicio de autenticación
    setTimeout(() => {
      // Aquí iría la lógica para procesar el inicio de sesión
      console.log('Datos de inicio de sesión:', formData);
      setIsLoading(false);
      // Después aquí podrías manejar la redirección o mostrar errores
    }, 2000); // Simulando 2 segundos de espera
  };

  const handleReturnHome = (e) => {
    e.preventDefault();
    setLoadingMessage('Returning to homepage...');
    setIsLoading(true);
    
    
    setTimeout(() => {
      navigate('/'); 
    }, 1500);
  };

  // Si está cargando, mostrar pantalla completa de carga
  if (isLoading) {
    return (
      <div className="fullscreen-loader-container">
        <div className="loader"></div>
        <p className="loading-text">{loadingMessage}</p>
      </div>
    );
  }

  // Si no está cargando, mostrar formulario normal
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Log in</h2>
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
            Log in
          </button>
        </form>
        
        <div className="auth-footer">
          <p>¿Don´t have an account? <Link to="/register">Sign in</Link></p>
          <a href="/" onClick={handleReturnHome}>Return to Homepage</a>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;