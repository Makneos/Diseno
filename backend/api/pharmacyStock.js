/**
 * API routes for pharmacy stock management
 * File: api/pharmacyStock.js
 */

const express = require('express');
const router = express.Router();

// Mock data para stock (mientras no hay datos reales en BD)
const MEDICATION_STOCK = {
  'paracetamol': {
    'ahumada': { level: 'high', quantity: 45, price: 2500, lastUpdated: new Date().toISOString() },
    'cruz verde': { level: 'medium', quantity: 12, price: 2200, lastUpdated: new Date().toISOString() },
    'salcobrand': { level: 'low', quantity: 3, price: 2800, lastUpdated: new Date().toISOString() }
  },
  'ibuprofeno': {
    'ahumada': { level: 'medium', quantity: 18, price: 3500, lastUpdated: new Date().toISOString() },
    'cruz verde': { level: 'high', quantity: 32, price: 3200, lastUpdated: new Date().toISOString() },
    'salcobrand': { level: 'out', quantity: 0, price: null, lastUpdated: new Date().toISOString() }
  },
  'omeprazol': {
    'ahumada': { level: 'low', quantity: 4, price: 8500, lastUpdated: new Date().toISOString() },
    'cruz verde': { level: 'medium', quantity: 15, price: 7800, lastUpdated: new Date().toISOString() },
    'salcobrand': { level: 'high', quantity: 28, price: 8200, lastUpdated: new Date().toISOString() }
  },
  'loratadina': {
    'ahumada': { level: 'high', quantity: 35, price: 4200, lastUpdated: new Date().toISOString() },
    'cruz verde': { level: 'low', quantity: 2, price: 3900, lastUpdated: new Date().toISOString() },
    'salcobrand': { level: 'medium', quantity: 11, price: 4500, lastUpdated: new Date().toISOString() }
  },
  'aspirina': {
    'ahumada': { level: 'out', quantity: 0, price: null, lastUpdated: new Date().toISOString() },
    'cruz verde': { level: 'high', quantity: 42, price: 2800, lastUpdated: new Date().toISOString() },
    'salcobrand': { level: 'medium', quantity: 16, price: 3100, lastUpdated: new Date().toISOString() }
  },
  'vitamin d3': {
    'ahumada': { level: 'medium', quantity: 14, price: 12500, lastUpdated: new Date().toISOString() },
    'cruz verde': { level: 'medium', quantity: 19, price: 11800, lastUpdated: new Date().toISOString() },
    'salcobrand': { level: 'high', quantity: 33, price: 12900, lastUpdated: new Date().toISOString() }
  }
};

const PHARMACY_LOCATIONS = {
  'ahumada': {
    name: 'Farmacias Ahumada',
    color: '#dc3545',
    workingHours: '24/7',
    phone: '+56 2 1234 5678',
    services: ['Delivery', 'Online Orders', 'Health Consultation']
  },
  'cruz verde': {
    name: 'Cruz Verde',
    color: '#28a745',
    workingHours: '08:00 - 22:00',
    phone: '+56 2 8765 4321',
    services: ['Delivery', 'Health Consultation', 'Vaccination']
  },
  'salcobrand': {
    name: 'Salcobrand',
    color: '#007bff',
    workingHours: '09:00 - 21:00',
    phone: '+56 2 5555 1234',
    services: ['Online Orders', 'Health Consultation', 'Beauty Products']
  }
};

// Helper functions
function getStockColor(level) {
  const colors = {
    'high': '#28a745',
    'medium': '#ffc107',
    'low': '#fd7e14',
    'out': '#dc3545',
    'unknown': '#6c757d'
  };
  return colors[level] || colors.unknown;
}

function getStockLabel(level) {
  const labels = {
    'high': 'In Stock',
    'medium': 'Limited Stock',
    'low': 'Low Stock',
    'out': 'Out of Stock',
    'unknown': 'Stock Unknown'
  };
  return labels[level] || labels.unknown;
}

