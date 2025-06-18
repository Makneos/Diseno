import React from 'react';

const MedicationTabs = ({ medications, currentTab, onTabChange }) => {
  const tabs = [
    {
      id: 'active',
      label: 'Active',
      icon: 'bi-play-circle',
      count: medications.filter(m => m.status === 'active').length
    },
    {
      id: 'standby',
      label: 'Standby',
      icon: 'bi-pause-circle',
      count: medications.filter(m => m.status === 'standby').length
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: 'bi-check-circle',
      count: medications.filter(m => m.status === 'completed').length
    },
    {
      id: 'all',
      label: 'All',
      icon: 'bi-list',
      count: medications.length
    }
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

export default MedicationTabs;