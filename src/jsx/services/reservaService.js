// src/jsx/services/reservaService.js
import { createBooking } from './api';

export const createReserva = async (reservaData) => {
  // Validación de campos requeridos
  const requiredFields = ['rut', 'nombre', 'apellido', 'email', 'telefono', 'descripcion'];
  for (const field of requiredFields) {
    if (!reservaData[field]) {
      throw new Error(`El campo ${field} es obligatorio.`);
    }
  }
  // Llamar a la función genérica de creación de bookings
  return createBooking(reservaData);
};