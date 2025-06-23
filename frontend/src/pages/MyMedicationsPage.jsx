import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthGuard, { useAuth } from '../components/AuthGuard';
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
        setError('Failed to load medications. Please refresh the page.');
      }

      setIsPageLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const handleAddMedication = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('📝 Adding medication:', medicationForm.name);
      const success = await addMedicamento(medicationForm);
      
      if (success) {
        setShowAddModal(false);
        setMedicationForm(getDefaultMedicationForm());
        
        // Reload medications
        console.log('🔄 Reloading medications after adding...');
        const updatedMedications = await fetchMedicamentos();
        setMedications(updatedMedications);
        
        console.log('✅ Medication added and list updated');
      } else {
        setError('Failed to add medication. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error in handleAddMedication:', error);
      setError('An error occurred while adding the medication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMedication = (medication) => {
    console.log('✏️ Edit medication:', medication);
    // TODO: Implement edit functionality
    alert('Edit functionality will be implemented soon!');
  };

  const handleDeleteMedication = async (medication) => {
    if (window.confirm(`Are you sure you want to delete "${medication.name}"?`)) {
      console.log('🗑️ Deleting medication:', medication.name);
      
      try {
        const success = await deleteMedicamento(medication.tratamiento_id);
        
        if (success) {
          console.log('🔄 Reloading medications after deletion...');
          const updatedMedications = await fetchMedicamentos();
          setMedications(updatedMedications);
          
          console.log('✅ Medication deleted and list updated');
        } else {
          console.error('❌ Failed to delete medication');
          setError('Failed to delete medication. Please try again.');
        }
      } catch (error) {
        console.error('❌ Error deleting medication:', error);
        setError('An error occurred while deleting the medication.');
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
    if (window.confirm('Are you sure you want to log out?')) {
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
        <p className="loading-text">Loading your medications...</p>
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
                        Profile
                      </a>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i>
                        Logout
                      </button>
                    </li>
                  </ul>
                </li>
              )}
              <li className="nav-item">
                <a className="nav-link" href="/" onClick={(e) => handleNavigation(e, '/', 'Going home...')}>
                  <i className="bi bi-house-door me-1"></i>
                  Home
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
                My Medications
              </h1>
              <p className="mb-0 opacity-75">
                Manage your treatments and medication schedule
              </p>
            </div>
            <button 
              className="btn btn-light btn-lg"
              onClick={() => setShowAddModal(true)}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Add Medication
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
          {/* Add New Medication Card - only show in active tab */}
          {currentTab === 'active' && (
            <AddMedicationCard onAddClick={() => setShowAddModal(true)} />
          )}

          {/* Medication Cards */}
          {filteredMedications.map((medication) => (
            <MedicationCard
              key={medication.id}
              medication={medication}
              onEdit={handleEditMedication}
              onDelete={handleDeleteMedication}
            />
          ))}

          {/* Empty State */}
          {filteredMedications.length === 0 && currentTab !== 'active' && (
            <div className="col-12">
              <div className="empty-state">
                <i className="bi bi-inbox"></i>
                <h5>No medications in this category</h5>
                <p>Add some medications to start tracking your treatments</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowAddModal(true)}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Add Your First Medication
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
                  Tips for Managing Your Medications
                </h4>
                <div className="row mt-3">
                  <div className="col-md-4 mb-3">
                    <div className="d-flex">
                      <div className="flex-shrink-0">
                        <i className="bi bi-clock-fill text-primary fs-4"></i>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h5>Set Regular Times</h5>
                        <p className="text-muted">Take medications at the same time each day to maintain consistent levels.</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="d-flex">
                      <div className="flex-shrink-0">
                        <i className="bi bi-bell-fill text-success fs-4"></i>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h5>Enable Reminders</h5>
                        <p className="text-muted">Use our reminder system to never miss a dose of your important medications.</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="d-flex">
                      <div className="flex-shrink-0">
                        <i className="bi bi-journal-medical text-info fs-4"></i>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h5>Track Progress</h5>
                        <p className="text-muted">Monitor your treatment progress and note any side effects or improvements.</p>
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
                Farmafia
              </h5>
              <p className="mb-0">Your trusted platform for pharmaceutical services and medication management.</p>
            </div>
            <div className="col-md-6 text-md-end">
              <p className="mb-0">© 2025 Farmafia. All rights reserved.</p>
              <small className="text-muted">
                Always consult with healthcare professionals before making changes to your medication regimen.
              </small>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Main component wrapped with AuthGuard
function MyMedicationsPage() {
  return (
    <AuthGuard>
      <MyMedicationsPageContent />
    </AuthGuard>
  );
}

export default MyMedicationsPage;