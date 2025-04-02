import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

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
          console.error("Error obtaining location:", err);
          setError(
            "Could not retrieve location. Please enable location access in your browser."
          );
        },
        { enableHighAccuracy: true }
      );
    } else {
      setError("Your browser does not support geolocation.");
    }
  }, []);

  return (
    <div className="map-container" style={{ textAlign: "center", padding: "20px" }}>
      <h2 style={{ marginBottom: "15px", color: "#333" }}>Your Location</h2>
      <LoadScript googleMapsApiKey="AIzaSyCwCSTcCexOHfJSIHgu2MQedMmX8jAkMQg">
        <div style={containerStyle}>
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={userLocation || defaultCenter}
            zoom={14}
          >
            {userLocation && <Marker position={userLocation} label="You" />}
          </GoogleMap>
        </div>
      </LoadScript>
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </div>
  );
};

export default GoogleMapsComponent;
