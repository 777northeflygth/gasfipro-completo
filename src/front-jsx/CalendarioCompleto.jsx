// src/front-jsx/CalendarioCompleto.jsx
import { useMemo, useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../scss/calendario.scss';

// Configuración del localizador para español y semana comenzando en lunes
const locales = { es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

function CalendarioCompleto({ bookings }) {
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [vistaActual, setVistaActual] = useState('month');
  const [fechaActual, setFechaActual] = useState(new Date());

  // Transformar reservas en eventos
  const eventos = useMemo(() => {
    const agendadas = bookings.filter(
      (b) => b.fecha_agenda && b.hora_agenda && b.status !== 'pendiente'
    );

    return agendadas.map((b) => {
      const fecha = new Date(`${b.fecha_agenda}T${b.hora_agenda}`);
      const fechaFin = addMinutes(fecha, 60); // 1 hora de duración

      let backgroundColor = '#3b82f6';
      if (b.status === 'agendado') backgroundColor = '#3b82f6';
      else if (b.status === 'en_proceso') backgroundColor = '#8b5cf6';
      else if (b.status === 'resuelto') backgroundColor = '#10b981';

      return {
        id: b.id,
        title: `${b.nombre} ${b.apellido} - ${b.service}`,
        start: fecha,
        end: fechaFin,
        allDay: false,
        resource: b,
        backgroundColor,
      };
    });
  }, [bookings]);

  const eventStyleGetter = useCallback((event) => {
    return {
      style: {
        backgroundColor: event.backgroundColor || '#3b82f6',
        borderRadius: '4px',
        color: 'white',
        border: 'none',
        padding: '2px 6px',
        fontSize: '0.75rem',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        cursor: 'pointer',
      },
    };
  }, []);

  const handleSelectEvent = useCallback((event) => {
    setEventoSeleccionado(event.resource);
  }, []);

  const handleCloseModal = useCallback(() => {
    setEventoSeleccionado(null);
  }, []);

  // Navegación
  const handlePrevious = useCallback(() => {
    if (vistaActual === 'month') {
      setFechaActual(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    } else if (vistaActual === 'week') {
      setFechaActual(prev => new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else if (vistaActual === 'day') {
      setFechaActual(prev => new Date(prev.getTime() - 24 * 60 * 60 * 1000));
    }
  }, [vistaActual]);

  const handleNext = useCallback(() => {
    if (vistaActual === 'month') {
      setFechaActual(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    } else if (vistaActual === 'week') {
      setFechaActual(prev => new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else if (vistaActual === 'day') {
      setFechaActual(prev => new Date(prev.getTime() + 24 * 60 * 60 * 1000));
    }
  }, [vistaActual]);

  const handleToday = useCallback(() => {
    setFechaActual(new Date());
  }, []);

  const handleViewChange = useCallback((view) => {
    setVistaActual(view);
  }, []);

  // Formatear título
  const getTitle = useCallback(() => {
    if (vistaActual === 'month') {
      return format(fechaActual, "MMMM 'de' yyyy", { locale: es });
    } else if (vistaActual === 'week') {
      const start = startOfWeek(fechaActual, { weekStartsOn: 1 });
      const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
      return `${format(start, "dd 'de' MMMM", { locale: es })} — ${format(end, "dd 'de' MMMM", { locale: es })}`;
    } else if (vistaActual === 'day') {
      return format(fechaActual, "dd 'de' MMMM 'de' yyyy", { locale: es });
    }
    return '';
  }, [vistaActual, fechaActual]);

  // Rango de horas según la vista
  const getMinMax = useCallback(() => {
    if (vistaActual === 'day') {
      // Vista día: mostrar 24 horas completas (00:00 - 23:59)
      return {
        min: new Date(0, 0, 0, 0, 0, 0),
        max: new Date(0, 0, 0, 23, 59, 59),
      };
    } else {
      // Vista semana o mes: rango laboral de 8:00 a 20:00
      return {
        min: new Date(0, 0, 0, 8, 0, 0),
        max: new Date(0, 0, 0, 20, 0, 0),
      };
    }
  }, [vistaActual]);

  const { min, max } = getMinMax();

  const messages = {
    next: 'Siguiente',
    previous: 'Anterior',
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    allDay: 'Todo el día',
    showMore: (count) => `+ Ver ${count} más`,
  };

  return (
    <div className="calendario-completo">
      {/* Toolbar personalizado */}
      <div className="calendario-toolbar">
        <div className="calendario-toolbar-left">
          <button onClick={handleToday} className="btn-today">Hoy</button>
          <button onClick={handlePrevious} className="btn-nav">‹</button>
          <button onClick={handleNext} className="btn-nav">›</button>
          <span className="toolbar-title">{getTitle()}</span>
        </div>
        <div className="calendario-toolbar-right">
          <button 
            className={`btn-view ${vistaActual === 'month' ? 'active' : ''}`}
            onClick={() => handleViewChange('month')}
          >
            Mes
          </button>
          <button 
            className={`btn-view ${vistaActual === 'week' ? 'active' : ''}`}
            onClick={() => handleViewChange('week')}
          >
            Semana
          </button>
          <button 
            className={`btn-view ${vistaActual === 'day' ? 'active' : ''}`}
            onClick={() => handleViewChange('day')}
          >
            Día
          </button>
        </div>
      </div>

      <Calendar
        localizer={localizer}
        events={eventos}
        startAccessor="start"
        endAccessor="end"
        date={fechaActual}
        view={vistaActual}
        onView={handleViewChange}
        onNavigate={(date) => setFechaActual(date)}
        style={{ height: 750 }}
        messages={messages}
        eventPropGetter={eventStyleGetter}
        defaultView="month"
        views={['month', 'week', 'day']}
        popup
        culture="es"
        onSelectEvent={handleSelectEvent}
        step={60}
        timeslots={1}
        min={min}
        max={max}
        formats={{
          dayFormat: 'dd/MM',
          weekdayFormat: 'EEEE',
          timeGutterFormat: 'HH:mm',
          dayHeaderFormat: "dd 'de' MMMM 'de' yyyy",
          dayRangeHeaderFormat: ({ start, end }) => 
            `${format(start, "dd 'de' MMMM", { locale: es })} — ${format(end, "dd 'de' MMMM", { locale: es })}`,
        }}
      />

      {/* Modal de detalles */}
      {eventoSeleccionado && (
        <div className="calendario-modal-overlay" onClick={handleCloseModal}>
          <div className="calendario-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Detalles de la reserva</h3>
            <div className="calendario-modal-body">
              <p><strong>Cliente:</strong> {eventoSeleccionado.nombre} {eventoSeleccionado.apellido}</p>
              <p><strong>RUT:</strong> {eventoSeleccionado.rut}</p>
              <p><strong>Servicio:</strong> {eventoSeleccionado.service || 'No especificado'}</p>
              <p><strong>Fecha agendada:</strong> {format(new Date(eventoSeleccionado.fecha_agenda), 'dd/MM/yyyy')}</p>
              <p><strong>Hora:</strong> {eventoSeleccionado.hora_agenda}</p>
              <p><strong>Estado:</strong> {
                eventoSeleccionado.status === 'agendado' ? 'Agendado' : 
                eventoSeleccionado.status === 'en_proceso' ? 'En proceso' : 
                eventoSeleccionado.status === 'resuelto' ? 'Resuelto' : eventoSeleccionado.status
              }</p>
              <p><strong>Descripción:</strong> {eventoSeleccionado.descripcion || '—'}</p>
              {eventoSeleccionado.boleta && <p><strong>Boleta:</strong> {eventoSeleccionado.boleta}</p>}
              {eventoSeleccionado.evidencia && (
                <p>
                  <strong>Evidencia:</strong>{' '}
                  <a href={eventoSeleccionado.evidencia} target="_blank" rel="noopener noreferrer">Ver archivo</a>
                </p>
              )}
            </div>
            <button className="calendario-modal-close" onClick={handleCloseModal}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarioCompleto;