// src/front-jsx/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../jsx/hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { loading, isAuthenticated, checkAuth } = useAuth();

  // Como el hook se monta de nuevo, 'loading' será true un instante.
  if (loading) {
    return (
      <div className="loading-screen" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Verificando sesión...</p>
      </div>
    );
  }

  // Verificamos si hay token en el localStorage (síncrono) por si el estado de React tarda en actualizarse
  const hasToken = localStorage.getItem('access_token');
  
  if (!isAuthenticated && !hasToken) {
    console.log("🔒 No autenticado, redirigiendo a /login");
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado o hay token, renderizamos
  return children ? children : <Outlet />;
}