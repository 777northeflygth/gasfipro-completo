// src/jsx/hooks/useAdmin.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO, isBefore, startOfDay } from 'date-fns';
import {
  fetchBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  updateStatus,
  fetchEarnings,
  fetchClients,
  fetchSolicitudes,
} from '../services/api';

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

  // Modal de evidencia (ahora maneja tanto URL como base64)
  const [showEvidenciaModal, setShowEvidenciaModal] = useState(false);
  const [evidenciaData, setEvidenciaData] = useState(null);
  const [evidenciaNombre, setEvidenciaNombre] = useState('');
  const [evidenciaTipo, setEvidenciaTipo] = useState('');

  // --- Carga inicial ---
  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBookings();
      // Asegurar que los datos tengan evidencia_url
      const mappedData = data.map(b => ({
        ...b,
        // Si el backend devuelve evidencia_url, usarlo; si no, construir desde evidencia
        evidenciaUrl: b.evidencia_url || b.evidencia || null,
      }));
      setBookings(mappedData);
    } catch (err) {
      setError(err.message);
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // --- CRUD ---
  const addBooking = useCallback(async (newBookingData) => {
    try {
      const created = await createBooking(newBookingData);
      setBookings(prev => [created, ...prev]);
      return created;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateBookingItem = useCallback(async (id, data) => {
    try {
      const updated = await updateBooking(id, data);
      setBookings(prev => prev.map(b => b.id === id ? updated : b));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteBookingItem = useCallback(async (id) => {
    try {
      await deleteBooking(id);
      setBookings(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const changeStatus = useCallback(async (id, status) => {
    try {
      const updated = await updateStatus(id, status);
      setBookings(prev => prev.map(b => b.id === id ? updated : b));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // --- Handlers de modal de edición ---
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

    const payload = {
      status: editStatus,
      fecha_agenda: editStatus === 'agendado' ? editDate : null,
      hora_agenda: editStatus === 'agendado' ? editTime : null,
      ganancia: editStatus === 'resuelto' ? parseFloat(editEarnings) : null,
      motivo_cobro: editStatus === 'resuelto' ? editMotivo.trim() : '',
    };

    try {
      const updated = await updateBooking(editingBooking.id, payload);
      setBookings(prev => prev.map(b => b.id === editingBooking.id ? updated : b));
      setSaveSuccess(true);
      setTimeout(closeEditModal, 1500);
    } catch (err) {
      alert('Error al guardar cambios: ' + err.message);
    }
  }, [editingBooking, editDate, editTime, editStatus, editEarnings, editMotivo, closeEditModal, updateBooking]);

  // --- Evidencia modal (mejorado) ---
  const openEvidenciaModal = useCallback((evidenciaPayload) => {
    // Si es un objeto con evidenciaData (base64)
    if (evidenciaPayload && evidenciaPayload.evidenciaData !== undefined) {
      setEvidenciaData(evidenciaPayload.evidenciaData);
      setEvidenciaNombre(evidenciaPayload.evidenciaNombre || 'Sin nombre');
      setEvidenciaTipo(evidenciaPayload.evidenciaTipo || '');
    }
    // Si es un booking
    else if (evidenciaPayload && evidenciaPayload.id) {
      // Usar evidencia_url si existe, si no, evidencia (ruta relativa)
      const url = evidenciaPayload.evidenciaUrl || evidenciaPayload.evidencia || null;
      const nombre = evidenciaPayload.evidenciaNombre || (url ? url.split('/').pop() : 'Sin nombre');
      const tipo = evidenciaPayload.evidenciaTipo || 'application/octet-stream';
      setEvidenciaData(url);
      setEvidenciaNombre(nombre);
      setEvidenciaTipo(tipo);
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

  // --- Cálculos (usando datos locales) ---
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => format(today, 'yyyy-MM-dd'), [today]);

  const pendingBookings = useMemo(() => bookings.filter(b => b.status === 'pendiente'), [bookings]);
  const agendadoBookings = useMemo(() => bookings.filter(b => b.status === 'agendado'), [bookings]);
  const enProcesoBookings = useMemo(() => bookings.filter(b => b.status === 'en_proceso'), [bookings]);
  const resueltoBookings = useMemo(() => bookings.filter(b => b.status === 'resuelto'), [bookings]);
  const pendingToday = useMemo(() => pendingBookings.filter(b => b.fecha_agenda === todayStr), [pendingBookings, todayStr]);

  const earningsData = useMemo(() => {
    const resueltos = bookings.filter(b => b.status === 'resuelto');
    const todayEarnings = resueltos
      .filter(b => b.fecha_agenda === todayStr)
      .reduce((sum, b) => sum + (b.ganancia || 0), 0);

    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const weekEarnings = resueltos
      .filter(b => {
        if (!b.fecha_agenda) return false;
        const bDate = parseISO(b.fecha_agenda);
        return isWithinInterval(bDate, { start: weekStart, end: weekEnd });
      })
      .reduce((sum, b) => sum + (b.ganancia || 0), 0);

    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const monthEarnings = resueltos
      .filter(b => {
        if (!b.fecha_agenda) return false;
        const bDate = parseISO(b.fecha_agenda);
        return isWithinInterval(bDate, { start: monthStart, end: monthEnd });
      })
      .reduce((sum, b) => sum + (b.ganancia || 0), 0);

    const totalEarnings = resueltos.reduce((sum, b) => sum + (b.ganancia || 0), 0);

    return { todayEarnings, weekEarnings, monthEarnings, totalEarnings };
  }, [bookings, today, todayStr]);

  // --- Filtrado y ordenamiento ---
  const filteredBookings = useMemo(() => {
    return bookings
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
  }, [bookings, searchTerm, statusFilter]);

  // --- Puntos en el calendario ---
  const tileContent = useCallback(({ date, view }) => {
    if (view === 'month') {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayBookings = bookings.filter(b => b.fecha_agenda === dateStr);
      if (dayBookings.length > 0) {
        return (
          <div className="admin__calendar-dot">
            <span className="admin__calendar-dot-indicator"></span>
          </div>
        );
      }
    }
    return null;
  }, [bookings]);

  // --- Retorno ---
  return {
    // Estado
    bookings,
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
    addBooking,
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