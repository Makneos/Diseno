import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';

function HomePage() {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Bienvenido a Farmacia</h1>
        <p>Su plataforma confiable de servicios farmacéuticos</p>
        
        <div className="buttons-container">
          <Link to="/login" className="auth-button login-button">
            Iniciar Sesión
          </Link>
          <Link to="/register" className="auth-button register-button">
            Registrarse
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
