import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const MedicationTabs = ({ medications, currentTab, onTabChange }) => {
  const { t } = useTranslation();

  const tabs = [
    {
      id: 'active',
      label: t('medications.status.active'),
      icon: 'bi-play-circle',
      count: medications.filter(m => m.status === 'active').length
    },
    {
      id: 'standby',
      label: t('medications.status.standby'),
      icon: 'bi-pause-circle',
      count: medications.filter(m => m.status === 'standby').length
    },
    {
      id: 'completed',
      label: t('medications.status.completed'),
      icon: 'bi-check-circle',
      count: medications.filter(m => m.status === 'completed').length
    },
    {
      id: 'all',
      label: t('medications.all'),
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