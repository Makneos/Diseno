import React from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const center = {
  lat: -33.45694,
  lng: -70.64827,
};

const GoogleMapsComponent = () => {
  return (
    <LoadScript googleMapsApiKey="AIzaSyCwCSTcCexOHfJSIHgu2MQedMmX8jAkMQg">
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={12}>
        {/* Puedes agregar marcadores o más elementos aquí */}
      </GoogleMap>
    </LoadScript>
  );
};

export default GoogleMapsComponent;