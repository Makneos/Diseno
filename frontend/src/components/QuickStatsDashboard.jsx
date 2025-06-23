import React, { useState, useEffect } from 'react';
import { fetchMedicamentos } from '../utils/medicationAPI';

const QuickStatsDashboard = ({ user }) => {
  const [stats, setStats] = useState({
    activeMedications: 0,
    todayDoses: 0,
    upcomingReminders: 0,
    completedTreatments: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const medications = await fetchMedicamentos();
      
      const activeMeds = medications.filter(med => med.status === 'active');
      const completedMeds = medications.filter(med => med.status === 'completed');
      
      // Calculate today's total doses
      const todayDoses = activeMeds.reduce((total, med) => {
        if (med.frequency === 'daily' && med.times) {
          return total + med.times.length;
        }
        return total;
      }, 0);
      
      // Calculate upcoming reminders (next 2 hours)
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const upcomingCount = activeMeds.reduce((count, med) => {
        if (!med.reminder || !med.times) return count;
        
        return count + med.times.filter(time => {
          const [hours, minutes] = time.split(':').map(Number);
          const reminderTime = hours * 60 + minutes;
          const timeDiff = reminderTime - currentTime;
          return timeDiff > 0 && timeDiff <= 120; // Next 2 hours
        }).length;
      }, 0);
      
      setStats({
        activeMedications: activeMeds.length,
        todayDoses: todayDoses,
        upcomingReminders: upcomingCount,
        completedTreatments: completedMeds.length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="row">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="col-6 col-md-3 mb-3">
            <div className="card">
              <div className="card-body text-center">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: 'Active Treatments',
      value: stats.activeMedications,
      icon: 'bi-activity',
      color: 'primary',
      description: 'medications in progress'
    },
    {
      title: "Today's Doses",
      value: stats.todayDoses,
      icon: 'bi-calendar-check',
      color: 'success',
      description: 'scheduled for today'
    },
    {
      title: 'Upcoming Reminders',
      value: stats.upcomingReminders,
      icon: 'bi-bell',
      color: 'warning',
      description: 'in next 2 hours'
    },
    {
      title: 'Completed',
      value: stats.completedTreatments,
      icon: 'bi-check-circle',
      color: 'info',
      description: 'treatments finished'
    }
  ];

  return (
    <div className="row">
      {statsData.map((stat, index) => (
        <div key={index} className="col-6 col-md-3 mb-3">
          <div className="card h-100 stat-card">
            <div className="card-body text-center">
              <div className={`stat-icon mb-2 text-${stat.color}`}>
                <i className={`bi ${stat.icon}`} style={{ fontSize: '2rem' }}></i>
              </div>
              <h3 className={`stat-value text-${stat.color} mb-1`}>
                {stat.value}
              </h3>
              <h6 className="stat-title mb-1">{stat.title}</h6>
              <small className="text-muted">{stat.description}</small>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuickStatsDashboard;