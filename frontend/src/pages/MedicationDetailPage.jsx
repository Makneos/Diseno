import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PriceChartsContainer from '../components/PriceChartsContainer';
import MedicationHeader from '../components/MedicationHeader';
import PriceComparisonResults from '../components/PriceComparisonResults';
import PriceSummary from '../components/PriceSummary';
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

    // Get selected medication from sessionStorage or fetch by ID
    const savedMedication = sessionStorage.getItem('selectedMedication');
    if (savedMedication) {
      const medication = JSON.parse(savedMedication);
      console.log('Medication from sessionStorage:', medication);
      setSelectedMedication(medication);
      loadPriceComparison(medication);
    } else {
      // If no medication in sessionStorage, try to get it by ID
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
      console.log('Medication obtained by ID:', medication);
      setSelectedMedication(medication);
      loadPriceComparison(medication);
    } catch (error) {
      console.error('Error fetching medication by ID:', error);
      setErrorMessage('Could not load medication details');
      
      // Fallback with sample data
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
      console.log(`🔍 Loading comparison for: "${medication.principio_activo}"`);
      
      const response = await fetch(`http://localhost:5000/api/medicamentos/precios-por-principio/${principioActivoEncoded}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error ${response.status}: ${errorText}`);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("✅ Comparison data received:", JSON.stringify(data, null, 2));
      
      if (!data.farmacias || data.farmacias.length === 0) {
        console.log("❌ No pharmacies found in API response");
        setErrorMessage('No price data available for medications with this active ingredient');
        
        // Fallback with sample data
        console.log("🔄 Using sample data");
        const sampleComparison = generateSampleComparison(medication);
        setComparisonResults(sampleComparison);
      } else {
        console.log("✅ Using real API data");
        setComparisonResults(data);
      }
    } catch (error) {
      console.error('💥 Comparison error:', error);
      
      // Fallback with sample data
      console.log("🔄 Using sample data as fallback due to error");
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

  // Function to get default image based on active ingredient
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

  // Function to generate sample data
  const generateSampleComparison = (medication) => {
    console.log('🔄 Generating sample data for:', medication);
    
    // Use selected medication image if available
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
              nombre: `${medication.principio_activo} Generic`,
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
    
    console.log('✅ Sample data generated:', sampleData);
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
        <MedicationHeader selectedMedication={selectedMedication} />

        {/* Error Message */}
        {errorMessage && (
          <div className="alert alert-info mb-4" role="alert">
            <i className="bi bi-info-circle me-2"></i>
            {errorMessage}
          </div>
        )}

        {/* Price Charts Section */}
        {comparisonResults.farmacias && (
          <div className="row mb-5">
            <div className="col-12">
              <PriceChartsContainer 
                medicationData={comparisonResults.farmacias.flatMap(farmacia => 
                  farmacia.medicamentos.map(med => ({
                    farmacia: farmacia.farmacia,
                    precio: med.precio,
                    disponible: med.disponible,
                    url_producto: med.url_producto
                  }))
                )}
                medicationName={selectedMedication.nombre}
              />
            </div>
          </div>
        )}

        {/* Price Comparison Results */}
        <PriceComparisonResults 
          comparisonResults={comparisonResults} 
          selectedMedication={selectedMedication} 
        />

        {/* Summary and Tips */}
        <PriceSummary comparisonResults={comparisonResults} />
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