import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/AuthPages.css';

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
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
    setLoadingMessage('Registering...');
    setIsLoading(true);
    
    const handleSubmit = (e) => {
      e.preventDefault();
      
      // Verificar si hay campos vacíos
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        alert('Por favor, completa todos los campos');
        return;
      }
      
      setLoadingMessage('Registering...');
      setIsLoading(true);
      
      // Simulación de llamada a API o servicio de registro
      setTimeout(() => {
        // Aquí iría la lógica para procesar el registro
        console.log('Datos de registro:', formData);
        setIsLoading(false);
        // Después aquí podrías manejar la redirección o mostrar errores
      }, 2000); // Simulando 2 segundos de espera
    };
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
        <h2>Crear Cuenta</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
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
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          
          <button type="submit" className="auth-submit-button">
            Sign in
          </button>
        </form>
        
        <div className="auth-footer">
          <p>¿Already have an account? <Link to="/login">Log in</Link></p>
          <a href="/" onClick={handleReturnHome}>Return to Homepage</a>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;