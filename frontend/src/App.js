import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 🌍 SISTEMA MULTILENGUAJE
import { LanguageProvider } from './context/LanguageContext';

// Páginas principales
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';

// Páginas de medicamentos
import MyMedicationsPage from './pages/MyMedicationsPage';
import PriceComparisonPage from './pages/PriceComparisonPage';
import MedicationDetailPage from './pages/MedicationDetailPage';

// 🤖 CHATBOT FLOTANTE
import ChatbotFloating from './components/ChatbotFloating';

// Componentes y páginas especiales
import GoogleMapsComponent from "./pages/GoogleMapsComponent";

// Sistema de autenticación
import AuthGuard from './components/AuthGuard';

// Estilos
import './App.css';

// Componente 404 con multilenguaje
import NotFoundPage from './pages/NotFoundPage';

import GoogleSuccessPage from './pages/GoogleSuccessPage';

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
    <LanguageProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* 🌐 RUTAS PÚBLICAS (no requieren autenticación) */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Páginas de medicamentos públicas */}
            <Route path="/price-comparison" element={<PriceComparisonPage />} />
            <Route path="/medication/:id" element={<MedicationDetailPage />} />
            <Route path="/medication-detail/:id" element={<MedicationDetailPage />} />
            
            {/* Mapa público */}
            <Route path="/GoogleMapsComponent" element={
              <GoogleMapsComponent 
                selectedPharmacies={defaultProps.selectedPharmacies} 
                distance={defaultProps.distance} 
              />
            } />
            <Route path="/map" element={
              <GoogleMapsComponent 
                selectedPharmacies={defaultProps.selectedPharmacies} 
                distance={defaultProps.distance} 
              />
            } />
            
            {/* 🔒 RUTAS PROTEGIDAS (requieren autenticación con AuthGuard) */}
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
            
            <Route path="/my-medications" element={
              <AuthGuard>
                <MyMedicationsPage />
              </AuthGuard>
            } />

            <Route path="/google-success" element={
              <GoogleSuccessPage />
            } />
            
            {/*RUTA DE FALLBACK */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          {/*CHATBOT FLOTANTE - Disponible en todas las páginas */}
          <ChatbotFloating />
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;