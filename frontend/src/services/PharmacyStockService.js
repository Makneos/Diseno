// PharmacyStockService.js - Service for handling pharmacy stock operations

import { 
  MEDICATION_STOCK, 
  STOCK_LEVELS, 
  STOCK_COLORS, 
  STOCK_LABELS,
  PHARMACY_LOCATIONS,
  getStockInfo,
  getPharmacyInventory,
  findPharmaciesWithStock,
  simulateStockChanges,
  getStockStatistics
} from './stockData.js';

/**
 * PharmacyStockService - Main service class for pharmacy stock management
 */
class PharmacyStockService {
  constructor() {
    this.stockUpdateInterval = null;
    this.listeners = [];
    this.lastUpdate = new Date();
  }

  /**
   * Start automatic stock simulation (updates every 30 seconds)
   */
  startStockSimulation() {
    if (this.stockUpdateInterval) {
      clearInterval(this.stockUpdateInterval);
    }

    this.stockUpdateInterval = setInterval(() => {
      simulateStockChanges();
      this.lastUpdate = new Date();
      this.notifyListeners();
    }, 30000); // Update every 30 seconds

    console.log('📦 Stock simulation started');
  }

  /**
   * Stop automatic stock simulation
   */
  stopStockSimulation() {
    if (this.stockUpdateInterval) {
      clearInterval(this.stockUpdateInterval);
      this.stockUpdateInterval = null;
      console.log('📦 Stock simulation stopped');
    }
  }

