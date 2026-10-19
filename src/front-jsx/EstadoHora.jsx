// src/front-jsx/EstadoHora.jsx
import { useEstadoHora } from '../jsx/hooks/useEstadoHora';
import '../scss/estado-hora.scss';

function EstadoHora() {
  const {
    tipoBusqueda,
    busquedaBoleta,
    setBusquedaBoleta,
    busquedaRut,
    setBusquedaRut,
    busquedaNombre,
    setBusquedaNombre,
    busquedaApellido,
    setBusquedaApellido,
    reservas,
    cargando,
    error,
    consultar,
    limpiar,
    cambiarTipoBusqueda,
  } = useEstadoHora();

  const handleSubmit = (e) => {
    e.preventDefault();
    consultar(e);
  };

  const handleReset = () => {
    limpiar();
    setBusquedaBoleta('');
    setBusquedaRut('');
    setBusquedaNombre('');
    setBusquedaApellido('');
  };

  // Mapeo de estados a colores y emojis
  const estadoMap = {
    pendiente: { label: 'Pendiente', color: '#f59e0b', emoji: '⏳' },
    agendado: { label: 'Agendado', color: '#3b82f6', emoji: '📅' },
    en_proceso: { label: 'En proceso', color: '#8b5cf6', emoji: '🔧' },
    resuelto: { label: 'Resuelto', color: '#10b981', emoji: '✅' },
  };

  return (
    <div className="estado-hora">
      <header className="estado-hora__header">
        <div className="estado-hora__logo-wrapper">
          <span className="estado-hora__logo-text">Gasfipro</span>
        </div>
        <nav className="estado-hora__nav">
          <a href="/">Inicio</a>
          <a href="/cotizacion">Cotización</a>
          <a href="/reserva">Reservar</a>
          <a href="/estado">Estado de hora</a>
        </nav>
      </header>

      <main className="estado-hora__main">
        <div className="estado-hora__contenedor">
          <h1 className="estado-hora__titulo">Estado de tu reserva</h1>
          <p className="estado-hora__subtitulo">
            Ingresa los datos para consultar el estado de tu solicitud.
          </p>

          <form className="estado-hora__form" onSubmit={handleSubmit}>
            {/* Selector de tipo de búsqueda */}
            <div className="estado-hora__campo">
              <label htmlFor="tipoBusqueda">Buscar por</label>
              <select
                id="tipoBusqueda"
                value={tipoBusqueda}
                onChange={(e) => {
                  cambiarTipoBusqueda(e.target.value);
                }}
                className="estado-hora__select"
              >
                <option value="boleta">Número de boleta</option>
                <option value="rut">RUT (con dígito verificador)</option>
                <option value="nombre">Nombre y apellido</option>
              </select>
            </div>

            {/* Campos según tipo */}
            {tipoBusqueda === 'boleta' && (
              <div className="estado-hora__campo">
                <label htmlFor="boleta">Número de boleta</label>
                <input
                  id="boleta"
                  type="text"
                  value={busquedaBoleta}
                  onChange={(e) => setBusquedaBoleta(e.target.value.replace(/\D/g, '').slice(0, 16))}
                  placeholder="Ej: 1234567890123456"
                  maxLength="16"
                  required
                  disabled={cargando}
                  className="estado-hora__input"
                />
                <small>16 dígitos numéricos</small>
              </div>
            )}

            {tipoBusqueda === 'rut' && (
              <div className="estado-hora__campo">
                <label htmlFor="rut">RUT</label>
                <input
                  id="rut"
                  type="text"
                  value={busquedaRut}
                  onChange={(e) => setBusquedaRut(e.target.value)}
                  placeholder="Ej: 12.345.678-9"
                  required
                  disabled={cargando}
                  className="estado-hora__input"
                />
                <small>Con puntos y guión (ej: 12.345.678-9)</small>
              </div>
            )}

            {tipoBusqueda === 'nombre' && (
              <>
                <div className="estado-hora__campo">
                  <label htmlFor="nombre">Nombre</label>
                  <input
                    id="nombre"
                    type="text"
                    value={busquedaNombre}
                    onChange={(e) => setBusquedaNombre(e.target.value)}
                    placeholder="Ej: María"
                    required
                    disabled={cargando}
                    className="estado-hora__input"
                  />
                </div>
                <div className="estado-hora__campo">
                  <label htmlFor="apellido">Apellido</label>
                  <input
                    id="apellido"
                    type="text"
                    value={busquedaApellido}
                    onChange={(e) => setBusquedaApellido(e.target.value)}
                    placeholder="Ej: González"
                    required
                    disabled={cargando}
                    className="estado-hora__input"
                  />
                </div>
              </>
            )}

            {error && <div className="estado-hora__error">{error}</div>}

            <div className="estado-hora__acciones">
              <button type="submit" className="estado-hora__boton estado-hora__boton--consultar" disabled={cargando}>
                {cargando ? 'Consultando...' : 'Consultar estado'}
              </button>
              <button type="button" className="estado-hora__boton estado-hora__boton--limpiar" onClick={handleReset} disabled={cargando}>
                Limpiar
              </button>
            </div>
          </form>

          {/* Mostrar resultados solo si hay reservas */}
          {reservas.length > 0 ? (
            <div className="estado-hora__resultado">
              <h2>Detalles de tus reservas ({reservas.length})</h2>
              <div className="estado-hora__lista">
                {reservas.map((reserva, index) => (
                  <div className="estado-hora__card" key={reserva.boleta || index}>
                    <div className="estado-hora__estado">
                      <span className="estado-hora__estado-icono">
                        {estadoMap[reserva.estado_codigo]?.emoji || '📋'}
                      </span>
                      <span
                        className="estado-hora__estado-texto"
                        style={{ backgroundColor: estadoMap[reserva.estado_codigo]?.color || '#64748b' }}
                      >
                        {estadoMap[reserva.estado_codigo]?.label || reserva.estado}
                      </span>
                    </div>

                    <div className="estado-hora__info-grid">
                      <div className="estado-hora__info-item">
                        <span className="estado-hora__info-label">Boleta</span>
                        <span className="estado-hora__info-valor">{reserva.boleta}</span>
                      </div>
                      <div className="estado-hora__info-item">
                        <span className="estado-hora__info-label">Cliente</span>
                        <span className="estado-hora__info-valor">{reserva.nombre} {reserva.apellido}</span>
                      </div>
                      <div className="estado-hora__info-item">
                        <span className="estado-hora__info-label">RUT</span>
                        <span className="estado-hora__info-valor">{reserva.rut}</span>
                      </div>
                      <div className="estado-hora__info-item">
                        <span className="estado-hora__info-label">Servicio</span>
                        <span className="estado-hora__info-valor">{reserva.service || 'No especificado'}</span>
                      </div>
                      <div className="estado-hora__info-item">
                        <span className="estado-hora__info-label">Fecha de solicitud</span>
                        <span className="estado-hora__info-valor">
                          {reserva.fecha_solicitud ? new Date(reserva.fecha_solicitud).toLocaleDateString('es-CL') : '—'}
                        </span>
                      </div>
                      <div className="estado-hora__info-item">
                        <span className="estado-hora__info-label">Fecha de agenda</span>
                        <span className="estado-hora__info-valor">
                          {reserva.fecha_agenda ? new Date(reserva.fecha_agenda).toLocaleDateString('es-CL') : 'Sin agendar'}
                          {reserva.hora_agenda && ` a las ${reserva.hora_agenda.slice(0,5)} hrs`}
                        </span>
                      </div>
                      <div className="estado-hora__info-item estado-hora__info-item--full">
                        <span className="estado-hora__info-label">Descripción del problema</span>
                        <span className="estado-hora__info-valor">{reserva.descripcion || '—'}</span>
                      </div>
                      {reserva.evidencia && (
                        <div className="estado-hora__info-item estado-hora__info-item--full">
                          <span className="estado-hora__info-label">Evidencia adjunta</span>
                          <a
                            href={reserva.evidencia}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="estado-hora__link"
                          >
                            📎 Ver evidencia
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Mostrar mensaje de "sin resultados" solo si el error es específico de "No se encontraron"
            error && error.includes('No se encontraron') && (
              <div className="estado-hora__sin-resultados">
                <p>{error}</p>
              </div>
            )
          )}
        </div>
      </main>

      <footer className="estado-hora__footer">
        <p>© 2026 Gasfipro - Todos los derechos reservados</p>
      </footer>
    </div>
  );
}

export default EstadoHora;