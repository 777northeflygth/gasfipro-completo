// src/jsx/hooks/useReserva.js
import { useState } from 'react';
import { createReserva } from '../services/api';

export const useReserva = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    rut: '',
    sexo: 'masculino',
    email: '',
    telefono: '',
    descripcion: '',
    evidencia: null,
  });

  const [enviado, setEnviado] = useState(false);
  const [boleta, setBoleta] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'evidencia') {
      setFormData((prev) => ({ ...prev, evidencia: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validarFormulario = () => {
    if (!formData.nombre || !formData.apellido || !formData.rut || !formData.descripcion || !formData.email || !formData.telefono) {
      setError('Por favor completa todos los campos obligatorios.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor ingresa un correo electrónico válido.');
      return false;
    }

    const telefonoLimpio = formData.telefono.replace(/\s/g, '');
    if (!/^\d{8,15}$/.test(telefonoLimpio)) {
      setError('Por favor ingresa un número de teléfono válido (mínimo 8 dígitos).');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setIsLoading(true);
    setError('');

    try {
      const payload = {
        rut: formData.rut,
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        telefono: formData.telefono,
        sexo: formData.sexo,
        service: formData.descripcion.split('\n')[0] || 'Servicio general',
        descripcion: formData.descripcion,
        fecha_agenda: new Date().toISOString().split('T')[0],
        hora_agenda: '09:00:00',
        status: 'pendiente',
        evidencia: formData.evidencia,
      };

      const response = await createReserva(payload);
      setBoleta(response.boleta);
      setEnviado(true);
    } catch (err) {
      setError(err.message || 'Error al enviar la solicitud. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      rut: '',
      sexo: 'masculino',
      email: '',
      telefono: '',
      descripcion: '',
      evidencia: null,
    });
    setEnviado(false);
    setBoleta('');
    setError('');
  };

  return {
    formData,
    handleChange,
    handleSubmit,
    enviado,
    boleta,
    isLoading,
    error,
    resetForm,
  };
};