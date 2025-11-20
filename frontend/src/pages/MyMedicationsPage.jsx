import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthGuard, { useAuth } from '../components/AuthGuard';
import { useTranslation } from '../hooks/useTranslation';
import MedicationStats from '../components/MedicationStats';
import MedicationTabs from '../components/MedicationTabs';
import MedicationCard from '../components/MedicationCard';
import AddMedicationCard from '../components/AddMedicationCard';
import AddMedicationModal from '../components/AddMedicationModal';
import { 
  fetchMedicamentos, 
  addMedicamento, 
  deleteMedicamento,
  getDefaultMedicationForm 
} from '../utils/medicationAPI';
import '../styles/MyMedicationsPage.css';

function MyMedicationsPageContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [medications, setMedications] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentTab, setCurrentTab] = useState('active');
  const [medicationForm, setMedicationForm] = useState(getDefaultMedicationForm());
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // ✅ SOLUCIÓN CORRECTA: Solo llamar el hook, sin parámetros
  const { t } = useTranslation();

  // Load medications on mount
  useEffect(() => {
    const loadData = async () => {
      setIsPageLoading(true);
      
      console.log('🔄 Loading medications for authenticated user:', user?.nombre);
      
      try {
        const medicamentosData = await fetchMedicamentos();
        
        if (medicamentosData && medicamentosData.length > 0) {
          console.log('✅ Medications loaded from database:', medicamentosData.length);
          setMedications(medicamentosData);
        } else {
          console.log('ℹ️ No medications found in database');
          setMedications([]);
        }
      } catch (error) {
        console.error('❌ Error loading medications:', error);
        setError(t('medications.errorLoading'));
      }

      setIsPageLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user]); // ✅ Solo depende de user

  const handleAddMedication = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('📝 Adding medication:', medicationForm.name);
      const success = await addMedicamento(medicationForm);
      
      if (success) {
        setShowAddModal(false);
        setMedicationForm(getDefaultMedicationForm());
        
        const updatedMedications = await fetchMedicamentos();
        setMedications(updatedMedications);
        
        console.log('✅ Medication added and list updated');
      } else {
        setError(t('medications.errorAdding'));
      }
    } catch (error) {
      console.error('❌ Error in handleAddMedication:', error);
      setError(t('medications.errorOccurred'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMedication = (medication) => {
    console.log('✏️ Edit medication:', medication);
    alert(t('medications.editComingSoon'));
  };

  const handleDeleteMedication = async (medication) => {
    const confirmMessage = t('medications.confirmDelete').replace('{name}', medication.name);
    if (window.confirm(confirmMessage)) {
      console.log('🗑️ Deleting medication:', medication.name);
      
      try {
        const success = await deleteMedicamento(medication.tratamiento_id);
        
        if (success) {
          const updatedMedications = await fetchMedicamentos();
          setMedications(updatedMedications);
          console.log('✅ Medication deleted and list updated');
        } else {
          console.error('❌ Failed to delete medication');
          setError(t('medications.errorDeleting'));
        }
      } catch (error) {
        console.error('❌ Error deleting medication:', error);
        setError(t('medications.errorOccurred'));
      }
    }
  };

  const handleNavigation = (e, path, message) => {
    e.preventDefault();
    setLoadingMessage(message);
    setIsLoading(true);

    setTimeout(() => {
      navigate(path);
      setIsLoading(false);
    }, 1500);
  };

  const handleLogout = () => {
    if (window.confirm(t('medications.confirmLogout'))) {
      logout();
    }
  };

  const filteredMedications = medications.filter(med => {
    if (currentTab === 'all') return true;
    return med.status === currentTab;
  });

  if (isPageLoading) {
    return (
      <div className="fullscreen-loader-container">
        <div className="loader"></div>
        <p className="loading-text">{t('medications.loading')}</p>
      </div>
    );
  }

  if (isLoading && loadingMessage) {
    return (
      <div className="fullscreen-loader-container">
        <div className="loader"></div>
        <p className="loading-text">{loadingMessage}</p>
      </div>
    );
  }

  return (
    <div className="my-medications-page">
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
        <div className="container">
          <a className="navbar-brand fw-bold text-primary" href="/">
            <i className="bi bi-heart-pulse me-2"></i>
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
              {user && (
                <li className="nav-item dropdown">
                  <a 
                    className="nav-link dropdown-toggle" 
                    href="#" 
                    id="navbarDropdown" 
                    role="button" 
                    data-bs-toggle="dropdown"
                  >
                    <i className="bi bi-person-circle me-1"></i>
                    {user.nombre}
                  </a>
                  <ul className="dropdown-menu">
                    <li>
                      <a className="dropdown-item" href="/profile">
                        <i className="bi bi-person me-2"></i>
                        {t('nav.profile')}
                      </a>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i>
                        {t('nav.logout')}
                      </button>
                    </li>
                  </ul>
                </li>
              )}
              <li className="nav-item">
                <a className="nav-link" href="/" onClick={(e) => handleNavigation(e, '/', t('loading.refreshing'))}>
                  <i className="bi bi-house-door me-1"></i>
                  {t('nav.home')}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container py-4">
        {/* Header */}
        <div className="page-header">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="mb-2">
                <i className="bi bi-prescription2 me-2"></i>
                {t('medications.myMedications')}
              </h1>
              <p className="mb-0 opacity-75">
                {t('medications.manage')}
              </p>
            </div>
            <button 
              className="btn btn-light btn-lg"
              onClick={() => setShowAddModal(true)}
            >
              <i className="bi bi-plus-circle me-2"></i>
              {t('medications.addMedication')}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger alert-dismissible" role="alert">
            {error}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setError('')}
              aria-label={t('common.close')}
            ></button>
          </div>
        )}

        {/* Quick Stats */}
        <MedicationStats medications={medications} />

        {/* Tabs */}
        <MedicationTabs 
          medications={medications}
          currentTab={currentTab}
          onTabChange={setCurrentTab}
        />

        {/* Medications Grid */}
        <div className="row">
          {currentTab === 'active' && (
            <AddMedicationCard onAddClick={() => setShowAddModal(true)} />
          )}

          {filteredMedications.map((medication) => (
            <MedicationCard
              key={medication.id}
              medication={medication}
              onEdit={handleEditMedication}
              onDelete={handleDeleteMedication}
            />
          ))}

          {filteredMedications.length === 0 && currentTab !== 'active' && (
            <div className="col-12">
              <div className="empty-state">
                <i className="bi bi-inbox"></i>
                <h5>{t('medications.noMedications')}</h5>
                <p>{t('medications.addToStartTracking')}</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowAddModal(true)}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  {t('medications.addFirst')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="row mt-5">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body">
                <h4 className="card-title">
                  <i className="bi bi-lightbulb me-2 text-warning"></i>
                  {t('medications.tipsTitle')}
                </h4>
                <div className="row mt-3">
                  <div className="col-md-4 mb-3">
                    <div className="d-flex">
                      <div className="flex-shrink-0">
                        <i className="bi bi-clock-fill text-primary fs-4"></i>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h5>{t('medications.tipRegularTitle')}</h5>
                        <p className="text-muted">{t('medications.tipRegularDesc')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="d-flex">
                      <div className="flex-shrink-0">
                        <i className="bi bi-bell-fill text-success fs-4"></i>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h5>{t('medications.tipRemindersTitle')}</h5>
                        <p className="text-muted">{t('medications.tipRemindersDesc')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="d-flex">
                      <div className="flex-shrink-0">
                        <i className="bi bi-journal-medical text-info fs-4"></i>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h5>{t('medications.tipTrackTitle')}</h5>
                        <p className="text-muted">{t('medications.tipTrackDesc')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Medication Modal */}
      <AddMedicationModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddMedication}
        formData={medicationForm}
        setFormData={setMedicationForm}
        isLoading={isLoading}
      />

      {/* Footer */}
      <footer className="bg-dark text-light py-4 mt-5">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h5>
                <i className="bi bi-heart-pulse me-2"></i>
                {t('nav.brand')}
              </h5>
              <p className="mb-0">{t('footer.description')}</p>
            </div>
            <div className="col-md-6 text-md-end">
              <p className="mb-0">© 2025 {t('nav.brand')}. {t('footer.rights')}</p>
              <small className="text-muted">
                {t('medications.disclaimer')}
              </small>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function MyMedicationsPage() {
  return (
    <AuthGuard>
      <MyMedicationsPageContent />
    </AuthGuard>
  );
}

export default MyMedicationsPage;