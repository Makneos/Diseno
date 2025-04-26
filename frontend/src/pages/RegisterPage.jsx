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
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // Clear error message when user starts typing again
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setErrorMessage('Por favor, completa todos los campos');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }
    
    if (formData.password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setLoadingMessage('Registrando usuario...');
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/usuarios/registro', {
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
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar usuario');
      }
      
      // Registro exitoso
      console.log('Usuario registrado:', data);
      
      // Redirigir al login después de un breve retraso
      setTimeout(() => {
        setLoadingMessage('Registro exitoso! Redirigiendo al login...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }, 1000);
      
    } catch (error) {
      console.error('Error en el registro:', error);
      setErrorMessage(error.message);
      setIsLoading(false);
    }
  };

  const handleReturnHome = (e) => {
    e.preventDefault();
    setLoadingMessage('Volviendo a la página principal...');
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
        {errorMessage && (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nombre</label>
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
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          
          <button type="submit" className="auth-submit-button">
            Registrarse
          </button>
        </form>
        
        <div className="auth-footer">
          <p>¿Ya tienes una cuenta? <Link to="/login">Iniciar sesión</Link></p>
          <a href="/" onClick={handleReturnHome}>Volver a la página principal</a>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;