import React from 'react';
import { 
  calculateProgress, 
  getCurrentDay, 
  getStatusColor, 
  getCategoryIcon, 
  getCategoryClass 
} from '../utils/medicationUtils';

const MedicationCard = ({ medication, onEdit, onDelete }) => {
  const progress = calculateProgress(medication);
  const currentDay = getCurrentDay(medication);

  return (
    <div className="col-lg-4 col-md-6 mb-4">
      <div className="card medication-card h-100">
        <div className="medication-status">
          <span className={`badge bg-${getStatusColor(medication.status)}`}>
            {medication.status}
          </span>
        </div>
        
        <div className="card-body">
          <div className="d-flex align-items-start mb-3">
            <div className={`medication-icon ${getCategoryClass(medication.category)}`}>
              <i className={`bi ${getCategoryIcon(medication.category)}`}></i>
            </div>
            <div className="flex-grow-1">
              <h5 className="card-title mb-1">{medication.name}</h5>
              <p className="text-muted mb-0">{medication.dosage}</p>
            </div>
          </div>

          <div className="dosage-info">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold">Schedule</span>
              <small className="text-muted">{medication.frequency}</small>
            </div>
            {medication.times.length > 0 && (
              <div className="d-flex flex-wrap gap-1">
                {medication.times.map((time, index) => (
                  <span key={index} className="badge bg-primary reminder-badge">
                    {time}
                  </span>
                ))}
              </div>
            )}
          </div>

          {medication.duration > 0 && (
            <div className="mt-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small text-muted">Treatment Progress</span>
                <span className="small fw-bold">{Math.round(progress)}%</span>
              </div>
              <div className="progress" style={{ height: '8px' }}>
                <div 
                  className="treatment-progress" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <small className="text-muted">
                Day {currentDay} of {medication.duration}
              </small>
            </div>
          )}

          {medication.notes && (
            <div className="mt-3">
              <small className="text-muted">
                <i className="bi bi-sticky me-1"></i>
                {medication.notes}
              </small>
            </div>
          )}
        </div>

        <div className="card-footer bg-light">
          <div className="quick-actions d-flex justify-content-between">
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={() => onEdit(medication)}
              title="Edit medication"
            >
              <i className="bi bi-pencil"></i>
            </button>
            
            {medication.reminder && (
              <button 
                className="btn btn-outline-success btn-sm"
                title="Reminders enabled"
              >
                <i className="bi bi-bell"></i>
              </button>
            )}
            
            <button 
              className="btn btn-outline-info btn-sm"
              title="View details"
            >
              <i className="bi bi-eye"></i>
            </button>
            
            <button 
              className="btn btn-outline-danger btn-sm"
              onClick={() => onDelete(medication.id)}
              title="Delete medication"
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicationCard;