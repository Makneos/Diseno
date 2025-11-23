import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import Counter from '../Counter';
import { validateMedicationForm } from '../utils/medicationUtils';

const EditMedicationModal = ({ 
  show, 
  onClose, 
  onSave, 
  formData, 
  setFormData,
  selectedMedication 
}) => {
  const { t } = useTranslation();
  
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

  const handleSave = () => {
    const validation = validateMedicationForm(formData);
    if (validation.isValid) {
      onSave();
    } else {
      console.log('Validation errors:', validation.errors);
    }
  };

  const updateStatus = (newStatus) => {
    setFormData({
      ...formData,
      status: newStatus
    });
  };

  if (!show || !selectedMedication) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-pencil me-2"></i>
              {t('medicationModal.editTitle')}
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <div>
              {/* Status Controls */}
              <div className="mb-4">
                <label className="form-label">{t('medications.status.title')}</label>
                <div className="btn-group w-100" role="group">
                  <input 
                    type="radio" 
                    className="btn-check" 
                    name="status" 
                    id="status-active" 
                    value="active"
                    checked={formData.status === 'active'}
                    onChange={(e) => updateStatus(e.target.value)}
                  />
                  <label className="btn btn-outline-success" htmlFor="status-active">
                    <i className="bi bi-play-circle me-1"></i>
                    {t('medications.status.active')}
                  </label>

                  <input 
                    type="radio" 
                    className="btn-check" 
                    name="status" 
                    id="status-standby" 
                    value="standby"
                    checked={formData.status === 'standby'}
                    onChange={(e) => updateStatus(e.target.value)}
                  />
                  <label className="btn btn-outline-warning" htmlFor="status-standby">
                    <i className="bi bi-pause-circle me-1"></i>
                    {t('medications.status.standby')}
                  </label>

                  <input 
                    type="radio" 
                    className="btn-check" 
                    name="status" 
                    id="status-completed" 
                    value="completed"
                    checked={formData.status === 'completed'}
                    onChange={(e) => updateStatus(e.target.value)}
                  />
                  <label className="btn btn-outline-info" htmlFor="status-completed">
                    <i className="bi bi-check-circle me-1"></i>
                    {t('medications.status.completed')}
                  </label>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    {t('medicationModal.medicationName')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder={t('medicationModal.dosagePlaceholder')}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">{t('medicationModal.dosage')}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.dosage}
                    onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                    placeholder={t('medicationModal.dosagePlaceholder')}
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
                        className="form-control me-2 time-slot-input"
                        value={time}
                        onChange={(e) => updateTimeSlot(index, e.target.value)}
                      />
                      {formData.times.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removeTimeSlot(index)}
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
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">{t('medicationModal.duration')}</label>
                  <Counter
                    initialCount={formData.duration}
                    maxCount={365}
                    label=""
                    onCountChange={(count) => setFormData({...formData, duration: count})}
                  />
                  <small className="text-muted">{t('medicationModal.durationHint')}</small>
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
                ></textarea>
              </div>

              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={formData.reminder}
                  onChange={(e) => setFormData({...formData, reminder: e.target.checked})}
                />
                <label className="form-check-label">
                  <i className="bi bi-bell me-1"></i>
                  {t('medicationModal.enableReminders')}
                </label>
              </div>

              {/* Progress Information */}
              {formData.duration > 0 && (
                <div className="mt-4 p-3 bg-light rounded">
                  <h6 className="mb-3">
                    <i className="bi bi-graph-up me-2"></i>
                    {t('medications.treatmentProgress')}
                  </h6>
                  <div className="row">
                    <div className="col-md-6">
                      <small className="text-muted">{t('medications.daysCompleted')}:</small>
                      <div className="fw-bold">
                        {Math.floor((new Date() - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1} / {formData.duration}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <small className="text-muted">{t('medications.progress')}:</small>
                      <div className="fw-bold">
                        {Math.min(Math.round(((new Date() - new Date(formData.startDate)) / (1000 * 60 * 60 * 24) + 1) / formData.duration * 100), 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
            >
              <i className="bi bi-x-circle me-1"></i>
              {t('common.cancel')}
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!formData.name.trim()}
            >
              <i className="bi bi-check-circle me-1"></i>
              {t('medicationModal.saveChanges')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditMedicationModal;