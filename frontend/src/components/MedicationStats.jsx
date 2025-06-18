import React from 'react';
import { getTotalDailyDoses } from '../utils/medicationUtils';

const MedicationStats = ({ medications }) => {
  const activeMedications = medications.filter(m => m.status === 'active').length;
  const medicationsWithReminders = medications.filter(m => m.reminder).length;
  const totalDailyDoses = getTotalDailyDoses(medications);
  const completedMedications = medications.filter(m => m.status === 'completed').length;

  const stats = [
    {
      icon: 'bi-activity',
      value: activeMedications,
      label: 'Active Treatments',
      color: 'primary'
    },
    {
      icon: 'bi-clock',
      value: medicationsWithReminders,
      label: 'With Reminders',
      color: 'success'
    },
    {
      icon: 'bi-calendar-check',
      value: totalDailyDoses,
      label: 'Daily Doses',
      color: 'info'
    },
    {
      icon: 'bi-check-circle',
      value: completedMedications,
      label: 'Completed',
      color: 'secondary'
    }
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

export default MedicationStats;