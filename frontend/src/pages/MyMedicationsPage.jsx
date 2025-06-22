import React, { useState, useEffect } from 'react';

// Sample Counter component (you can replace with your actual Counter component)
const Counter = ({ initialCount = 0, maxCount = 10, label = "Cantidad", onCountChange }) => {
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
      <button className="btn btn-outline-danger btn-sm" onClick={decrement} disabled={count <= 0}>
        <i className="bi bi-dash"></i>
      </button>
      <span className="fw-bold mx-2">{count}</span>
      <button className="btn btn-outline-success btn-sm" onClick={increment} disabled={count >= maxCount}>
        <i className="bi bi-plus"></i>
      </button>
    </div>
  );
};

// Utility functions
const calculateProgress = (medication) => {
  const today = new Date();
  const startDate = new Date(medication.startDate);
  const daysPassed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  
  if (medication.duration === 0) return 0;
  return Math.min((daysPassed / medication.duration) * 100, 100);
};

const getCurrentDay = (medication) => {
  const today = new Date();
  const startDate = new Date(medication.startDate);
  return Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
};

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'success';
    case 'standby': return 'warning';
    case 'completed': return 'info';
    case 'expired': return 'danger';
    default: return 'secondary';
  }
};

const getCategoryIcon = (category) => {
  switch (category) {
    case 'prescription': return 'bi-prescription2';
    case 'supplement': return 'bi-heart-pulse';
    case 'otc': return 'bi-capsule';
    default: return 'bi-medicine';
  }
};

const getCategoryClass = (category) => {
  switch (category) {
    case 'prescription': return 'category-prescription';
    case 'supplement': return 'category-supplement';
    case 'otc': return 'category-otc';
    default: return 'category-prescription';
  }
};

const getDefaultMedicationForm = () => ({
  name: '',
  dosage: '',
  frequency: 'daily',
  times: ['08:00'],
  duration: 7,
  startDate: new Date().toISOString().split('T')[0],
  notes: '',
  reminder: true,
  category: 'prescription',
  status: 'active'
});

const getSampleMedications = () => [
  {
    id: 1,
    name: 'Paracetamol 500mg',
    dosage: '500mg',
    frequency: 'daily',
    times: ['08:00', '20:00'],
    duration: 7,
    startDate: '2025-06-10',
    progress: 4,
    category: 'prescription',
    reminder: true,
    notes: 'Take with food',
    status: 'active'
  },
  {
    id: 2,
    name: 'Vitamin D3',
    dosage: '1000 IU',
    frequency: 'daily',
    times: ['09:00'],
    duration: 30,
    startDate: '2025-06-01',
    progress: 16,
    category: 'supplement',
    reminder: true,
    notes: 'Take with breakfast',
    status: 'active'
  },
  {
    id: 3,
    name: 'Ibuprofeno 400mg',
    dosage: '400mg',
    frequency: 'as-needed',
    times: [],
    duration: 0,
    startDate: '2025-06-15',
    progress: 0,
    category: 'otc',
    reminder: false,
    notes: 'For headaches only',
    status: 'standby'
  }
];

