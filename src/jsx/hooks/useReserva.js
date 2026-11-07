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

  // Estado para guardar el base64 y el nombre del archivo
  const [evidenciaBase64, setEvidenciaBase64] = useState(null);
  const [evidenciaNombre, setEvidenciaNombre] = useState('');

  const [enviado, setEnviado] = useState(false);
  const [boleta, setBoleta] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'evidencia') {
      const file = files[0];
      if (file) {
        setFormData((prev) => ({ ...prev, evidencia: file }));
        setEvidenciaNombre(file.name);

        // Convertir archivo a Base64 para enviarlo a Django
        const reader = new FileReader();
        reader.onloadend = () => {
          setEvidenciaBase64(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validarFormulario = () => {
    if (!formData.nombre || !formData.apellido || !formData.rut || !formData.descripcion || !formData.email || !formData.telefono) {
      setError('Por favor completa todos los campos obligatorios.');
      return false;
    }

    // ✅ CORRECCIÓN SONARCLOUD: Validación de email sin regex (evita ReDoS)
    const emailParts = formData.email.split('@');
    const isEmailValid = emailParts.length === 2 && emailParts[1].includes('.') && !emailParts[1].startsWith('.') && !emailParts[1].endsWith('.');

    if (!isEmailValid) {
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
        // ✅ CORRECCIÓN: Enviamos el Base64 y el Nombre que espera el backend
        evidenciaBase64: evidenciaBase64,
        evidenciaNombre: evidenciaNombre,
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
    setEvidenciaBase64(null);
    setEvidenciaNombre('');
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
    evidenciaBase64, // Opcional, por si lo necesitas en la vista
    evidenciaNombre, // Opcional
  };
};