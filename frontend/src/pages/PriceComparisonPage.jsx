import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/PriceComparison.css';

function PriceComparisonPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [comparisonResults, setComparisonResults] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [user, setUser] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = sessionStorage.getItem('user');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
  }, []);

  useEffect(() => {
    // Handle search when searchTerm changes (with debounce)
    const debounceTimer = setTimeout(() => {
      if (searchTerm.length >= 3) {
        performSearch();
      } else if (searchTerm.length === 0) {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const performSearch = async () => {
    if (searchTerm.length < 3) return;
    
    setIsSearching(true);
    setErrorMessage('');
    
    try {
      // Simulated API call - Replace with actual backend call when implemented
      const response = await fetch(`http://localhost:5000/api/medicamentos/buscar?q=${encodeURIComponent(searchTerm)}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching medications:', error);
      
      // For demo purposes, generate sample data when API is not available
      const sampleResults = generateSampleResults(searchTerm);
      setSearchResults(sampleResults);
      
      if (!sampleResults.length) {
        setErrorMessage('No matching medications were found');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch();
  };

  const handleSelectMedication = async (medication) => {
    setSelectedMedication(medication);
    setComparisonResults([]);
    setErrorMessage('');
    setIsLoading(true);
    setLoadingMessage('Comparing prices...');
    
    // Forzar el uso de datos de muestra sin intentar la llamada API
    console.log("Generating sample data for:", medication);
    const sampleComparison = generateSampleComparison(medication);
    console.log("Sample data generated:", sampleComparison);
    setComparisonResults(sampleComparison);
    setIsLoading(false);
  };

  const handleReturnHome = (e) => {
    e.preventDefault();
    setLoadingMessage('Returning to home page...');
    setIsLoading(true);

    setTimeout(() => {
      navigate('/');
      setIsLoading(false);
    }, 1500);
  };

  // Helper function to generate sample search results
  const generateSampleResults = (term) => {
    const lowercaseTerm = term.toLowerCase();
    
    const sampleMedications = [
      { id: 1, nombre: 'Paracetamol 500mg', principio_activo: 'Paracetamol', es_generico: true },
      { id: 2, nombre: 'Ibuprofeno 400mg', principio_activo: 'Ibuprofeno', es_generico: true },
      { id: 3, nombre: 'Aspirina 100mg', principio_activo: 'Ácido acetilsalicílico', es_generico: false },
      { id: 4, nombre: 'Loratadina 10mg', principio_activo: 'Loratadina', es_generico: true },
      { id: 5, nombre: 'Omeprazol 20mg', principio_activo: 'Omeprazol', es_generico: true },
      { id: 6, nombre: 'Tapsin Día y Noche', principio_activo: 'Paracetamol/Fenilefrina', es_generico: false },
      { id: 7, nombre: 'Kitadol Forte 500mg', principio_activo: 'Paracetamol', es_generico: false },
      { id: 8, nombre: 'Nastizol Compuesto', principio_activo: 'Paracetamol/Clorfeniramina', es_generico: false },
      { id: 9, nombre: 'Migratap 400mg', principio_activo: 'Ibuprofeno', es_generico: false },
      { id: 10, nombre: 'Desenfriol D', principio_activo: 'Paracetamol/Fenilefrina/Clorfeniramina', es_generico: false },
    ];
    
    return sampleMedications.filter(med => 
      med.nombre.toLowerCase().includes(lowercaseTerm) || 
      med.principio_activo.toLowerCase().includes(lowercaseTerm)
    );
  };

  // Helper function to generate sample comparison data
  const generateSampleComparison = (medication) => {
    const basePrice = medication.id * 1000 + Math.floor(Math.random() * 500);
    
    return [
      {
        id: 1,
        farmacia: { id: 1, nombre: 'Ahumada', logo_url: 'https://www.farmaciasahumada.cl/logo.png' },
        precio: basePrice + Math.floor(Math.random() * 500),
        disponible: Math.random() > 0.2,
        url_producto: 'https://www.farmaciasahumada.cl'
      },
      {
        id: 2,
        farmacia: { id: 2, nombre: 'Cruz Verde', logo_url: 'https://www.cruzverde.cl/logo.png' },
        precio: basePrice - Math.floor(Math.random() * 300),
        disponible: Math.random() > 0.1,
        url_producto: 'https://www.cruzverde.cl'
      },
      {
        id: 3,
        farmacia: { id: 3, nombre: 'Salcobrand', logo_url: 'https://salcobrand.cl/logo.png' },
        precio: basePrice + Math.floor(Math.random() * 200),
        disponible: Math.random() > 0.15,
        url_producto: 'https://salcobrand.cl'
      }
    ];
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
    <div className="price-comparison-page">
      <nav className="navbar navbar-expand-lg navbar-light bg-light px-4 shadow-sm sticky-top">
        <a
          className="navbar-brand fw-bold"
          href="/"
          onClick={handleReturnHome}
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
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="/profile"
                  onClick={(e) => {
                    e.preventDefault();
                    setLoadingMessage('Loading profile...');
                    setIsLoading(true);
                    setTimeout(() => {
                      navigate('/profile');
                      setIsLoading(false);
                    }, 1500);
                  }}
                >
                  <i className="bi bi-person-circle me-1"></i>
                  {user.nombre}
                </a>
              </li>
            ) : (
              <li className="nav-item">
                <a
                  className="nav-link"
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    setLoadingMessage('Loading login page...');
                    setIsLoading(true);
                    setTimeout(() => {
                      navigate('/login');
                      setIsLoading(false);
                    }, 1500);
                  }}
                >
                  Login
                </a>
              </li>
            )}
            <li className="nav-item">
              <a
                className="nav-link"
                href="/"
                onClick={handleReturnHome}
              >
                <i className="bi bi-house-door me-1"></i>
                Home
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <div className="container py-5">
        <div className="row">
          <div className="col-12">
            <h1 className="text-center mb-4">Medication Price Comparator</h1>
            <p className="text-center text-muted mb-5">
            Save on Medications: Find the Best Prices in Chile
            </p>
          </div>
        </div>

        <div className="row justify-content-center mb-5">
          <div className="col-md-8">
            <div className="card shadow">
              <div className="card-body p-4">
                <form onSubmit={handleSearch}>
                  <div className="input-group mb-3">
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="Search by name or active ingredient..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      aria-label="Medicine name"
                    />
                    <button 
                      className="btn btn-primary" 
                      type="submit"
                      disabled={searchTerm.length < 3 || isSearching}
                    >
                      {isSearching ? (
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      ) : (
                        <i className="bi bi-search me-2"></i>
                      )}
                      Search
                    </button>
                  </div>
                  {searchTerm.length > 0 && searchTerm.length < 3 && (
                    <div className="form-text text-muted">Enter at least 3 characters to search</div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="alert alert-warning my-4" role="alert">
            {errorMessage}
          </div>
        )}

        {searchResults.length > 0 && !selectedMedication && (
          <div className="row">
            <div className="col-12">
              <div className="card shadow">
                <div className="card-header bg-light">
                  <h5 className="mb-0">Search results</h5>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Active Ingredient</th>
                          <th>Type</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.map((medication) => (
                          <tr key={medication.id}>
                            <td>{medication.nombre}</td>
                            <td>{medication.principio_activo}</td>
                            <td>
                              {medication.es_generico ? (
                                <span className="badge bg-success">Generic</span>
                              ) : (
                                <span className="badge bg-info">Brand</span>
                              )}
                            </td>
                            <td>
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleSelectMedication(medication)}
                              >
                                Compare prices
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedMedication && (
          <div className="row mt-4">
            <div className="col-12 mb-4">
              <button 
                className="btn btn-outline-secondary" 
                onClick={() => setSelectedMedication(null)}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Volver a resultados
              </button>
            </div>
            
            <div className="col-12">
              <div className="card shadow">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">Price comparison for {selectedMedication.nombre}</h5>
                </div>
                <div className="card-body">
                  <div className="medication-info mb-4">
                    <div className="row">
                      <div className="col-md-6">
                        <p><strong>Active Ingredient:</strong> {selectedMedication.principio_activo}</p>
                        <p>
                          <strong>Tipo:</strong> {' '}
                          {selectedMedication.es_generico ? 'Genérico' : 'Marca'}
                        </p>
                      </div>
                      <div className="col-md-6 text-md-end">
                        <p className="text-muted">Last Update: {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  {comparisonResults.length > 0 ? (
                    <div className="price-comparison-results">
                      <div className="row">
                        {comparisonResults.map((result) => {
                          // Find the cheapest price for highlighting
                          const cheapestPrice = Math.min(...comparisonResults.map(r => r.precio));
                          const isLowestPrice = result.precio === cheapestPrice;
                          
                          return (
                            <div className="col-md-4 mb-4" key={result.id}>
                              <div className={`card h-100 ${isLowestPrice ? 'border-success' : ''}`}>
                                <div className={`card-header ${isLowestPrice ? 'bg-success text-white' : 'bg-light'}`}>
                                  <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">{result.farmacia.nombre}</h5>
                                    {isLowestPrice && (
                                      <span className="badge bg-white text-success">Best price</span>
                                    )}
                                  </div>
                                </div>
                                <div className="card-body">
                                  <div className="text-center mb-3">
                                    <div className="pharmacy-logo-container mb-3">
                                      {/* Replace with actual logos when available */}
                                      {result.farmacia.nombre === 'Ahumada' && (
                                        <div className="pharmacy-logo bg-danger">FA</div>
                                      )}
                                      {result.farmacia.nombre === 'Cruz Verde' && (
                                        <div className="pharmacy-logo bg-success">CV</div>
                                      )}
                                      {result.farmacia.nombre === 'Salcobrand' && (
                                        <div className="pharmacy-logo bg-primary">SB</div>
                                      )}
                                    </div>
                                    
                                    <h2 className="price mb-0">
                                      ${result.precio.toLocaleString('es-CL')}
                                    </h2>
                                    
                                    <div className="availability mt-3">
                                      {result.disponible ? (
                                        <span className="text-success">
                                          <i className="bi bi-check-circle me-2"></i>
                                          Available
                                        </span>
                                      ) : (
                                        <span className="text-danger">
                                          <i className="bi bi-x-circle me-2"></i>
                                          Not Available
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="card-footer bg-white">
                                  <a 
                                    href={result.url_producto} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-outline-primary w-100"
                                  >
                                    View on site
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="saving-info mt-4 alert alert-info">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-info-circle-fill me-3 fs-4"></i>
                          <div>
                            <h5 className="mb-1">Did you know?</h5>
                            <p className="mb-0">
                              You could save up to ${Math.abs(Math.max(...comparisonResults.map(r => r.precio)) - 
                              Math.min(...comparisonResults.map(r => r.precio))).toLocaleString('es-CL')} en este medicamento comparando precios.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-3">Searching for the best prices...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tips section */}
        <div className="row mt-5">
          <div className="col-md-12">
            <div className="card shadow-sm">
              <div className="card-body">
                <h4 className="card-title">
                  <i className="bi bi-lightbulb me-2 text-warning"></i>
                  Tips to Save on Medications
                </h4>
                <div className="row mt-3">
                  <div className="col-md-4 mb-3">
                    <div className="d-flex">
                      <div className="flex-shrink-0">
                        <i className="bi bi-check-circle-fill text-success fs-4"></i>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h5>Compare always</h5>
                        <p className="text-muted">Medication prices can vary significantly between pharmacies.</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="d-flex">
                      <div className="flex-shrink-0">
                        <i className="bi bi-capsule text-primary fs-4"></i>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h5>Consider generics</h5>
                        <p className="text-muted">Generic medicines have the same active ingredient and are more affordable.</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="d-flex">
                      <div className="flex-shrink-0">
                        <i className="bi bi-calendar-check text-info fs-4"></i>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h5>Check for promotions</h5>
                        <p className="text-muted">Pharmacies offer special discounts on certain days of the week.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-dark text-light py-4 mt-5">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h5>Farmafia</h5>
              <p className="mb-0">Your trusted platform for pharmaceutical services.</p>
            </div>
            <div className="col-md-6 text-md-end">
              <p className="mb-0">© 2025 Farmafia. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PriceComparisonPage;