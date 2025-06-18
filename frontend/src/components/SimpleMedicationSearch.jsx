import React, { useState, useEffect } from 'react';

const SimpleMedicationSearch = ({ 
  onMedicationSelect, 
  selectedMedication, 
  onClearSearch,
  className = '' 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Available medications for search
  const availableMedications = [
    { name: 'paracetamol', displayName: 'Paracetamol' },
    { name: 'ibuprofeno', displayName: 'Ibuprofeno' },
    { name: 'omeprazol', displayName: 'Omeprazol' },
    { name: 'loratadina', displayName: 'Loratadina' },
    { name: 'aspirina', displayName: 'Aspirina' },
    { name: 'vitamin d3', displayName: 'Vitamin D3' },
    { name: 'acetaminofen', displayName: 'Acetaminofén' },
    { name: 'diclofenaco', displayName: 'Diclofenaco' },
    { name: 'amoxicilina', displayName: 'Amoxicilina' },
    { name: 'cetirizina', displayName: 'Cetirizina' }
  ];

  // Search for medications when search term changes
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

  // Update search term when medication is selected externally
  useEffect(() => {
    if (selectedMedication) {
      setSearchTerm(selectedMedication.charAt(0).toUpperCase() + selectedMedication.slice(1));
      setShowDropdown(false);
    }
  }, [selectedMedication]);

  const performSearch = async () => {
    setIsSearching(true);
    
    try {
      // Try to fetch from API first
      const response = await fetch(`http://localhost:5000/api/stock/search?q=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const apiResults = data.data.medications.map(med => ({
            name: med.medication,
            displayName: med.displayName
          }));
          setSearchResults(apiResults);
          setShowDropdown(true);
          setIsSearching(false);
          return;
        }
      }
    } catch (error) {
      console.log('API not available, using local search');
    }

    // Fallback to local search
    const filtered = availableMedications.filter(med =>
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setSearchResults(filtered);
    setShowDropdown(true);
    setIsSearching(false);
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
    onClearSearch();
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value === '') {
      handleClearSearch();
    }
  };

  return (
    <div className={`medication-search ${className}`}>
      <div className="search-container position-relative">
        {/* Search Input */}
        <div className="input-group">
          <span className="input-group-text bg-white border-end-0">
            <i className="bi bi-search text-muted"></i>
          </span>
          <input
            type="text"
            className="form-control border-start-0"
            placeholder="Search medications to see stock on map..."
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          />
          {(searchTerm || selectedMedication) && (
            <button 
              className="btn btn-outline-secondary" 
              type="button"
              onClick={handleClearSearch}
              title="Clear search"
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
                  onMouseDown={() => handleMedicationSelect(medication)}
                >
                  <div>
                    <i className="bi bi-capsule me-2 text-primary"></i>
                    <strong>{medication.displayName}</strong>
                  </div>
                  <small className="text-muted">
                    <i className="bi bi-geo-alt me-1"></i>
                    Check availability
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
              <span className="visually-hidden">Searching...</span>
            </div>
            Searching medications...
          </div>
        )}
      </div>

      {/* Popular Medications (when no search) */}
      {!searchTerm && !selectedMedication && (
        <div className="popular-medications mt-3">
          <h6 className="text-muted mb-2">Popular medications:</h6>
          <div className="d-flex flex-wrap gap-2">
            {['Paracetamol', 'Ibuprofeno', 'Omeprazol', 'Loratadina'].map(med => (
              <button
                key={med}
                className="btn btn-outline-primary btn-sm"
                onClick={() => handleMedicationSelect({ 
                  name: med.toLowerCase(), 
                  displayName: med 
                })}
              >
                {med}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Medication Info */}
      {selectedMedication && (
        <div className="selected-medication-info mt-3">
          <div className="alert alert-info d-flex justify-content-between align-items-center">
            <div>
              <i className="bi bi-info-circle me-2"></i>
              Showing availability for <strong>{selectedMedication}</strong>
            </div>
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={handleClearSearch}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {searchTerm.length >= 2 && searchResults.length === 0 && !isSearching && (
        <div className="no-results mt-3">
          <div className="alert alert-warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            No medications found matching "<strong>{searchTerm}</strong>"
          </div>
        </div>
      )}

      <style jsx>{`
        .search-dropdown {
          max-height: 300px;
          overflow-y: auto;
        }
        
        .search-container {
          z-index: 100;
        }
        
        .medication-search .input-group-text {
          background-color: white;
          border-color: #dee2e6;
        }
        
        .medication-search .form-control {
          border-left: none;
          border-color: #dee2e6;
        }
        
        .medication-search .form-control:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
        }
        
        .medication-search .input-group {
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }

        .popular-medications {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 12px;
        }
        
        @media (max-width: 768px) {
          .medication-search .form-control {
            font-size: 16px; /* Prevent zoom on iOS */
          }
        }
      `}</style>
    </div>
  );
};

export default SimpleMedicationSearch;