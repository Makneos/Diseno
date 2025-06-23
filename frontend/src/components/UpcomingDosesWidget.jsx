import React, { useState, useEffect } from 'react';
import { fetchMedicamentos } from '../utils/medicationAPI';

const UpcomingDosesWidget = ({ user }) => {
  const [upcomingDoses, setUpcomingDoses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUpcomingDoses();
      
      // Update every minute to keep times current
      const interval = setInterval(loadUpcomingDoses, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUpcomingDoses = async () => {
    try {
      setIsLoading(true);
      const medications = await fetchMedicamentos();
      
      const activeMeds = medications.filter(med => 
        med.status === 'active' && med.times && med.times.length > 0
      );
      
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      const upcoming = [];
      
      activeMeds.forEach(medication => {
        medication.times.forEach(time => {
          const [hours, minutes] = time.split(':').map(Number);
          const reminderTime = hours * 60 + minutes;
          
          // Only show upcoming doses (within next 6 hours)
          const timeDiff = reminderTime - currentTime;
          if (timeDiff > 0 && timeDiff <= 360) {
            upcoming.push({
              id: `${medication.id}-${time}`,
              medication: medication,
              time: time,
              timeMinutes: reminderTime,
              timeDiff: timeDiff,
              timeUntil: formatTimeUntil(timeDiff)
            });
          }
        });
      });
      
      // Sort by time and take next 3
      upcoming.sort((a, b) => a.timeDiff - b.timeDiff);
      setUpcomingDoses(upcoming.slice(0, 3));
    } catch (error) {
      console.error('Error loading upcoming doses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeUntil = (minutes) => {
    if (minutes < 60) {
      return `in ${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `in ${hours}h ${mins}m` : `in ${hours}h`;
    }
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border spinner-border-sm me-2" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          Loading upcoming doses...
        </div>
      </div>
    );
  }

  if (upcomingDoses.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">
            <i className="bi bi-clock me-2"></i>
            Next Doses
          </h6>
        </div>
        <div className="card-body text-center">
          <i className="bi bi-check-circle text-success" style={{ fontSize: '2rem' }}></i>
          <p className="text-muted mt-2 mb-0 small">No upcoming doses in the next 6 hours</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h6 className="mb-0">
          <i className="bi bi-clock me-2"></i>
          Next Doses
        </h6>
      </div>
      <div className="card-body p-0">
        <div className="list-group list-group-flush">
          {upcomingDoses.map((dose, index) => (
            <div key={dose.id} className="list-group-item">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <div className={`me-3 ${index === 0 ? 'text-warning' : 'text-muted'}`}>
                    <i className={`bi ${index === 0 ? 'bi-bell-fill' : 'bi-clock'}`}></i>
                  </div>
                  <div>
                    <div className="fw-medium">{dose.medication.name}</div>
                    <small className="text-muted">
                      {dose.medication.dosage}
                    </small>
                  </div>
                </div>
                <div className="text-end">
                  <div className="fw-medium">{dose.time}</div>
                  <small className={`${index === 0 ? 'text-warning' : 'text-muted'}`}>
                    {dose.timeUntil}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpcomingDosesWidget;