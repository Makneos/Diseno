import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HomePage.css';
import GoogleMapsComponent from './GoogleMapsComponent';

function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [distance, setDistance] = useState(5); // km
  const [selectedPharmacies, setSelectedPharmacies] = useState({
    cruzverde: true,
    salcobrand: true,
    ahumada: true,
  });

  const navigate = useNavigate();

  const handleNavigation = (e, path, message) => {
    e.preventDefault();
    setLoadingMessage(message);
    setIsLoading(true);

    setTimeout(() => {
      navigate(path);
      setIsLoading(false); // Para reiniciar el estado de carga
    }, 1500);
  };

  const togglePharmacySelection = (pharmacy) => {
    setSelectedPharmacies({
      ...selectedPharmacies,
      [pharmacy]: !selectedPharmacies[pharmacy],
    });
  };

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
      <nav className="navbar navbar-expand-lg navbar-light bg-light px-4 shadow-sm sticky-top">
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
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav">
            <li className="nav-item">
              <a className="nav-link" href="/register" onClick={(e) => handleNavigation(e, '/register', 'Loading registration page...')}>
                Sign In
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/login" onClick={(e) => handleNavigation(e, '/login', 'Loading login page...')}>
                Login
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/GoogleMapsComponent" onClick={(e) => handleNavigation(e, '/GoogleMapsComponent', 'Finding nearby pharmacies...')}>
                Nearby
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/my-meds" onClick={(e) => handleNavigation(e, '/my-meds', 'Loading your medications...')}>
                My Meds
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <section
        className="d-flex flex-column align-items-center justify-content-center text-center py-5 px-3"
        style={{
          background: 'linear-gradient(to bottom, #64b6ac, #f8f9fa)',
          color: '#333',
          minHeight: '60vh',
        }}
      >
        <h1 className="display-4 fw-bold">Welcome to Farmafia</h1>
        <p className="lead mb-4">Your Trusted Platform for Pharmaceutical Services</p>
      </section>

      <section className="container my-5">
        <div className="row gy-4">
          <div className="col-md-4">
            <div className="card shadow-sm p-3">
              <h5 className="mb-3">Filter Pharmacies</h5>

              <label className="form-label">Distance (km):</label>
              <input
                type="range"
                className="form-range"
                min="1"
                max="20"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
              />
              <div className="text-muted mb-3">{distance} km</div>

              <div className="d-flex flex-column gap-2">
                <button
                  className={`btn ${selectedPharmacies.cruzverde ? 'btn-success' : 'btn-outline-secondary'}`}
                  onClick={() => togglePharmacySelection('cruzverde')}
                >
                  Cruz Verde
                </button>
                <button
                  className={`btn ${selectedPharmacies.salcobrand ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => togglePharmacySelection('salcobrand')}
                >
                  Salcobrand
                </button>
                <button
                  className={`btn ${selectedPharmacies.ahumada ? 'btn-danger' : 'btn-outline-secondary'}`}
                  onClick={() => togglePharmacySelection('ahumada')}
                >
                  Ahumada
                </button>
              </div>
            </div>
          </div>

          <div className="col-md-8">
            <div className="card shadow-sm">
              <GoogleMapsComponent
                distance={distance}
                selectedPharmacies={selectedPharmacies}
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-dark text-light text-center py-5 mt-auto">
        <div className="container">
          <h5 className="mb-3">About Farmafia</h5>
          <p className="mb-4">
            We connect you with nearby pharmacies and help you manage your medications efficiently and safely.
          </p>

          <p className="mt-4 small">© 2025 Farmafia. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

export default HomePage;