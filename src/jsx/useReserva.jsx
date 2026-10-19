// src/jsx/useReserva.jsx
import { useState } from 'react';
import { createReserva, fetchEstadoReserva } from './services/api';

export const useReserva = () => {
  // --- Estado para el formulario de reserva ---
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    rut: '',
    sexo: 'masculino',
    email: '',
    telefono: '',
    descripcion: '',
    hora_agenda: '', // 🆕 Hora de agenda seleccionada por el usuario
  });

  // Estados para la evidencia (base64)
  const [evidenciaFile, setEvidenciaFile] = useState(null);
  const [evidenciaBase64, setEvidenciaBase64] = useState(null);
  const [evidenciaNombre, setEvidenciaNombre] = useState('');

  const [enviado, setEnviado] = useState(false);
  const [boleta, setBoleta] = useState('');
  const [fechaSolicitud, setFechaSolicitud] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // --- Estado para la consulta de estado ---
  const [tipoBusqueda, setTipoBusqueda] = useState('boleta');
  const [busquedaBoleta, setBusquedaBoleta] = useState('');
  const [busquedaRut, setBusquedaRut] = useState('');
  const [busquedaNombre, setBusquedaNombre] = useState('');
  const [busquedaApellido, setBusquedaApellido] = useState('');
  const [reservas, setReservas] = useState([]);
  const [cargandoConsulta, setCargandoConsulta] = useState(false);
  const [errorConsulta, setErrorConsulta] = useState('');

  // --- Handlers para el formulario de reserva ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setEvidenciaFile(null);
      setEvidenciaBase64(null);
      setEvidenciaNombre('');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('El archivo es demasiado grande (máx 15MB).');
      setEvidenciaFile(null);
      setEvidenciaBase64(null);
      setEvidenciaNombre('');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEvidenciaBase64(reader.result);
      setEvidenciaNombre(file.name);
      setEvidenciaFile(file);
      if (error) setError('');
    };
    reader.onerror = () => {
      setError('Error al leer el archivo. Intenta nuevamente.');
      setEvidenciaFile(null);
      setEvidenciaBase64(null);
      setEvidenciaNombre('');
    };
    reader.readAsDataURL(file);
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
        hora_agenda: formData.hora_agenda || null, // 🆕 Usa el valor del formulario o null
        status: 'pendiente',
        evidenciaBase64: evidenciaBase64,
        evidenciaNombre: evidenciaNombre,
      };

      const response = await createReserva(payload);
      
      setBoleta(response.boleta);
      setFechaSolicitud(response.created_at);
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
      hora_agenda: '', // 🆕 Reiniciar también la hora
    });
    setEvidenciaFile(null);
    setEvidenciaBase64(null);
    setEvidenciaNombre('');
    setEnviado(false);
    setBoleta('');
    setFechaSolicitud('');
    setError('');
  };

  // --- Handlers para la consulta de estado ---
  const consultarEstado = async (e) => {
    e.preventDefault();
    setErrorConsulta('');
    setReservas([]);

    let params = {};
    if (tipoBusqueda === 'boleta') {
      if (!busquedaBoleta || busquedaBoleta.length !== 16) {
        setErrorConsulta('El número de boleta debe tener 16 dígitos.');
        return;
      }
      params = { boleta: busquedaBoleta };
    } else if (tipoBusqueda === 'rut') {
      if (!busquedaRut) {
        setErrorConsulta('Por favor ingresa el RUT.');
        return;
      }
      params = { rut: busquedaRut };
    } else if (tipoBusqueda === 'nombre') {
      if (!busquedaNombre || !busquedaApellido) {
        setErrorConsulta('Por favor ingresa nombre y apellido.');
        return;
      }
      params = { nombre: busquedaNombre, apellido: busquedaApellido };
    }

    setCargandoConsulta(true);
    try {
      const reservasData = await fetchEstadoReserva(params);
      
      if (Array.isArray(reservasData) && reservasData.length > 0) {
        setReservas(reservasData);
      } else {
        setErrorConsulta('No se encontraron reservas con los datos proporcionados.');
        setReservas([]);
      }
    } catch (err) {
      setErrorConsulta(err.message || 'No se pudo consultar el estado.');
      setReservas([]);
    } finally {
      setCargandoConsulta(false);
    }
  };

  const limpiarConsulta = () => {
    setReservas([]);
    setErrorConsulta('');
    setBusquedaBoleta('');
    setBusquedaRut('');
    setBusquedaNombre('');
    setBusquedaApellido('');
  };

  // --- Retorno unificado ---
  return {
    // Para reserva
    formData,
    handleChange,
    handleFileChange,
    handleSubmit,
    enviado,
    boleta,
    fechaSolicitud,
    isLoading,
    error,
    resetForm,
    evidenciaBase64,
    evidenciaNombre,
    evidenciaFile,

    // Para consulta de estado
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
    reservas,
    cargandoConsulta,
    errorConsulta,
    consultarEstado,
    limpiarConsulta,
  };
}; 