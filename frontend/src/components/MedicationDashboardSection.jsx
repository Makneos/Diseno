import React from 'react';
import { useNavigate } from 'react-router-dom';
import MedicationReminders from './MedicationReminders';
import QuickStatsDashboard from './QuickStatsDashboard';
import UpcomingDosesWidget from './UpcomingDosesWidget';

// CSS para los componentes del dashboard
const dashboardStyles = `
  .stat-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    border: none;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }
  
  .stat-value {
    font-size: 2rem;
    font-weight: bold;
  }
  
  .stat-title {
    font-size: 0.9rem;
    font-weight: 600;
  }
  
  .list-group-item {
    border-left: none;
    border-right: none;
  }
  
  .list-group-item:first-child {
    border-top: none;
  }
  
  .list-group-item:last-child {
    border-bottom: none;
  }
  
  .badge-sm {
    font-size: 0.7rem;
    padding: 0.2rem 0.4rem;
  }
  
  .health-dashboard {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 15px;
    padding: 2rem;
    margin: 2rem 0;
  }
  
  .dashboard-header {
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
    color: white;
    border-radius: 10px;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .quick-action-btn {
    transition: all 0.2s ease;
  }
  
  .quick-action-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  @media (max-width: 768px) {
    .stat-value {
      font-size: 1.5rem;
    }
    
    .stat-title {
      font-size: 0.8rem;
    }
    
    .health-dashboard {
      padding: 1rem;
      margin: 1rem 0;
    }
    
    .dashboard-header {
      padding: 1rem;
    }
  }
`;

const MedicationDashboardSection = ({ user }) => {
  const navigate = useNavigate();

  if (!user) {
    return null; // Don't render anything if user is not logged in
  }

  return (
    <>
      <style>{dashboardStyles}</style>
      <div className="health-dashboard">
        <div className="container">
          {/* Dashboard Header */}
          <div className="dashboard-header">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="fw-bold mb-1">
                  <i className="bi bi-heart-pulse me-2"></i>
                  Health Dashboard
                </h2>
                <p className="mb-0 opacity-90">Welcome back, {user.nombre}! Manage your medications and track your health</p>
              </div>
              <button
                className="btn btn-light btn-lg"
                onClick={() => navigate('/my-meds')}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Manage Medications
              </button>
            </div>
          </div>

          {/* Quick Stats Row */}
          <QuickStatsDashboard user={user} />

          {/* Main Dashboard Content */}
          <div className="row mt-4">
            {/* Left Column - Medication Reminders */}
            <div className="col-lg-8 mb-4">
              <MedicationReminders user={user} />
            </div>

            {/* Right Column - Upcoming Doses & Quick Actions */}
            <div className="col-lg-4 mb-4">
              <UpcomingDosesWidget user={user} />
              
              {/* Quick Actions Card */}
              <div className="card mt-3 shadow-sm">
                <div className="card-header bg-primary text-white">
                  <h6 className="mb-0">
                    <i className="bi bi-lightning me-2"></i>
                    Quick Actions
                  </h6>
                </div>
                <div className="card-body">
                  <div className="d-grid gap-2">
                    <button
                      className="btn btn-outline-primary btn-sm quick-action-btn"
                      onClick={() => navigate('/my-meds')}
                    >
                      <i className="bi bi-plus me-2"></i>
                      Add Medication
                    </button>
                    <button
                      className="btn btn-outline-success btn-sm quick-action-btn"
                      onClick={() => navigate('/price-comparison')}
                    >
                      <i className="bi bi-graph-up me-2"></i>
                      Compare Prices
                    </button>
                    <button
                      className="btn btn-outline-info btn-sm quick-action-btn"
                      onClick={() => navigate('/GoogleMapsComponent')}
                    >
                      <i className="bi bi-geo-alt me-2"></i>
                      Find Pharmacies
                    </button>
                  </div>
                </div>
              </div>

              {/* Health Reminder Card */}
              <div className="card mt-3 border-warning">
                <div className="card-body text-center">
                  <i className="bi bi-shield-check text-warning mb-2" style={{ fontSize: '2rem' }}></i>
                  <h6 className="card-title">Health Reminder</h6>
                  <p className="card-text small text-muted">
                    Remember to consult your doctor before making any changes to your medication regimen.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Health Tips Section */}
          <div className="row mt-4">
            <div className="col-12">
              <div className="card bg-gradient" style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
                <div className="card-body">
                  <h5 className="card-title text-primary">
                    <i className="bi bi-lightbulb me-2"></i>
                    Daily Health Tips
                  </h5>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <div className="d-flex align-items-start">
                        <div className="flex-shrink-0">
                          <i className="bi bi-droplet-fill text-info me-2" style={{ fontSize: '1.5rem' }}></i>
                        </div>
                        <div>
                          <h6 className="mb-1">Stay Hydrated</h6>
                          <small className="text-muted">Drink water regularly, especially when taking medications. Proper hydration helps your body absorb medications effectively.</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <div className="d-flex align-items-start">
                        <div className="flex-shrink-0">
                          <i className="bi bi-clock-fill text-success me-2" style={{ fontSize: '1.5rem' }}></i>
                        </div>
                        <div>
                          <h6 className="mb-1">Consistent Timing</h6>
                          <small className="text-muted">Take medications at the same time daily to maintain consistent levels in your system.</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <div className="d-flex align-items-start">
                        <div className="flex-shrink-0">
                          <i className="bi bi-journal-medical text-primary me-2" style={{ fontSize: '1.5rem' }}></i>
                        </div>
                        <div>
                          <h6 className="mb-1">Track Symptoms</h6>
                          <small className="text-muted">Note any side effects or improvements to discuss with your healthcare provider.</small>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Tips Row */}
                  <hr className="my-3" />
                  <div className="row">
                    <div className="col-md-6 mb-2">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-moon-stars text-purple me-2"></i>
                        <small><strong>Sleep Well:</strong> Good sleep helps your body heal and process medications</small>
                      </div>
                    </div>
                    <div className="col-md-6 mb-2">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-heart text-danger me-2"></i>
                        <small><strong>Stay Active:</strong> Regular exercise supports overall health and medication effectiveness</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MedicationDashboardSection;