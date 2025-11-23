import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { fetchMedicamentos } from '../utils/medicationAPI';

const MedicationReminders = ({ user }) => {
  const { t } = useTranslation();
  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadReminders();
    }
  }, [user]);

  const loadReminders = async () => {
    try {
      setIsLoading(true);
      const medications = await fetchMedicamentos();
      
      // Filter medications with reminders enabled and active status
      const medicationsWithReminders = medications.filter(med => 
        med.reminder && med.status === 'active'
      );
      
      // Generate today's reminders with times
      const todayReminders = [];
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      medicationsWithReminders.forEach(medication => {
        if (medication.times && medication.times.length > 0) {
          medication.times.forEach(time => {
            const [hours, minutes] = time.split(':').map(Number);
            const reminderTime = hours * 60 + minutes;
            
            // Calculate status based on current time
            let status = 'upcoming';
            const timeDiff = reminderTime - currentTime;
            
            if (timeDiff < -30) {
              status = 'missed';
            } else if (timeDiff >= -30 && timeDiff <= 30) {
              status = 'due';
            } else if (timeDiff > 30 && timeDiff <= 120) {
              status = 'soon';
            }
            
            todayReminders.push({
              id: `${medication.id}-${time}`,
              medication: medication,
              time: time,
              timeMinutes: reminderTime,
              status: status,
              taken: false // In a real app, this would come from the database
            });
          });
        }
      });
      
      // Sort by time
      todayReminders.sort((a, b) => a.timeMinutes - b.timeMinutes);
      
      setReminders(todayReminders);
    } catch (error) {
      console.error('Error loading reminders:', error);
      setError(t('reminders.errorLoading'));
    } finally {
      setIsLoading(false);
    }
  };

  const markAsTaken = (reminderId) => {
    setReminders(prev => 
      prev.map(reminder => 
        reminder.id === reminderId 
          ? { ...reminder, taken: true, status: 'taken' }
          : reminder
      )
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'taken':
        return 'bi-check-circle-fill text-success';
      case 'due':
        return 'bi-exclamation-circle-fill text-warning';
      case 'missed':
        return 'bi-x-circle-fill text-danger';
      case 'soon':
        return 'bi-clock-fill text-info';
      default:
        return 'bi-circle text-muted';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'taken':
        return t('reminders.status.taken');
      case 'due':
        return t('reminders.status.dueNow');
      case 'missed':
        return t('reminders.status.missed');
      case 'soon':
        return t('reminders.status.dueSoon');
      default:
        return t('reminders.status.upcoming');
    }
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border spinner-border-sm me-2" role="status">
            <span className="visually-hidden">{t('common.loading')}</span>
          </div>
          {t('reminders.loadingReminders')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-warning mb-0">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-bell me-2"></i>
            {t('dashboard.todaysReminders')}
          </h5>
        </div>
        <div className="card-body text-center">
          <i className="bi bi-calendar-check text-muted" style={{ fontSize: '2rem' }}></i>
          <p className="text-muted mt-2 mb-0">{t('reminders.noRemindersToday')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="bi bi-bell me-2"></i>
          {t('dashboard.todaysReminders')}
        </h5>
        <span className="badge bg-primary">
          {reminders.filter(r => !r.taken).length} {t('reminders.pending')}
        </span>
      </div>
      <div className="card-body p-0">
        <div className="list-group list-group-flush">
          {reminders.map((reminder) => (
            <div 
              key={reminder.id} 
              className={`list-group-item d-flex justify-content-between align-items-center ${
                reminder.taken ? 'bg-light' : ''
              }`}
            >
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <i className={`bi ${getStatusIcon(reminder.status)} fs-5`}></i>
                </div>
                <div>
                  <h6 className={`mb-1 ${reminder.taken ? 'text-muted text-decoration-line-through' : ''}`}>
                    {reminder.medication.name}
                  </h6>
                  <div className="d-flex align-items-center">
                    <small className="text-muted me-3">
                      <i className="bi bi-clock me-1"></i>
                      {reminder.time}
                    </small>
                    <small className="text-muted me-3">
                      <i className="bi bi-capsule me-1"></i>
                      {reminder.medication.dosage}
                    </small>
                    <span className={`badge badge-sm ${
                      reminder.status === 'taken' ? 'bg-success' :
                      reminder.status === 'due' ? 'bg-warning' :
                      reminder.status === 'missed' ? 'bg-danger' :
                      reminder.status === 'soon' ? 'bg-info' : 'bg-secondary'
                    }`}>
                      {getStatusText(reminder.status)}
                    </span>
                  </div>
                </div>
              </div>
              
              {!reminder.taken && reminder.status !== 'upcoming' && (
                <button
                  className="btn btn-sm btn-outline-success"
                  onClick={() => markAsTaken(reminder.id)}
                  title={t('reminders.markAsTaken')}
                >
                  <i className="bi bi-check2"></i>
                </button>
              )}
            </div>
          ))}
        </div>
        
        {reminders.some(r => !r.taken) && (
          <div className="card-footer bg-light">
            <small className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              {t('reminders.tapToMarkTaken')}
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicationReminders;