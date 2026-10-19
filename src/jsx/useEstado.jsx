// src/jsx/useEstado.jsx
import { useState } from 'react';
import { fetchEstadoReserva } from '../services/api';

/**
 * Hook para consultar el estado de reservas.
 * Permite buscar por boleta, RUT o nombre+apellido.
 */
export const useEstado = () => {
  // --- Estado del formulario de búsqueda ---
  const [tipoBusqueda, setTipoBusqueda] = useState('boleta');
  const [busquedaBoleta, setBusquedaBoleta] = useState('');
  const [busquedaRut, setBusquedaRut] = useState('');
  const [busquedaNombre, setBusquedaNombre] = useState('');
  const [busquedaApellido, setBusquedaApellido] = useState('');

  // --- Estado de resultados ---
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  /**
   * Consulta el estado de reservas según los parámetros seleccionados.
   * @param {Event} e - Evento del formulario (opcional, se puede llamar sin él)
   */
  const consultar = async (e) => {
    if (e) e.preventDefault();

    setError('');
    setReservas([]);

    // Construir parámetros según el tipo de búsqueda
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
      // fetchEstadoReserva devuelve el array directamente (desde api.js)
      const reservasData = await fetchEstadoReserva(params);
      if (Array.isArray(reservasData) && reservasData.length > 0) {
        setReservas(reservasData);
      } else {
        setError('No se encontraron reservas con los datos proporcionados.');
        setReservas([]);
      }
    } catch (err) {
      setError(err.message || 'No se pudo consultar el estado.');
      setReservas([]);
    } finally {
      setCargando(false);
    }
  };

  /**
   * Limpia todos los campos y resultados.
   */
  const limpiar = () => {
    setBusquedaBoleta('');
    setBusquedaRut('');
    setBusquedaNombre('');
    setBusquedaApellido('');
    setReservas([]);
    setError('');
  };

  return {
    // Estado de búsqueda
    tipoBusqueda,
    setTipoBusqueda,
    busquedaBoleta,
    setBusquedaBoleta,
    busquedaRut,
    setBusquedaRut,
    busquedaNombre,
    setBusquedaNombre,
    busquedaApellido,
    setBusquedaApellido,

    // Estado de resultados
    reservas,
    cargando,
    error,

    // Acciones
    consultar,
    limpiar,
  };
};