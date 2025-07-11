// src/config/api.js
// 🌐 Configuración centralizada de la API

// ⚠️ IMPORTANTE: Cambia esta URL por la de tu backend en Railway
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // 🚂 AQUÍ PON TU URL DE RAILWAY BACKEND
    return 'https://wellaging-production-99c2.up.railway.app';
    // Ejemplo: return 'https://farmafia-backend-production-1234.up.railway.app';
  }
  
  // Desarrollo local
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();

// 🔧 Función helper para hacer requests
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  // Agregar token si existe
  const user = sessionStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    if (userData.token) {
      defaultOptions.headers['Authorization'] = `Bearer ${userData.token}`;
    }
  }
  
  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, finalOptions);
    
    console.log(`📥 Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ API Error for ${url}:`, error);
    
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your internet connection.');
    }
    
    throw error;
  }
};

// 🚀 API específicas
export const authAPI = {
  login: (credentials) => apiRequest('/api/usuarios/login', {
    method: 'POST',
    body: JSON.stringify({
      email: credentials.email,
      contrasena: credentials.password
    }),
  }),
  
  register: (userData) => apiRequest('/api/usuarios/registro', {
    method: 'POST',
    body: JSON.stringify({
      nombre: userData.name,
      email: userData.email,
      contrasena: userData.password
    }),
  }),
  
  getProfile: () => apiRequest('/api/usuarios/perfil'),
};

export const medicationAPI = {
  search: (query) => apiRequest(`/api/medicamentos/buscar?q=${encodeURIComponent(query)}`),
  
  getPricesByActiveIngredient: (activeIngredient) => 
    apiRequest(`/api/medicamentos/precios-por-principio/${encodeURIComponent(activeIngredient)}`),
  
  getById: (id) => apiRequest(`/api/medicamentos/${id}`),
};

// 🔍 Debug en desarrollo
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 API Configuration loaded:', API_BASE_URL);
}