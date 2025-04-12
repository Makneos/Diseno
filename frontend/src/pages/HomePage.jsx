import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HomePage.css';
import GoogleMapsComponent from './GoogleMapsComponent'; 

function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const navigate = useNavigate();

  const handleNavigation = (e, path, message) => {
    e.preventDefault();
    setLoadingMessage(message);
    setIsLoading(true);
    
    // Simulamos un breve tiempo de carga antes de navegar
    setTimeout(() => {
      navigate(path);
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

  return (
    <>
      {/* NAVBAR CON SOMBRA */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light px-4 shadow-sm" style={{ boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)' }}>
        <a 
          className="navbar-brand fw-bold" 
          href="/" 
          onClick={(e) => handleNavigation(e, '/', 'Refreshing home page...')}
        >
          Farmafia
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav">
            <li className="nav-item">
              <a 
                className="nav-link" 
                href="/register" 
                onClick={(e) => handleNavigation(e, '/register', 'Loading registration page...')}
              >
                Sign In
              </a>
            </li>
            <li className="nav-item">
              <a 
                className="nav-link" 
                href="/login" 
                onClick={(e) => handleNavigation(e, '/login', 'Loading login page...')}
              >
                Login
              </a>
            </li>
            <li className="nav-item">
              <a 
                className="nav-link" 
                href="/GoogleMapsComponent" 
                onClick={(e) => handleNavigation(e, '/GoogleMapsComponent', 'Finding nearby pharmacies...')}
              >
                Nearby
              </a>
            </li>
            <li className="nav-item">
              <a 
                className="nav-link" 
                href="/my-meds" 
                onClick={(e) => handleNavigation(e, '/my-meds', 'Loading your medications...')}
              >
                My Meds
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {/* HERO SECTION CON DEGRADADO */}
      <section
        className="d-flex flex-column align-items-center justify-content-center text-center py-5"
        style={{
          background: 'linear-gradient(to bottom, #007bff, #f8f9fa)',
          color: '#333',
          minHeight: '60vh'
        }}
      >
        <h1 className="display-4 fw-bold">Welcome to Farmafia</h1>
        <p className="lead mb-4">Your Trusted Platform for Pharmaceutical Services</p>

        <div className="d-flex gap-3 flex-wrap justify-content-center">
          {/* Puedes agregar botones adicionales aquí */}
        </div>
      </section>

      {/* MAPA INCLUIDO EN LA HOME */}
      <section className="container my-5">
        <GoogleMapsComponent />
      </section>

      {/* FOOTER */}
      <footer className="bg-dark text-light text-center py-5 mt-auto">
        <div className="container">
          <h5 className="mb-3">About Farmafia</h5>
          <p className="mb-4">We connect you with nearby pharmacies and help you manage your medications efficiently and safely.</p>

          <div className="input-group mx-auto" style={{ maxWidth: "400px" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search for medications..."
              aria-label="Search for medications"
            />
            <button 
              className="btn btn-outline-light" 
              type="button"
              onClick={() => {
                setLoadingMessage('Searching for medications...');
                setIsLoading(true);
                
        
                setTimeout(() => {
                  setIsLoading(false);
                  alert('Search functionality will be implemented soon!');
                }, 2000);
              }}
            >
              Search
            </button>
          </div>

          <p className="mt-4 small">© 2025 Farmafia. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

export default HomePage;