// Components
const MedicationStats = ({ medications }) => {
  const activeMedications = medications.filter(m => m.status === 'active').length;
  const medicationsWithReminders = medications.filter(m => m.reminder).length;
  const totalDailyDoses = medications.reduce((total, med) => {
    if (med.frequency === 'daily') {
      return total + med.times.length;
    }
    return total;
  }, 0);
  const completedMedications = medications.filter(m => m.status === 'completed').length;

  const stats = [
    { icon: 'bi-activity', value: activeMedications, label: 'Active Treatments' },
    { icon: 'bi-clock', value: medicationsWithReminders, label: 'With Reminders' },
    { icon: 'bi-calendar-check', value: totalDailyDoses, label: 'Daily Doses' },
    { icon: 'bi-check-circle', value: completedMedications, label: 'Completed' }
  ];

  return (
    <div className="row mb-4">
      {stats.map((stat, index) => (
        <div key={index} className="col-md-3 mb-3">
          <div className="stat-card">
            <i className={`bi ${stat.icon} fs-2 mb-2`}></i>
            <h3 className="mb-1">{stat.value}</h3>
            <p className="mb-0">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const MedicationTabs = ({ medications, currentTab, onTabChange }) => {
  const tabs = [
    { id: 'active', label: 'Active', icon: 'bi-play-circle', count: medications.filter(m => m.status === 'active').length },
    { id: 'standby', label: 'Standby', icon: 'bi-pause-circle', count: medications.filter(m => m.status === 'standby').length },
    { id: 'completed', label: 'Completed', icon: 'bi-check-circle', count: medications.filter(m => m.status === 'completed').length },
    { id: 'all', label: 'All', icon: 'bi-list', count: medications.length }
  ];

  return (
    <div className="row mb-4">
      <div className="col-12">
        <ul className="nav nav-pills nav-justified">
          {tabs.map((tab) => (
            <li key={tab.id} className="nav-item">
              <button 
                className={`nav-link ${currentTab === tab.id ? 'active' : ''}`}
                onClick={() => onTabChange(tab.id)}
              >
                <i className={`${tab.icon} me-2`}></i>
                {tab.label} ({tab.count})
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

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

const AddMedicationCard = ({ onAddClick }) => {
  return (
    <div className="col-lg-4 col-md-6 mb-4">
      <div 
        className="card add-medication-card h-100 d-flex align-items-center justify-content-center"
        onClick={onAddClick}
      >
        <div className="text-center add-content">
          <i className="bi bi-plus-circle fs-1 mb-3"></i>
          <h5>Add New Medication</h5>
          <p className="text-muted">Start tracking a new treatment</p>
        </div>
      </div>
    </div>
  );
};

const AddMedicationModal = ({ show, onClose, onSave, formData, setFormData }) => {
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
              Add New Medication
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">
                  Medication Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Paracetamol 500mg"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Dosage</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.dosage}
                  onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                  placeholder="e.g., 500mg, 1 tablet"
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
                Enable reminders for this medication
              </label>
            </div>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
            >
              <i className="bi bi-x-circle me-1"></i>
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={onSave}
              disabled={!formData.name.trim()}
            >
              <i className="bi bi-check-circle me-1"></i>
              Add Medication
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function MyMedicationsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [user, setUser] = useState(null);
  const [medications, setMedications] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentTab, setCurrentTab] = useState('active');
  const [medicationForm, setMedicationForm] = useState(getDefaultMedicationForm());

  useEffect(() => {
    // Simulate user check and load medications
    const loggedInUser = sessionStorage.getItem('user');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
    setMedications(getSampleMedications());
  }, []);

  const handleAddMedication = () => {
    const newMedication = {
      id: Date.now(),
      ...medicationForm,
      progress: 0,
      status: 'active'
    };
    
    setMedications([...medications, newMedication]);
    setShowAddModal(false);
    setMedicationForm(getDefaultMedicationForm());
  };

  const handleEditMedication = (medication) => {
    // In a real app, this would open an edit modal
    console.log('Edit medication:', medication);
  };

  const handleDeleteMedication = (id) => {
    if (window.confirm('Are you sure you want to delete this medication?')) {
      setMedications(medications.filter(med => med.id !== id));
    }
  };

  const filteredMedications = medications.filter(med => {
    if (currentTab === 'all') return true;
    return med.status === currentTab;
  });

  if (isLoading) {
    return (
      <div className="fullscreen-loader-container">
        <div className="loader"></div>
        <p className="loading-text">{loadingMessage}</p>
      </div>
    );
  }

  return (
    <div className="my-medications-page">
      <style>{`
        .my-medications-page {
          min-height: 100vh;
          background-color: #f8f9fa;
        }

        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 15px;
          padding: 20px;
          text-align: center;
          transition: transform 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .page-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 15px;
          padding: 30px;
          margin-bottom: 30px;
        }

        .medication-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-radius: 15px;
          overflow: hidden;
        }

        .medication-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .medication-status {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 1;
        }

        .medication-icon {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
          margin-right: 15px;
          flex-shrink: 0;
        }

        .category-prescription { background: linear-gradient(135deg, #dc3545, #c82333); }
        .category-supplement { background: linear-gradient(135deg, #28a745, #20c997); }
        .category-otc { background: linear-gradient(135deg, #007bff, #0056b3); }

        .dosage-info {
          background: rgba(0,123,255,0.1);
          border-left: 4px solid #007bff;
          padding: 10px;
          margin: 10px 0;
          border-radius: 0 8px 8px 0;
        }

        .reminder-badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          margin: 2px;
          border-radius: 12px;
        }

        .treatment-progress {
          background: linear-gradient(90deg, #28a745, #20c997);
          height: 8px;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .add-medication-card {
          border: 2px dashed #dee2e6;
          background: transparent;
          cursor: pointer;
          transition: all 0.3s ease;
          min-height: 200px;
          border-radius: 15px;
        }

        .add-medication-card:hover {
          border-color: #007bff;
          background: rgba(0,123,255,0.05);
          transform: translateY(-2px);
        }

        .add-content {
          color: #6c757d;
          transition: color 0.3s ease;
        }

        .add-medication-card:hover .add-content {
          color: #007bff;
        }

        .quick-actions .btn {
          border-radius: 25px;
          padding: 8px 16px;
          margin: 2px;
          transition: all 0.2s ease;
        }

        .quick-actions .btn:hover {
          transform: scale(1.05);
        }

        .modal-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 15px 15px 0 0;
        }

        .modal-content {
          border-radius: 15px;
          border: none;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .form-control:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }

        .form-select:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }

        .schedule-item {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 10px;
          margin: 5px 0;
          transition: all 0.2s ease;
        }

        .schedule-item:hover {
          background: #e9ecef;
          border-color: #007bff;
        }

        .nav-pills .nav-link {
          border-radius: 25px;
          margin: 0 5px;
          transition: all 0.3s ease;
        }

        .nav-pills .nav-link.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6c757d;
        }

        .empty-state i {
          font-size: 4rem;
          margin-bottom: 20px;
          opacity: 0.5;
        }

        .fullscreen-loader-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: #f5f5f5;
          z-index: 1000;
        }

        .loading-text {
          margin-top: 20px;
          font-size: 18px;
          color: #25b09b;
        }

        .loader {
          width: 40px;
          height: 40px;
          position: relative;
          --c: no-repeat linear-gradient(#25b09b 0 0);
          background:
            var(--c) center/100% 10px,
            var(--c) center/10px 100%;
        }

        .loader:before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            var(--c) 0    0,
            var(--c) 100% 0,
            var(--c) 0    100%,
            var(--c) 100% 100%;
          background-size: 15.5px 15.5px;
          animation: l16 1.5s infinite cubic-bezier(0.3,1,0,1);
        }

        @keyframes l16 {
          33%  {inset:-10px;transform: rotate(0deg)}
          66%  {inset:-10px;transform: rotate(90deg)}
          100% {inset:0    ;transform: rotate(90deg)}
        }

        @media (max-width: 768px) {
          .stat-card {
            margin-bottom: 15px;
          }
          
          .page-header {
            padding: 20px;
            text-align: center;
          }
          
          .nav-pills {
            flex-direction: column;
          }
          
          .nav-pills .nav-link {
            margin: 5px 0;
          }
        }
      `}</style>
      
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
                <li className="nav-item">
                  <a className="nav-link" href="/profile">
                    <i className="bi bi-person-circle me-1"></i>
                    {user.nombre}
                  </a>
                </li>
              )}
              <li className="nav-item">
                <a className="nav-link" href="/">
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

export default MyMedicationsPage;