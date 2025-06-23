import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import MyMedicationsPage from './pages/MyMedicationsPage';
import GoogleMapsComponent from "./pages/GoogleMapsComponent";
import AuthGuard from './components/AuthGuard'; // ← Importar AuthGuard
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
          {/* 🌐 Rutas públicas (no requieren autenticación) */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* 🔒 Rutas protegidas (requieren autenticación con AuthGuard) */}
          <Route path="/profile" element={
            <AuthGuard>
              <ProfilePage />
            </AuthGuard>
          } />
          
          <Route path="/my-meds" element={
            <AuthGuard>
              <MyMedicationsPage />
            </AuthGuard>
          } />
          
          {/* 🗺️ Ruta del mapa (puede ser pública o protegida según tu decisión) */}
          <Route path="/GoogleMapsComponent" element={
            <GoogleMapsComponent 
              selectedPharmacies={defaultProps.selectedPharmacies} 
              distance={defaultProps.distance} 
            />
          } />
          
          {/* 🚫 Ruta de fallback */}
          <Route path="*" element={<div>Página no encontrada</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;