/**
 * @route   GET /api/stock/medication/:medicationName
 * @desc    Get stock availability for a specific medication across all pharmacies
 * @access  Public
 */
router.get('/medication/:medicationName', (req, res) => {
  try {
    const { medicationName } = req.params;
    const normalizedName = medicationName.toLowerCase().trim();
    
    if (!MEDICATION_STOCK[normalizedName]) {
      return res.status(404).json({
        success: false,
        error: 'Medication not found'
      });
    }

    const stockData = MEDICATION_STOCK[normalizedName];
    const pharmaciesWithStock = [];

    Object.keys(stockData).forEach(pharmacy => {
      const stock = stockData[pharmacy];
      pharmaciesWithStock.push({
        pharmacy: pharmacy,
        pharmacyInfo: PHARMACY_LOCATIONS[pharmacy],
        stockInfo: {
          ...stock,
          stockColor: getStockColor(stock.level),
          stockLabel: getStockLabel(stock.level)
        }
      });
    });

    res.json({
      success: true,
      data: {
        medication: medicationName,
        totalPharmacies: pharmaciesWithStock.length,
        pharmacies: pharmaciesWithStock,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting medication stock:', error);
    res.status(500).json({
      success: false,
      error: 'Error retrieving medication stock'
    });
  }
});

/**
 * @route   GET /api/stock/search
 * @desc    Search for medications with availability info
 * @access  Public
 */
router.get('/search', (req, res) => {
  try {
    const { q, pharmacy } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      });
    }

    const searchTerm = q.toLowerCase().trim();
    const results = [];

    Object.keys(MEDICATION_STOCK).forEach(medication => {
      if (medication.includes(searchTerm)) {
        const medicationData = {
          medication: medication,
          displayName: medication.charAt(0).toUpperCase() + medication.slice(1),
          pharmacies: []
        };

        Object.keys(MEDICATION_STOCK[medication]).forEach(pharmacyKey => {
          // If specific pharmacy requested, filter by it
          if (pharmacy && pharmacy.toLowerCase() !== pharmacyKey) {
            return;
          }

          const stock = MEDICATION_STOCK[medication][pharmacyKey];
          medicationData.pharmacies.push({
            pharmacy: pharmacyKey,
            pharmacyInfo: PHARMACY_LOCATIONS[pharmacyKey],
            stockInfo: {
              ...stock,
              stockColor: getStockColor(stock.level),
              stockLabel: getStockLabel(stock.level)
            }
          });
        });

        if (medicationData.pharmacies.length > 0) {
          results.push(medicationData);
        }
      }
    });

    res.json({
      success: true,
      data: {
        searchTerm: q,
        totalResults: results.length,
        medications: results
      }
    });
  } catch (error) {
    console.error('Error searching medications:', error);
    res.status(500).json({
      success: false,
      error: 'Error searching medications'
    });
  }
});

/**
 * @route   GET /api/stock/pharmacy/:pharmacyName
 * @desc    Get full inventory for a specific pharmacy
 * @access  Public
 */
