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

  // --- Decodificar token ---
  const decodeToken = useCallback((token) => {
    try {
      const decoded = jwtDecode(token);
      return {
        id: decoded.user_id || decoded.sub,
        email: decoded.email || decoded.username,
        username: decoded.username || decoded.email,
      };
    } catch (err) {
      console.error('Error decodificando token:', err);
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
    if (access) localStorage.setItem('access_token', access);
    if (refresh) localStorage.setItem('refresh_token', refresh);
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
          setUser(userData);
          setIsAuthenticated(true);
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

  // --- Login ---
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
    logout,
    refreshToken,
    getAccessToken,
    getRefreshToken,
    checkAuth,
    isTokenExpired,
  };
};