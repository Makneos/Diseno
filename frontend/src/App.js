import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import GoogleMapsComponent from "./pages/GoogleMapsComponent";
import PriceComparisonPage from "./pages/PriceComparisonPage";
import MedicationDetailPage from "./pages/MedicationDetailPage";
import './App.css';

function App() {
  // Valores predeterminados para GoogleMapsComponent cuando se usa como página
  const defaultProps = {
    selectedPharmacies: {
      cruzverde: true,
      salcobrand: true,
      ahumada: true,
    },
    distance: 5
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/GoogleMapsComponent" element={
            <GoogleMapsComponent 
              selectedPharmacies={defaultProps.selectedPharmacies} 
              distance={defaultProps.distance} 
            />
          } />
          <Route path="/price-comparison" element={<PriceComparisonPage />} />
          <Route path="/medication/:medicationId" element={<MedicationDetailPage />} />
          <Route path="/my-meds" element={<div>Página de mis medicamentos en desarrollo</div>} />
          <Route path="*" element={<div>Página no encontrada</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;