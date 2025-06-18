// stockData.js - Mock data for pharmacy stock simulation

/**
 * Stock levels simulation data
 * In a real application, this would come from pharmacy APIs
 */

// Stock levels enum
export const STOCK_LEVELS = {
  HIGH: 'high',        // > 20 units
  MEDIUM: 'medium',    // 5-20 units  
  LOW: 'low',          // 1-4 units
  OUT_OF_STOCK: 'out', // 0 units
  UNKNOWN: 'unknown'   // No data available
};

// Stock level colors for UI
export const STOCK_COLORS = {
  [STOCK_LEVELS.HIGH]: '#28a745',      // Green
  [STOCK_LEVELS.MEDIUM]: '#ffc107',    // Yellow
  [STOCK_LEVELS.LOW]: '#fd7e14',       // Orange
  [STOCK_LEVELS.OUT_OF_STOCK]: '#dc3545', // Red
  [STOCK_LEVELS.UNKNOWN]: '#6c757d'    // Gray
};

// Stock level labels
export const STOCK_LABELS = {
  [STOCK_LEVELS.HIGH]: 'In Stock',
  [STOCK_LEVELS.MEDIUM]: 'Limited Stock',
  [STOCK_LEVELS.LOW]: 'Low Stock',
  [STOCK_LEVELS.OUT_OF_STOCK]: 'Out of Stock',
  [STOCK_LEVELS.UNKNOWN]: 'Stock Unknown'
};

// Sample medications with stock across different pharmacies
export const MEDICATION_STOCK = {
  // Popular medications
  'paracetamol': {
    'ahumada': {
      level: STOCK_LEVELS.HIGH,
      quantity: 45,
      lastUpdated: new Date().toISOString(),
      price: 2500
    },
    'cruz verde': {
      level: STOCK_LEVELS.MEDIUM,
      quantity: 12,
      lastUpdated: new Date().toISOString(),
      price: 2200
    },
    'salcobrand': {
      level: STOCK_LEVELS.LOW,
      quantity: 3,
      lastUpdated: new Date().toISOString(),
      price: 2800
    }
  },
  'ibuprofeno': {
    'ahumada': {
      level: STOCK_LEVELS.MEDIUM,
      quantity: 18,
      lastUpdated: new Date().toISOString(),
      price: 3500
    },
    'cruz verde': {
      level: STOCK_LEVELS.HIGH,
      quantity: 32,
      lastUpdated: new Date().toISOString(),
      price: 3200
    },
    'salcobrand': {
      level: STOCK_LEVELS.OUT_OF_STOCK,
      quantity: 0,
      lastUpdated: new Date().toISOString(),
      price: null
    }
  },
  'omeprazol': {
    'ahumada': {
      level: STOCK_LEVELS.LOW,
      quantity: 4,
      lastUpdated: new Date().toISOString(),
      price: 8500
    },
    'cruz verde': {
      level: STOCK_LEVELS.MEDIUM,
      quantity: 15,
      lastUpdated: new Date().toISOString(),
      price: 7800
    },
    'salcobrand': {
      level: STOCK_LEVELS.HIGH,
      quantity: 28,
      lastUpdated: new Date().toISOString(),
      price: 8200
    }
  },
  'loratadina': {
    'ahumada': {
      level: STOCK_LEVELS.HIGH,
      quantity: 35,
      lastUpdated: new Date().toISOString(),
      price: 4200
    },
    'cruz verde': {
      level: STOCK_LEVELS.LOW,
      quantity: 2,
      lastUpdated: new Date().toISOString(),
      price: 3900
    },
    'salcobrand': {
      level: STOCK_LEVELS.MEDIUM,
      quantity: 11,
      lastUpdated: new Date().toISOString(),
      price: 4500
    }
  },
  'aspirina': {
    'ahumada': {
      level: STOCK_LEVELS.OUT_OF_STOCK,
      quantity: 0,
      lastUpdated: new Date().toISOString(),
      price: null
    },
    'cruz verde': {
      level: STOCK_LEVELS.HIGH,
      quantity: 42,
      lastUpdated: new Date().toISOString(),
      price: 2800
    },
    'salcobrand': {
      level: STOCK_LEVELS.MEDIUM,
      quantity: 16,
      lastUpdated: new Date().toISOString(),
      price: 3100
    }
  },
  'vitamin d3': {
    'ahumada': {
      level: STOCK_LEVELS.MEDIUM,
      quantity: 14,
      lastUpdated: new Date().toISOString(),
      price: 12500
    },
    'cruz verde': {
      level: STOCK_LEVELS.MEDIUM,
      quantity: 19,
      lastUpdated: new Date().toISOString(),
      price: 11800
    },
    'salcobrand': {
      level: STOCK_LEVELS.HIGH,
      quantity: 33,
      lastUpdated: new Date().toISOString(),
      price: 12900
    }
  }
};

