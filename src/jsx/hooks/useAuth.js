// src/jsx/hooks/useAuth.js

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, refreshToken as apiRefreshToken } from '../services/api';
import { jwtDecode } from 'jwt-decode';

export const useAuth = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // --- Decodificar token (Con validación extra) ---
  const decodeToken = useCallback((token) => {
    try {
      if (!token || token === 'undefined' || token.split('.').length !== 3) {
        console.error('❌ El token no tiene formato JWT válido:', token);
        return null;
      }
      const decoded = jwtDecode(token);
      return {
        id: decoded.user_id || decoded.sub,
        email: decoded.email || decoded.username,
        username: decoded.username || decoded.email,
      };
    } catch (err) {
      console.error('❌ Error decodificando token:', err);
      return null;
    }
  }, []);

  // --- Verificar expiración ---
  const isTokenExpired = useCallback((token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }, []);

  // --- Getters y setters de tokens ---
  const getAccessToken = useCallback(() => localStorage.getItem('access_token'), []);
  const getRefreshToken = useCallback(() => localStorage.getItem('refresh_token'), []);
  
  const setTokens = useCallback((access, refresh) => {
    if (access && access !== 'undefined') localStorage.setItem('access_token', access);
    if (refresh && refresh !== 'undefined') localStorage.setItem('refresh_token', refresh);
  }, []);
  
  const clearTokens = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }, []);

  // --- Verificación inicial de autenticación ---
  useEffect(() => {
    const verifyAuth = async () => {
      setLoading(true);
      try {
        const token = getAccessToken();
        const refresh = getRefreshToken();

        if (!token || !refresh) {
          setLoading(false);
          return;
        }

        if (!isTokenExpired(token)) {
          const userData = decodeToken(token);
          if (userData) {
            setUser(userData);
            setIsAuthenticated(true);
          } else {
             clearTokens(); // Si el token está corrupto, limpiamos
          }
        } else {
          // Intentar refrescar
          try {
            const newToken = await apiRefreshToken();
            const userData = decodeToken(newToken);
            setUser(userData);
            setIsAuthenticated(true);
          } catch (refreshError) {
            console.error('Error al refrescar token:', refreshError);
            clearTokens();
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Error en verificación de autenticación:', err);
        clearTokens();
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, [getAccessToken, getRefreshToken, isTokenExpired, decodeToken, clearTokens]);

  // --- Login Tradicional ---
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiLogin(email, password);
      setTokens(data.access, data.refresh);
      const userData = decodeToken(data.access);
      setUser(userData);
      setIsAuthenticated(true);
      navigate('/admin');
      return true;
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas');
      setIsAuthenticated(false);
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, [navigate, setTokens, decodeToken]);

  // ✅ Login con Google (Actualizado para Auth-Code)
  const loginWithGoogle = useCallback(async (googleCode) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/google/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // ✅ CAMBIO CLAVE: Enviamos ÚNICAMENTE el código de autorización
        body: JSON.stringify({ code: googleCode }),
      });

      // Validar si el servidor devolvió HTML (error 500) en lugar de JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("El servidor falló. Revisa la terminal de Django para más detalles.");
      }

      const data = await response.json();

      // 1. Vemos exactamente qué devuelve Django
      console.log("1. Respuesta del backend:", data);

      if (!response.ok) {
        const errorMessage = data.non_field_errors?.[0] || data.detail || 'Error al autenticar con Google.';
        throw new Error(errorMessage);
      }

      // 2. Extraemos el token (cubriendo todas las variantes posibles de Django)
      const accessToken = data.access || data.access_token || data.key || data.token;
      const refreshToken = data.refresh || data.refresh_token;

      // 3. Verificamos si realmente obtuvimos un token
      console.log("2. Token extraído para guardar en LocalStorage:", accessToken);

      if (!accessToken) {
        throw new Error("El backend no devolvió un token de acceso válido.");
      }

      // 4. Guardamos en LocalStorage
      setTokens(accessToken, refreshToken);
      
      // 5. Decodificamos
      const userData = decodeToken(accessToken);
      console.log("3. Datos del usuario decodificados:", userData);

      if (!userData) {
         throw new Error("El token devuelto no es un JWT válido o está corrupto.");
      }

      setUser(userData);
      setIsAuthenticated(true);
      
      // 6. Redirigimos
      console.log("4. ¡Éxito! Redirigiendo a /admin...");
      navigate('/admin');
      return true;
    } catch (err) {
      console.error("❌ Error en loginWithGoogle:", err);
      setError(err.message || 'Error de conexión con el servidor');
      setIsAuthenticated(false);
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, [navigate, setTokens, decodeToken]);

  // --- Logout ---
  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  }, [navigate, clearTokens]);

  // --- Refrescar token ---
  const refreshToken = useCallback(async () => {
    try {
      const newToken = await apiRefreshToken();
      setTokens(newToken, null);
      const userData = decodeToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error('Error en refreshToken:', err);
      logout();
      return false;
    }
  }, [setTokens, decodeToken, logout]);

  // --- checkAuth ---
  const checkAuth = useCallback(() => {
    const token = getAccessToken();
    if (!token) return false;
    if (isTokenExpired(token)) {
      refreshToken();
      return false;
    }
    return true;
  }, [getAccessToken, isTokenExpired, refreshToken]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    loginWithGoogle,
    logout,
    refreshToken,
    getAccessToken,
    getRefreshToken,
    checkAuth,
    isTokenExpired,
  };
};