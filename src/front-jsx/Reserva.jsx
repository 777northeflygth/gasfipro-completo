// src/front-jsx/Reserva.jsx
import { useReserva } from '../jsx/useReserva';
import '../scss/reserva.scss';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

function Reserva() {
  const {
    formData,
    handleChange,
    handleFileChange,
    handleSubmit,
    enviado,
    boleta,
    fechaSolicitud, // 🆕
    isLoading,
    error,
    resetForm,
    evidenciaBase64,
    evidenciaNombre,
    evidenciaFile,
  } = useReserva();

  const handleReset = () => {
    resetForm();
  };

  // Formatear fecha para mostrar
  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return '';
    try {
      const fecha = parseISO(fechaISO);
      return format(fecha, "dd/MM/yyyy 'a las' HH:mm 'hrs'", { locale: es });
    } catch {
      return fechaISO;
    }
  };

  return (
    <div className="reserva">
      <header className="reserva__header">
        <div className="reserva__logo-wrapper">
          <span className="reserva__logo-text">Gasfipro</span>
        </div>
        <nav className="reserva__nav">
          <a href="/">Inicio</a>
          <a href="/cotizacion">Cotización</a>
          <a href="/reserva">Reservar</a>
        </nav>
      </header>

      <main className="reserva__main">
        <h1 className="reserva__titulo">Reservar tu hora</h1>
        <p className="reserva__subtitulo">Completa tus datos para agendar una visita técnica.</p>

        {enviado ? (
          <div className="reserva__exito">
            <h2>¡Solicitud enviada!</h2>
            <p>Nos pondremos en contacto contigo para confirmar la fecha y hora de la visita.</p>
            <div className="reserva__boleta">
              <strong>Número de boleta:</strong>
              <span className="reserva__boleta-numero">{boleta}</span>
            </div>
            {fechaSolicitud && (
              <div className="reserva__fecha-solicitud">
                <strong>Fecha de solicitud:</strong>
                <span>{formatearFecha(fechaSolicitud)}</span>
              </div>
            )}
            <button className="reserva__boton" onClick={handleReset}>
              Enviar otra solicitud
            </button>
          </div>
        ) : (
          <form className="reserva__form" onSubmit={handleSubmit}>
            <div className="reserva__campo">
              <label>Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="reserva__campo">
              <label>Apellido *</label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="reserva__campo">
              <label>RUT *</label>
              <input
                type="text"
                name="rut"
                value={formData.rut}
                onChange={handleChange}
                placeholder="Ej: 12.345.678-9"
                required
                disabled={isLoading}
              />
            </div>

            <div className="reserva__campo">
              <label>Sexo</label>
              <select name="sexo" value={formData.sexo} onChange={handleChange} disabled={isLoading}>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div className="reserva__campo">
              <label>Correo electrónico *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ejemplo@correo.com"
                required
                disabled={isLoading}
              />
            </div>

            <div className="reserva__campo">
              <label>Teléfono *</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Ej: 912345678"
                required
                disabled={isLoading}
              />
            </div>

            <div className="reserva__campo">
              <label>Descripción del problema *</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows="4"
                required
                disabled={isLoading}
              ></textarea>
            </div>

            <div className="reserva__campo">
              <label>Evidencia (opcional) - Máx 15MB</label>
              <input
                type="file"
                name="evidencia"
                onChange={handleFileChange}
                accept="image/*,video/*,.pdf"
                disabled={isLoading}
              />
              {evidenciaNombre && (
                <div className="reserva__archivo-info">
                  <span>📎 {evidenciaNombre}</span>
                  {evidenciaFile && (
                    <span className="reserva__archivo-tamano">
                      ({Math.round(evidenciaFile.size / 1024)} KB)
                    </span>
                  )}
                </div>
              )}
              {evidenciaBase64 && (
                <div className="reserva__preview">
                  <img src={evidenciaBase64} alt="Vista previa de la evidencia" />
                </div>
              )}
              <small>Formatos permitidos: imágenes, videos, PDF</small>
            </div>

            {error && <div className="reserva__error">{error}</div>}

            <button type="submit" className="reserva__boton" disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </form>
        )}
      </main>

      <footer className="reserva__footer">
        <p>© 2026 Gasfipro - Todos los derechos reservados</p>
      </footer>
    </div>
  );
}

export default Reserva;