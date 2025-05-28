import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AuthPages.css';

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = sessionStorage.getItem('user');
    const token = sessionStorage.getItem('token');
    
    // Verificar que el usuario tenga tanto datos como token
    if (loggedInUser && token) {
      setUser(JSON.parse(loggedInUser));
      console.log('User and token found in session storage');
    } else {
      console.log('No user or token found, redirecting to login');
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    setIsLoading(true);
    setLoadingMessage('Logging out...');
    
    setTimeout(() => {
      // Limpiar TODOS los datos de sesión
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token'); // *** NUEVO: Limpiar token JWT ***
      
      // Limpiar cualquier otro dato de sesión que pueda existir
      sessionStorage.clear();
      
      console.log('All session data cleared (user data and JWT token)');
      
      setLoadingMessage('Logged out successfully. Redirecting...');
      
      setTimeout(() => {
        navigate('/');
      }, 1500);
    }, 1000);
  };

  const handleReturnHome = (e) => {
    e.preventDefault();
    navigate('/');
  };

  // Función para probar la ruta protegida (opcional - para testing)
  const testProtectedRoute = async () => {
    const token = sessionStorage.getItem('token');
    
    if (!token) {
      console.error('No token found');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/usuarios/perfil', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Protected route data:', data);
      } else {
        console.error('Protected route failed:', response.status);
        if (response.status === 401) {
          // Token inválido o expirado
          handleLogout();
        }
      }
    } catch (error) {
      console.error('Error calling protected route:', error);
    }
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
        <p className="loading-text">Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card profile-card">
        <h2>User Profile</h2>
        
        <div className="profile-avatar">
          <div className="avatar-circle">
            {user.nombre.charAt(0).toUpperCase()}
          </div>
        </div>
        
        <div className="profile-info">
          <div className="info-item">
            <label>Name:</label>
            <p>{user.nombre}</p>
          </div>
          
          <div className="info-item">
            <label>Email:</label>
            <p>{user.email}</p>
          </div>
        </div>

        {/* Botón para probar ruta protegida - OPCIONAL, para testing */}
        <button 
          className="auth-submit-button"
          onClick={testProtectedRoute}
          style={{ marginBottom: '10px', backgroundColor: '#28a745' }}
        >
          Test Protected Route
        </button>
        
        <button 
          className="auth-submit-button logout-button"
          onClick={handleLogout}
        >
          Log Out
        </button>
        
        <div className="auth-footer">
          <a href="/" onClick={handleReturnHome}>Return to main page</a>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;