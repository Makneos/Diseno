import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const AddMedicationCard = ({ onAddClick }) => {
  const { t } = useTranslation();

  return (
    <div className="col-lg-4 col-md-6 mb-4">
      <div 
        className="card add-medication-card h-100 d-flex align-items-center justify-content-center"
        onClick={onAddClick}
      >
        <div className="text-center add-content">
          <i className="bi bi-plus-circle fs-1 mb-3"></i>
          <h5>{t('medications.addMedication')}</h5>
          <p className="text-muted">{t('medications.startTracking')}</p>
        </div>
      </div>
    </div>
  );
};

export default AddMedicationCard;