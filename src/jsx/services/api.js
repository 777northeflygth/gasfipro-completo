// src/jsx/services/api.js

const API_BASE = 'http://localhost:8000/api';

// --- Helpers de autenticación ---
const getToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');
const setTokens = (access, refresh) => {
  if (access) localStorage.setItem('access_token', access);
  if (refresh) localStorage.setItem('refresh_token', refresh);
};
const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// --- Headers para peticiones autenticadas ---
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

// --- Función para manejar errores de respuesta ---
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = 'Error en la petición';
    try {
      const data = await response.json();
      errorMessage = data.detail || data.message || JSON.stringify(data);
    } catch {
      errorMessage = response.statusText || `Error ${response.status}`;
    }
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

// --- Función para peticiones autenticadas con reintento de refresh ---
const fetchWithAuth = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders(),
        ...options.headers,
      },
    });
    return await handleResponse(response);
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      try {
        const newAccess = await refreshToken();
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newAccess}`,
            ...options.headers,
          },
        });
        return await handleResponse(response);
      } catch (refreshError) {
        clearTokens();
        window.location.href = '/login';
        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
      }
    }
    throw error;
  }
};

// --- Funciones de la API ---

// 1. Obtener todas las reservas
export const fetchBookings = async () => {
  return fetchWithAuth(`${API_BASE}/bookings/`);
};

// 2. Crear una nueva reserva (con evidencia en base64)
export const createBooking = async (data) => {
  const token = getToken();
  if (!token) {
    throw new Error('No hay token de autenticación. Inicia sesión.');
  }

  const response = await fetch(`${API_BASE}/bookings/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (response.status === 401) {
    try {
      const newToken = await refreshToken();
      const retryResponse = await fetch(`${API_BASE}/bookings/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newToken}`,
        },
        body: JSON.stringify(data),
      });
      return handleResponse(retryResponse);
    } catch (refreshError) {
      clearTokens();
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
    }
  }

  return handleResponse(response);
};

// 3. Actualizar una reserva
export const updateBooking = async (id, data) => {
  return fetchWithAuth(`${API_BASE}/bookings/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

// 4. Eliminar una reserva
export const deleteBooking = async (id) => {
  return fetchWithAuth(`${API_BASE}/bookings/${id}/`, {
    method: 'DELETE',
  });
};

// 5. Obtener resumen de ganancias
export const fetchEarnings = async () => {
  return fetchWithAuth(`${API_BASE}/bookings/earnings/`);
};

// 6. Obtener clientes
export const fetchClients = async () => {
  return fetchWithAuth(`${API_BASE}/bookings/clients/`);
};

// 7. Obtener solicitudes (con evidencia)
export const fetchSolicitudes = async () => {
  return fetchWithAuth(`${API_BASE}/bookings/solicitudes/`);
};

// 8. Cambiar estado de una reserva
export const updateStatus = async (id, status) => {
  return fetchWithAuth(`${API_BASE}/bookings/${id}/status/`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

// 9. Login (obtener tokens)
export const login = async (email, password) => {
  const response = await fetch(`${API_BASE}/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || 'Credenciales incorrectas');
  }
  const data = await response.json();
  setTokens(data.access, data.refresh);
  return data;
};

// 10. Refrescar token
export const refreshToken = async () => {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error('No hay refresh token');
  const response = await fetch(`${API_BASE}/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  if (!response.ok) {
    clearTokens();
    throw new Error('Error al refrescar token');
  }
  const data = await response.json();
  setTokens(data.access, null);
  return data.access;
};

// 11. Logout
export const logout = () => {
  clearTokens();
  window.location.href = '/login';
};

// 12. Obtener URL de la evidencia (para mostrar en el frontend)
export const getEvidenciaUrl = (evidenciaPath) => {
  if (!evidenciaPath) return null;
  if (evidenciaPath.startsWith('http')) return evidenciaPath;
  return `${API_BASE.replace('/api', '')}/media/${evidenciaPath}`;
};

// 13. Crear reserva (alias con validación)
export const createReserva = async (reservaData) => {
  const requiredFields = ['rut', 'nombre', 'apellido', 'email', 'telefono', 'descripcion'];
  for (const field of requiredFields) {
    if (!reservaData[field]) {
      throw new Error(`El campo ${field} es obligatorio.`);
    }
  }
  return createBooking(reservaData);
};

// 🆕 14. Consultar estado de una reserva (público) - RETORNA DIRECTAMENTE EL ARRAY
export const fetchEstadoReserva = async (params) => {
  const query = new URLSearchParams();
  if (params.boleta) {
    if (params.boleta.length !== 16) {
      throw new Error('El número de boleta debe tener 16 dígitos.');
    }
    query.append('boleta', params.boleta);
  } else if (params.rut) {
    query.append('rut', params.rut);
  } else if (params.nombre && params.apellido) {
    query.append('nombre', params.nombre);
    query.append('apellido', params.apellido);
  } else {
    throw new Error('Debes proporcionar boleta, RUT o nombre y apellido.');
  }

  const url = `${API_BASE}/bookings/estado/?${query.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Error al consultar el estado de la reserva');
  }

  const data = await response.json();
  
  // ✅ Extraer el array de reservas (el backend devuelve { reservas: [...] })
  if (data && data.reservas && Array.isArray(data.reservas)) {
    return data.reservas;
  }
  
  // Fallback: si la respuesta no tiene el formato esperado, devolver array vacío
  console.warn('La respuesta de fetchEstadoReserva no contiene "reservas" array:', data);
  return [];
};