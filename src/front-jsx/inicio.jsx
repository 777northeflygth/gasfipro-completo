import '../scss/inicio.scss';
import logo from '../assets/logo.jpg';
import portada from '../assets/portada.png';
import nosotros from '../assets/nosotros.jpg';
import img2 from '../assets/2.png';
import img4 from '../assets/4.png';
import img6 from '../assets/6.png';
import img8 from '../assets/8.png';
import img10 from '../assets/10.png';
import img12 from '../assets/12.png';
import img14 from '../assets/14.png';
import img16 from '../assets/16.png';
import { useNavigate } from 'react-router-dom';

function Inicio() {
  const navigate = useNavigate();

  const servicios = [
    {
      titulo: 'Detección y Reparación de fugas de agua',
      descripcion:
        'Localizamos fugas ocultas utilizando tecnología de gas trazador y equipos electrónicos de alta precisión, identificando el punto exacto de la fuga sin realizar demoliciones innecesarias.',
      imagen: img2,
    },
    {
      titulo: 'Reparación y Cambio de Cañerías',
      descripcion:
        'Realizamos reparación, renovación y reemplazo de tuberías deterioradas, asegurando el correcto funcionamiento de las redes de agua potable y alcantarillado.',
      imagen: img4,
    },
    {
      titulo: 'Destapes de alcantarillado',
      descripcion:
        'Eliminamos obstrucciones en redes de alcantarillado utilizando maquinaria profesional de última tecnología, restableciendo el flujo normal de las tuberías de forma rápida, segura y eficiente.',
      imagen: img6,
    },
    {
      titulo: 'Destapes de cámaras y Desagües',
      descripcion:
        'Destapamos desagües de cocinas, baños, patios, lavanderías y terrazas, eliminando obstrucciones causadas por grasa, residuos, sedimentos y otros elementos que impiden el correcto funcionamiento del sistema.',
      imagen: img8,
    },
    {
      titulo: 'Destape y limpieza vertical / horizontal en edificios o particulares',
      descripcion:
        'Servicio especializado para edificios, condominios, empresas y particulares, eliminando bloqueos en columnas sanitarias y redes principales de evacuación.',
      imagen: img10,
    },
    {
      titulo: 'Destape de lavaplatos, tinas, lavamanos y WC',
      descripcion:
        'Solucionamos obstrucciones en todo tipo de artefactos sanitarios mediante equipos especializados, evitando daños en las cañerías y entregando una solución rápida y efectiva.',
      imagen: img12,
    },
    {
      titulo: 'Mantención Preventiva de Redes Sanitarias',
      descripcion:
        'Ejecutamos mantenciones preventivas para hogares, edificios, condominios, empresas e industrias, evitando obstrucciones futuras y prolongando la vida útil del sistema de alcantarillado.',
      imagen: img14,
    },
    {
      titulo: 'Limpieza de Tuberías con Hidrojet',
      descripcion:
        'Realizamos limpieza profunda de tuberías mediante equipos Hidrojet de alta presión, eliminando grasa, sarro, lodos, raíces e incrustaciones para recuperar el óptimo funcionamiento de la red sanitaria.',
      imagen: img16,
    },
  ];

  const handleCotizar = () => {
    navigate('/cotizacion');
  };

  const handleReservar = () => {
    navigate('/reserva');
  };

  const handleEstado = () => {
    navigate('/estado');
  };

  return (
    <div className="inicio">
      <header className="inicio__header">
        <div className="inicio__logo-wrapper">
          <img src={logo} alt="Gasfipro Logo" className="inicio__logo-img" />
          <span className="inicio__logo-text">Gasfipro</span>
        </div>
        <nav className="inicio__nav">
          <a href="#servicios">Servicios</a>
          <a href="#nosotros">Nosotros</a>
          <a href="/reserva">Reservar</a>
          <a href="/estado">Estado de hora</a> {/* ← NUEVO */}
          <a href="/contacto">Contacto</a>
        </nav>
      </header>

      <main className="inicio__hero">
        <div className="inicio__contenido">
          <h1 className="inicio__titulo">
            Expertos en <br />
            <span>gasfitería</span>
          </h1>
          <p className="inicio__descripcion">
            Solucionamos cualquier problema de cañerías, instalaciones y
            mantenciones con la mejor calidad y rapidez. Confía en los
            profesionales.
          </p>
          <div className="inicio__botones">
            <button
              className="inicio__boton inicio__boton--cotizar"
              onClick={handleCotizar}
            >
              Solicitar Cotización
            </button>
            <button
              className="inicio__boton inicio__boton--reserva"
              onClick={handleReservar}
            >
              Reservar tu hora
            </button>
          </div>
        </div>
        <div className="inicio__imagen">
          <img src={portada} alt="Gasfipro portada" className="inicio__portada" />
        </div>
      </main>

      <section className="inicio__servicios" id="servicios">
        <h2 className="inicio__servicios-titulo">Nuestros Servicios</h2>
        <div className="inicio__servicios-grid">
          {servicios.map((servicio, index) => (
            <div className="inicio__servicio-card" key={index}>
              <img
                src={servicio.imagen}
                alt={servicio.titulo}
                className="inicio__servicio-imagen"
              />
              <h3 className="inicio__servicio-titulo">{servicio.titulo}</h3>
              <p className="inicio__servicio-descripcion">{servicio.descripcion}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="inicio__destape">
        <h2 className="inicio__destape-titulo">Destape de Alcantarillados en Santiago 24/7</h2>
        <p className="inicio__destape-descripcion">
          Brindamos un servicio rápido y profesional de destape de alcantarillados, desagües y tuberías para casas, edificios, condominios, empresas y locales comerciales en toda la Región Metropolitana. Atendemos emergencias las 24 horas del día, los 365 días del año, utilizando equipos de última tecnología para eliminar obstrucciones de forma rápida, limpia y eficiente.
        </p>
        <button
          className="inicio__boton inicio__boton--reserva inicio__boton--destape"
          onClick={handleReservar}
        >
          Reservar tu hora
        </button>
      </section>

      <section className="inicio__nosotros" id="nosotros">
        <div className="inicio__nosotros-contenedor">
          <div className="inicio__nosotros-imagen">
            <img src={nosotros} alt="Nosotros - Gasfipro" />
          </div>
          <div className="inicio__nosotros-texto">
            <h2 className="inicio__nosotros-titulo">Nosotros</h2>
            <p className="inicio__nosotros-descripcion">
              Somos una empresa especializada en destape de alcantarillados, desagües, detección y reparación de fugas de agua, con amplia experiencia atendiendo casas, edificios, condominios, empresas e industrias en toda la Región Metropolitana.
            </p>
            <p className="inicio__nosotros-descripcion">
              Nuestro compromiso es entregar soluciones rápidas, seguras y duraderas, utilizando tecnología de última generación, como equipos Hidrojet de alta presión, máquinas eléctricas de destape, resortes eléctricos, cámaras de inspección de tuberías y detectores de fugas con gas trazador, lo que nos permite resolver obstrucciones y detectar fallas con máxima precisión.
            </p>
            <p className="inicio__nosotros-descripcion">
              Sabemos que un alcantarillado tapado o una fuga de agua pueden convertirse en una emergencia. Por eso ofrecemos atención 24 horas al día, los 365 días del año, respondiendo con rapidez para minimizar daños.
            </p>
            <p className="inicio__nosotros-descripcion">
              Más que un servicio técnico, entregamos confianza, experiencia y soluciones profesionales para que tu hogar, edificio o empresa vuelva a funcionar con total normalidad.
            </p>
          </div>
        </div>
      </section>

      <footer className="inicio__footer">
        <p>© 2026 Gasfipro - Todos los derechos reservados</p>
      </footer>

      {/* BOTÓN WHATSAPP FLOTANTE */}
      <a
        href="https://web.whatsapp.com/send?phone=56966852245"
        target="_blank"
        rel="noopener noreferrer"
        className="inicio__whatsapp"
        aria-label="Contactar por WhatsApp"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="32"
          height="32"
          fill="white"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
}

export default Inicio;