// src/jsx/useEstadoReserva.js
import { useState } from 'react';
import { fetchEstadoReserva } from '../services/api';

export const useEstadoReserva = () => {
  const [boleta, setBoleta] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);
  const [consultado, setConsultado] = useState(false);

  const consultar = async (e) => {
    e.preventDefault();
    if (!boleta || boleta.length !== 16) {
      setError('El número de boleta debe tener 16 dígitos.');
      return;
    }

    setCargando(true);
    setError('');
    setConsultado(true);
    setResultado(null);

    try {
      const data = await fetchEstadoReserva(boleta);
      setResultado(data);
    } catch (err) {
      setError(err.message || 'No se pudo consultar el estado.');
    } finally {
      setCargando(false);
    }
  };

  const reset = () => {
    setBoleta('');
    setResultado(null);
    setError('');
    setConsultado(false);
  };

  return {
    boleta,
    setBoleta,
    cargando,
    error,
    resultado,
    consultado,
    consultar,
    reset,
  };
};