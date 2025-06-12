import React from 'react';
import MedicationImage from './MedicationImage';

const PriceComparisonResults = ({ comparisonResults, selectedMedication }) => {
  if (!comparisonResults.farmacias) {
    return null;
  }

  return (
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
                              {/* MEDICATION IMAGE */}
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
                                  ${medicamento.precio.toLocaleString('en-US')}
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
  );
};

export default PriceComparisonResults;