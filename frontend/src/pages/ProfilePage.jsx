import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthGuard, { useAuth } from '../components/AuthGuard';
import '../styles/AuthPages.css';

function ProfilePageContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    setIsLoading(true);
    setLoadingMessage('Logging out...');
    
    setTimeout(() => {
      setLoadingMessage('Logged out successfully. Redirecting...');
      
      setTimeout(() => {
        logout(); // Esto redirigirá automáticamente
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
          
          <div className="info-item">
            <label>User ID:</label>
            <p>#{user.id}</p>
          </div>
        </div>
        
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

// Main component wrapped with AuthGuard
function ProfilePage() {
  return (
    <AuthGuard>
      <ProfilePageContent />
    </AuthGuard>
  );
}

export default ProfilePage;