// src/config/api.js - CONFIGURACIÓN CORREGIDA PARA AZURE + RAILWAY

const getApiBaseUrl = () => {
  // Detectar si estamos en Azure Static Apps
  if (window.location.hostname.includes('azurestaticapps.net')) {
    // 🚂 BACKEND EN RAILWAY (correcto)
    return 'https://wellaging-production-99c2.up.railway.app';
  }
  
  // Si estamos en desarrollo local
  if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
    return 'http://localhost:5000';
  }
  
  // Fallback para otros entornos
  return 'https://wellaging-production-99c2.up.railway.app';
};

export const API_BASE_URL = getApiBaseUrl();

// 🔧 Función helper mejorada para Azure + Railway
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log(`🌐 Azure Frontend → Railway Backend`);
  console.log(`📍 Frontend: ${window.location.origin}`);
  console.log(`🎯 API Request: ${options.method || 'GET'} ${url}`);
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  // Agregar token si existe
  const user = sessionStorage.getItem('user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      if (userData.token) {
        defaultOptions.headers['Authorization'] = `Bearer ${userData.token}`;
      }
    } catch (e) {
      console.warn('⚠️ Invalid user data in sessionStorage');
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
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      console.error('❌ API Error:', errorData);
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ API Success:', data);
    return data;
    
  } catch (error) {
    console.error(`💥 Request failed for ${url}:`, error);
    
    // Errores específicos de CORS entre Azure y Railway
    if (error.message.includes('Failed to fetch')) {
      throw new Error(`Cannot connect to Railway backend. Please check:
1. Railway backend is running
2. CORS is configured for Azure Static Apps
3. Network connection is stable`);
    }
    
    throw error;
  }
};

// 🚀 API específicas (sin cambios)
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

// 🔍 Debug específico para Azure + Railway
console.log('🔧 API Configuration loaded:');
console.log('📍 Frontend URL:', window.location.origin);
console.log('🎯 Backend URL:', API_BASE_URL);
console.log('🌍 Environment:', process.env.NODE_ENV);

// Test de conectividad automático
setTimeout(() => {
  testBackendConnection();
}, 2000);

async function testBackendConnection() {
  try {
    console.log('🧪 Testing Railway backend connection...');
    const response = await fetch(API_BASE_URL);
    const data = await response.json();
    console.log('✅ Backend connection test successful:', data);
  } catch (error) {
    console.error('❌ Backend connection test failed:', error);
    console.log('💡 Possible issues:');
    console.log('  - Railway backend is down');
    console.log('  - CORS not configured for Azure Static Apps');
    console.log('  - Network connectivity issues');
  }
}