// Pharmacy locations (enhanced with additional info)
export const PHARMACY_LOCATIONS = {
  'ahumada': {
    name: 'Farmacias Ahumada',
    color: '#dc3545', // Red
    icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
    workingHours: '24/7',
    phone: '+56 2 1234 5678',
    services: ['Delivery', 'Online Orders', 'Health Consultation']
  },
  'cruz verde': {
    name: 'Cruz Verde',
    color: '#28a745', // Green  
    icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
    workingHours: '08:00 - 22:00',
    phone: '+56 2 8765 4321',
    services: ['Delivery', 'Health Consultation', 'Vaccination']
  },
  'salcobrand': {
    name: 'Salcobrand',
    color: '#007bff', // Blue
    icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    workingHours: '09:00 - 21:00', 
    phone: '+56 2 5555 1234',
    services: ['Online Orders', 'Health Consultation', 'Beauty Products']
  }
};

/**
 * Simulate stock level changes over time
 * This function would typically be called by a background service
 */
export const simulateStockChanges = () => {
  Object.keys(MEDICATION_STOCK).forEach(medication => {
    Object.keys(MEDICATION_STOCK[medication]).forEach(pharmacy => {
      const stock = MEDICATION_STOCK[medication][pharmacy];
      
      // Random chance of stock change (10%)
      if (Math.random() < 0.1) {
        // Simulate stock being sold or restocked
        const change = Math.floor(Math.random() * 10) - 5; // -5 to +5
        const newQuantity = Math.max(0, stock.quantity + change);
        
        // Update quantity and level
        stock.quantity = newQuantity;
        stock.lastUpdated = new Date().toISOString();
        
        // Update stock level based on new quantity
        if (newQuantity === 0) {
          stock.level = STOCK_LEVELS.OUT_OF_STOCK;
          stock.price = null;
        } else if (newQuantity <= 4) {
          stock.level = STOCK_LEVELS.LOW;
        } else if (newQuantity <= 20) {
          stock.level = STOCK_LEVELS.MEDIUM;
        } else {
          stock.level = STOCK_LEVELS.HIGH;
        }
      }
    });
  });
};

/**
 * Get stock information for a specific medication and pharmacy
 */
export const getStockInfo = (medicationName, pharmacyName) => {
  const normalizedMedication = medicationName.toLowerCase().trim();
  const normalizedPharmacy = pharmacyName.toLowerCase().trim();
  
  if (MEDICATION_STOCK[normalizedMedication] && 
      MEDICATION_STOCK[normalizedMedication][normalizedPharmacy]) {
    return MEDICATION_STOCK[normalizedMedication][normalizedPharmacy];
  }
  
  // Return unknown stock if not found
  return {
    level: STOCK_LEVELS.UNKNOWN,
    quantity: null,
    lastUpdated: new Date().toISOString(),
    price: null
  };
};

/**
 * Get all medications available at a specific pharmacy
 */
export const getPharmacyInventory = (pharmacyName) => {
  const normalizedPharmacy = pharmacyName.toLowerCase().trim();
  const inventory = {};
  
  Object.keys(MEDICATION_STOCK).forEach(medication => {
    if (MEDICATION_STOCK[medication][normalizedPharmacy]) {
      inventory[medication] = MEDICATION_STOCK[medication][normalizedPharmacy];
    }
  });
  
  return inventory;
};

/**
 * Search for pharmacies that have a specific medication in stock
 */
export const findPharmaciesWithStock = (medicationName) => {
  const normalizedMedication = medicationName.toLowerCase().trim();
  const pharmaciesWithStock = [];
  
  if (MEDICATION_STOCK[normalizedMedication]) {
    Object.keys(MEDICATION_STOCK[normalizedMedication]).forEach(pharmacy => {
      const stock = MEDICATION_STOCK[normalizedMedication][pharmacy];
      if (stock.level !== STOCK_LEVELS.OUT_OF_STOCK) {
        pharmaciesWithStock.push({
          pharmacy: pharmacy,
          pharmacyInfo: PHARMACY_LOCATIONS[pharmacy],
          stockInfo: stock
        });
      }
    });
  }
  
  return pharmaciesWithStock.sort((a, b) => b.stockInfo.quantity - a.stockInfo.quantity);
};

/**
 * Get stock level statistics
 */
export const getStockStatistics = () => {
  let totalMedications = 0;
  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;
  
  Object.keys(MEDICATION_STOCK).forEach(medication => {
    Object.keys(MEDICATION_STOCK[medication]).forEach(pharmacy => {
      totalMedications++;
      const level = MEDICATION_STOCK[medication][pharmacy].level;
      
      if (level === STOCK_LEVELS.OUT_OF_STOCK) {
        outOfStock++;
      } else if (level === STOCK_LEVELS.LOW) {
        lowStock++;
      } else {
        inStock++;
      }
    });
  });
  
  return {
    total: totalMedications,
    inStock,
    lowStock,
    outOfStock,
    inStockPercentage: Math.round((inStock / totalMedications) * 100)
  };
};