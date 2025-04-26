import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AuthPages.css';

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const navigate = useNavigate();

  // Cargar datos del usuario de la sesión
  useEffect(() => {
    const loggedInUser = sessionStorage.getItem('user');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    } else {
      // Si no hay usuario en sesión, redirigir al login
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    setIsLoading(true);
    setLoadingMessage('Cerrando sesión...');
    
    // Simular un breve retraso antes de cerrar sesión
    setTimeout(() => {
      // Eliminar datos de sesión
      sessionStorage.removeItem('user');
      
      setLoadingMessage('Sesión cerrada correctamente. Redirigiendo...');
      
      // Redirigir al home después de cerrar sesión
      setTimeout(() => {
        navigate('/');
      }, 1500);
    }, 1000);
  };

  const handleReturnHome = (e) => {
    e.preventDefault();
    navigate('/');
  };

  // Si está cargando, mostrar pantalla de carga
  if (isLoading) {
    return (
      <div className="fullscreen-loader-container">
        <div className="loader"></div>
        <p className="loading-text">{loadingMessage}</p>
      </div>
    );
  }

  // Si no hay datos de usuario aún, mostrar pantalla de carga
  if (!user) {
    return (
      <div className="fullscreen-loader-container">
        <div className="loader"></div>
        <p className="loading-text">Cargando datos de usuario...</p>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card profile-card">
        <h2>Perfil de Usuario</h2>
        
        <div className="profile-avatar">
          <div className="avatar-circle">
            {user.nombre.charAt(0).toUpperCase()}
          </div>
        </div>
        
        <div className="profile-info">
          <div className="info-item">
            <label>Nombre:</label>
            <p>{user.nombre}</p>
          </div>
          
          <div className="info-item">
            <label>Email:</label>
            <p>{user.email}</p>
          </div>
        </div>
        
        <button 
          className="auth-submit-button logout-button"
          onClick={handleLogout}
        >
          Cerrar Sesión
        </button>
        
        <div className="auth-footer">
          <a href="/" onClick={handleReturnHome}>Volver a la página principal</a>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;