import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import pharmacyStockService from '../services/PharmacyStockService';

const MedicationSearchMap = ({ 
  onMedicationSelect, 
  selectedMedication, 
  onClearSearch,
  className = '' 
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [availableMedications, setAvailableMedications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [availabilityInfo, setAvailabilityInfo] = useState(null);

  useEffect(() => {
    loadAvailableMedications();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        performSearch();
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  useEffect(() => {
    if (selectedMedication) {
      loadAvailabilityInfo(selectedMedication);
      setSearchTerm(selectedMedication);
      setShowDropdown(false);
    }
  }, [selectedMedication]);

  const loadAvailableMedications = async () => {
    try {
      const response = await pharmacyStockService.getAllMedications();
      if (response.success) {
        setAvailableMedications(response.data);
      }
    } catch (error) {
      console.error('Error loading medications:', error);
    }
  };

  const performSearch = () => {
    setIsSearching(true);
    
    const filtered = availableMedications.filter(med =>
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setSearchResults(filtered);
    setShowDropdown(true);
    setIsSearching(false);
  };

  const loadAvailabilityInfo = async (medicationName) => {
    try {
      const response = await pharmacyStockService.searchMedicationAvailability(medicationName);
      if (response.success) {
        setAvailabilityInfo(response.data);
      }
    } catch (error) {
      console.error('Error loading availability info:', error);
    }
  };

  const handleMedicationSelect = (medication) => {
    setSearchTerm(medication.displayName);
    setShowDropdown(false);
    onMedicationSelect(medication.name);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowDropdown(false);
    setAvailabilityInfo(null);
    onClearSearch();
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value === '') {
      handleClearSearch();
    }
  };

  const getAvailabilityBadge = (pharmacies) => {
    const inStock = pharmacies.filter(p => p.stockInfo.level !== 'out').length;
    const total = pharmacies.length;
    
    if (inStock === 0) {
      return <span className="badge bg-danger">{t('priceComparison.notAvailable')}</span>;
    } else if (inStock === total) {
      return <span className="badge bg-success">{t('pharmacyMap.availableAt')} {total} {t('pharmacyMap.pharmacies')}</span>;
    } else {
      return <span className="badge bg-warning">{t('pharmacyMap.availableAt')} {inStock}/{total} {t('pharmacyMap.pharmacies')}</span>;
    }
  };

  return (
    <div className={`medication-search-map ${className}`}>
      <div className="search-container position-relative">
        {/* Search Input */}
        <div className="input-group">
          <span className="input-group-text bg-white border-end-0">
            <i className="bi bi-search text-muted"></i>
          </span>
          <input
            type="text"
            className="form-control border-start-0"
            placeholder={t('pharmacyMap.searchPlaceholder')}
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
          />
          {(searchTerm || selectedMedication) && (
            <button 
              className="btn btn-outline-secondary" 
              type="button"
              onClick={handleClearSearch}
              title={t('pharmacyMap.clearSearch')}
            >
              <i className="bi bi-x"></i>
            </button>
          )}
        </div>

        {/* Search Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className="search-dropdown position-absolute w-100 mt-1 bg-white border rounded shadow-lg" style={{ zIndex: 1000 }}>
            <div className="list-group list-group-flush">
              {searchResults.slice(0, 5).map((medication, index) => (
                <button
                  key={index}
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                  onClick={() => handleMedicationSelect(medication)}
                >
                  <div>
                    <i className="bi bi-capsule me-2 text-primary"></i>
                    <strong>{medication.displayName}</strong>
                  </div>
                  <small className="text-muted">
                    {medication.availablePharmacies} {t('pharmacyMap.pharmacies')}
                  </small>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="search-loading position-absolute w-100 mt-1 bg-white border rounded shadow-sm p-3 text-center">
            <div className="spinner-border spinner-border-sm me-2" role="status">
              <span className="visually-hidden">{t('priceComparison.searching')}</span>
            </div>
            {t('priceComparison.searching')}
          </div>
        )}
      </div>

      {/* Selected Medication Info */}
      {selectedMedication && availabilityInfo && (
        <div className="selected-medication-info mt-3">
          <div className="card">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h6 className="card-title mb-0">
                  <i className="bi bi-capsule me-2 text-primary"></i>
                  {selectedMedication.charAt(0).toUpperCase() + selectedMedication.slice(1)}
                </h6>
                {getAvailabilityBadge(availabilityInfo.pharmacies)}
              </div>
              
              <p className="card-text small text-muted mb-3">
                {t('pharmacyMap.showingIn')} {availabilityInfo.totalPharmacies} {t('pharmacyMap.nearbyPharmacies')}
              </p>

              {/* Quick Pharmacy List */}
              <div className="pharmacy-quick-list">
                {availabilityInfo.pharmacies.slice(0, 3).map((pharmacy, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center py-1">
                    <div className="d-flex align-items-center">
                      <div 
                        className="pharmacy-indicator rounded-circle me-2"
                        style={{
                          width: '8px',
                          height: '8px',
                          backgroundColor: pharmacy.stockColor
                        }}
                      ></div>
                      <small className="fw-medium">{pharmacy.pharmacyInfo.name}</small>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <small style={{ color: pharmacy.stockColor }}>
                        {pharmacy.stockLabel}
                      </small>
                      {pharmacy.stockInfo.price && (
                        <small className="text-primary fw-bold">
                          ${Math.round(pharmacy.stockInfo.price / 1000)}k
                        </small>
                      )}
                    </div>
                  </div>
                ))}
                
                {availabilityInfo.pharmacies.length > 3 && (
                  <small className="text-muted">
                    +{availabilityInfo.pharmacies.length - 3} {t('pharmacyMap.morePlaces')}
                  </small>
                )}
              </div>

              {/* Legend */}
              <div className="legend mt-3 pt-2 border-top">
                <small className="text-muted">{t('pharmacyMap.legend')}</small>
                <div className="d-flex flex-wrap gap-2 mt-1">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle me-1" style={{ width: '8px', height: '8px', backgroundColor: '#28a745' }}></div>
                    <small>{t('pharmacyMap.inStock')}</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle me-1" style={{ width: '8px', height: '8px', backgroundColor: '#ffc107' }}></div>
                    <small>{t('pharmacyMap.limited')}</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle me-1" style={{ width: '8px', height: '8px', backgroundColor: '#fd7e14' }}></div>
                    <small>{t('pharmacyMap.lowStock')}</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle me-1" style={{ width: '8px', height: '8px', backgroundColor: '#dc3545' }}></div>
                    <small>{t('pharmacyMap.outOfStock')}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {searchTerm.length >= 2 && searchResults.length === 0 && !isSearching && (
        <div className="no-results mt-3">
          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            {t('pharmacyMap.noResults')} "<strong>{searchTerm}</strong>"
          </div>
        </div>
      )}

      {/* Popular Medications (when no search) */}
      {!searchTerm && !selectedMedication && (
        <div className="popular-medications mt-3">
          <h6 className="text-muted">{t('pharmacyMap.popularMedications')}</h6>
          <div className="d-flex flex-wrap gap-2">
            {['paracetamol', 'ibuprofeno', 'omeprazol', 'loratadina'].map(med => (
              <button
                key={med}
                className="btn btn-outline-primary btn-sm"
                onClick={() => handleMedicationSelect({ name: med, displayName: med.charAt(0).toUpperCase() + med.slice(1) })}
              >
                {med.charAt(0).toUpperCase() + med.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .search-dropdown {
          max-height: 300px;
          overflow-y: auto;
        }
        
        .pharmacy-quick-list {
          max-height: 150px;
          overflow-y: auto;
        }
        
        .search-container {
          z-index: 100;
        }
        
        .medication-search-map .input-group-text {
          background-color: white;
        }
        
        .medication-search-map .form-control {
          border-left: none;
        }
        
        .medication-search-map .form-control:focus {
          border-color: #0d6efd;
          box-shadow: none;
        }
        
        .legend {
          font-size: 0.75rem;
        }
        
        @media (max-width: 768px) {
          .legend .d-flex {
            flex-direction: column;
            gap: 0.25rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MedicationSearchMap;