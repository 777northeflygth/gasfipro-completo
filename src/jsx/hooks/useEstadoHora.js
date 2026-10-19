// src/jsx/hooks/useEstadoHora.js
import { useState } from 'react';
import { fetchEstadoReserva } from '../services/api';

export const useEstadoHora = () => {
  // Estados para los campos de búsqueda
  const [tipoBusqueda, setTipoBusqueda] = useState('boleta');
  const [busquedaBoleta, setBusquedaBoleta] = useState('');
  const [busquedaRut, setBusquedaRut] = useState('');
  const [busquedaNombre, setBusquedaNombre] = useState('');
  const [busquedaApellido, setBusquedaApellido] = useState('');

  // Estados de la consulta
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Función para consultar el estado
  const consultar = async (e) => {
    e.preventDefault();
    setError('');
    setReservas([]);

    // Validar y construir parámetros
    let params = {};
    if (tipoBusqueda === 'boleta') {
      if (!busquedaBoleta || busquedaBoleta.length !== 16) {
        setError('El número de boleta debe tener 16 dígitos.');
        return;
      }
      params = { boleta: busquedaBoleta };
    } else if (tipoBusqueda === 'rut') {
      if (!busquedaRut) {
        setError('Por favor ingresa el RUT.');
        return;
      }
      params = { rut: busquedaRut };
    } else if (tipoBusqueda === 'nombre') {
      if (!busquedaNombre || !busquedaApellido) {
        setError('Por favor ingresa nombre y apellido.');
        return;
      }
      params = { nombre: busquedaNombre, apellido: busquedaApellido };
    }

    setCargando(true);
    try {
      // fetchEstadoReserva devuelve directamente el array de reservas
      const data = await fetchEstadoReserva(params);
      if (Array.isArray(data) && data.length > 0) {
        setReservas(data);
      } else {
        setError('No se encontraron reservas con los datos proporcionados.');
      }
    } catch (err) {
      setError(err.message || 'Error al consultar el estado.');
    } finally {
      setCargando(false);
    }
  };

  // Limpiar toda la búsqueda
  const limpiar = () => {
    setReservas([]);
    setError('');
    setBusquedaBoleta('');
    setBusquedaRut('');
    setBusquedaNombre('');
    setBusquedaApellido('');
  };

  // Cambiar tipo de búsqueda (limpia campos)
  const cambiarTipoBusqueda = (nuevoTipo) => {
    setTipoBusqueda(nuevoTipo);
    setBusquedaBoleta('');
    setBusquedaRut('');
    setBusquedaNombre('');
    setBusquedaApellido('');
    setReservas([]);
    setError('');
  };

  return {
    // Estados
    tipoBusqueda,
    busquedaBoleta,
    setBusquedaBoleta,
    busquedaRut,
    setBusquedaRut,
    busquedaNombre,
    setBusquedaNombre,
    busquedaApellido,
    setBusquedaApellido,
    reservas,
    cargando,
    error,

    // Acciones
    consultar,
    limpiar,
    cambiarTipoBusqueda,
  };
};