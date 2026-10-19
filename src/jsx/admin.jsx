// src/jsx/admin.jsx
// ============================================================
//  LÓGICA COMPLETA PARA ADMIN (con API)
//  (sin localStorage, todo se sincroniza con el backend)
// ============================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, isBefore, startOfDay } from 'date-fns';
import {
  fetchBookings,
  updateBooking,
  deleteBooking,
  updateStatus,
} from './services/api';

// ----- CONSTANTES -----
export const statusLabels = {
  pendiente: 'Pendiente',
  agendado: 'Agendado',
  en_proceso: 'En proceso',
  resuelto: 'Resuelto',
};

// ✅ FORMATOS: Convertir a número antes de formatear
export const formatCurrency = (amount) => {
  const num = Number(amount);
  if (isNaN(num)) return '$0';
  return `$${num.toLocaleString('es-CL')}`;
};

export const safeFormatDate = (dateString, formatStr = 'dd/MM/yyyy') => {
  if (!dateString) return '—';
  try {
    return format(parseISO(dateString), formatStr);
  } catch {
    return '—';
  }
};

// ----- HOOK PERSONALIZADO -----
export const useAdmin = () => {
  // --- Estado ---
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editEarnings, setEditEarnings] = useState('');
  const [editMotivo, setEditMotivo] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Modal de evidencia
  const [showEvidenciaModal, setShowEvidenciaModal] = useState(false);
  const [evidenciaData, setEvidenciaData] = useState(null);
  const [evidenciaNombre, setEvidenciaNombre] = useState('');
  const [evidenciaTipo, setEvidenciaTipo] = useState('');

  // ----- Carga inicial desde la API (con manejo de paginación) -----
  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBookings();
      // Si la respuesta tiene paginación (results), extraer el array
      let bookingsData;
      if (data && typeof data === 'object' && data.results) {
        bookingsData = data.results;
      } else {
        bookingsData = Array.isArray(data) ? data : [];
      }
      setBookings(bookingsData);
    } catch (err) {
      setError(err.message);
      console.error('Error loading bookings:', err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // ----- CRUD (llamadas a la API) -----
  const updateBookingItem = useCallback(async (id, data) => {
    try {
      const updated = await updateBooking(id, data);
      setBookings(prev => Array.isArray(prev) ? prev.map(b => b.id === id ? updated : b) : [updated]);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteBookingItem = useCallback(async (id) => {
    try {
      await deleteBooking(id);
      setBookings(prev => Array.isArray(prev) ? prev.filter(b => b.id !== id) : []);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const changeStatus = useCallback(async (id, status) => {
    try {
      const updated = await updateStatus(id, status);
      setBookings(prev => Array.isArray(prev) ? prev.map(b => b.id === id ? updated : b) : [updated]);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // ----- Handlers para el modal de edición -----
  const openEditModal = useCallback((booking) => {
    setEditingBooking(booking);
    setEditDate(booking.fecha_agenda || '');
    setEditTime(booking.hora_agenda || '');
    setEditStatus(booking.status);
    if (booking.status === 'resuelto' && booking.ganancia !== undefined && booking.ganancia !== null) {
      setEditEarnings(booking.ganancia.toString());
      setEditMotivo(booking.motivo_cobro || '');
    } else {
      setEditEarnings('');
      setEditMotivo('');
    }
    setShowEditModal(true);
    setSaveSuccess(false);
  }, []);

  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setEditingBooking(null);
    setSaveSuccess(false);
  }, []);

  const handleStatusChange = useCallback((newStatus) => {
    setEditStatus(newStatus);
    if (newStatus === 'resuelto' && editingBooking) {
      const currentEarnings = editingBooking.ganancia;
      setEditEarnings(currentEarnings ? currentEarnings.toString() : '');
      setEditMotivo(editingBooking.motivo_cobro || '');
    } else if (newStatus !== 'resuelto') {
      setEditEarnings('');
      setEditMotivo('');
    }
  }, [editingBooking]);

  const handleEditSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!editStatus) return;

    // Validaciones
    if (editStatus === 'agendado' && (!editDate || !editTime)) {
      alert('Para agendar, debes seleccionar fecha y hora.');
      return;
    }

    if (editStatus === 'resuelto') {
      const parsed = parseFloat(editEarnings);
      if (isNaN(parsed) || parsed < 0) {
        alert('Por favor ingresa una ganancia válida (número positivo).');
        return;
      }
      if (!editMotivo.trim()) {
        alert('Debes ingresar el motivo del cobro.');
        return;
      }
    }

    // Preparar payload
    const payload = {
      status: editStatus,
      fecha_agenda: editStatus === 'agendado' ? editDate : null,
      hora_agenda: editStatus === 'agendado' ? editTime : null,
      ganancia: editStatus === 'resuelto' ? parseFloat(editEarnings) : null,
      motivo_cobro: editStatus === 'resuelto' ? editMotivo.trim() : '',
    };

    try {
      const updated = await updateBooking(editingBooking.id, payload);
      setBookings(prev => Array.isArray(prev) ? prev.map(b => b.id === editingBooking.id ? updated : b) : [updated]);
      setSaveSuccess(true);
      setTimeout(closeEditModal, 1500);
    } catch (err) {
      alert('Error al guardar cambios: ' + err.message);
    }
  }, [editingBooking, editDate, editTime, editStatus, editEarnings, editMotivo, closeEditModal, updateBookingItem]);

  // ----- Handlers para el modal de evidencia -----
  const openEvidenciaModal = useCallback((evidenciaPayload) => {
    if (evidenciaPayload && typeof evidenciaPayload === 'object') {
      if (evidenciaPayload.evidenciaData !== undefined) {
        setEvidenciaData(evidenciaPayload.evidenciaData);
        setEvidenciaNombre(evidenciaPayload.evidenciaNombre || 'Sin nombre');
        setEvidenciaTipo(evidenciaPayload.evidenciaTipo || '');
      } else if (evidenciaPayload.evidenciaUrl !== undefined) {
        setEvidenciaData(evidenciaPayload.evidenciaUrl);
        setEvidenciaNombre(evidenciaPayload.evidenciaNombre ||
                          (evidenciaPayload.evidenciaUrl ? evidenciaPayload.evidenciaUrl.split('/').pop() : 'Sin nombre'));
        setEvidenciaTipo(evidenciaPayload.evidenciaTipo || '');
      } else if (evidenciaPayload.id) {
        const url = evidenciaPayload.evidenciaData ||
                   evidenciaPayload.evidenciaUrl ||
                   evidenciaPayload.evidencia ||
                   null;
        const nombre = evidenciaPayload.evidenciaNombre ||
                      (url ? url.split('/').pop() : 'Sin nombre');
        const tipo = evidenciaPayload.evidenciaTipo || '';
        setEvidenciaData(url);
        setEvidenciaNombre(nombre);
        setEvidenciaTipo(tipo);
      } else {
        setEvidenciaData(null);
        setEvidenciaNombre('Sin nombre');
        setEvidenciaTipo('');
      }
    } else {
      setEvidenciaData(null);
      setEvidenciaNombre('Sin nombre');
      setEvidenciaTipo('');
    }
    setShowEvidenciaModal(true);
  }, []);

  const closeEvidenciaModal = useCallback(() => {
    setShowEvidenciaModal(false);
    setEvidenciaData(null);
    setEvidenciaNombre('');
    setEvidenciaTipo('');
  }, []);

  // ----- Cálculos de métricas (basados en bookings) -----
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => format(today, 'yyyy-MM-dd'), [today]);

  const bookingsArray = useMemo(() => Array.isArray(bookings) ? bookings : [], [bookings]);

  const pendingBookings = useMemo(() => {
    return bookingsArray.filter(b => b.status === 'pendiente');
  }, [bookingsArray]);

  const agendadoBookings = useMemo(() => {
    return bookingsArray.filter(b => b.status === 'agendado');
  }, [bookingsArray]);

  const enProcesoBookings = useMemo(() => {
    return bookingsArray.filter(b => b.status === 'en_proceso');
  }, [bookingsArray]);

  const resueltoBookings = useMemo(() => {
    return bookingsArray.filter(b => b.status === 'resuelto');
  }, [bookingsArray]);

  const pendingToday = useMemo(() => {
    return pendingBookings.filter(b => b.fecha_agenda === todayStr);
  }, [pendingBookings, todayStr]);

  // ✅ CORRECCIÓN: Convertir ganancia a número en todos los cálculos
  const earningsData = useMemo(() => {
    const resueltos = bookingsArray.filter(b => b.status === 'resuelto');
    const todayEarnings = resueltos
      .filter(b => b.fecha_agenda === todayStr)
      .reduce((sum, b) => sum + Number(b.ganancia || 0), 0);

    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const weekEarnings = resueltos
      .filter(b => {
        if (!b.fecha_agenda) return false;
        const bDate = parseISO(b.fecha_agenda);
        return isWithinInterval(bDate, { start: weekStart, end: weekEnd });
      })
      .reduce((sum, b) => sum + Number(b.ganancia || 0), 0);

    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const monthEarnings = resueltos
      .filter(b => {
        if (!b.fecha_agenda) return false;
        const bDate = parseISO(b.fecha_agenda);
        return isWithinInterval(bDate, { start: monthStart, end: monthEnd });
      })
      .reduce((sum, b) => sum + Number(b.ganancia || 0), 0);

    const totalEarnings = resueltos.reduce((sum, b) => sum + Number(b.ganancia || 0), 0);

    return { todayEarnings, weekEarnings, monthEarnings, totalEarnings };
  }, [bookingsArray, today, todayStr]);

  // ----- Filtrado y ordenamiento (usando created_at del backend) -----
  const filteredBookings = useMemo(() => {
    return bookingsArray
      .filter(b => {
        const matchesSearch =
          b.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.rut?.includes(searchTerm) ||
          b.service?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const aDate = a.created_at || a.fecha_agenda || '';
        const bDate = b.created_at || b.fecha_agenda || '';
        if (aDate > bDate) return -1;
        if (aDate < bDate) return 1;
        return 0;
      });
  }, [bookingsArray, searchTerm, statusFilter]);

  // ----- Puntos en el calendario -----
  const tileContent = useCallback(({ date, view }) => {
    if (view === 'month') {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayBookings = bookingsArray.filter(b => b.fecha_agenda === dateStr);
      if (dayBookings.length > 0) {
        return (
          <div className="admin__calendar-dot">
            <span className="admin__calendar-dot-indicator"></span>
          </div>
        );
      }
    }
    return null;
  }, [bookingsArray]);

  // ----- Retorno -----
  return {
    // Estado
    bookings: bookingsArray,
    loading,
    error,
    selectedDate,
    setSelectedDate,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    showEditModal,
    editingBooking,
    editDate,
    setEditDate,
    editTime,
    setEditTime,
    editStatus,
    setEditStatus,
    editEarnings,
    setEditEarnings,
    editMotivo,
    setEditMotivo,
    saveSuccess,
    showEvidenciaModal,
    evidenciaData,
    evidenciaNombre,
    evidenciaTipo,
    // Datos calculados
    pendingBookings,
    agendadoBookings,
    enProcesoBookings,
    resueltoBookings,
    pendingToday,
    earningsData,
    filteredBookings,
    tileContent,
    // Acciones
    loadBookings,
    updateBookingItem,
    deleteBookingItem,
    changeStatus,
    openEditModal,
    closeEditModal,
    handleStatusChange,
    handleEditSubmit,
    openEvidenciaModal,
    closeEvidenciaModal,
  };
};