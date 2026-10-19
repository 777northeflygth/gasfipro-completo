// src/front-jsx/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../jsx/hooks/useAuth'; // ← Ruta corregida

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, error } = useAuth();

  // Mostrar mensaje de carga mientras se verifica la sesión
  if (loading) {
    return (
      <div className="loading-screen">
        <p>Verificando sesión...</p>
      </div>
    );
  }

  // Si hay un error de autenticación o no está autenticado, redirigir al login
  if (error || !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, renderizar el contenido
  return children;
}