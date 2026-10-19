import '../scss/cotizacion.scss';

function Cotizacion() {
  const servicios = [
    { nombre: 'Detección y Reparación de fugas de agua', precio: 150000 },
    { nombre: 'Reparación y Cambio de Cañerías', precio: 120000 },
    { nombre: 'Destapes de alcantarillado', precio: 80000 },
    { nombre: 'Destapes de cámaras y Desagües', precio: 70000 },
    { nombre: 'Destape y limpieza vertical / horizontal', precio: 100000 },
    { nombre: 'Destape de lavaplatos, tinas, lavamanos y WC', precio: 60000 },
    { nombre: 'Mantención Preventiva de Redes Sanitarias', precio: 90000 },
    { nombre: 'Limpieza de Tuberías con Hidrojet', precio: 110000 },
    { nombre: 'Servicio de Transporte (traslado de equipos)', precio: 15000 },
  ];

  const formatearPrecio = (monto) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(monto);
  };

  return (
    <div className="cotizacion">
      <header className="cotizacion__header">
        <div className="cotizacion__logo-wrapper">
          <span className="cotizacion__logo-text">Gasfipro</span>
        </div>
        <nav className="cotizacion__nav">
          <a href="/">Inicio</a>
          <a href="/cotizacion">Cotización</a>
          <a href="#contacto">Contacto</a>
        </nav>
      </header>

      <main className="cotizacion__main">
        <h1 className="cotizacion__titulo">Lista de Precios</h1>
        <p className="cotizacion__subtitulo">
          Valores referenciales (IVA incluido). Solicita una cotización personalizada según tu necesidad.
        </p>

        <div className="cotizacion__tabla">
          {servicios.map((item, index) => (
            <div className="cotizacion__fila" key={index}>
              <span className="cotizacion__servicio">{item.nombre}</span>
              <span className="cotizacion__precio">{formatearPrecio(item.precio)}</span>
            </div>
          ))}
        </div>

        <div className="cotizacion__nota">
          <p>* Los precios pueden variar según la complejidad del trabajo y la ubicación.</p>
          <p>** Consulta por descuentos para mantenciones preventivas o contratos de largo plazo.</p>
        </div>
      </main>

      <footer className="cotizacion__footer">
        <p>© 2026 Gasfipro - Todos los derechos reservados</p>
      </footer>
    </div>
  );
}

export default Cotizacion;