// src/front-jsx/Admin.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import '../scss/admin.scss';
import { useAdmin, formatCurrency, safeFormatDate, statusLabels } from '../jsx/admin';
import CalendarioCompleto from './CalendarioCompleto';

const Sidebar = ({ activeTab, onTabChange }) => (
  <aside className="admin__sidebar">
    <nav className="admin__sidebar-nav" role="navigation" aria-label="Panel de administración">
      {[
        { id: 'dashboard', label: '📊 Dashboard' },
        { id: 'bookings', label: '📋 Reservas' },
        { id: 'earnings', label: '💰 Ganancias' },
        { id: 'clients', label: '👤 Clientes' },
        { id: 'solicitudes', label: '📋 Solicitudes' },
        { id: 'calendario', label: '📅 Calendario' },
        { id: 'settings', label: '⚙️ Configuración' },
      ].map(({ id, label }) => (
        <button
          key={id}
          className={`admin__sidebar-btn ${activeTab === id ? 'active' : ''}`}
          onClick={() => onTabChange(id)}
          aria-current={activeTab === id ? 'page' : undefined}
        >
          {label}
        </button>
      ))}
    </nav>
  </aside>
);

function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const {
    bookings,
    pendingBookings,
    agendadoBookings,
    enProcesoBookings,
    resueltoBookings,
    pendingToday,
    earningsData,
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
    openEditModal,
    closeEditModal,
    handleStatusChange,
    handleEditSubmit,
    openEvidenciaModal,
    closeEvidenciaModal,
    filteredBookings,
    tileContent,
  } = useAdmin();

  const handleLogout = () => navigate('/login');

  // ---- Funciones de renderizado ----

  const renderMetricCards = () => (
    <section className="admin__metrics">
      <div className="admin__metric-card">
        <h4 className="admin__metric-title">Pendientes hoy</h4>
        <p className="admin__metric-value">{pendingToday.length}</p>
      </div>
      <div className="admin__metric-card">
        <h4 className="admin__metric-title">Total pendientes</h4>
        <p className="admin__metric-value">{pendingBookings.length}</p>
      </div>
      <div className="admin__metric-card">
        <h4 className="admin__metric-title">Agendados</h4>
        <p className="admin__metric-value">{agendadoBookings.length}</p>
      </div>
      <div className="admin__metric-card">
        <h4 className="admin__metric-title">En proceso</h4>
        <p className="admin__metric-value">{enProcesoBookings.length}</p>
      </div>
      <div className="admin__metric-card">
        <h4 className="admin__metric-title">Resueltos</h4>
        <p className="admin__metric-value">{resueltoBookings.length}</p>
      </div>
      <div className="admin__metric-card admin__metric-card--week">
        <h4 className="admin__metric-title">Ganancias del día</h4>
        <p className="admin__metric-value">{formatCurrency(earningsData.todayEarnings)}</p>
      </div>
      <div className="admin__metric-card admin__metric-card--month">
        <h4 className="admin__metric-title">Ganancias semana</h4>
        <p className="admin__metric-value">{formatCurrency(earningsData.weekEarnings)}</p>
      </div>
      <div className="admin__metric-card admin__metric-card--month">
        <h4 className="admin__metric-title">Ganancias mes</h4>
        <p className="admin__metric-value">{formatCurrency(earningsData.monthEarnings)}</p>
      </div>
    </section>
  );

  const renderBookingTable = (bookingList, title, showActions = true) => {
    if (!bookingList.length) {
      return <p className="admin__empty">No hay reservas para mostrar.</p>;
    }
    return (
      <div className="admin__table-wrapper">
        <h3 className="admin__table-title">{title}</h3>
        <div className="admin__table-scroll">
          <table className="admin__table">
            <thead>
              <tr>
                <th>RUT</th>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Servicio</th>
                <th>Fecha solicitud</th>
                <th>Hora solicitud</th>
                <th>Fecha agenda</th>
                <th>Hora agenda</th>
                <th>Estado</th>
                <th>Boleta</th>
                <th>Ganancia</th>
                <th>Motivo</th>
                {showActions && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {bookingList.map(b => (
                <tr key={b.id}>
                  <td>{b.rut}</td>
                  <td>{b.nombre}</td>
                  <td>{b.apellido}</td>
                  <td>{b.service}</td>
                  <td>{safeFormatDate(b.created_at, 'dd/MM/yyyy')}</td>
                  <td>{safeFormatDate(b.created_at, 'HH:mm')}</td>
                  <td>
                    {b.status === 'pendiente' 
                      ? '--/--/--' 
                      : safeFormatDate(b.fecha_agenda, 'dd/MM/yyyy')}
                  </td>
                  <td>
                    {b.status === 'pendiente' 
                      ? '--:--:--' 
                      : (b.hora_agenda || '—')}
                  </td>
                  <td>
                    <span className={`admin__status admin__status--${b.status}`}>
                      {statusLabels[b.status] || b.status}
                    </span>
                  </td>
                  <td>{b.boleta || '—'}</td>
                  <td>{b.ganancia ? formatCurrency(b.ganancia) : '—'}</td>
                  <td>{b.motivo_cobro || '—'}</td>
                  {showActions && (
                    <td>
                      <button
                        className="admin__btn admin__btn--edit"
                        onClick={() => openEditModal(b)}
                        aria-label={`Editar reserva de ${b.nombre} ${b.apellido}`}
                      >
                        ✏️ Editar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSolicitudesView = () => {
    const allBookings = [...bookings].sort((a, b) => {
      const aDate = a.created_at || a.fecha_agenda || '';
      const bDate = b.created_at || b.fecha_agenda || '';
      if (aDate > bDate) return -1;
      if (aDate < bDate) return 1;
      return 0;
    });

    const tieneEvidencia = (booking) => {
      return !!(booking.evidenciaData || booking.evidenciaUrl || booking.evidencia);
    };

    return (
      <div className="admin__view">
        <h2 className="admin__view-title">Solicitudes</h2>
        <p className="admin__view-subtitle">Todas las solicitudes de clientes con su evidencia adjunta.</p>
        <div className="admin__table-wrapper">
          <h3 className="admin__table-title">Listado de solicitudes</h3>
          <div className="admin__table-scroll">
            <table className="admin__table">
              <thead>
                <tr>
                  <th>RUT</th>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Servicio</th>
                  <th>Fecha solicitud</th>
                  <th>Evidencia</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {allBookings.length === 0 ? (
                  <tr><td colSpan="7" className="admin__empty">No hay solicitudes registradas.</td></tr>
                ) : (
                  allBookings.map(b => (
                    <tr key={b.id}>
                      <td>{b.rut}</td>
                      <td>{b.nombre}</td>
                      <td>{b.apellido}</td>
                      <td>{b.service}</td>
                      <td>{safeFormatDate(b.created_at, 'dd/MM/yyyy HH:mm')}</td>
                      <td>
                        {tieneEvidencia(b) ? (
                          <span className="admin__badge admin__badge--success">✅ Adjunto</span>
                        ) : (
                          <span className="admin__badge admin__badge--muted">❌ Sin evidencia</span>
                        )}
                      </td>
                      <td>
                        {tieneEvidencia(b) ? (
                          <button
                            className="admin__btn admin__btn--view"
                            onClick={() => openEvidenciaModal(b)}
                            aria-label="Ver evidencia"
                          >
                            👁️ Ver evidencia
                          </button>
                        ) : (
                          <span className="admin__text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <>
      {renderMetricCards()}
      <section className="admin__dashboard-grid">
        <div className="admin__dashboard-item admin__dashboard-item--table">
          {renderBookingTable(pendingBookings, 'Reservas pendientes')}
        </div>
        <div className="admin__dashboard-item admin__dashboard-item--calendar">
          <h3 className="admin__table-title">Calendario</h3>
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            locale="es"
            tileContent={tileContent}
            className="admin__calendar"
          />
          <div className="admin__calendar-legend">
            <span className="admin__calendar-legend-dot"></span>
            <span>Días con reservas</span>
          </div>
        </div>
      </section>
    </>
  );

  const renderBookingsView = () => (
    <div className="admin__view">
      <div className="admin__view-header">
        <h2 className="admin__view-title">Todas las reservas</h2>
        <div className="admin__view-filters">
          <input
            type="text"
            placeholder="Buscar por nombre, RUT o servicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin__search"
            aria-label="Buscar reservas"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin__filter"
            aria-label="Filtrar por estado"
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="agendado">Agendados</option>
            <option value="en_proceso">En proceso</option>
            <option value="resuelto">Resueltos</option>
          </select>
        </div>
      </div>
      {renderBookingTable(filteredBookings, `Resultados (${filteredBookings.length})`)}
    </div>
  );

  const renderEarningsView = () => {
    const resueltos = bookings.filter(b => b.status === 'resuelto');
    // ✅ CORRECCIÓN: Convertir ganancia a número antes de sumar
    const earningsByService = resueltos.reduce((acc, b) => {
      const service = b.service;
      const ganancia = Number(b.ganancia) || 0;
      acc[service] = (acc[service] || 0) + ganancia;
      return acc;
    }, {});
    const serviceCounts = resueltos.reduce((acc, b) => {
      acc[b.service] = (acc[b.service] || 0) + 1;
      return acc;
    }, {});
    // ✅ CORRECCIÓN: Convertir ganancia a número para el total
    const totalGeneral = resueltos.reduce((sum, b) => sum + Number(b.ganancia || 0), 0);

    return (
      <div className="admin__view">
        <h2 className="admin__view-title">Resumen de ganancias</h2>
        <div className="admin__earnings-grid">
          <div className="admin__earnings-card"><h4>Hoy</h4><p>{formatCurrency(earningsData.todayEarnings)}</p></div>
          <div className="admin__earnings-card"><h4>Esta semana</h4><p>{formatCurrency(earningsData.weekEarnings)}</p></div>
          <div className="admin__earnings-card"><h4>Este mes</h4><p>{formatCurrency(earningsData.monthEarnings)}</p></div>
          <div className="admin__earnings-card"><h4>Total general</h4><p>{formatCurrency(totalGeneral)}</p></div>
        </div>
        <div className="admin__earnings-detail">
          <h3>Desglose por servicio</h3>
          <div className="admin__table-scroll">
            <table className="admin__table">
              <thead><tr><th>Servicio</th><th>Cantidad</th><th>Total ganado</th></tr></thead>
              <tbody>
                {Object.keys(earningsByService).length === 0 ? (
                  <tr><td colSpan="3" className="admin__empty">No hay trabajos resueltos.</td></tr>
                ) : (
                  Object.keys(earningsByService).map(service => (
                    <tr key={service}>
                      <td>{service}</td>
                      <td>{serviceCounts[service] || 0}</td>
                      <td>{formatCurrency(earningsByService[service])}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderClientsView = () => {
    const clientsMap = bookings.reduce((acc, b) => {
      if (!acc[b.rut]) {
        acc[b.rut] = {
          rut: b.rut,
          nombre: b.nombre,
          apellido: b.apellido,
          email: b.email || '',
          telefono: b.telefono || '',
          bookings: 1,
        };
      } else {
        acc[b.rut].nombre = b.nombre;
        acc[b.rut].apellido = b.apellido;
        if (b.email) acc[b.rut].email = b.email;
        if (b.telefono) acc[b.rut].telefono = b.telefono;
        acc[b.rut].bookings += 1;
      }
      return acc;
    }, {});
    const clients = Object.values(clientsMap);

    return (
      <div className="admin__view">
        <h2 className="admin__view-title">Clientes</h2>
        <div className="admin__table-scroll">
          <table className="admin__table">
            <thead>
              <tr>
                <th>RUT</th>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Reservas</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.rut}>
                  <td>{c.rut}</td>
                  <td>{c.nombre}</td>
                  <td>{c.apellido}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.telefono || '—'}</td>
                  <td>{c.bookings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSettingsView = () => (
    <div className="admin__view">
      <h2 className="admin__view-title">Configuración</h2>
      <div className="admin__settings">
        <div className="admin__setting-group">
          <h3>Cambiar contraseña</h3>
          <form onSubmit={(e) => { e.preventDefault(); alert('Funcionalidad simulada'); }}>
            <input type="password" placeholder="Contraseña actual" className="admin__input" />
            <input type="password" placeholder="Nueva contraseña" className="admin__input" />
            <input type="password" placeholder="Confirmar nueva contraseña" className="admin__input" />
            <button type="submit" className="admin__btn admin__btn--primary">Actualizar</button>
          </form>
        </div>
        <div className="admin__setting-group">
          <h3>Preferencias</h3>
          <label><input type="checkbox" /> Notificaciones por correo</label>
          <label><input type="checkbox" /> Recordatorios de reservas</label>
        </div>
      </div>
    </div>
  );

  // ---- Render principal ----
  return (
    <div className="admin">
      <header className="admin__header">
        <div className="admin__logo-wrapper">
          <span className="admin__logo-text">Gasfipro</span>
          <span className="admin__logo-badge">Admin</span>
        </div>
        <button onClick={handleLogout} className="admin__nav-logout" aria-label="Cerrar sesión">
          Cerrar sesión
        </button>
      </header>

      <div className="admin__layout">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="admin__content" role="main">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'bookings' && renderBookingsView()}
          {activeTab === 'earnings' && renderEarningsView()}
          {activeTab === 'clients' && renderClientsView()}
          {activeTab === 'solicitudes' && renderSolicitudesView()}
          {activeTab === 'calendario' && (
            <div className="admin__view">
              <h2 className="admin__view-title">Calendario de citas</h2>
              <CalendarioCompleto bookings={bookings} />
            </div>
          )}
          {activeTab === 'settings' && renderSettingsView()}
        </main>
      </div>

      {/* Modal de edición */}
      {showEditModal && editingBooking && (
        <div className="admin__modal-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
          <div className="admin__modal admin__modal--wide">
            <h3 id="edit-modal-title">Editar ticket</h3>
            <p className="admin__modal-subtitle">
              {editingBooking.nombre} {editingBooking.apellido} - {editingBooking.rut}
            </p>
            {saveSuccess && <div className="admin__modal-success">✅ Cambios guardados correctamente.</div>}
            <form onSubmit={handleEditSubmit}>
              <div className="admin__modal-grid">
                <div className="admin__modal-field">
                  <label htmlFor="edit-status">Estado</label>
                  <select
                    id="edit-status"
                    value={editStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="agendado">Agendado</option>
                    <option value="en_proceso">En proceso</option>
                    <option value="resuelto">Resuelto</option>
                  </select>
                </div>

                <div className="admin__modal-field">
                  <label>Fecha y hora de solicitud (solo lectura)</label>
                  <div className="admin__modal-readonly">
                    {safeFormatDate(editingBooking.created_at, 'dd/MM/yyyy HH:mm')}
                  </div>
                </div>

                {editStatus === 'agendado' && (
                  <>
                    <div className="admin__modal-field">
                      <label>Fecha de agenda</label>
                      <div className="admin__modal-calendar-wrapper">
                        <Calendar
                          onChange={(date) => setEditDate(format(date, 'yyyy-MM-dd'))}
                          value={parseISO(editDate)}
                          locale="es"
                          className="admin__modal-calendar"
                          minDate={new Date()}
                        />
                      </div>
                    </div>
                    <div className="admin__modal-field">
                      <label htmlFor="edit-time">Hora de agenda</label>
                      <input
                        id="edit-time"
                        type="time"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}

                {editStatus === 'resuelto' && (
                  <>
                    <div className="admin__modal-field">
                      <label htmlFor="edit-earnings">Ganancia obtenida (CLP) *</label>
                      <input
                        id="edit-earnings"
                        type="number"
                        min="0"
                        step="100"
                        value={editEarnings}
                        onChange={(e) => setEditEarnings(e.target.value)}
                        placeholder="Ej: 80000"
                        required
                      />
                    </div>
                    <div className="admin__modal-field">
                      <label htmlFor="edit-motivo">Motivo del cobro *</label>
                      <textarea
                        id="edit-motivo"
                        rows="3"
                        value={editMotivo}
                        onChange={(e) => setEditMotivo(e.target.value)}
                        placeholder="Describe por qué se cobró este monto..."
                        required
                        className="admin__input admin__textarea"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="admin__modal-actions">
                <button type="submit" className="admin__btn admin__btn--primary">
                  {editStatus === 'agendado' ? 'Agendar' :
                   editStatus === 'resuelto' ? 'Resolver' :
                   'Guardar cambios'}
                </button>
                <button type="button" className="admin__btn admin__btn--cancel" onClick={closeEditModal}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de evidencia */}
      {showEvidenciaModal && (
        <div className="admin__modal-overlay" role="dialog" aria-modal="true" onClick={closeEvidenciaModal}>
          <div className="admin__modal admin__modal--wide" onClick={(e) => e.stopPropagation()}>
            <h3>Evidencia adjunta</h3>
            <p className="admin__modal-subtitle">
              <strong>Archivo:</strong> {evidenciaNombre}
            </p>
            <div className="admin__evidencia-contenedor">
              {evidenciaData && (
                (evidenciaTipo?.startsWith('image/') || 
                 evidenciaNombre?.match(/\.(jpe?g|png|gif|webp|bmp|svg)$/i)) ? (
                  <img src={evidenciaData} alt="Evidencia" className="admin__evidencia-imagen" />
                ) : (
                  <div className="admin__evidencia-descarga">
                    <p>Este archivo no se puede previsualizar directamente.</p>
                    <a
                      href={evidenciaData}
                      download={evidenciaNombre}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin__btn admin__btn--primary"
                    >
                      📥 Descargar archivo
                    </a>
                  </div>
                )
              )}
              {!evidenciaData && <p>No hay evidencia adjunta.</p>}
            </div>
            <div className="admin__modal-actions">
              <button className="admin__btn admin__btn--cancel" onClick={closeEvidenciaModal}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="admin__footer">
        <p>© 2026 Gasfipro - Panel de Administración</p>
      </footer>
    </div>
  );
}

export default Admin;