router.get('/pharmacy/:pharmacyName', (req, res) => {
  try {
    const { pharmacyName } = req.params;
    const normalizedPharmacy = pharmacyName.toLowerCase().trim();
    
    if (!PHARMACY_LOCATIONS[normalizedPharmacy]) {
      return res.status(404).json({
        success: false,
        error: 'Pharmacy not found'
      });
    }

    const inventory = [];
    
    Object.keys(MEDICATION_STOCK).forEach(medication => {
      if (MEDICATION_STOCK[medication][normalizedPharmacy]) {
        const stock = MEDICATION_STOCK[medication][normalizedPharmacy];
        inventory.push({
          medication: medication,
          ...stock,
          stockColor: getStockColor(stock.level),
          stockLabel: getStockLabel(stock.level)
        });
      }
    });

    res.json({
      success: true,
      data: {
        pharmacy: pharmacyName,
        pharmacyInfo: PHARMACY_LOCATIONS[normalizedPharmacy],
        inventory: inventory,
        totalMedications: inventory.length,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting pharmacy inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Error retrieving pharmacy inventory'
    });
  }
});

/**
 * @route   GET /api/stock/medications
 * @desc    Get list of all available medications
 * @access  Public
 */
router.get('/medications', (req, res) => {
  try {
    const medications = Object.keys(MEDICATION_STOCK).map(med => ({
      name: med,
      displayName: med.charAt(0).toUpperCase() + med.slice(1),
      availablePharmacies: Object.keys(MEDICATION_STOCK[med]).length
    }));

    res.json({
      success: true,
      data: medications
    });
  } catch (error) {
    console.error('Error getting medications list:', error);
    res.status(500).json({
      success: false,
      error: 'Error retrieving medications list'
    });
  }
});

/**
 * @route   GET /api/stock/nearby
 * @desc    Find medications available nearby (simulated geolocation)
 * @access  Public
 */
router.get('/nearby', (req, res) => {
  try {
    const { lat, lng, radius = 5, medication } = req.query;
    
    // In a real implementation, you would:
    // 1. Use the lat/lng to find nearby pharmacies
    // 2. Check their stock levels
    // 3. Calculate actual distances
    
    // For demo purposes, we'll simulate this
    const nearbyPharmacies = [];
    
    Object.keys(PHARMACY_LOCATIONS).forEach(pharmacyKey => {
      const pharmacy = PHARMACY_LOCATIONS[pharmacyKey];
      
      // Simulate distance (in a real app, calculate using coordinates)
      const simulatedDistance = Math.random() * parseInt(radius);
      
      let stockInfo = null;
      if (medication) {
        const normalizedMedication = medication.toLowerCase().trim();
        if (MEDICATION_STOCK[normalizedMedication] && 
            MEDICATION_STOCK[normalizedMedication][pharmacyKey]) {
          const stock = MEDICATION_STOCK[normalizedMedication][pharmacyKey];
          stockInfo = {
            ...stock,
            stockColor: getStockColor(stock.level),
            stockLabel: getStockLabel(stock.level)
          };
        }
      }
      
      nearbyPharmacies.push({
        pharmacy: pharmacyKey,
        pharmacyInfo: pharmacy,
        distance: simulatedDistance,
        estimatedTime: Math.round(simulatedDistance * 3), // 3 minutes per km
        stockInfo: stockInfo
      });
    });

    // Sort by distance
    nearbyPharmacies.sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      data: {
        searchLocation: { lat: parseFloat(lat), lng: parseFloat(lng) },
        radius: parseInt(radius),
        medication: medication || null,
        totalPharmacies: nearbyPharmacies.length,
        pharmacies: nearbyPharmacies
      }
    });
  } catch (error) {
    console.error('Error finding nearby pharmacies:', error);
    res.status(500).json({
      success: false,
      error: 'Error finding nearby pharmacies'
    });
  }
});

/**
 * @route   GET /api/stock/dashboard
 * @desc    Get stock statistics for dashboard
 * @access  Public
 */
router.get('/dashboard', (req, res) => {
  try {
    let totalMedications = 0;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    
    Object.keys(MEDICATION_STOCK).forEach(medication => {
      Object.keys(MEDICATION_STOCK[medication]).forEach(pharmacy => {
        totalMedications++;
        const level = MEDICATION_STOCK[medication][pharmacy].level;
        
        if (level === 'out') {
          outOfStock++;
        } else if (level === 'low') {
          lowStock++;
        } else {
          inStock++;
        }
      });
    });
    
    res.json({
      success: true,
      data: {
        total: totalMedications,
        inStock,
        lowStock,
        outOfStock,
        inStockPercentage: Math.round((inStock / totalMedications) * 100),
        lastUpdated: new Date().toISOString(),
        updateFrequency: '30 seconds'
      }
    });
  } catch (error) {
    console.error('Error getting stock dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Error retrieving stock dashboard'
    });
  }
});

module.exports = router;