import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';

function HomePage() {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Welcome to Farmafia</h1>
        <p>Your Trusted Platform for Pharmaceutical Services</p>
        
        <div className="buttons-container">
          <Link to="/login" className="auth-button login-button">
            Log in
          </Link>
          <Link to="/register" className="auth-button register-button">
            Sign in
          </Link>
          <Link to="/GoogleMapsComponent" className="auth-button GoogleMapsComponent">
            GoogleMaps
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
