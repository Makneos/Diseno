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

const GoogleMapsComponent = ({ selectedPharmacies, distance }) => {
  // 🔧 DEBUG: Log props received
  console.log('🗺️ GoogleMapsComponent props:', { selectedPharmacies, distance });

  // 🔧 Use API key from environment variables
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  
  // 🔧 DEBUG: Check if API key is loaded
  console.log('🔑 Google Maps API Key:', apiKey ? 'Found' : 'Missing');
  
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
  });

  // 🔧 DEBUG: Log API loading status
  console.log('🔄 Google Maps API status:', { isLoaded, loadError });

  const [userLocation, setUserLocation] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [filteredPharmacies, setFilteredPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [error, setError] = useState(null);

  // Normalize selected pharmacies names
  const normalizedSelectedPharmacies = useMemo(() => {
    if (!selectedPharmacies) return {};
    
    const normalized = {};
    for (const name in selectedPharmacies) {
      normalized[name.toLowerCase()] = selectedPharmacies[name];
    }
    console.log('🏥 Normalized pharmacies:', normalized);
    return normalized;
  }, [selectedPharmacies]);

  // Check if any pharmacy is selected
  const hasSelectedPharmacies = useMemo(() => {
    const hasSelected = selectedPharmacies && Object.values(selectedPharmacies).some(value => value);
    console.log('✅ Has selected pharmacies:', hasSelected);
    return hasSelected;
  }, [selectedPharmacies]);

  // Get user location
  useEffect(() => {
    console.log('📍 Requesting user location...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log('✅ User location obtained:', location);
          setUserLocation(location);
        },
        (err) => {
          console.error("❌ Error getting location:", err);
          setError("Unable to retrieve your location. Using default location.");
          // Use default location (Santiago, Chile)
          setUserLocation(defaultCenter);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      console.error("❌ Geolocation not supported");
      setError("Your browser does not support geolocation. Using default location.");
      setUserLocation(defaultCenter);
    }
  }, []);

  // Load pharmacies from GeoJSON file
  useEffect(() => {
    console.log('📦 Loading pharmacies from GeoJSON...');
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
            console.warn("⚠️ Invalid feature geometry", feature);
            return null;
          }
          
          return {
            id: index,
            name: (feature.properties?.name || "unnamed pharmacy").toLowerCase(),
            position: {
              lat: feature.geometry.coordinates[1],
              lng: feature.geometry.coordinates[0],
            },
          };
        }).filter(Boolean); // Remove null entries
        
        console.log(`✅ Loaded ${parsedPharmacies.length} pharmacies from GeoJSON`);
        setPharmacies(parsedPharmacies);
      } catch (err) {
        console.error("❌ Error loading pharmacies:", err);
        setError("Unable to load pharmacies. Using sample data.");
        
        // 🔧 FALLBACK: Use sample pharmacy data
        const samplePharmacies = [
          {
            id: 1,
            name: "cruz verde sample",
            position: { lat: -33.4569, lng: -70.6483 }
          },
          {
            id: 2,
            name: "ahumada sample",
            position: { lat: -33.4500, lng: -70.6600 }
          },
          {
            id: 3,
            name: "salcobrand sample",
            position: { lat: -33.4600, lng: -70.6400 }
          }
        ];
        console.log('🔧 Using sample pharmacies:', samplePharmacies);
        setPharmacies(samplePharmacies);
      }
    };
    
    fetchGeoJSON();
  }, []);

  // Filter pharmacies by name and distance
  useEffect(() => {
    console.log('🔍 Filtering pharmacies...');
    console.log('- User location:', userLocation);
    console.log('- Pharmacies count:', pharmacies.length);
    console.log('- Has selected pharmacies:', hasSelectedPharmacies);
    console.log('- Distance:', distance);

    if (!userLocation || !pharmacies || pharmacies.length === 0) {
      console.log('❌ Missing requirements for filtering');
      setFilteredPharmacies([]);
      return;
    }

    // If no pharmacy is selected, show none
    if (!hasSelectedPharmacies) {
      console.log('❌ No pharmacies selected');
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
      if (dist > Number(distance)) {
        console.log(`❌ Pharmacy ${pharmacy.name} too far: ${dist.toFixed(2)}km > ${distance}km`);
        return false;
      }
      
      const matches = matchesSelectedChain(pharmacy.name);
      if (!matches) {
        console.log(`❌ Pharmacy ${pharmacy.name} doesn't match selected chains`);
        return false;
      }

      console.log(`✅ Pharmacy ${pharmacy.name} included: ${dist.toFixed(2)}km`);
      return true;
    });

    console.log(`🎯 Filtered result: ${filtered.length} pharmacies found out of ${pharmacies.length}`);
    setFilteredPharmacies(filtered);
  }, [userLocation, pharmacies, normalizedSelectedPharmacies, distance, hasSelectedPharmacies]);

  const getIconColor = (name) => {
    if (!name) return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
    
    if (name.includes("cruz")) {
      return "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
    } else if (name.includes("ahumada")) {
      return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
    } else if (name.includes("salco")) {
      return "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
    }
    return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
  };

  const handlePharmacyClick = (pharmacy) => {
    if (!pharmacy) return;
    
    console.log('🖱️ Pharmacy clicked:', pharmacy.name);
    setSelectedPharmacy(pharmacy);
    
    if (userLocation && isLoaded && window.google?.maps?.geometry) {
      try {
        const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
          new window.google.maps.LatLng(pharmacy.position.lat, pharmacy.position.lng)
        );
        const distanceKm = (distance / 1000).toFixed(2);
        console.log(`📏 Distance calculated: ${distanceKm}km`);
        setDistanceKm(distanceKm);
      } catch (err) {
        console.error("❌ Error calculating distance:", err);
      }
    }
  };

  // 🔧 DEBUG: Early returns with detailed logging
  if (!apiKey) {
    console.error('❌ Google Maps API key not found in environment variables');
    return (
      <div className="alert alert-danger m-3">
        <h5>Google Maps API Key Missing</h5>
        <p>The Google Maps API key is not configured properly.</p>
        <small>Check that REACT_APP_GOOGLE_MAPS_API_KEY is set in your .env file</small>
      </div>
    );
  }

  if (loadError) {
    console.error('❌ Google Maps load error:', loadError);
    return (
      <div className="alert alert-danger m-3">
        <h5>Error loading Google Maps</h5>
        <p>{loadError.message}</p>
        <small>Check your API key and network connection</small>
      </div>
    );
  }

  if (!isLoaded) {
    console.log('⏳ Google Maps API still loading...');
    return (
      <div className="d-flex justify-content-center align-items-center p-5" style={{ height: "500px" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  console.log('🗺️ Rendering map with:', {
    userLocation,
    filteredPharmaciesCount: filteredPharmacies.length,
    hasSelectedPharmacies
  });

  return (
    <div style={containerStyle}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={userLocation || defaultCenter}
        zoom={13}
        options={{
          fullscreenControl: false,
          streetViewControl: false,
        }}
        onLoad={(map) => {
          console.log('✅ Google Map loaded successfully');
          // Optional: You can save map reference here if needed
        }}
      >
        {/* User location marker */}
        {userLocation && (
          <Marker 
            position={userLocation} 
            label="YOU"
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            }}
          />
        )}

        {/* Pharmacy markers */}
        {Array.isArray(filteredPharmacies) && filteredPharmacies.map((pharmacy) => (
          pharmacy && pharmacy.position && (
            <Marker
              key={pharmacy.id}
              position={pharmacy.position}
              onClick={() => handlePharmacyClick(pharmacy)}
              icon={{ url: getIconColor(pharmacy.name) }}
              title={pharmacy.name}
            />
          )
        ))}

        {/* Info window for selected pharmacy */}
        {selectedPharmacy && (
          <InfoWindow
            position={selectedPharmacy.position}
            onCloseClick={() => {
              console.log('❌ InfoWindow closed');
              setSelectedPharmacy(null);
              setDistanceKm(null);
            }}
          >
            <div>
              <strong style={{ textTransform: 'capitalize' }}>
                {selectedPharmacy.name}
              </strong>
              {distanceKm && <p>Distance: {distanceKm} km</p>}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      
      {/* Status messages */}
      {!hasSelectedPharmacies && (
        <div className="alert alert-info mt-3 position-absolute bottom-0 start-50 translate-middle-x" style={{ maxWidth: "90%" }}>
          <i className="bi bi-info-circle me-2"></i>
          Please select at least one pharmacy to display results on the map
        </div>
      )}
      
      {error && (
        <div className="alert alert-warning mt-3 position-absolute top-0 start-0 m-3" style={{ maxWidth: "90%" }}>
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="position-absolute top-0 end-0 m-2 p-2 bg-dark text-white small" style={{ fontSize: '10px', maxWidth: '200px' }}>
          <div>API Loaded: {isLoaded ? '✅' : '❌'}</div>
          <div>User Location: {userLocation ? '✅' : '❌'}</div>
          <div>Pharmacies: {pharmacies.length}</div>
          <div>Filtered: {filteredPharmacies.length}</div>
          <div>Selected: {hasSelectedPharmacies ? '✅' : '❌'}</div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapsComponent;