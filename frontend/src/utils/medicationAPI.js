// API functions for medications with proper JWT authentication
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

export const fetchMedicamentos = async () => {
  try {
    console.log('🔍 Fetching medicamentos from API...');
    
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    };
    
    console.log('📤 Request headers:', headers);
    
    const response = await fetch('http://localhost:5000/api/tratamientos/mis-medicamentos', {
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
    
    const response = await fetch('http://localhost:5000/api/tratamientos/agregar-medicamento', {
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
    
    const response = await fetch(`http://localhost:5000/api/tratamientos/eliminar/${tratamientoId}`, {
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

// ✅ NUEVA FUNCIÓN: Verificar si el usuario está autenticado
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

// ✅ NUEVA FUNCIÓN: Obtener datos del usuario
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