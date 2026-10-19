// src/front-jsx/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Inicio from './inicio';
import Cotizacion from './Cotizacion';
import Reserva from './Reserva';
import Contacto from './Contacto';
import Login from './Login';
import Admin from './Admin';
import EstadoHora from './EstadoHora';
import ProtectedRoute from './ProtectedRoute'; // ← importación por defecto
import CalendarioCompleto from './CalendarioCompleto';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/cotizacion" element={<Cotizacion />} />
        <Route path="/reserva" element={<Reserva />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/login" element={<Login />} />
        <Route path="/estado" element={<EstadoHora />} />
        <Route path="/calendario" element={<CalendarioCompleto />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;