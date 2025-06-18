import React, { useEffect, useState, useMemo } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "15px",
  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
  overflow: "hidden",
};

const defaultCenter = {
  lat: -33.45694,
  lng: -70.64827,
};

const libraries = ["geometry"];

// Mapping pharmacy name variants for better filtering
const PHARMACY_NAME_VARIANTS = {
  cruzverde: ["cruz", "verde", "cruz verde"],
  salcobrand: ["salco", "brand", "salcobrand"],
  ahumada: ["ahumada"]
};

// Enhanced component with medication search and stock functionality
const GoogleMapsComponent = ({ selectedPharmacies, distance, selectedMedication, onMedicationSelect }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyCwCSTcCexOHfJSIHgu2MQedMmX8jAkMQg",
    libraries,
  });

  const [userLocation, setUserLocation] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [filteredPharmacies, setFilteredPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [error, setError] = useState(null);
  
  // New states for stock functionality
  const [stockData, setStockData] = useState({});
  const [isLoadingStock, setIsLoadingStock] = useState(false);

  // Normalize selected pharmacies names
  const normalizedSelectedPharmacies = useMemo(() => {
    if (!selectedPharmacies) return {};
    
    const normalized = {};
    for (const name in selectedPharmacies) {
      normalized[name.toLowerCase()] = selectedPharmacies[name];
    }
    return normalized;
  }, [selectedPharmacies]);

  // Check if any pharmacy is selected
  const hasSelectedPharmacies = useMemo(() => {
    return selectedPharmacies && Object.values(selectedPharmacies).some(value => value);
  }, [selectedPharmacies]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.error("Error getting location:", err);
          setError("Unable to retrieve your location.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      setError("Your browser does not support geolocation.");
    }
  }, []);

  // Load pharmacies from GeoJSON file
  useEffect(() => {
    const fetchGeoJSON = async () => {
      try {
        const response = await fetch("/export.geojson");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (!data || !data.features || !Array.isArray(data.features)) {
          throw new Error("Invalid GeoJSON format");
        }
        
        const parsedPharmacies = data.features.map((feature, index) => {
          if (!feature.geometry || !feature.geometry.coordinates || 
              !Array.isArray(feature.geometry.coordinates) || 
              feature.geometry.coordinates.length < 2) {
            console.warn("Invalid feature geometry", feature);
            return null;
          }
          
          return {
            id: index,
            name: (feature.properties?.name || "unnamed pharmacy").toLowerCase(),
            displayName: feature.properties?.name || "unnamed pharmacy",
            position: {
              lat: feature.geometry.coordinates[1],
              lng: feature.geometry.coordinates[0],
            },
          };
        }).filter(Boolean); // Remove null entries
        
        setPharmacies(parsedPharmacies);
      } catch (err) {
        console.error("Error loading pharmacies:", err);
        setError("Unable to load pharmacies.");
      }
    };
    
    fetchGeoJSON();
  }, []);

  // Load stock data when medication is selected
  useEffect(() => {
    if (selectedMedication && pharmacies.length > 0) {
      loadStockData(selectedMedication);
    } else {
      setStockData({});
    }
  }, [selectedMedication, pharmacies]);

  // Load stock data from API
  const loadStockData = async (medicationName) => {
    setIsLoadingStock(true);
    try {
      const response = await fetch(`http://localhost:5000/api/stock/medication/${encodeURIComponent(medicationName)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Convert pharmacy array to object for easier lookup
          const stockMap = {};
          data.data.pharmacies.forEach(pharmacy => {
            stockMap[pharmacy.pharmacy.toLowerCase()] = pharmacy.stockInfo;
          });
          setStockData(stockMap);
        }
      } else {
        // Fallback to mock data if API not available
        setStockData(generateMockStockData(medicationName));
      }
    } catch (error) {
      console.error('Error loading stock data:', error);
      // Fallback to mock data
      setStockData(generateMockStockData(medicationName));
    } finally {
      setIsLoadingStock(false);
    }
  };

  // Generate mock stock data as fallback
  const generateMockStockData = (medicationName) => {
    const stockLevels = ['high', 'medium', 'low', 'out'];
    const colors = {
      'high': '#28a745',
      'medium': '#ffc107', 
      'low': '#fd7e14',
      'out': '#dc3545'
    };
    
    return {
      'ahumada': {
        level: stockLevels[Math.floor(Math.random() * stockLevels.length)],
        quantity: Math.floor(Math.random() * 50),
        price: 2000 + Math.floor(Math.random() * 3000),
        stockColor: colors[stockLevels[Math.floor(Math.random() * stockLevels.length)]]
      },
      'cruz verde': {
        level: stockLevels[Math.floor(Math.random() * stockLevels.length)],
        quantity: Math.floor(Math.random() * 50),
        price: 2000 + Math.floor(Math.random() * 3000),
        stockColor: colors[stockLevels[Math.floor(Math.random() * stockLevels.length)]]
      },
      'salcobrand': {
        level: stockLevels[Math.floor(Math.random() * stockLevels.length)],
        quantity: Math.floor(Math.random() * 50),
        price: 2000 + Math.floor(Math.random() * 3000),
        stockColor: colors[stockLevels[Math.floor(Math.random() * stockLevels.length)]]
      }
    };
  };

  // Filter pharmacies by name and distance
  useEffect(() => {
    if (!userLocation || !pharmacies || pharmacies.length === 0) {
      setFilteredPharmacies([]);
      return;
    }

    // If no pharmacy is selected, show none
    if (!hasSelectedPharmacies) {
      setFilteredPharmacies([]);
      return;
    }

    const calculateDistance = (location1, location2) => {
      if (!location1 || !location2) return Infinity;
      
      const R = 6371;
      const dLat = ((location2.lat - location1.lat) * Math.PI) / 180;
      const dLng = ((location2.lng - location1.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((location1.lat * Math.PI) / 180) *
          Math.cos((location2.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const matchesSelectedChain = (pharmacyName) => {
      if (!pharmacyName) return false;
      
      for (const chainName in normalizedSelectedPharmacies) {
        if (!normalizedSelectedPharmacies[chainName]) continue;
        
        const variants = PHARMACY_NAME_VARIANTS[chainName] || [chainName];
        
        for (const variant of variants) {
          if (pharmacyName.includes(variant)) {
            return true;
          }
        }
      }
      return false;
    };

    const filtered = pharmacies.filter((pharmacy) => {
      if (!pharmacy || !pharmacy.position) return false;
      
      const dist = calculateDistance(userLocation, pharmacy.position);
      if (dist > Number(distance)) return false;
      
      // If medication is selected, only show pharmacies with stock
      if (selectedMedication && stockData[pharmacy.name]) {
        const stock = stockData[pharmacy.name];
        if (stock.level === 'out') return false;
      }
      
      return matchesSelectedChain(pharmacy.name);
    });

    console.log(`Filter applied: ${filtered.length} pharmacies found out of ${pharmacies.length}`);
    setFilteredPharmacies(filtered);
  }, [userLocation, pharmacies, normalizedSelectedPharmacies, distance, hasSelectedPharmacies, selectedMedication, stockData]);

  const getIconColor = (pharmacy) => {
    // If medication is selected and we have stock data, use stock-based colors
    if (selectedMedication && stockData[pharmacy.name]) {
      const stock = stockData[pharmacy.name];
      switch (stock.level) {
        case 'high': return "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
        case 'medium': return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
        case 'low': return "http://maps.google.com/mapfiles/ms/icons/orange-dot.png";
        case 'out': return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
        default: return "http://maps.google.com/mapfiles/ms/icons/grey-dot.png";
      }
    }
    
    // Default pharmacy colors
    const name = pharmacy.name;
    if (!name) return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
    
    if (name.includes("cruz")) {
      return "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
    } else if (name.includes("ahumada")) {
      return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
    } else if (name.includes("salcobrand")) {
      return "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
    }
    return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
  };

  const handlePharmacyClick = (pharmacy) => {
    if (!pharmacy) return;
    
    setSelectedPharmacy(pharmacy);
    if (userLocation && isLoaded && window.google?.maps?.geometry) {
      try {
        const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
          new window.google.maps.LatLng(pharmacy.position.lat, pharmacy.position.lng)
        );
        setDistanceKm((distance / 1000).toFixed(2));
      } catch (err) {
        console.error("Error calculating distance:", err);
      }
    }
  };

  const renderInfoWindow = () => {
    if (!selectedPharmacy) return null;

    const stock = selectedMedication && stockData[selectedPharmacy.name];
    
    return (
      <InfoWindow
        position={selectedPharmacy.position}
        onCloseClick={() => {
          setSelectedPharmacy(null);
          setDistanceKm(null);
        }}
      >
        <div style={{ maxWidth: '300px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #0d6efd 0%, #0056b3 100%)',
            color: 'white',
            padding: '12px 16px',
            margin: '-8px -8px 8px -8px',
            borderRadius: '4px 4px 0 0'
          }}>
            <strong>{selectedPharmacy.displayName}</strong>
          </div>
          
          <div style={{ padding: '0 8px 8px 8px' }}>
            {distanceKm && (
              <p style={{ margin: '8px 0', color: '#666' }}>
                <i className="bi bi-geo-alt me-1"></i>
                Distance: {distanceKm} km
              </p>
            )}
            
            {selectedMedication && stock && (
              <div style={{ 
                borderTop: '1px solid #eee',
                paddingTop: '8px',
                marginTop: '8px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: stock.stockColor || '#666',
                    flexShrink: 0
                  }}></div>
                  <strong style={{ color: stock.stockColor || '#666' }}>
                    {selectedMedication.charAt(0).toUpperCase() + selectedMedication.slice(1)}
                  </strong>
                </div>
                
                <div style={{ fontSize: '14px', color: '#666' }}>
                  <div>Status: <span style={{ color: stock.stockColor }}>{stock.level === 'high' ? 'In Stock' : stock.level === 'medium' ? 'Limited Stock' : stock.level === 'low' ? 'Low Stock' : 'Out of Stock'}</span></div>
                  {stock.quantity > 0 && (
                    <div>Quantity: {stock.quantity} units</div>
                  )}
                  {stock.price && (
                    <div style={{ fontWeight: 'bold', color: '#0d6efd' }}>
                      Price: ${stock.price.toLocaleString('es-CL')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </InfoWindow>
    );
  };

  if (loadError) {
    return <div className="alert alert-danger m-3">Error loading Google Maps: {loadError.message}</div>;
  }

  if (!isLoaded) {
    return <div className="d-flex justify-content-center p-5"><div className="spinner-border" role="status"></div></div>;
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={containerStyle}>
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={userLocation || defaultCenter}
          zoom={13}
          options={{
            fullscreenControl: false,
            streetViewControl: false,
          }}
        >
          {userLocation && <Marker position={userLocation} label="YOU" />}

          {Array.isArray(filteredPharmacies) && filteredPharmacies.map((pharmacy) => (
            pharmacy && pharmacy.position && (
              <Marker
                key={pharmacy.id}
                position={pharmacy.position}
                onClick={() => handlePharmacyClick(pharmacy)}
                icon={{ url: getIconColor(pharmacy) }}
              />
            )
          ))}

          {renderInfoWindow()}
        </GoogleMap>
        
        {/* Loading overlay for stock data */}
        {isLoadingStock && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255,255,255,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            borderRadius: '15px'
          }}>
            <div style={{ textAlign: 'center', color: '#666' }}>
              <div className="spinner-border mb-2" role="status"></div>
              <div>Loading stock information...</div>
            </div>
          </div>
        )}
        
        {/* Stock Legend */}
        {selectedMedication && Object.keys(stockData).length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '180px'
          }}>
            <h6 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
              Stock for {selectedMedication}
            </h6>
            <div style={{ fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#28a745' }}></div>
                <span>In Stock</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffc107' }}></div>
                <span>Limited Stock</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#fd7e14' }}></div>
                <span>Low Stock</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#dc3545' }}></div>
                <span>Out of Stock</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {!hasSelectedPharmacies && (
        <div className="alert alert-info mt-3 position-absolute bottom-0 start-50 translate-middle-x" style={{ maxWidth: "90%" }}>
          Please select at least one pharmacy to display results on the map
        </div>
      )}
      
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </div>
  );
};

export default GoogleMapsComponent;