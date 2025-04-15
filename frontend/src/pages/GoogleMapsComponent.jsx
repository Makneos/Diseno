import React, { useEffect, useState, useMemo } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";

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

const GoogleMapsComponent = ({ selectedPharmacies, distance }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [filteredPharmacies, setFilteredPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [error, setError] = useState(null);
  const [isFilteringActive, setIsFilteringActive] = useState(false);

  // Normalizar nombres
  const normalizedSelectedPharmacies = useMemo(() => {
    const normalized = {};
    for (const name in selectedPharmacies) {
      normalized[name.toLowerCase()] = selectedPharmacies[name];
    }
    return normalized;
  }, [selectedPharmacies]);

  // Obtener la ubicación del usuario
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
          console.error("Error al obtener la ubicación:", err);
          setError("No se pudo obtener tu ubicación.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      setError("Tu navegador no soporta geolocalización.");
    }
  }, []);

  // Cargar farmacias desde archivo GeoJSON
  useEffect(() => {
    fetch("/export.geojson")
      .then((res) => res.json())
      .then((data) => {
        const parsedPharmacies = data.features.map((feature, index) => ({
          id: index,
          name: feature.properties?.name?.toLowerCase() || "farmacia sin nombre",
          position: {
            lat: feature.geometry.coordinates[1],
            lng: feature.geometry.coordinates[0],
          },
        }));
        setPharmacies(parsedPharmacies);
        setFilteredPharmacies(parsedPharmacies);
      })
      .catch((err) => {
        console.error("Error al cargar farmacias:", err);
        setError("No se pudieron cargar las farmacias.");
      });
  }, []);

  // Activar filtrado al modificar opciones
  useEffect(() => {
    if (Object.values(selectedPharmacies).some((value) => value)) {
      setIsFilteringActive(true);
    }
  }, [selectedPharmacies, distance]);

  // Filtrar farmacias por nombre y distancia
  useEffect(() => {
    if (!userLocation) return;

    if (!isFilteringActive) {
      setFilteredPharmacies(pharmacies);
      return;
    }

    const calculateDistance = (location1, location2) => {
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

    const filtered = pharmacies.filter((pharmacy) => {
      const dist = calculateDistance(userLocation, pharmacy.position);
      return normalizedSelectedPharmacies[pharmacy.name] && dist <= distance;
    });

    setFilteredPharmacies(filtered);
  }, [userLocation, pharmacies, normalizedSelectedPharmacies, distance, isFilteringActive]);

  // Iconos personalizados por nombre
  const getIconColor = (name) => {
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
    setSelectedPharmacy(pharmacy);
    if (userLocation && window.google?.maps?.geometry) {
      const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
        new window.google.maps.LatLng(pharmacy.position.lat, pharmacy.position.lng)
      );
      setDistanceKm((distance / 1000).toFixed(2));
    }
  };

  return (
    <LoadScript googleMapsApiKey="AIzaSyCwCSTcCexOHfJSIHgu2MQedMmX8jAkMQg" libraries={["geometry"]}>
      <div style={containerStyle}>
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={userLocation || defaultCenter}
          zoom={13}
        >
          {userLocation && <Marker position={userLocation} label="Tú" />}

          {filteredPharmacies.map((pharmacy) => (
            <Marker
              key={pharmacy.id}
              position={pharmacy.position}
              onClick={() => handlePharmacyClick(pharmacy)}
              icon={{ url: getIconColor(pharmacy.name) }}
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
                {distanceKm && <p>Distancia: {distanceKm} km</p>}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </LoadScript>
  );
};

export default GoogleMapsComponent;