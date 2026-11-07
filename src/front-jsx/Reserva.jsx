// src/front-jsx/Reserva.jsx
import { useReserva } from "../jsx/useReserva";
import "../scss/reserva.scss";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// ✅ CORRECCIÓN SONARCLOUD: Sanitizar URLs (para la previsualización de imagen)
const getSafeUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  if (
    url.startsWith("data:image/") ||
    url.startsWith("blob:") ||
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("/media/")
  ) {
    return url;
  }
  return "";
};

function Reserva() {
  const {
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
  } = useReserva();

  const handleReset = () => {
    resetForm();
  };

  // Formatear fecha para mostrar
  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "";
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
        <p className="reserva__subtitulo">
          Completa tus datos para agendar una visita técnica.
        </p>

        {enviado ? (
          <div className="reserva__exito">
            <h2>¡Solicitud enviada!</h2>
            <p>
              Nos pondremos en contacto contigo para confirmar la fecha y hora
              de la visita.
            </p>
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
              {/* ✅ CORRECCIÓN SONARCLOUD: Añadido htmlFor e id */}
              <label htmlFor="nombre">Nombre *</label>
              <input
                id="nombre"
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="reserva__campo">
              <label htmlFor="apellido">Apellido *</label>
              <input
                id="apellido"
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="reserva__campo">
              <label htmlFor="rut">RUT *</label>
              <input
                id="rut"
                type="text"
                name="rut"
                value={formData.rut}
                onChange={handleChange}
                placeholder="Ej: 12.345.678-9"
                required
                disabled={isLoading}
              />
            </div>

            {/* ✅ NUEVO - Campo de Dirección */}
            <div className="reserva__campo">
              <label htmlFor="direccion">Dirección *</label>
              <input
                id="direccion"
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                placeholder="Ej: Av. Providencia 1234, Depto 56"
                required
                disabled={isLoading}
              />
            </div>

            <div className="reserva__campo">
              <label htmlFor="sexo">Sexo</label>
              <select
                id="sexo"
                name="sexo"
                value={formData.sexo}
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div className="reserva__campo">
              <label htmlFor="email">Correo electrónico *</label>
              <input
                id="email"
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
              <label htmlFor="telefono">Teléfono *</label>
              <input
                id="telefono"
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
              <label htmlFor="descripcion">Descripción del problema *</label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows="4"
                required
                disabled={isLoading}
              ></textarea>
            </div>

            <div className="reserva__campo">
              <label htmlFor="evidencia">Evidencia (opcional) - Máx 15MB</label>
              <input
                id="evidencia"
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
                  <img
                    src={getSafeUrl(evidenciaBase64)} // ✅ CORRECCIÓN SONARCLOUD: Sanitizar src
                    alt="Vista previa de la evidencia"
                  />
                </div>
              )}
              <small>Formatos permitidos: imágenes, videos, PDF</small>
            </div>

            {error && <div className="reserva__error">{error}</div>}

            <button
              type="submit"
              className="reserva__boton"
              disabled={isLoading}
            >
              {isLoading ? "Enviando..." : "Enviar solicitud"}
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