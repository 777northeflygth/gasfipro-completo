import { useState } from 'react';
import '../scss/contacto.scss';

function Contacto() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    mensaje: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.email || !formData.mensaje) {
      alert('Por favor completa todos los campos obligatorios.');
      return;
    }
    alert('¡Mensaje enviado con éxito! Te contactaremos a la brevedad.');
    setFormData({ nombre: '', email: '', telefono: '', mensaje: '' });
  };

  return (
    <div className="contacto">
      <header className="contacto__header">
        <div className="contacto__logo-wrapper">
          <span className="contacto__logo-text">Gasfipro</span>
        </div>
        <nav className="contacto__nav">
          <a href="/">Inicio</a>
          <a href="/cotizacion">Cotización</a>
          <a href="/reserva">Reservar</a>
          <a href="/contacto">Contacto</a>
        </nav>
      </header>

      <main className="contacto__main">
        <h1 className="contacto__titulo">Contacto</h1>
        <p className="contacto__subtitulo">
          ¿Tienes alguna consulta o necesitas ayuda? Escríbenos y te responderemos lo antes posible.
        </p>

        <div className="contacto__contenedor">
          <div className="contacto__info">
            <h3>Información de contacto</h3>
            <div className="contacto__item">
              <span className="contacto__icono">📞</span>
              <div>
                <strong>Teléfono</strong>
                <p>+56 9 6685 2245</p>
              </div>
            </div>
            <div className="contacto__item">
              <span className="contacto__icono">✉️</span>
              <div>
                <strong>Correo electrónico</strong>
                <p>contacto@gasfipro.cl</p>
              </div>
            </div>
            <div className="contacto__item">
              <span className="contacto__icono">📍</span>
              <div>
                <strong>Dirección</strong>
                <p>Santiago, Región Metropolitana, Chile</p>
              </div>
            </div>
            <div className="contacto__item">
              <span className="contacto__icono">🕒</span>
              <div>
                <strong>Horario de atención</strong>
                <p>Lunes a Sábado: 08:00 – 20:00</p>
                <p>Domingo: 09:00 – 14:00</p>
              </div>
            </div>
            {/* NUEVO: enlace a Instagram */}
            <div className="contacto__item">
              <span className="contacto__icono">📸</span>
              <div>
                <strong>Instagram</strong>
                <a
                  href="https://www.instagram.com/gasfiprocl/?hl=es"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contacto__instagram-link"
                >
                  @gasfiprocl
                </a>
              </div>
            </div>
            <div className="contacto__whatsapp-link">
              <a
                href="https://web.whatsapp.com/send?phone=56966852245"
                target="_blank"
                rel="noopener noreferrer"
              >
                📱 Escríbenos por WhatsApp
              </a>
            </div>
          </div>

          <form className="contacto__form" onSubmit={handleSubmit}>
            {/* ... (formulario sin cambios) ... */}
          </form>
        </div>
      </main>

      <footer className="contacto__footer">
        <p>© 2026 Gasfipro - Todos los derechos reservados</p>
        {/* NUEVO: enlace a Instagram en el footer */}
      </footer>
    </div>
  );
}

export default Contacto;