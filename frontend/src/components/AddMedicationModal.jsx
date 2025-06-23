import React, { useState, useEffect } from 'react';

// Counter component inline
const Counter = ({ initialCount = 0, maxCount = 10, onCountChange }) => {
  const [count, setCount] = useState(initialCount);

  const increment = () => {
    if (count < maxCount) {
      const newCount = count + 1;
      setCount(newCount);
      if (onCountChange) onCountChange(newCount);
    }
  };

  const decrement = () => {
    if (count > 0) {
      const newCount = count - 1;
      setCount(newCount);
      if (onCountChange) onCountChange(newCount);
    }
  };

  return (
    <div className="d-flex align-items-center gap-2">
      <button 
        className="btn btn-outline-danger btn-sm" 
        onClick={decrement} 
        disabled={count <= 0}
        type="button"
      >
        <i className="bi bi-dash"></i>
      </button>
      <span className="fw-bold mx-2">{count}</span>
      <button 
        className="btn btn-outline-success btn-sm" 
        onClick={increment} 
        disabled={count >= maxCount}
        type="button"
      >
        <i className="bi bi-plus"></i>
      </button>
    </div>
  );
};

// Función para buscar medicamentos
const searchMedicamentos = async (query) => {
  if (!query || query.length < 2) return [];
  
  try {
    const response = await fetch(`http://localhost:5000/api/medicamentos/buscar?q=${encodeURIComponent(query)}`);
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('Error searching medications:', error);
  }
  return [];
};

const AddMedicationModal = ({ show, onClose, onSave, formData, setFormData, isLoading }) => {
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Buscar medicamentos cuando cambie el nombre
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (formData.name.length >= 2) {
        setIsSearching(true);
        try {
          const results = await searchMedicamentos(formData.name);
          setSearchResults(results);
          setShowDropdown(results.length > 0);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
          setShowDropdown(false);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [formData.name]);

  // Reset search when modal closes
  useEffect(() => {
    if (!show) {
      setSearchResults([]);
      setShowDropdown(false);
      setIsSearching(false);
    }
  }, [show]);

  const selectMedication = (medication) => {
    setFormData({
      ...formData,
      name: medication.nombre,
      dosage: '', // El usuario puede especificar la dosis
      category: medication.es_generico ? 'otc' : 'prescription'
    });
    setShowDropdown(false);
    setSearchResults([]);
    setIsSearching(false);
  };

  const addTimeSlot = () => {
    setFormData({
      ...formData,
      times: [...formData.times, '08:00']
    });
  };

  const removeTimeSlot = (index) => {
    const newTimes = formData.times.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      times: newTimes
    });
  };

  const updateTimeSlot = (index, time) => {
    const newTimes = [...formData.times];
    newTimes[index] = time;
    setFormData({
      ...formData,
      times: newTimes
    });
  };

  const handleInputChange = (value) => {
    setFormData({ ...formData, name: value });
    
    // Si el input se vacía, limpiar todo inmediatamente
    if (!value) {
      setSearchResults([]);
      setShowDropdown(false);
      setIsSearching(false);
    }
  };

  const handleInputFocus = () => {
    if (searchResults.length > 0 && !isSearching) {
      setShowDropdown(true);
    }
  };

  const handleInputBlur = () => {
    // Delay para permitir clicks en el dropdown
    setTimeout(() => {
      setShowDropdown(false);
    }, 150);
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-plus-circle me-2"></i>
              Add New Medication
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={isLoading}
            ></button>
          </div>
          <div className="modal-body">
            <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Medication Name <span className="text-danger">*</span>
                  </label>
                  <div className="position-relative">
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      placeholder="Start typing to search medications..."
                      disabled={isLoading}
                      required
                      autoComplete="off"
                    />
                    
                    {/* Loading indicator */}
                    {isSearching && (
                      <div className="position-absolute top-50 end-0 translate-middle-y pe-3">
                        <div className="spinner-border spinner-border-sm" role="status">
                          <span className="visually-hidden">Searching...</span>
                        </div>
                      </div>
                    )}

                    {/* Search results dropdown */}
                    {showDropdown && searchResults.length > 0 && !isSearching && (
                      <div className="position-absolute w-100 mt-1 bg-white border rounded shadow-lg" style={{ zIndex: 1000 }}>
                        <div className="list-group list-group-flush" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {searchResults.slice(0, 5).map((medication) => (
                            <button
                              key={medication.id}
                              type="button"
                              className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                              onMouseDown={() => selectMedication(medication)}
                            >
                              <div className="d-flex align-items-center">
                                <i className="bi bi-capsule me-2 text-primary"></i>
                                <div>
                                  <div className="fw-medium">{medication.nombre}</div>
                                  <small className="text-muted">{medication.principio_activo}</small>
                                </div>
                              </div>
                              <div>
                                {medication.es_generico ? (
                                  <span className="badge bg-success">Generic</span>
                                ) : (
                                  <span className="badge bg-info">Brand</span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                        <div className="p-2 border-top bg-light">
                          <small className="text-muted">
                            <i className="bi bi-info-circle me-1"></i>
                            Click to select a medication or continue typing to add a new one
                          </small>
                        </div>
                      </div>
                    )}

                    {/* No results message */}
                    {formData.name.length >= 2 && !isSearching && searchResults.length === 0 && (
                      <div className="position-absolute w-100 mt-1 bg-white border rounded shadow p-3">
                        <div className="text-center text-muted">
                          <i className="bi bi-info-circle me-2"></i>
                          No medications found. You can add "{formData.name}" as a new medication.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Dosage</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.dosage}
                    onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                    placeholder="e.g., 500mg, 1 tablet"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    disabled={isLoading}
                  >
                    <option value="prescription">Prescription</option>
                    <option value="otc">Over-the-counter</option>
                    <option value="supplement">Supplement</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Frequency</label>
                  <select
                    className="form-select"
                    value={formData.frequency}
                    onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                    disabled={isLoading}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="as-needed">As needed</option>
                  </select>
                </div>
              </div>

              {formData.frequency !== 'as-needed' && (
                <div className="mb-3">
                  <label className="form-label">Daily Schedule</label>
                  {formData.times.map((time, index) => (
                    <div key={index} className="schedule-item d-flex align-items-center mb-2">
                      <input
                        type="time"
                        className="form-control me-2"
                        value={time}
                        onChange={(e) => updateTimeSlot(index, e.target.value)}
                        disabled={isLoading}
                      />
                      {formData.times.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removeTimeSlot(index)}
                          disabled={isLoading}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm mt-2"
                    onClick={addTimeSlot}
                    disabled={isLoading}
                  >
                    <i className="bi bi-plus"></i> Add Time Slot
                  </button>
                </div>
              )}

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Treatment Duration (days)</label>
                  <Counter
                    initialCount={formData.duration}
                    maxCount={365}
                    onCountChange={(count) => setFormData({...formData, duration: count})}
                  />
                  <small className="text-muted d-block mt-1">Set to 0 for ongoing treatments</small>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Special instructions, side effects to watch for, etc."
                  disabled={isLoading}
                ></textarea>
              </div>

              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={formData.reminder}
                  onChange={(e) => setFormData({...formData, reminder: e.target.checked})}
                  disabled={isLoading}
                  id="reminderCheck"
                />
                <label className="form-check-label" htmlFor="reminderCheck">
                  <i className="bi bi-bell me-1"></i>
                  Enable reminders for this medication
                </label>
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              <i className="bi bi-x-circle me-1"></i>
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={onSave}
              disabled={!formData.name.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Adding...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-1"></i>
                  Add Medication
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMedicationModal;