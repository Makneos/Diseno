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
    if (!formData.email || !formData.password) {
      setErrorMessage('Por favor, completa todos los campos');
      return;
    }
    
    setLoadingMessage('Iniciando sesión...');
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/usuarios/login', {
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
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }
      
      // Login exitoso
      console.log('Usuario autenticado:', data);
      
      // Guardar información del usuario en localStorage o sessionStorage
      sessionStorage.setItem('user', JSON.stringify({
        id: data.id,
        nombre: data.nombre,
        email: data.email
      }));
      
      // Redirigir al home después de un breve retraso
      setTimeout(() => {
        setLoadingMessage('Inicio de sesión exitoso! Redirigiendo...');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }, 1000);
      
    } catch (error) {
      console.error('Error en el inicio de sesión:', error);
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
        <h2>Iniciar Sesión</h2>
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
            <label htmlFor="password">Contraseña</label>
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
            Iniciar Sesión
          </button>
        </form>
        
        <div className="auth-footer">
          <p>¿No tienes una cuenta? <Link to="/register">Registrarse</Link></p>
          <a href="/" onClick={handleReturnHome}>Volver a la página principal</a>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;