  /**
   * Add listener for stock updates
   */
  addStockUpdateListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove listener for stock updates
   */
  removeStockUpdateListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  /**
   * Notify all listeners of stock changes
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.lastUpdate);
      } catch (error) {
        console.error('Error notifying stock listener:', error);
      }
    });
  }

  /**
   * Get stock information for a specific medication at a pharmacy
   */
  async getStock(medicationName, pharmacyName) {
    try {
      const stockInfo = getStockInfo(medicationName, pharmacyName);
      
      return {
        success: true,
        data: {
          medication: medicationName,
          pharmacy: pharmacyName,
          ...stockInfo,
          stockLabel: STOCK_LABELS[stockInfo.level],
          stockColor: STOCK_COLORS[stockInfo.level]
        }
      };
    } catch (error) {
      console.error('Error getting stock info:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Search for pharmacies that have a medication in stock
   */
  async searchMedicationAvailability(medicationName, userLocation = null, radiusKm = 10) {
    try {
      const pharmaciesWithStock = findPharmaciesWithStock(medicationName);
      
      // If user location is provided, calculate distances
      if (userLocation && userLocation.lat && userLocation.lng) {
        pharmaciesWithStock.forEach(item => {
          // In a real app, you'd calculate actual distance
          // For now, simulate distance
          item.distance = Math.random() * radiusKm;
          item.estimatedTime = Math.round(item.distance * 3); // 3 minutes per km
        });

        // Sort by distance
        pharmaciesWithStock.sort((a, b) => a.distance - b.distance);
      }

      return {
        success: true,
        data: {
          medication: medicationName,
          totalPharmacies: pharmaciesWithStock.length,
          pharmacies: pharmaciesWithStock.map(item => ({
            ...item,
            stockLabel: STOCK_LABELS[item.stockInfo.level],
            stockColor: STOCK_COLORS[item.stockInfo.level]
          }))
        }
      };
    } catch (error) {
      console.error('Error searching medication availability:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get complete inventory for a pharmacy
   */
  async getPharmacyStock(pharmacyName) {
    try {
      const inventory = getPharmacyInventory(pharmacyName);
      const pharmacyInfo = PHARMACY_LOCATIONS[pharmacyName.toLowerCase()];

      return {
        success: true,
        data: {
          pharmacy: pharmacyName,
          pharmacyInfo,
          inventory: Object.keys(inventory).map(medication => ({
            medication,
            ...inventory[medication],
            stockLabel: STOCK_LABELS[inventory[medication].level],
            stockColor: STOCK_COLORS[inventory[medication].level]
          })),
          totalMedications: Object.keys(inventory).length,
          lastUpdated: this.lastUpdate
        }
      };
    } catch (error) {
      console.error('Error getting pharmacy stock:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get enhanced marker data for Google Maps
   */
  async getMapMarkersData(selectedMedication = null) {
    try {
      const markers = [];

      Object.keys(PHARMACY_LOCATIONS).forEach(pharmacyKey => {
        const pharmacy = PHARMACY_LOCATIONS[pharmacyKey];
        let stockInfo = null;

        // If a specific medication is selected, get its stock info
        if (selectedMedication) {
          const stock = getStockInfo(selectedMedication, pharmacyKey);
          stockInfo = {
            ...stock,
            stockLabel: STOCK_LABELS[stock.level],
            stockColor: STOCK_COLORS[stock.level]
          };
        }

        markers.push({
          pharmacyKey,
          pharmacyName: pharmacy.name,
          pharmacyInfo: pharmacy,
          stockInfo,
          // Enhanced icon based on stock level
          icon: selectedMedication && stockInfo ? 
            this.getStockBasedIcon(stockInfo.level) : 
            pharmacy.icon
        });
      });

      return {
        success: true,
        data: markers
      };
    } catch (error) {
      console.error('Error getting map markers data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get icon URL based on stock level
   */
  getStockBasedIcon(stockLevel) {
    const iconMap = {
      [STOCK_LEVELS.HIGH]: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
      [STOCK_LEVELS.MEDIUM]: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
      [STOCK_LEVELS.LOW]: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
      [STOCK_LEVELS.OUT_OF_STOCK]: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
      [STOCK_LEVELS.UNKNOWN]: 'http://maps.google.com/mapfiles/ms/icons/grey-dot.png'
    };

    return iconMap[stockLevel] || iconMap[STOCK_LEVELS.UNKNOWN];
  }

  /**
   * Get stock statistics for dashboard
   */
  async getStockDashboard() {
    try {
      const stats = getStockStatistics();
      
      return {
        success: true,
        data: {
          ...stats,
          lastUpdated: this.lastUpdate,
          updateFrequency: '30 seconds'
        }
      };
    } catch (error) {
      console.error('Error getting stock dashboard:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if medication is available within radius
   */
  async checkAvailabilityNearby(medicationName, userLocation, radiusKm = 5) {
    try {
      const availability = await this.searchMedicationAvailability(
        medicationName, 
        userLocation, 
        radiusKm
      );

      if (!availability.success) {
        return availability;
      }

      const nearbyPharmacies = availability.data.pharmacies.filter(
        pharmacy => !pharmacy.distance || pharmacy.distance <= radiusKm
      );

      return {
        success: true,
        data: {
          medication: medicationName,
          radius: radiusKm,
          availableNearby: nearbyPharmacies.length > 0,
          totalNearbyPharmacies: nearbyPharmacies.length,
          closestPharmacy: nearbyPharmacies[0] || null,
          pharmacies: nearbyPharmacies
        }
      };
    } catch (error) {
      console.error('Error checking nearby availability:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all available medications across all pharmacies
   */
  async getAllMedications() {
    try {
      const medications = Object.keys(MEDICATION_STOCK);
      
      return {
        success: true,
        data: medications.map(med => ({
          name: med,
          displayName: med.charAt(0).toUpperCase() + med.slice(1),
          availablePharmacies: Object.keys(MEDICATION_STOCK[med]).length
        }))
      };
    } catch (error) {
      console.error('Error getting all medications:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cleanup method
   */
  destroy() {
    this.stopStockSimulation();
    this.listeners = [];
  }
}

// Create singleton instance
const pharmacyStockService = new PharmacyStockService();

// Export both the service instance and the class
export default pharmacyStockService;
export { PharmacyStockService, STOCK_LEVELS, STOCK_COLORS, STOCK_LABELS };