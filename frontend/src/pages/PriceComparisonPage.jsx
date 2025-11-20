import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import '../styles/PriceComparison.css';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://wellaging-production-99c2.up.railway.app'
  : 'http://localhost:5000';

function PriceComparisonPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
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
      console.log('🔍 Searching medications for:', searchTerm);
      console.log('🌐 API URL:', `${API_BASE_URL}/api/medicamentos/buscar`);
      
      const response = await fetch(`${API_BASE_URL}/api/medicamentos/buscar?q=${encodeURIComponent(searchTerm)}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📥 Search results:', data);
      setSearchResults(data);
      
      if (data.length === 0) {
        setErrorMessage(t('priceComparison.noMedicationsFound'));
      }
    } catch (error) {
      console.error('❌ Error searching medications:', error);
      
      const sampleResults = generateSampleResults(searchTerm);
      setSearchResults(sampleResults);
      
      if (error.message.includes('Failed to fetch')) {
        setErrorMessage(t('priceComparison.connectionError'));
      } else if (!sampleResults.length) {
        setErrorMessage(t('priceComparison.noMatchingMedications'));
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch();
  };

  const handleSelectMedication = (medication) => {
    console.log('🔍 Navigating to medication details:', medication);
    sessionStorage.setItem('selectedMedication', JSON.stringify(medication));
    navigate(`/medication/${medication.id}`);
  };

  const handleReturnHome = (e) => {
    e.preventDefault();
    setLoadingMessage(t('loading.refreshing'));
    setIsLoading(true);

    setTimeout(() => {
      navigate('/');
      setIsLoading(false);
    }, 1500);
  };

  const MedicationImage = ({ src, alt, className = "" }) => {
    const [imageSrc, setImageSrc] = useState(src);
    const [hasError, setHasError] = useState(false);

    const handleImageError = () => {
      setHasError(true);
    };

    useEffect(() => {
      setImageSrc(src);
      setHasError(false);
    }, [src]);

    if (!src || hasError) {
      return (
        <div className={`medication-image-placeholder d-flex align-items-center justify-content-center ${className}`} 
             style={{ backgroundColor: '#f8f9fa', border: '1px dashed #dee2e6' }}>
          <i className="bi bi-capsule fs-2 text-muted"></i>
        </div>
      );
    }

    return (
      <img 
        src={imageSrc} 
        alt={alt} 
        className={`medication-image w-100 h-100 ${className}`}
        onError={handleImageError}
        loading="lazy"
        style={{ objectFit: 'contain' }}
      />
    );
  };

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
    ];
    
    return sampleMedications.filter(med => 
      med.nombre.toLowerCase().includes(lowercaseTerm) || 
      med.principio_activo.toLowerCase().includes(lowercaseTerm)
    );
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
        <a className="navbar-brand fw-bold" href="/" onClick={handleReturnHome}>
          {t('nav.brand')}
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
                  {t('nav.login')}
                </a>
              </li>
            )}
            <li className="nav-item">
              <a className="nav-link" href="/" onClick={handleReturnHome}>
                <i className="bi bi-house-door me-1"></i>
                {t('nav.home')}
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <div className="container py-5">
        <div className="row">
          <div className="col-12">
            <h1 className="text-center mb-4">{t('priceComparison.title')}</h1>
            <p className="text-center text-muted mb-5">
              {t('priceComparison.subtitle')}
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
                      placeholder={t('priceComparison.searchPlaceholder')}
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
                      {t('priceComparison.search')}
                    </button>
                  </div>
                  {searchTerm.length > 0 && searchTerm.length < 3 && (
                    <div className="form-text text-muted">{t('priceComparison.minCharacters')}</div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="alert alert-warning my-4" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {errorMessage}
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="row">
            <div className="col-12">
              <div className="card shadow">
                <div className="card-header bg-light">
                  <h5 className="mb-0">{t('priceComparison.searchResults')} ({searchResults.length} {t('priceComparison.found')})</h5>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th style={{ width: '80px' }}>{t('priceComparison.image')}</th>
                          <th>{t('priceComparison.name')}</th>
                          <th>{t('priceComparison.activeIngredient')}</th>
                          <th>{t('priceComparison.type')}</th>
                          <th>{t('priceComparison.action')}</th>
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
                            <td>
                              <div>
                                <strong>{medication.nombre}</strong>
                                <div className="small text-muted">ID: {medication.id}</div>
                              </div>
                            </td>
                            <td>{medication.principio_activo}</td>
                            <td>
                              {medication.es_generico ? (
                                <span className="badge bg-success">{t('priceComparison.generic')}</span>
                              ) : (
                                <span className="badge bg-info">{t('priceComparison.brand')}</span>
                              )}
                            </td>
                            <td>
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleSelectMedication(medication)}
                              >
                                <i className="bi bi-search-heart me-1"></i>
                                {t('priceComparison.viewDetails')}
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

        <div className="row mt-5">
          <div className="col-md-12">
            <div className="card shadow-sm">
              <div className="card-body">
                <h4 className="card-title">
                  <i className="bi bi-lightbulb me-2 text-warning"></i>
                  {t('priceComparison.searchTips')}
                </h4>
                <div className="row mt-3">
                  <div className="col-md-4 mb-3">
                    <div className="d-flex">
                      <div className="flex-shrink-0">
                        <i className="bi bi-search text-primary fs-4"></i>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h5>{t('priceComparison.tipSearchTitle')}</h5>
                        <p className="text-muted">{t('priceComparison.tipSearchDesc')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="d-flex">
                      <div className="flex-shrink-0">
                        <i className="bi bi-eye text-success fs-4"></i>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h5>{t('priceComparison.tipDetailsTitle')}</h5>
                        <p className="text-muted">{t('priceComparison.tipDetailsDesc')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="d-flex">
                      <div className="flex-shrink-0">
                        <i className="bi bi-currency-dollar text-info fs-4"></i>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h5>{t('priceComparison.tipPriceTitle')}</h5>
                        <p className="text-muted">{t('priceComparison.tipPriceDesc')}</p>
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
              <h5>{t('nav.brand')}</h5>
              <p className="mb-0">{t('footer.description')}</p>
            </div>
            <div className="col-md-6 text-md-end">
              <p className="mb-0">© 2025 {t('nav.brand')}. {t('footer.rights')}</p>
            </div>
          </div>
        </div>
      </footer>
      
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          position: 'fixed', 
          bottom: '10px', 
          left: '10px', 
          background: 'rgba(0,0,0,0.8)', 
          color: 'white', 
          padding: '10px', 
          borderRadius: '5px',
          fontSize: '12px'
        }}>
          API: {API_BASE_URL}
        </div>
      )}
    </div>
  );
}

export default PriceComparisonPage;