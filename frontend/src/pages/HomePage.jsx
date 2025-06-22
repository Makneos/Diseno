import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HomePage.css';
import GoogleMapsComponent from './GoogleMapsComponent';
import SimpleMedicationSearch from '../components/SimpleMedicationSearch';

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
  
  // New states for medication search functionality
  const [selectedMedication, setSelectedMedication] = useState(null);

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

  // Handle medication selection from search component
  const handleMedicationSelect = (medicationName) => {
    setSelectedMedication(medicationName);
  };

  // Handle clearing medication search
  const handleClearMedicationSearch = () => {
    setSelectedMedication(null);
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
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-body d-flex flex-column align-items-center justify-content-center">
                      <i className="bi bi-graph-up-arrow mb-3" style={{ fontSize: '2rem', color: '#0d6efd' }}></i>
                      <h5 className="card-title">Price Comparison</h5>
                      <p className="card-text small text-muted">Compare medication prices across pharmacies</p>
                    </div>
                  </div>
                </div>
                
                <div className="col-12 col-md-6 col-lg-3">
                  <div className="card h-100 tool-card shadow-sm position-relative">
                    <div className="card-body d-flex flex-column align-items-center justify-content-center">
                      <i className="bi bi-calendar-check mb-3" style={{ fontSize: '2rem', color: '#198754' }}></i>
                      <h5 className="card-title">Medication Reminder</h5>
                      <p className="card-text small text-muted">Set reminders for your medications</p>
                      <span className="badge bg-warning position-absolute top-0 end-0 m-2">Coming Soon</span>
                    </div>
                  </div>
                </div>
                
                <div className="col-12 col-md-6 col-lg-3">
                  <div className="card h-100 tool-card shadow-sm position-relative">
                    <div className="card-body d-flex flex-column align-items-center justify-content-center">
                      <i className="bi bi-capsule mb-3" style={{ fontSize: '2rem', color: '#dc3545' }}></i>
                      <h5 className="card-title">Medication Info</h5>
                      <p className="card-text small text-muted">Detailed information about medications</p>
                      <span className="badge bg-warning position-absolute top-0 end-0 m-2">Coming Soon</span>
                    </div>
                  </div>
                </div>
                
                <div className="col-12 col-md-6 col-lg-3">
                  <div className="card h-100 tool-card shadow-sm position-relative">
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
              <h5 className="mb-3">
                <i className="bi bi-funnel me-2"></i>
                Filter Pharmacies
              </h5>

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
                  <i className="bi bi-check-circle me-2"></i>
                  Cruz Verde
                </button>
                <button
                  className={`btn ${selectedPharmacies.salcobrand ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => togglePharmacySelection('salcobrand')}
                >
                  <i className="bi bi-check-circle me-2"></i>
                  Salcobrand
                </button>
                <button
                  className={`btn ${selectedPharmacies.ahumada ? 'btn-danger' : 'btn-outline-secondary'}`}
                  onClick={() => togglePharmacySelection('ahumada')}
                >
                  <i className="bi bi-check-circle me-2"></i>
                  Ahumada
                </button>
              </div>

              {/* Medication Search Section */}
              <div className="mt-4 pt-3 border-top">
                <h6 className="mb-3">
                  <i className="bi bi-search me-2"></i>
                  Search Medication Availability
                </h6>
                <SimpleMedicationSearch
                  selectedMedication={selectedMedication}
                  onMedicationSelect={handleMedicationSelect}
                  onClearSearch={handleClearMedicationSearch}
                />
              </div>
            </div>
          </div>

          <div className="col-md-8">
            <div className="card shadow-sm">
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-geo-alt me-2"></i>
                  Nearby Pharmacies
                  {selectedMedication && (
                    <span className="badge bg-primary ms-2">
                      Showing {selectedMedication} availability
                    </span>
                  )}
                </h5>
                {selectedMedication && (
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={handleClearMedicationSearch}
                    title="Clear medication search"
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
              <GoogleMapsComponent
                distance={distance}
                selectedPharmacies={selectedPharmacies}
                selectedMedication={selectedMedication}
                onMedicationSelect={handleMedicationSelect}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-light py-5">
        <div className="container">
          <div className="row text-center">
            <div className="col-12 mb-4">
              <h2 className="fw-bold">Why Choose Farmafia?</h2>
              <p className="text-muted">Your complete pharmaceutical companion</p>
            </div>
          </div>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="text-center">
                <div className="feature-icon mb-3">
                  <i className="bi bi-geo-alt-fill" style={{ fontSize: '3rem', color: '#0d6efd' }}></i>
                </div>
                <h4>Real-time Availability</h4>
                <p className="text-muted">Check medication stock across nearby pharmacies in real-time</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-center">
                <div className="feature-icon mb-3">
                  <i className="bi bi-graph-up" style={{ fontSize: '3rem', color: '#28a745' }}></i>
                </div>
                <h4>Price Comparison</h4>
                <p className="text-muted">Compare prices and find the best deals on your medications</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-center">
                <div className="feature-icon mb-3">
                  <i className="bi bi-heart-pulse" style={{ fontSize: '3rem', color: '#dc3545' }}></i>
                </div>
                <h4>Health Management</h4>
                <p className="text-muted">Track your treatments and medication schedules</p>
              </div>
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
          <div className="row">
            <div className="col-md-4">
              <h6>Quick Links</h6>
              <ul className="list-unstyled">
                <li><a href="/" className="text-light text-decoration-none">Home</a></li>
                <li><a href="/price-comparison" className="text-light text-decoration-none">Price Comparison</a></li>
                <li><a href="/my-meds" className="text-light text-decoration-none">My Medications</a></li>
              </ul>
            </div>
            <div className="col-md-4">
              <h6>Contact</h6>
              <p className="mb-1">📧 info@farmafia.cl</p>
              <p className="mb-1">📱 +56 2 1234 5678</p>
            </div>
            <div className="col-md-4">
              <h6>Follow Us</h6>
              <div className="d-flex justify-content-center gap-3">
                <a href="#" className="text-light"><i className="bi bi-facebook"></i></a>
                <a href="#" className="text-light"><i className="bi bi-twitter"></i></a>
                <a href="#" className="text-light"><i className="bi bi-instagram"></i></a>
              </div>
            </div>
          </div>
          <hr className="my-4" />
          <p className="mt-4 small">© 2025 Farmafia. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

export default HomePage;