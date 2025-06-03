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
      const response = await fetch(`http://localhost:5000/api/medicamentos/buscar?q=${encodeURIComponent(searchTerm)}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Resultados de búsqueda:', data);
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching medications:', error);
      
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
    console.log('Medicamento seleccionado:', medication);
    
    setSelectedMedication(medication);
    setComparisonResults([]);
    setErrorMessage('');
    setIsLoading(true);
    setLoadingMessage('Comparing prices for medications with the same active ingredient...');
    
    try {
      const principioActivoEncoded = encodeURIComponent(medication.principio_activo);
      console.log(`Calling API: http://localhost:5000/api/medicamentos/precios-por-principio/${principioActivoEncoded}`);
      
      const response = await fetch(`http://localhost:5000/api/medicamentos/precios-por-principio/${principioActivoEncoded}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error ${response.status}: ${errorText}`);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Datos reales de la API:", data);
      
      // Debug detallado de las imágenes
      if (data.farmacias) {
        data.farmacias.forEach(farmacia => {
          console.log(`Farmacia: ${farmacia.farmacia.nombre}`);
          farmacia.medicamentos.forEach(med => {
            console.log(`  - ${med.nombre}`);
            console.log(`    Imagen URL: "${med.imagen_url}"`);
            console.log(`    Tiene imagen: ${med.imagen_url ? 'SÍ' : 'NO'}`);
          });
        });
      }
      
      if (!data.farmacias || data.farmacias.length === 0) {
        setErrorMessage('No price data available for medications with this active ingredient');
        
        // Fallback con datos de muestra que incluyen imágenes
        console.log("Usando fallback con datos de muestra");
        const sampleComparison = generateSampleComparison(medication);
        setComparisonResults(sampleComparison);
      } else {
        setComparisonResults(data);
      }
    } catch (error) {
      console.error('Error completo:', error);
      
      // Fallback con datos de muestra
      console.log("Usando datos de muestra como fallback debido a error:", error.message);
      const sampleComparison = generateSampleComparison(medication);
      setComparisonResults(sampleComparison);
    } finally {
      setIsLoading(false);
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

  // Componente mejorado para manejar imágenes con mejor debugging
  const MedicationImage = ({ src, alt, className = "" }) => {
    const [imageSrc, setImageSrc] = useState(src);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const handleImageLoad = () => {
      setIsLoading(false);
      setHasError(false);
      console.log(`Imagen cargada exitosamente: ${src}`);
    };

    const handleImageError = (e) => {
      console.error(`Error cargando imagen: ${src}`, e);
      setHasError(true);
      setIsLoading(false);
    };

    useEffect(() => {
      console.log(`MedicationImage: src="${src}", alt="${alt}"`);
      setImageSrc(src);
      setHasError(false);
      setIsLoading(true);
    }, [src]);

    // Si no hay src o está vacío
    if (!src || src === 'null' || src === 'undefined') {
      console.log(`Sin imagen para: ${alt}`);
      return (
        <div className={`medication-image-placeholder d-flex align-items-center justify-content-center ${className}`} 
             style={{ backgroundColor: '#f8f9fa', border: '1px dashed #dee2e6' }}>
          <i className="bi bi-capsule fs-2 text-muted"></i>
        </div>
      );
    }

    // Si hubo error cargando la imagen
    if (hasError) {
      console.log(`Error en imagen para: ${alt}`);
      return (
        <div className={`medication-image-placeholder d-flex align-items-center justify-content-center ${className}`} 
             style={{ backgroundColor: '#f8f9fa', border: '1px dashed #dee2e6' }}>
          <div className="text-center">
            <i className="bi bi-exclamation-triangle fs-2 text-warning"></i>
            <div className="small text-muted mt-1">Error loading image</div>
          </div>
        </div>
      );
    }

    return (
      <div className={className} style={{ position: 'relative' }}>
        {isLoading && (
          <div className="position-absolute top-50 start-50 translate-middle">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
        <img 
          src={imageSrc} 
          alt={alt} 
          className={`medication-image w-100 h-100 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
          style={{ 
            objectFit: 'contain',
            transition: 'opacity 0.3s ease'
          }}
        />
      </div>
    );
  };

  // Helper function to generate sample search results
  const generateSampleResults = (term) => {
    const lowercaseTerm = term.toLowerCase();
    
    const sampleMedications = [
      { 
        id: 1, 
        nombre: 'Paracetamol 500mg', 
        principio_activo: 'Paracetamol', 
        es_generico: true,
        imagen_url: 'https://www.cruzverde.cl/dw/image/v2/BDPM_PRD/on/demandware.static/-/Sites-masterCatalog_Chile/default/dw5a7de0d6/images/large/186508-paracetamol-mk-500-mg-20-comprimidos.jpg'
      },
      { 
        id: 2, 
        nombre: 'Ibuprofeno 400mg', 
        principio_activo: 'Ibuprofeno', 
        es_generico: true,
        imagen_url: 'https://www.cruzverde.cl/dw/image/v2/BDPM_PRD/on/demandware.static/-/Sites-masterCatalog_Chile/default/dw8f4e4e1e/images/large/103738-ibuprofeno-400-mg-20-comprimidos.jpg'
      },
      { 
        id: 3, 
        nombre: 'Aspirina 100mg', 
        principio_activo: 'Ácido acetilsalicílico', 
        es_generico: false,
        imagen_url: 'https://www.cruzverde.cl/dw/image/v2/BDPM_PRD/on/demandware.static/-/Sites-masterCatalog_Chile/default/dw1c5c8c1f/images/large/103715-aspirina-100-mg-30-comprimidos.jpg'
      },
      { 
        id: 4, 
        nombre: 'Loratadina 10mg', 
        principio_activo: 'Loratadina', 
        es_generico: true,
        imagen_url: 'https://via.placeholder.com/150x150?text=Loratadina'
      },
      { 
        id: 5, 
        nombre: 'Omeprazol 20mg', 
        principio_activo: 'Omeprazol', 
        es_generico: true,
        imagen_url: 'https://via.placeholder.com/150x150?text=Omeprazol'
      },
    ];
    
    return sampleMedications.filter(med => 
      med.nombre.toLowerCase().includes(lowercaseTerm) || 
      med.principio_activo.toLowerCase().includes(lowercaseTerm)
    );
  };

  // Helper function to generate sample comparison data con imágenes reales
  const generateSampleComparison = (medication) => {
    console.log('Generando datos de muestra para:', medication);
    
    const sampleData = {
      principio_activo: medication.principio_activo,
      farmacias: [
        {
          farmacia: { id: 1, nombre: 'Ahumada', logo_url: null },
          medicamentos: [
            {
              id: 1,
              medicamento_id: medication.id,
              nombre: medication.nombre,
              es_generico: medication.es_generico,
              imagen_url: medication.imagen_url || 'https://www.cruzverde.cl/dw/image/v2/BDPM_PRD/on/demandware.static/-/Sites-masterCatalog_Chile/default/dw5a7de0d6/images/large/186508-paracetamol-mk-500-mg-20-comprimidos.jpg',
              precio: 1500 + Math.floor(Math.random() * 500),
              disponible: true,
              url_producto: 'https://www.farmaciasahumada.cl'
            },
            {
              id: 11,
              medicamento_id: medication.id + 10,
              nombre: `${medication.principio_activo} Genérico`,
              es_generico: true,
              imagen_url: 'https://via.placeholder.com/150x150?text=Generic',
              precio: 800 + Math.floor(Math.random() * 300),
              disponible: true,
              url_producto: 'https://www.farmaciasahumada.cl'
            }
          ]
        },
        {
          farmacia: { id: 2, nombre: 'Cruz Verde', logo_url: null },
          medicamentos: [
            {
              id: 2,
              medicamento_id: medication.id,
              nombre: medication.nombre,
              es_generico: medication.es_generico,
              imagen_url: medication.imagen_url || 'https://www.cruzverde.cl/dw/image/v2/BDPM_PRD/on/demandware.static/-/Sites-masterCatalog_Chile/default/dw5a7de0d6/images/large/186508-paracetamol-mk-500-mg-20-comprimidos.jpg',
              precio: 1200 + Math.floor(Math.random() * 300),
              disponible: true,
              url_producto: 'https://www.cruzverde.cl'
            }
          ]
        },
        {
          farmacia: { id: 3, nombre: 'Salcobrand', logo_url: null },
          medicamentos: [
            {
              id: 3,
              medicamento_id: medication.id,
              nombre: medication.nombre,
              es_generico: medication.es_generico,
              imagen_url: medication.imagen_url || 'https://www.cruzverde.cl/dw/image/v2/BDPM_PRD/on/demandware.static/-/Sites-masterCatalog_Chile/default/dw5a7de0d6/images/large/186508-paracetamol-mk-500-mg-20-comprimidos.jpg',
              precio: 1800 + Math.floor(Math.random() * 200),
              disponible: true,
              url_producto: 'https://salcobrand.cl'
            },
            {
              id: 12,
              medicamento_id: medication.id + 20,
              nombre: `${medication.principio_activo} MK`,
              es_generico: false,
              imagen_url: 'https://via.placeholder.com/150x150?text=MK',
              precio: 2200 + Math.floor(Math.random() * 400),
              disponible: false,
              url_producto: 'https://salcobrand.cl'
            }
          ]
        }
      ]
    };
    
    console.log('Datos de muestra generados:', sampleData);
    return sampleData;
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
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light px-4 shadow-sm sticky-top">
        <a className="navbar-brand fw-bold" href="/" onClick={handleReturnHome}>
          Farmafia
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav">
            {user ? (
              <li className="nav-item">
                <a className="nav-link" href="/profile" onClick={(e) => {
                    e.preventDefault();
                    navigate('/profile');
                  }}>
                  <i className="bi bi-person-circle me-1"></i>
                  {user.nombre}
                </a>
              </li>
            ) : (
              <li className="nav-item">
                <a className="nav-link" href="/login" onClick={(e) => {
                    e.preventDefault();
                    navigate('/login');
                  }}>
                  Login
                </a>
              </li>
            )}
            <li className="nav-item">
              <a className="nav-link" href="/" onClick={handleReturnHome}>
                <i className="bi bi-house-door me-1"></i>
                Home
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <div className="container py-5">
        {/* Header */}
        <div className="row">
          <div className="col-12">
            <h1 className="text-center mb-4">Medication Price Comparator</h1>
            <p className="text-center text-muted mb-5">
              Save on Medications: Find the Best Prices in Chile
            </p>
          </div>
        </div>

        {/* Search Form */}
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
                    />
                    <button 
                      className="btn btn-primary" 
                      type="submit"
                      disabled={searchTerm.length < 3 || isSearching}
                    >
                      {isSearching ? (
                        <span className="spinner-border spinner-border-sm me-2"></span>
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

        {/* Error Message */}
        {errorMessage && (
          <div className="alert alert-warning my-4" role="alert">
            {errorMessage}
          </div>
        )}

        {/* Search Results */}
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
                          <th style={{ width: '80px' }}>Image</th>
                          <th>Name</th>
                          <th>Active Ingredient</th>
                          <th>Type</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.map((medication) => (
                          <tr key={medication.id}>
                            <td>
                              <div style={{ width: '60px', height: '60px' }}>
                                <MedicationImage 
                                  src={medication.imagen_url} 
                                  alt={medication.nombre}
                                  className="w-100 h-100 rounded"
                                />
                              </div>
                            </td>
                            <td><strong>{medication.nombre}</strong></td>
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

        {/* Price Comparison Results */}
        {selectedMedication && (
          <div className="row mt-4">
            <div className="col-12 mb-4">
              <button 
                className="btn btn-outline-secondary" 
                onClick={() => setSelectedMedication(null)}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Back to results
              </button>
            </div>
            
            <div className="col-12">
              <div className="card shadow">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">Price comparison for medications with {selectedMedication.principio_activo}</h5>
                </div>
                <div className="card-body">
                  <div className="medication-info mb-4">
                    <div className="row align-items-center">
                      <div className="col-md-2">
                        <div style={{ width: '80px', height: '80px' }}>
                          <MedicationImage 
                            src={selectedMedication.imagen_url} 
                            alt={selectedMedication.nombre}
                            className="w-100 h-100 rounded"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <p><strong>Active Ingredient:</strong> {selectedMedication.principio_activo}</p>
                        <p><strong>Selected Medication:</strong> {selectedMedication.nombre}</p>
                      </div>
                      <div className="col-md-4 text-md-end">
                        <p className="text-muted">Last update: {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  {comparisonResults.farmacias && (
                    <div className="price-comparison-results">
                      {comparisonResults.farmacias.map((farmacia) => (
                        <div className="farmacia-section mb-4" key={farmacia.farmacia.id}>
                          <h4 className="pharmacy-title mb-3 d-flex align-items-center">
                            <i className="bi bi-shop me-2"></i>
                            {farmacia.farmacia.nombre}
                            <span className="badge bg-secondary ms-2">{farmacia.medicamentos.length} productos</span>
                          </h4>
                          <div className="row">
                            {farmacia.medicamentos.map((medicamento) => {
                              const isSelectedMed = medicamento.medicamento_id === selectedMedication.id;
                              const allPrices = comparisonResults.farmacias.flatMap(f => f.medicamentos.map(m => m.precio));
                              const minPrice = Math.min(...allPrices);
                              const isBestPrice = medicamento.precio === minPrice;
                              
                              return (
                                <div className="col-lg-4 col-md-6 mb-3" key={medicamento.id}>
                                  <div className={`card h-100 ${isSelectedMed ? 'border-primary border-2' : isBestPrice ? 'border-success border-2' : ''}`}>
                                    <div className={`card-header ${isSelectedMed ? 'bg-primary text-white' : isBestPrice ? 'bg-success text-white' : 'bg-light'}`}>
                                      <div className="d-flex justify-content-between align-items-start">
                                        <h6 className="mb-1 text-truncate flex-grow-1 me-2">{medicamento.nombre}</h6>
                                        <div className="d-flex flex-column gap-1">
                                          {isSelectedMed && (
                                            <span className="badge bg-white text-primary">Selected</span>
                                          )}
                                          {isBestPrice && !isSelectedMed && (
                                            <span className="badge bg-white text-success">Best Price</span>
                                          )}
                                          {medicamento.es_generico ? (
                                            <span className="badge bg-success">Generic</span>
                                          ) : (
                                            <span className="badge bg-info">Brand</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="card-body d-flex flex-column">
                                      {/* IMAGEN DEL MEDICAMENTO */}
                                      <div className="text-center mb-3">
                                        <div style={{ width: '100px', height: '100px', margin: '0 auto' }}>
                                          <MedicationImage 
                                            src={medicamento.imagen_url} 
                                            alt={medicamento.nombre}
                                            className="w-100 h-100 rounded shadow-sm"
                                          />
                                        </div>
                                      </div>
                                      
                                      <div className="text-center mb-3 flex-grow-1">
                                        <h3 className={`price mb-2 fw-bold ${isBestPrice ? 'text-success' : 'text-primary'}`}>
                                          ${medicamento.precio.toLocaleString('es-CL')}
                                        </h3>
                                        
                                        <div className="availability">
                                          {medicamento.disponible ? (
                                            <span className="text-success">
                                              <i className="bi bi-check-circle me-2"></i>
                                              Available
                                            </span>
                                          ) : (
                                            <span className="text-danger">
                                              <i className="bi bi-x-circle me-2"></i>
                                              Not available
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="card-footer bg-white">
                                      {medicamento.url_producto ? (
                                        <a 
                                          href={medicamento.url_producto} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className={`btn w-100 ${medicamento.disponible ? 'btn-outline-primary' : 'btn-outline-secondary disabled'}`}
                                        >
                                          <i className="bi bi-external-link me-2"></i>
                                          View on site
                                        </a>
                                      ) : (
                                        <button className="btn btn-outline-secondary w-100" disabled>
                                          <i className="bi bi-exclamation-circle me-2"></i>
                                          Link not available
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
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