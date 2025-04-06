import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';
import GoogleMapsComponent from './GoogleMapsComponent'; // Asegúrate que el path sea correcto

function HomePage() {
  return (
    <>
      {/* NAVBAR CON SOMBRA */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light px-4 shadow-sm" style={{ boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)' }}>
        <Link className="navbar-brand fw-bold" to="/">
          Farmafia
        </Link>
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
              <Link className="nav-link" to="/register">Sign In</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/login">Login</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/GoogleMapsComponent">Nearby</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/my-meds">My Meds</Link>
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
            <button className="btn btn-outline-light" type="button">Search</button>
          </div>

          <p className="mt-4 small">© 2025 Farmafia. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

export default HomePage;
