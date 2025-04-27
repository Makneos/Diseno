import React, { useState, useEffect } from 'react';
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
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = sessionStorage.getItem('user');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
  }, []);

  const handleNavigation = (e, path, message) => {
    e.preventDefault();
    setLoadingMessage(message);
    setIsLoading(true);

    setTimeout(() => {
      navigate(path);
      setIsLoading(false);
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
            {user ? (
              <>
                <li className="nav-item">
                  <a
                    className="nav-link"
                    href="/profile"
                    onClick={(e) => handleNavigation(e, '/profile', 'Loading profile...')}
                  >
                    <i className="bi bi-person-circle me-1"></i>
                    {user.nombre}
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
              </>
            ) : (
              <>
                <li className="nav-item">
                  <a
                    className="nav-link"
                    href="/register"
                    onClick={(e) => handleNavigation(e, '/register', 'Loading registration page...')}
                  >
                    Sign Up
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
              </>
            )}
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
        {user && (
          <>
            <div className="alert alert-success mt-3">
              Welcome, {user.nombre}!
            </div>
            
            {/* Tools Section */}
            <div className="tools-section container mt-4">
              <h3 className="mb-4">Pharmacy Tools</h3>
              <div className="row g-3">
                <div className="col-12 col-md-6 col-lg-3">
                  <div 
                    className="card h-100 tool-card shadow-sm"
                    onClick={(e) => handleNavigation(e, '/price-comparison', 'Loading price comparison tool...')}
                  >
                    <div className="card-body d-flex flex-column align-items-center justify-content-center">
                      <i className="bi bi-graph-up-arrow mb-3" style={{ fontSize: '2rem', color: '#0d6efd' }}></i>
                      <h5 className="card-title">Price Comparison</h5>
                      <p className="card-text small text-muted">Compare medication prices across pharmacies</p>
                    </div>
                  </div>
                </div>
                
                <div className="col-12 col-md-6 col-lg-3">
                  <div className="card h-100 tool-card shadow-sm">
                    <div className="card-body d-flex flex-column align-items-center justify-content-center">
                      <i className="bi bi-calendar-check mb-3" style={{ fontSize: '2rem', color: '#198754' }}></i>
                      <h5 className="card-title">Medication Reminder</h5>
                      <p className="card-text small text-muted">Set reminders for your medications</p>
                      <span className="badge bg-warning position-absolute top-0 end-0 m-2">Coming Soon</span>
                    </div>
                  </div>
                </div>
                
                <div className="col-12 col-md-6 col-lg-3">
                  <div className="card h-100 tool-card shadow-sm">
                    <div className="card-body d-flex flex-column align-items-center justify-content-center">
                      <i className="bi bi-capsule mb-3" style={{ fontSize: '2rem', color: '#dc3545' }}></i>
                      <h5 className="card-title">Medication Info</h5>
                      <p className="card-text small text-muted">Detailed information about medications</p>
                      <span className="badge bg-warning position-absolute top-0 end-0 m-2">Coming Soon</span>
                    </div>
                  </div>
                </div>
                
                <div className="col-12 col-md-6 col-lg-3">
                  <div className="card h-100 tool-card shadow-sm">
                    <div className="card-body d-flex flex-column align-items-center justify-content-center">
                      <i className="bi bi-chat-dots mb-3" style={{ fontSize: '2rem', color: '#6610f2' }}></i>
                      <h5 className="card-title">Pharmacy Chat</h5>
                      <p className="card-text small text-muted">Chat with pharmacy professionals</p>
                      <span className="badge bg-warning position-absolute top-0 end-0 m-2">Coming Soon</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
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