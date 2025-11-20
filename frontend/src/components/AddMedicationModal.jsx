import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { searchMedications } from '../utils/medicationAPI';

// Counter component inline
const Counter = ({ initialCount = 0, maxCount = 10, onCountChange }) => {
  const { t } = useTranslation();
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
        aria-label={t('counter.decrease')}
      >
        <i className="bi bi-dash"></i>
      </button>
      <span className="fw-bold mx-2">{count}</span>
      <button 
        className="btn btn-outline-success btn-sm" 
        onClick={increment} 
        disabled={count >= maxCount}
        type="button"
        aria-label={t('counter.increase')}
      >
        <i className="bi bi-plus"></i>
      </button>
    </div>
  );
};

const AddMedicationModal = ({ show, onClose, onSave, formData, setFormData, isLoading }) => {
  const { t } = useTranslation();
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Buscar medicamentos cuando cambie el nombre
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (formData.name.length >= 2) {
        setIsSearching(true);
        console.log('🔍 Searching medications for:', formData.name);
        
        try {
          const results = await searchMedications(formData.name);
          console.log('📋 Search results:', results);
          
          setSearchResults(results || []);
          setShowDropdown((results || []).length > 0);
        } catch (error) {
          console.error('❌ Search error:', error);
          setSearchResults([]);
          setShowDropdown(false);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [formData.name]);

  const selectMedication = (medication) => {
    console.log('✅ Selected medication:', medication);
    
    setFormData({
      ...formData,
      name: medication.nombre,
      dosage: '',
      category: medication.es_generico ? 'otc' : 'prescription'
    });
    setShowDropdown(false);
    setSearchResults([]);
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

  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-plus-circle me-2"></i>
              {t('medicationModal.addTitle')}
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={isLoading}
              aria-label={t('common.close')}
            ></button>
          </div>
          <div className="modal-body">
            <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    {t('medicationModal.medicationName')} <span className="text-danger">*</span>
                  </label>
                  <div className="position-relative">
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder={t('medicationModal.searchPlaceholder')}
                      disabled={isLoading}
                      required
                      autoComplete="off"
                    />
                    
                    {/* Loading indicator */}
                    {isSearching && (
                      <div className="position-absolute top-50 end-0 translate-middle-y pe-3">
                        <div className="spinner-border spinner-border-sm" role="status">
                          <span className="visually-hidden">{t('medicationModal.searching')}</span>
                        </div>
                      </div>
                    )}

                    {/* Search results dropdown */}
                    {showDropdown && searchResults.length > 0 && (
                      <div className="position-absolute w-100 mt-1 bg-white border rounded shadow-lg" style={{ zIndex: 1000 }}>
                        <div className="list-group list-group-flush" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {searchResults.slice(0, 5).map((medication) => (
                            <button
                              key={medication.id}
                              type="button"
                              className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                              onClick={() => selectMedication(medication)}
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
                                  <span className="badge bg-success">{t('medicationModal.generic')}</span>
                                ) : (
                                  <span className="badge bg-info">{t('medicationModal.brand')}</span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                        <div className="p-2 border-top bg-light">
                          <small className="text-muted">
                            <i className="bi bi-info-circle me-1"></i>
                            {t('medicationModal.selectHint')}
                          </small>
                        </div>
                      </div>
                    )}

                    {/* No results message */}
                    {formData.name.length >= 2 && !isSearching && searchResults.length === 0 && (
                      <div className="position-absolute w-100 mt-1 bg-white border rounded shadow p-3">
                        <div className="text-center text-muted">
                          <i className="bi bi-info-circle me-2"></i>
                          {t('medicationModal.noResults').replace('{name}', formData.name)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">{t('medicationModal.dosage')}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.dosage}
                    onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                    placeholder={t('medicationModal.dosagePlaceholder')}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">{t('medicationModal.category')}</label>
                  <select
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    disabled={isLoading}
                  >
                    <option value="prescription">{t('medicationModal.prescription')}</option>
                    <option value="otc">{t('medicationModal.otc')}</option>
                    <option value="supplement">{t('medicationModal.supplement')}</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">{t('medicationModal.frequency')}</label>
                  <select
                    className="form-select"
                    value={formData.frequency}
                    onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                    disabled={isLoading}
                  >
                    <option value="daily">{t('medicationModal.daily')}</option>
                    <option value="weekly">{t('medicationModal.weekly')}</option>
                    <option value="as-needed">{t('medicationModal.asNeeded')}</option>
                  </select>
                </div>
              </div>

              {formData.frequency !== 'as-needed' && (
                <div className="mb-3">
                  <label className="form-label">{t('medicationModal.dailySchedule')}</label>
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
                          aria-label={t('common.delete')}
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
                    <i className="bi bi-plus"></i> {t('medicationModal.addTimeSlot')}
                  </button>
                </div>
              )}

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">{t('medicationModal.startDate')}</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">{t('medicationModal.duration')}</label>
                  <Counter
                    initialCount={formData.duration}
                    maxCount={365}
                    onCountChange={(count) => setFormData({...formData, duration: count})}
                  />
                  <small className="text-muted d-block mt-1">{t('medicationModal.durationHint')}</small>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">{t('medicationModal.notes')}</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder={t('medicationModal.notesPlaceholder')}
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
                  {t('medicationModal.enableReminders')}
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
              {t('common.cancel')}
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
                  {t('medicationModal.adding')}
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-1"></i>
                  {t('medicationModal.addButton')}
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