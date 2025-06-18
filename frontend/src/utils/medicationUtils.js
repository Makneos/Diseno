/**
 * Calculate the progress percentage of a medication treatment
 * @param {Object} medication - The medication object
 * @returns {number} Progress percentage (0-100)
 */
export const calculateProgress = (medication) => {
  const today = new Date();
  const startDate = new Date(medication.startDate);
  const daysPassed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  
  if (medication.duration === 0) return 0;
  return Math.min((daysPassed / medication.duration) * 100, 100);
};

/**
 * Get the current day of treatment
 * @param {Object} medication - The medication object
 * @returns {number} Current day number
 */
export const getCurrentDay = (medication) => {
  const today = new Date();
  const startDate = new Date(medication.startDate);
  return Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Get the appropriate color class for medication status
 * @param {string} status - The medication status
 * @returns {string} Bootstrap color class
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'success';
    case 'standby': return 'warning';
    case 'completed': return 'info';
    case 'expired': return 'danger';
    default: return 'secondary';
  }
};

/**
 * Get the appropriate icon for medication category
 * @param {string} category - The medication category
 * @returns {string} Bootstrap icon class
 */
export const getCategoryIcon = (category) => {
  switch (category) {
    case 'prescription': return 'bi-prescription2';
    case 'supplement': return 'bi-heart-pulse';
    case 'otc': return 'bi-capsule';
    default: return 'bi-medicine';
  }
};

/**
 * Get the appropriate CSS class for medication category
 * @param {string} category - The medication category
 * @returns {string} CSS class name
 */
export const getCategoryClass = (category) => {
  switch (category) {
    case 'prescription': return 'category-prescription';
    case 'supplement': return 'category-supplement';
    case 'otc': return 'category-otc';
    default: return 'category-prescription';
  }
};

/**
 * Check if a medication is due for next dose
 * @param {Object} medication - The medication object
 * @returns {boolean} True if medication is due
 */
export const isMedicationDue = (medication) => {
  if (medication.frequency === 'as-needed' || medication.times.length === 0) {
    return false;
  }
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  return medication.times.some(time => {
    const [hours, minutes] = time.split(':').map(Number);
    const medicationTime = hours * 60 + minutes;
    // Consider medication due if within 30 minutes
    return Math.abs(currentTime - medicationTime) <= 30;
  });
};

/**
 * Get the next scheduled dose time for a medication
 * @param {Object} medication - The medication object
 * @returns {string|null} Next dose time or null
 */
export const getNextDoseTime = (medication) => {
  if (medication.frequency === 'as-needed' || medication.times.length === 0) {
    return null;
  }
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  // Find next time today
  const todayTimes = medication.times
    .map(time => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    })
    .filter(time => time > currentTime)
    .sort((a, b) => a - b);
  
  if (todayTimes.length > 0) {
    const nextTime = todayTimes[0];
    const hours = Math.floor(nextTime / 60);
    const minutes = nextTime % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  // If no more times today, return first time tomorrow
  const tomorrowTimes = medication.times
    .map(time => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    })
    .sort((a, b) => a - b);
  
  if (tomorrowTimes.length > 0) {
    const nextTime = tomorrowTimes[0];
    const hours = Math.floor(nextTime / 60);
    const minutes = nextTime % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} (tomorrow)`;
  }
  
  return null;
};

/**
 * Filter medications by status
 * @param {Array} medications - Array of medications
 * @param {string} status - Status to filter by
 * @returns {Array} Filtered medications
 */
export const filterMedicationsByStatus = (medications, status) => {
  if (status === 'all') return medications;
  return medications.filter(med => med.status === status);
};

/**
 * Calculate total daily doses for all medications
 * @param {Array} medications - Array of medications
 * @returns {number} Total daily doses
 */
export const getTotalDailyDoses = (medications) => {
  return medications.reduce((total, med) => {
    if (med.frequency === 'daily') {
      return total + med.times.length;
    }
    return total;
  }, 0);
};

/**
 * Generate default form data for new medication
 * @returns {Object} Default medication form data
 */
export const getDefaultMedicationForm = () => ({
  name: '',
  dosage: '',
  frequency: 'daily',
  times: ['08:00'],
  duration: 7,
  startDate: new Date().toISOString().split('T')[0],
  notes: '',
  reminder: true,
  category: 'prescription'
});

/**
 * Validate medication form data
 * @param {Object} formData - Form data to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateMedicationForm = (formData) => {
  const errors = {};
  
  if (!formData.name.trim()) {
    errors.name = 'Medication name is required';
  }
  
  if (formData.frequency !== 'as-needed' && formData.times.length === 0) {
    errors.times = 'At least one time is required for scheduled medications';
  }
  
  if (formData.duration < 0) {
    errors.duration = 'Duration cannot be negative';
  }
  
  const startDate = new Date(formData.startDate);
  if (isNaN(startDate.getTime())) {
    errors.startDate = 'Valid start date is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Format medication frequency for display
 * @param {string} frequency - Frequency value
 * @returns {string} Formatted frequency text
 */
export const formatFrequency = (frequency) => {
  switch (frequency) {
    case 'daily': return 'Daily';
    case 'weekly': return 'Weekly';
    case 'as-needed': return 'As needed';
    default: return frequency;
  }
};

/**
 * Check if medication treatment is completed
 * @param {Object} medication - The medication object
 * @returns {boolean} True if treatment is completed
 */
export const isTreatmentCompleted = (medication) => {
  if (medication.duration === 0) return false;
  
  const today = new Date();
  const startDate = new Date(medication.startDate);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + medication.duration);
  
  return today >= endDate;
};

/**
 * Get sample medications for demo purposes
 * @returns {Array} Array of sample medications
 */
export const getSampleMedications = () => [
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
  },
  {
    id: 4,
    name: 'Omeprazol 20mg',
    dosage: '20mg',
    frequency: 'daily',
    times: ['07:30'],
    duration: 14,
    startDate: '2025-05-20',
    progress: 100,
    category: 'prescription',
    reminder: true,
    notes: 'Take before breakfast',
    status: 'completed'
  }
];