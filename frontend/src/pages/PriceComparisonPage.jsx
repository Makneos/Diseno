import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/PriceComparison.css';

function PriceComparisonPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMedications, setSelectedMedications] = useState([]); // Changed to array for multiple selections
  const [comparisonResults, setComparisonResults] = useState({});  // Changed to object with medication IDs as keys
  const [errorMessage, setErrorMessage] = useState('');
  const [user, setUser] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isComparing, setIsComparing] = useState(false);

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

  // Modified to handle toggling medication selection
  const handleSelectMedication = (medication) => {
    // Check if medication is already selected
    const isAlreadySelected = selectedMedications.some(med => med.id === medication.id);
    
    if (isAlreadySelected) {
      // Remove medication from selection
      setSelectedMedications(selectedMedications.filter(med => med.id !== medication.id));
      // Remove from comparison results if exists
      const newComparisonResults = {...comparisonResults};
      delete newComparisonResults[medication.id];
      setComparisonResults(newComparisonResults);
    } else {
      // Add medication to selection
      setSelectedMedications([...selectedMedications, medication]);
    }
  };
  
  // Remove a medication from the comparison list
  const handleRemoveMedication = (medicationId) => {
    setSelectedMedications(selectedMedications.filter(med => med.id !== medicationId));
    
    // Remove from comparison results if exists
    const newComparisonResults = {...comparisonResults};
    delete newComparisonResults[medicationId];
    setComparisonResults(newComparisonResults);
  };

  // New function to compare all selected medications
  const handleCompareSelected = async () => {
    if (selectedMedications.length === 0) return;
    
    setIsComparing(true);
    setErrorMessage('');
    
    try {
      // Create a new empty results object
      let newResults = {};
      
      // Process each medication one by one
      for (const medication of selectedMedications) {
        setLoadingMessage(`Comparing prices for ${medication.nombre}...`);
        
        try {
          // Simulated API call for each medication
          const response = await fetch(`http://localhost:5000/api/medicamentos/precios/${medication.id}`);
          
          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          // Store results with medication id as key
          newResults[medication.id] = data;
        } catch (error) {
          console.error(`Error fetching price comparison for ${medication.nombre}:`, error);
          // For demo purposes, generate sample comparison data
          newResults[medication.id] = generateSampleComparison(medication);
        }
        
        // Small delay between each medication to show progress
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Update all results at once
      setComparisonResults(newResults);
    } catch (error) {
      console.error('Error during comparison:', error);
    } finally {
      setIsComparing(false);
      setLoadingMessage('');
    }
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

  // Calculate total prices for all selected medications by pharmacy
  const calculateTotalsByPharmacy = () => {
    if (Object.keys(comparisonResults).length === 0) return [];
    
    // Get all unique pharmacies
    const allPharmacies = new Set();
    Object.values(comparisonResults).forEach(results => {
      results.forEach(result => {
        allPharmacies.add(result.farmacia.id);
      });
    });
    
    // Calculate totals
    const pharmacyTotals = [];
    allPharmacies.forEach(pharmacyId => {
      let totalPrice = 0;
      let pharmacyName = '';
      let pharmacyUrl = '';
      let allAvailable = true;
      
      // For each medication, add its price at this pharmacy (if available)
      Object.entries(comparisonResults).forEach(([medicationId, pharmacyResults]) => {
        const pharmacyResult = pharmacyResults.find(result => result.farmacia.id === pharmacyId);
        if (pharmacyResult) {
          totalPrice += pharmacyResult.precio;
          pharmacyName = pharmacyResult.farmacia.nombre;
          pharmacyUrl = pharmacyResult.url_producto;
          if (!pharmacyResult.disponible) {
            allAvailable = false;
          }
        } else {
          // If a medication is not available at this pharmacy
          allAvailable = false;
        }
      });
      
      pharmacyTotals.push({
        id: pharmacyId,
        nombre: pharmacyName,
        precio_total: totalPrice,
        disponible: allAvailable,
        url: pharmacyUrl
      });
    });
    
    // Sort by total price
    return pharmacyTotals.sort((a, b) => a.precio_total - b.precio_total);
  };

  if (isLoading) {
    return (
      <div className="fullscreen-loader-container">
        <div className="loader"></div>
        <p className="loading-text">{loadingMessage}</p>
      </div>
    );
  }

  const pharmacyTotals = calculateTotalsByPharmacy();

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

        {/* Selected medications summary */}
        {selectedMedications.length > 0 && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Selected Medications ({selectedMedications.length})</h5>
                  <button 
                    className="btn btn-light btn-sm"
                    onClick={handleCompareSelected}
                    disabled={isComparing}
                  >
                    {isComparing ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    ) : (
                      <i className="bi bi-arrow-repeat me-2"></i>
                    )}
                    Compare Prices
                  </button>
                </div>
                <div className="card-body">
                  <div className="selected-medications">
                    <div className="row">
                      {selectedMedications.map((medication) => (
                        <div className="col-md-4 mb-3" key={medication.id}>
                          <div className="selected-medication p-3 border rounded">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className="mb-1">{medication.nombre}</h6>
                                <p className="mb-1 small text-muted">{medication.principio_activo}</p>
                                <span className={`badge ${medication.es_generico ? 'bg-success' : 'bg-info'} mt-1`}>
                                  {medication.es_generico ? 'Generic' : 'Brand'}
                                </span>
                              </div>
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleRemoveMedication(medication.id)}
                              >
                                <i className="bi bi-x"></i>
                              </button>
                            </div>
                            
                            {comparisonResults[medication.id] && (
                              <div className="mt-2 pt-2 border-top">
                                <p className="mb-1 small">Best price:</p>
                                <p className="mb-0 fw-bold">
                                  ${Math.min(...comparisonResults[medication.id].map(r => r.precio)).toLocaleString('es-CL')}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-warning my-4" role="alert">
            {errorMessage}
          </div>
        )}

        {/* Search results */}
        {searchResults.length > 0 && (
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
                        {searchResults.map((medication) => {
                          const isSelected = selectedMedications.some(med => med.id === medication.id);
                          
                          return (
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
                                  className={`btn btn-sm ${isSelected ? 'btn-success' : 'btn-outline-primary'}`}
                                  onClick={() => handleSelectMedication(medication)}
                                >
                                  {isSelected ? (
                                    <>
                                      <i className="bi bi-check me-1"></i>
                                      Selected
                                    </>
                                  ) : 'Select for comparison'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Price comparison results */}
        {Object.keys(comparisonResults).length > 0 && (
          <div className="row mt-4">
            {/* Summary of all pharmacies */}
            <div className="col-12 mb-4">
              <div className="card shadow">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">Total Comparison Summary</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    {pharmacyTotals.map((pharmacy, index) => {
                      const isLowestPrice = index === 0; // First pharmacy has lowest price
                      
                      return (
                        <div className="col-md-4 mb-4" key={pharmacy.id}>
                          <div className={`card h-100 ${isLowestPrice ? 'border-success' : ''}`}>
                            <div className={`card-header ${isLowestPrice ? 'bg-success text-white' : 'bg-light'}`}>
                              <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">{pharmacy.nombre}</h5>
                                {isLowestPrice && (
                                  <span className="badge bg-white text-success">Best total price</span>
                                )}
                              </div>
                            </div>
                            <div className="card-body">
                              <div className="text-center mb-3">
                                <div className="pharmacy-logo-container mb-3">
                                  {/* Replace with actual logos when available */}
                                  {pharmacy.nombre === 'Ahumada' && (
                                    <div className="pharmacy-logo bg-danger">FA</div>
                                  )}
                                  {pharmacy.nombre === 'Cruz Verde' && (
                                    <div className="pharmacy-logo bg-success">CV</div>
                                  )}
                                  {pharmacy.nombre === 'Salcobrand' && (
                                    <div className="pharmacy-logo bg-primary">SB</div>
                                  )}
                                </div>
                                
                                <h2 className="price mb-0">
                                  ${pharmacy.precio_total.toLocaleString('es-CL')}
                                </h2>
                                
                                <div className="availability mt-3">
                                  {pharmacy.disponible ? (
                                    <span className="text-success">
                                      <i className="bi bi-check-circle me-2"></i>
                                      All Available
                                    </span>
                                  ) : (
                                    <span className="text-warning">
                                      <i className="bi bi-exclamation-triangle me-2"></i>
                                      Some items may not be available
                                    </span>
                                  )}
                                </div>
                                
                                <p className="text-muted mt-2 small">
                                  For {selectedMedications.length} medication{selectedMedications.length > 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="card-footer bg-white">
                              <a 
                                href={pharmacy.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="btn btn-outline-primary w-100"
                              >
                                Visit website
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {pharmacyTotals.length > 0 && (
                    <div className="saving-info mt-4 alert alert-info">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-info-circle-fill me-3 fs-4"></i>
                        <div>
                          <h5 className="mb-1">Total Savings</h5>
                          <p className="mb-0">
                            By choosing the cheapest pharmacy, you could save up to 
                            ${Math.abs(pharmacyTotals[pharmacyTotals.length-1].precio_total - 
                              pharmacyTotals[0].precio_total).toLocaleString('es-CL')} on these medications.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Individual medication comparison results */}
            {selectedMedications.map(medication => (
              <div className="col-12 mb-4" key={medication.id}>
                <div className="card shadow">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">Price comparison for {medication.nombre}</h5>
                  </div>
                  <div className="card-body">
                    <div className="medication-info mb-4">
                      <div className="row">
                        <div className="col-md-6">
                          <p><strong>Active Ingredient:</strong> {medication.principio_activo}</p>
                          <p>
                            <strong>Type:</strong> {' '}
                            {medication.es_generico ? 'Generic' : 'Brand'}
                          </p>
                        </div>
                        <div className="col-md-6 text-md-end">
                          <p className="text-muted">Last Update: {new Date().toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    {comparisonResults[medication.id] ? (
                      <div className="price-comparison-results">
                        <div className="row">
                          {comparisonResults[medication.id].map((result) => {
                            // Find the cheapest price for highlighting
                            const cheapestPrice = Math.min(...comparisonResults[medication.id].map(r => r.precio));
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
                                You could save up to ${Math.abs(Math.max(...comparisonResults[medication.id].map(r => r.precio)) - 
                                Math.min(...comparisonResults[medication.id].map(r => r.precio))).toLocaleString('es-CL')} on this medication by comparing prices.
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
            ))}
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