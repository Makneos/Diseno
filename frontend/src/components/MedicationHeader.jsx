import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import MedicationImage from './MedicationImage';

const MedicationHeader = ({ selectedMedication }) => {
  const { t } = useTranslation();

  return (
    <div className="row mb-5">
      <div className="col-12">
        <div className="card shadow">
          <div className="card-header bg-primary text-white">
            <h2 className="mb-0">
              <i className="bi bi-capsule me-2"></i>
              {t('medicationHeader.title')}
            </h2>
          </div>
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-md-3">
                <div style={{ width: '150px', height: '150px', margin: '0 auto' }}>
                  <MedicationImage 
                    src={selectedMedication.imagen_url} 
                    alt={selectedMedication.nombre}
                    className="w-100 h-100"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <h3 className="mb-3">{selectedMedication.nombre}</h3>
                <div className="medication-details">
                  <p className="mb-2">
                    <strong>{t('medicationHeader.activeIngredient')}:</strong> 
                    <span className="badge bg-info ms-2">{selectedMedication.principio_activo}</span>
                  </p>
                  <p className="mb-2">
                    <strong>{t('medicationHeader.type')}:</strong> 
                    {selectedMedication.es_generico ? (
                      <span className="badge bg-success ms-2">{t('medicationModal.generic')}</span>
                    ) : (
                      <span className="badge bg-primary ms-2">{t('medicationModal.brand')}</span>
                    )}
                  </p>
                  <p className="mb-0">
                    <strong>{t('medicationHeader.medicationId')}:</strong> 
                    <code className="ms-2">{selectedMedication.id}</code>
                  </p>
                </div>
              </div>
              <div className="col-md-3 text-md-end">
                <div className="text-muted">
                  <i className="bi bi-clock me-1"></i>
                  {t('medicationHeader.lastUpdate')}: {new Date().toLocaleDateString()}
                </div>
                <div className="mt-2">
                  <span className="badge bg-secondary">
                    {t('medicationHeader.comparing')} "{selectedMedication.principio_activo}"
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicationHeader;