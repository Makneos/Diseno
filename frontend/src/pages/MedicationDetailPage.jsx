import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/PriceComparison.css';

function MedicationDetailPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [comparisonResults, setComparisonResults] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [user, setUser] = useState(null);

  const navigate = useNavigate();
  const { medicationId } = useParams();

  useEffect(() => {
    const loggedInUser = sessionStorage.getItem('user');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }

    // Obtener el medicamento seleccionado desde sessionStorage o hacer fetch por ID
    const savedMedication = sessionStorage.getItem('selectedMedication');
    if (savedMedication) {
      const medication = JSON.parse(savedMedication);
      console.log('Medicamento desde sessionStorage:', medication);
      setSelectedMedication(medication);
      loadPriceComparison(medication);
    } else {
      // Si no hay medicamento en sessionStorage, intentar obtenerlo por ID
      fetchMedicationById(medicationId);
    }
  }, [medicationId]);

  const fetchMedicationById = async (id) => {
    setIsLoading(true);
    setLoadingMessage('Loading medication details...');
    
    try {
      const response = await fetch(`http://localhost:5000/api/medicamentos/${id}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const medication = await response.json();
      console.log('Medicamento obtenido por ID:', medication);
      setSelectedMedication(medication);
      loadPriceComparison(medication);
    } catch (error) {
      console.error('Error fetching medication by ID:', error);
      setErrorMessage('Could not load medication details');
      
      // Fallback con datos de muestra
      const fallbackMedication = {
        id: parseInt(id),
        nombre: 'Unknown Medication',
        principio_activo: 'Unknown',
        es_generico: false,
        imagen_url: null
      };
      setSelectedMedication(fallbackMedication);
      loadPriceComparison(fallbackMedication);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPriceComparison = async (medication) => {
    if (!medication) return;

    setIsLoading(true);
    setLoadingMessage('Loading price comparison...');
    
    try {
      const principioActivoEncoded = encodeURIComponent(medication.principio_activo);
      console.log(`🔍 Cargando comparación para: "${medication.principio_activo}"`);
      console.log(`📡 API URL: http://localhost:5000/api/medicamentos/precios-por-principio/${principioActivoEncoded}`);
      
      const response = await fetch(`http://localhost:5000/api/medicamentos/precios-por-principio/${principioActivoEncoded}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error ${response.status}: ${errorText}`);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("✅ Datos de comparación recibidos:", JSON.stringify(data, null, 2));
      
      // Debug detallado de las imágenes
      if (data.farmacias) {
        console.log("📋 ANÁLISIS DETALLADO DE IMÁGENES EN COMPARACIÓN:");
        data.farmacias.forEach((farmacia, farmaciaIndex) => {
          console.log(`🏪 Farmacia ${farmaciaIndex + 1}: ${farmacia.farmacia.nombre}`);
          farmacia.medicamentos.forEach((med, medIndex) => {
            console.log(`  💊 Medicamento ${medIndex + 1}:`);
            console.log(`    - Nombre: "${med.nombre}"`);
            console.log(`    - Imagen URL: "${med.imagen_url}"`);
            console.log(`    - Tipo: ${typeof med.imagen_url}`);
            console.log(`    - Es válida: ${!!(med.imagen_url && med.imagen_url !== 'null' && med.imagen_url !== '')}`);
            console.log(`    - Longitud URL: ${med.imagen_url ? med.imagen_url.length : 0}`);
          });
        });
      }
      
      if (!data.farmacias || data.farmacias.length === 0) {
        console.log("❌ No se encontraron farmacias en la respuesta de la API");
        setErrorMessage('No price data available for medications with this active ingredient');
        
        // Fallback con datos de muestra
        console.log("🔄 Usando datos de muestra");
        const sampleComparison = generateSampleComparison(medication);
        setComparisonResults(sampleComparison);
      } else {
        console.log("✅ Usando datos reales de la API");
        setComparisonResults(data);
      }
    } catch (error) {
      console.error('💥 Error en comparación:', error);
      
      // Fallback con datos de muestra
      console.log("🔄 Usando datos de muestra como fallback debido a error");
      const sampleComparison = generateSampleComparison(medication);
      setComparisonResults(sampleComparison);
      
      setErrorMessage(`API Error: ${error.message}. Showing sample data.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSearch = () => {
    navigate('/price-comparison');
  };

  const handleReturnHome = (e) => {
    e.preventDefault();
    navigate('/');
  };

  // Función para obtener imagen por defecto según principio activo
  const getDefaultImageForActiveIngredient = (principioActivo, tipo = 'brand') => {
    const activo = principioActivo?.toLowerCase() || '';
    
    if (activo.includes('paracetamol')) {
      return tipo === 'generic' 
        ? 'https://via.placeholder.com/150x150/28a745/ffffff?text=Paracetamol+Gen'
        : 'https://www.cruzverde.cl/dw/image/v2/BDPM_PRD/on/demandware.static/-/Sites-masterCatalog_Chile/default/dw5a7de0d6/images/large/186508-paracetamol-mk-500-mg-20-comprimidos.jpg';
    }
    
    if (activo.includes('gesidol')) {
      return 'https://via.placeholder.com/150x150/ff6b6b/ffffff?text=Gesidol';
    }
    
    if (activo.includes('día') || activo.includes('noche')) {
      return 'https://via.placeholder.com/150x150/4ecdc4/ffffff?text=Tapsin';
    }
    
    if (activo.includes('ibuprofeno')) {
      return tipo === 'generic'
        ? 'https://via.placeholder.com/150x150/17a2b8/ffffff?text=Ibuprofeno+Gen'
        : 'https://www.cruzverde.cl/dw/image/v2/BDPM_PRD/on/demandware.static/-/Sites-masterCatalog_Chile/default/dw8f4e4e1e/images/large/103738-ibuprofeno-400-mg-20-comprimidos.jpg';
    }
    
    return tipo === 'generic'
      ? 'https://via.placeholder.com/150x150/6c757d/ffffff?text=Generic'
      : 'https://via.placeholder.com/150x150/007bff/ffffff?text=Medication';
  };

  // Componente mejorado para manejar imágenes
  const MedicationImage = ({ src, alt, className = "" }) => {
    const [imageSrc, setImageSrc] = useState(src);
    const [hasError, setHasError] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(true);

    const handleImageLoad = () => {
      setIsImageLoading(false);
      setHasError(false);
      console.log(`✅ Imagen cargada: ${src}`);
    };

    const handleImageError = (e) => {
      console.error(`❌ Error cargando imagen: ${src}`, e);
      setHasError(true);
      setIsImageLoading(false);
    };

    useEffect(() => {
      console.log(`🖼️ MedicationImage: src="${src}", alt="${alt}"`);
      setImageSrc(src);
      setHasError(false);
      setIsImageLoading(!!src);
    }, [src]);

    // Si no hay src o está vacío
    if (!src || src === 'null' || src === 'undefined' || src === '') {
      console.log(`❌ Sin imagen válida para: ${alt}`);
      return (
        <div className={`medication-image-placeholder d-flex align-items-center justify-content-center ${className}`} 
             style={{ backgroundColor: '#f8f9fa', border: '2px dashed #dee2e6', borderRadius: '8px' }}>
          <div className="text-center">
            <i className="bi bi-capsule fs-1 text-muted"></i>
            <div className="small text-muted mt-2">No image</div>
          </div>
        </div>
      );
    }

    // Si hubo error cargando la imagen
    if (hasError) {
      console.log(`❌ Error en imagen para: ${alt}`);
      return (
        <div className={`medication-image-placeholder d-flex align-items-center justify-content-center ${className}`} 
             style={{ backgroundColor: '#fff3cd', border: '2px dashed #ffc107', borderRadius: '8px' }}>
          <div className="text-center">
            <i className="bi bi-exclamation-triangle fs-1 text-warning"></i>
            <div className="small text-muted mt-2">Error loading</div>
          </div>
        </div>
      );
    }

    return (
      <div className={`position-relative ${className}`}>
        {isImageLoading && (
          <div className="position-absolute top-50 start-50 translate-middle">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
        <img 
          src={imageSrc} 
          alt={alt} 
          className={`medication-image w-100 h-100 rounded ${isImageLoading ? 'opacity-25' : 'opacity-100'}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
          style={{ 
            objectFit: 'contain',
            transition: 'opacity 0.3s ease',
            border: '1px solid #dee2e6'
          }}
        />
      </div>
    );
  };

  // Función para generar datos de muestra
  const generateSampleComparison = (medication) => {
    console.log('🔄 Generando datos de muestra para:', medication);
    
    // Usar la imagen del medicamento seleccionado si está disponible
    const baseImageUrl = medication.imagen_url || getDefaultImageForActiveIngredient(medication.principio_activo);
    
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
              imagen_url: baseImageUrl,
              precio: 1500 + Math.floor(Math.random() * 500),
              disponible: true,
              url_producto: 'https://www.farmaciasahumada.cl'
            },
            {
              id: 11,
              medicamento_id: medication.id + 100,
              nombre: `${medication.principio_activo} Genérico`,
              es_generico: true,
              imagen_url: getDefaultImageForActiveIngredient(medication.principio_activo, 'generic'),
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
              imagen_url: baseImageUrl,
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
              imagen_url: baseImageUrl,
              precio: 1800 + Math.floor(Math.random() * 200),
              disponible: true,
              url_producto: 'https://salcobrand.cl'
            },
            {
              id: 12,
              medicamento_id: medication.id + 200,
              nombre: `${medication.principio_activo} MK`,
              es_generico: false,
              imagen_url: getDefaultImageForActiveIngredient(medication.principio_activo),
              precio: 2200 + Math.floor(Math.random() * 400),
              disponible: Math.random() > 0.3,
              url_producto: 'https://salcobrand.cl'
            }
          ]
        }
      ]
    };
    
    console.log('✅ Datos de muestra generados:', sampleData);
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

  if (!selectedMedication) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Medication not found. 
          <button className="btn btn-link p-0 ms-2" onClick={handleBackToSearch}>
            Return to search
          </button>
        </div>
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
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <button className="btn btn-link p-0" onClick={handleReturnHome}>Home</button>
            </li>
            <li className="breadcrumb-item">
              <button className="btn btn-link p-0" onClick={handleBackToSearch}>Search</button>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {selectedMedication.nombre}
            </li>
          </ol>
        </nav>

        {/* Back Button */}
        <div className="row mb-4">
          <div className="col-12">
            <button 
              className="btn btn-outline-secondary" 
              onClick={handleBackToSearch}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back to search
            </button>
          </div>
        </div>

        {/* Medication Header */}
        <div className="row mb-5">
          <div className="col-12">
            <div className="card shadow">
              <div className="card-header bg-primary text-white">
                <h2 className="mb-0">
                  <i className="bi bi-capsule me-2"></i>
                  Medication Details & Price Comparison
                </h2>
              </div>
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-md-3">
                    <div style={{ width: '150px', height: '150px', margin: '0 auto' }}>
                      <MedicationImage 
                        src={selectedMedication.imagen_url} 
                        alt={selectedMedication.nombre}
                        className="w-100 h-100"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h3 className="mb-3">{selectedMedication.nombre}</h3>
                    <div className="medication-details">
                      <p className="mb-2">
                        <strong>Active Ingredient:</strong> 
                        <span className="badge bg-info ms-2">{selectedMedication.principio_activo}</span>
                      </p>
                      <p className="mb-2">
                        <strong>Type:</strong> 
                        {selectedMedication.es_generico ? (
                          <span className="badge bg-success ms-2">Generic</span>
                        ) : (
                          <span className="badge bg-primary ms-2">Brand</span>
                        )}
                      </p>
                      <p className="mb-0">
                        <strong>Medication ID:</strong> 
                        <code className="ms-2">{selectedMedication.id}</code>
                      </p>
                    </div>
                  </div>
                  <div className="col-md-3 text-md-end">
                    <div className="text-muted">
                      <i className="bi bi-clock me-1"></i>
                      Last update: {new Date().toLocaleDateString()}
                    </div>
                    <div className="mt-2">
                      <span className="badge bg-secondary">
                        Comparing medications with "{selectedMedication.principio_activo}"
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="alert alert-info mb-4" role="alert">
            <i className="bi bi-info-circle me-2"></i>
            {errorMessage}
          </div>
        )}

        {/* Price Comparison Results */}
        {comparisonResults.farmacias && (
          <div className="row">
            <div className="col-12">
              <h3 className="mb-4">
                <i className="bi bi-graph-up me-2"></i>
                Price Comparison ({comparisonResults.farmacias.length} pharmacies)
              </h3>
              
              <div className="price-comparison-results">
                {comparisonResults.farmacias.map((farmacia) => (
                  <div className="farmacia-section mb-5" key={farmacia.farmacia.id}>
                    <div className="card shadow-sm">
                      <div className="card-header bg-light">
                        <h4 className="mb-0 d-flex align-items-center">
                          <i className="bi bi-shop me-2 text-primary"></i>
                          {farmacia.farmacia.nombre}
                          <span className="badge bg-secondary ms-2">
                            {farmacia.medicamentos.length} product{farmacia.medicamentos.length !== 1 ? 's' : ''}
                          </span>
                        </h4>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          {farmacia.medicamentos.map((medicamento) => {
                            const isSelectedMed = medicamento.medicamento_id === selectedMedication.id;
                            const allPrices = comparisonResults.farmacias.flatMap(f => f.medicamentos.map(m => m.precio));
                            const minPrice = Math.min(...allPrices);
                            const isBestPrice = medicamento.precio === minPrice;
                            
                            return (
                              <div className="col-lg-3 col-md-4 col-sm-6 mb-4" key={medicamento.id}>
                                <div className={`card h-100 medication-card ${isSelectedMed ? 'border-primary border-3' : isBestPrice ? 'border-success border-2' : ''}`}>
                                  <div className={`card-header text-center ${isSelectedMed ? 'bg-primary text-white' : isBestPrice ? 'bg-success text-white' : 'bg-light'}`}>
                                    <div className="d-flex justify-content-center mb-2">
                                      {isSelectedMed && (
                                        <span className="badge bg-white text-primary me-1">Selected</span>
                                      )}
                                      {isBestPrice && !isSelectedMed && (
                                        <span className="badge bg-white text-success me-1">Best Price</span>
                                      )}
                                      {medicamento.es_generico ? (
                                        <span className="badge bg-success">Generic</span>
                                      ) : (
                                        <span className="badge bg-info">Brand</span>
                                      )}
                                    </div>
                                    <h6 className="mb-0 small">{medicamento.nombre}</h6>
                                  </div>
                                  <div className="card-body d-flex flex-column text-center">
                                    {/* IMAGEN DEL MEDICAMENTO */}
                                    <div className="mb-3">
                                      <div style={{ width: '80px', height: '80px', margin: '0 auto' }}>
                                        <MedicationImage 
                                          src={medicamento.imagen_url} 
                                          alt={medicamento.nombre}
                                          className="w-100 h-100"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="flex-grow-1">
                                      <h4 className={`price mb-3 fw-bold ${isBestPrice ? 'text-success' : 'text-primary'}`}>
                                        ${medicamento.precio.toLocaleString('es-CL')}
                                      </h4>
                                      
                                      <div className="availability mb-3">
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Summary and Tips */}
        <div className="row mt-5">
          <div className="col-md-8">
            <div className="card shadow-sm">
              <div className="card-body">
                <h4 className="card-title">
                  <i className="bi bi-info-circle me-2 text-info"></i>
                  Price Summary
                </h4>
                {comparisonResults.farmacias && (() => {
                  const allPrices = comparisonResults.farmacias.flatMap(f => f.medicamentos.map(m => m.precio));
                  const minPrice = Math.min(...allPrices);
                  const maxPrice = Math.max(...allPrices);
                  const avgPrice = (allPrices.reduce((a, b) => a + b, 0) / allPrices.length);
                  const savings = maxPrice - minPrice;
                  
                  return (
                    <div className="row text-center">
                      <div className="col-md-3">
                        <div className="statistic">
                          <div className="h4 text-success">${minPrice.toLocaleString('es-CL')}</div>
                          <div className="small text-muted">Lowest Price</div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="statistic">
                          <div className="h4 text-danger">${maxPrice.toLocaleString('es-CL')}</div>
                          <div className="small text-muted">Highest Price</div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="statistic">
                          <div className="h4 text-info">${avgPrice.toFixed(0).toLocaleString('es-CL')}</div>
                          <div className="small text-muted">Average Price</div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="statistic">
                          <div className="h4 text-warning">${savings.toLocaleString('es-CL')}</div>
                          <div className="small text-muted">Max Savings</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">
                  <i className="bi bi-lightbulb me-2 text-warning"></i>
                  Quick Tip
                </h5>
                <p className="mb-0">
                  Consider generic alternatives - they contain the same active ingredient 
                  and are often significantly cheaper while being equally effective.
                </p>
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

export default MedicationDetailPage;