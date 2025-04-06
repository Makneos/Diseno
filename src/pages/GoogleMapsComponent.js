import React, { useEffect, useState } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";

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

const GoogleMapsComponent = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [filteredPharmacies, setFilteredPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [filter, setFilter] = useState("");

  // Obtener ubicación
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
          console.error("Error:", err);
          setError("Could not locate.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      setError("Your browser do not support this function.");
    }
  }, []);

 
  useEffect(() => {
    fetch("/export.geojson")
      .then((res) => res.json())
      .then((data) => {
        const parsedPharmacies = data.features.map((feature, index) => ({
          id: index,
          name: feature.properties?.name || "Farmacia sin nombre",
          position: {
            lat: feature.geometry.coordinates[1],
            lng: feature.geometry.coordinates[0],
          },
        }));
        setPharmacies(parsedPharmacies);
        setFilteredPharmacies(parsedPharmacies);
      })
      .catch((err) => {
        console.error("Error:", err);
        setError("Could not locate pharmacy.");
      });
  }, []);

  // Filtro por texto
  useEffect(() => {
    const filtered = pharmacies.filter((pharmacy) =>
      pharmacy.name.toLowerCase().includes(filter.toLowerCase())
    );
    setFilteredPharmacies(filtered);
  }, [filter, pharmacies]);

  // Al hacer clic en una farmacia
  const handlePharmacyClick = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    if (userLocation && window.google?.maps?.geometry) {
      const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
        new window.google.maps.LatLng(
          pharmacy.position.lat,
          pharmacy.position.lng
        )
      );
      setDistanceKm((distance / 1000).toFixed(2));
    }
  };


  const getIconColor = (name) => {
    if (name.toLowerCase().includes("cruz")) {
      return "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
    } else if (name.toLowerCase().includes("ahumada")) {
      return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
    } else {
      return "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
    }
  };

  return (
    <div className="map-container" style={{ textAlign: "center", padding: "20px" }}>
      <h2 style={{ marginBottom: "15px", color: "#333" }}>Pharmacies from Santiago</h2>

      <input
        type="text"
        placeholder="Search..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{
          padding: "8px 12px",
          marginBottom: "15px",
          borderRadius: "10px",
          border: "1px solid #ccc",
          width: "300px",
        }}
      />

      <LoadScript
        googleMapsApiKey="AIzaSyCwCSTcCexOHfJSIHgu2MQedMmX8jAkMQg"
        libraries={["geometry"]}
      >
        <div style={containerStyle}>
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={userLocation || defaultCenter}
            zoom={13}
          >
            {userLocation && <Marker position={userLocation} label="You" />}

            {filteredPharmacies.map((pharmacy) => (
              <Marker
                key={pharmacy.id}
                position={pharmacy.position}
                onClick={() => handlePharmacyClick(pharmacy)}
                icon={{
                  url: getIconColor(pharmacy.name),
                }}
              />
            ))}

            {selectedPharmacy && (
              <InfoWindow
                position={selectedPharmacy.position}
                onCloseClick={() => {
                  setSelectedPharmacy(null);
                  setDistanceKm(null);
                }}
              >
                <div>
                  <strong>{selectedPharmacy.name}</strong>
                  {distanceKm && (
                    <p>Distance from you: {distanceKm} km</p>
                  )}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>
      </LoadScript>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </div>
  );
};

export default GoogleMapsComponent;
