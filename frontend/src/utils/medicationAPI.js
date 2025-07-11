// ===================================
// API CONFIGURATION FOR PRODUCTION
// ===================================

// 🌐 API Base URL - Detecta automáticamente el entorno
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://wellaging-production-99c2.up.railway.app'  // 🚂 Railway URL
  : 'http://localhost:5000';                            // 💻 Local development

console.log(`🔗 API configured for: ${API_BASE_URL} (${process.env.NODE_ENV || 'development'})`);

// ===================================
// AUTHENTICATION FUNCTIONS
// ===================================

export const getAuthHeader = () => {
  const user = sessionStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    // ✅ Verificar si tiene token en los datos del usuario
    if (userData.token) {
      return { 'Authorization': `Bearer ${userData.token}` };
    }
    console.warn('⚠️ No token found in user data:', userData);
  } else {
    console.warn('⚠️ No user found in sessionStorage');
  }
  return {};
};

// ✅ FUNCIÓN: Verificar si el usuario está autenticado
export const isAuthenticated = () => {
  const user = sessionStorage.getItem('user');
  if (!user) return false;
  
  try {
    const userData = JSON.parse(user);
    return !!(userData.token && userData.id);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return false;
  }
};

// ✅ FUNCIÓN: Obtener datos del usuario
export const getUserData = () => {
  const user = sessionStorage.getItem('user');
  if (!user) return null;
  
  try {
    return JSON.parse(user);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// ===================================
// MEDICATION API FUNCTIONS
// ===================================

export const fetchMedicamentos = async () => {
  try {
    console.log('🔍 Fetching medicamentos from API...');
    
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    };
    
    console.log('📤 Request headers:', headers);
    console.log('🌐 API URL:', `${API_BASE_URL}/api/tratamientos/mis-medicamentos`);
    
    const response = await fetch(`${API_BASE_URL}/api/tratamientos/mis-medicamentos`, {
      headers
    });
    
    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      if (response.status === 401) {
        console.warn('⚠️ Token expired or invalid - redirecting to login');
        // Limpiar datos de usuario inválidos
        sessionStorage.removeItem('user');
        window.location.href = '/login';
        return [];
      }
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Medicamentos fetched:', data.data?.length || 0);
    return data.success ? data.data : [];
  } catch (error) {
    console.error('❌ Error fetching medicamentos:', error);
    
    // Si es error de red, mostrar mensaje más amigable
    if (error.message.includes('Failed to fetch')) {
      console.error('🌐 Network error - check API connection');
    }
    
    return [];
  }
};

export const addMedicamento = async (medicationData) => {
  try {
    console.log('📝 Adding new medication:', medicationData.name);
    
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    };
    
    console.log('📤 Request headers for add:', headers);
    console.log('📦 Medication data:', medicationData);
    console.log('🌐 API URL:', `${API_BASE_URL}/api/tratamientos/agregar-medicamento`);
    
    const response = await fetch(`${API_BASE_URL}/api/tratamientos/agregar-medicamento`, {
      method: 'POST',
      headers,
      body: JSON.stringify(medicationData)
    });
    
    console.log('📥 Add medication response status:', response.status);
    
    if (!response.ok) {
      if (response.status === 401) {
        console.warn('⚠️ Token expired or invalid during add operation');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
        return false;
      }
      
      const errorText = await response.text();
      console.error('❌ Add medication error:', errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Add medication response:', data);
    return data.success;
  } catch (error) {
    console.error('❌ Error adding medication:', error);
    return false;
  }
};

export const deleteMedicamento = async (tratamientoId) => {
  try {
    console.log('🗑️ Deleting medication:', tratamientoId);
    
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    };
    
    console.log('🌐 API URL:', `${API_BASE_URL}/api/tratamientos/eliminar/${tratamientoId}`);
    
    const response = await fetch(`${API_BASE_URL}/api/tratamientos/eliminar/${tratamientoId}`, {
      method: 'DELETE',
      headers
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        console.warn('⚠️ Token expired or invalid during delete operation');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
        return false;
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Medication deleted successfully');
    return data.success;
  } catch (error) {
    console.error('❌ Error deleting medication:', error);
    return false;
  }
};

// ===================================
// UTILITY FUNCTIONS
// ===================================

export const getDefaultMedicationForm = () => ({
  name: '',
  dosage: '',
  frequency: 'daily',
  times: ['08:00'],
  duration: 7,
  startDate: new Date().toISOString().split('T')[0],
  notes: '',
  reminder: true,
  category: 'prescription'
});

// ===================================
// GENERAL API FUNCTIONS
// ===================================

// 🔍 Función para buscar medicamentos (para el comparador de precios)
export const searchMedications = async (query) => {
  try {
    console.log('🔍 Searching medications:', query);
    
    const response = await fetch(`${API_BASE_URL}/api/medicamentos/buscar?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Search results:', data.length);
    return data;
  } catch (error) {
    console.error('❌ Error searching medications:', error);
    return [];
  }
};

// 💰 Función para obtener precios por principio activo
export const getPricesByActiveIngredient = async (activeIngredient) => {
  try {
    console.log('💰 Getting prices for:', activeIngredient);
    
    const response = await fetch(`${API_BASE_URL}/api/medicamentos/precios-por-principio/${encodeURIComponent(activeIngredient)}`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Price comparison data received');
    return data;
  } catch (error) {
    console.error('❌ Error getting price comparison:', error);
    throw error;
  }
};

// 🏥 Función para login
export const loginUser = async (credentials) => {
  try {
    console.log('🔐 Attempting login...');
    
    const response = await fetch(`${API_BASE_URL}/api/usuarios/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Login successful');
    
    // Guardar datos del usuario incluyendo el token
    sessionStorage.setItem('user', JSON.stringify(data));
    
    return data;
  } catch (error) {
    console.error('❌ Login error:', error);
    throw error;
  }
};

// 📝 Función para registro
export const registerUser = async (userData) => {
  try {
    console.log('📝 Attempting registration...');
    
    const response = await fetch(`${API_BASE_URL}/api/usuarios/registro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Registration successful');
    
    return data;
  } catch (error) {
    console.error('❌ Registration error:', error);
    throw error;
  }
};

// 🔍 Health check de la API
export const checkAPIHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    console.log('💓 API Health:', data);
    return data.status === 'healthy';
  } catch (error) {
    console.error('❌ API Health check failed:', error);
    return false;
  }
};

// ===================================
// EXPORT DEFAULT API OBJECT
// ===================================

const API = {
  baseURL: API_BASE_URL,
  auth: {
    login: loginUser,
    register: registerUser,
    isAuthenticated,
    getUserData,
    getAuthHeader
  },
  medications: {
    fetch: fetchMedicamentos,
    add: addMedicamento,
    delete: deleteMedicamento,
    search: searchMedications,
    getPrices: getPricesByActiveIngredient
  },
  utils: {
    getDefaultForm: getDefaultMedicationForm,
    checkHealth: checkAPIHealth
  }
};

export default API;