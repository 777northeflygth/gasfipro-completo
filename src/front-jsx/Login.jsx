// src/front-jsx/Login.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../jsx/hooks/useAuth';
import '../scss/login.scss';

function Login() {
  const { login, loading, error, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
    // Si falla, el estado error se actualiza automáticamente en useAuth
  };

  return (
    <div className="login">
      <header className="login__header">
        <div className="login__logo-wrapper">
          <span className="login__logo-text">Gasfipro</span>
        </div>
        <nav className="login__nav">
          <a href="/">Inicio</a>
          <a href="/cotizacion">Cotización</a>
          <a href="/reserva">Reservar</a>
          <a href="/contacto">Contacto</a>
        </nav>
      </header>

      <main className="login__main">
        <div className="login__card">
          <h1 className="login__titulo">Iniciar sesión</h1>
          <p className="login__subtitulo">Acceso para administradores</p>

          <form className="login__form" onSubmit={handleSubmit}>
            <div className="login__campo">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gasfipro.cl"
                required
                disabled={loading}
              />
            </div>

            <div className="login__campo">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
                disabled={loading}
              />
            </div>

            {error && <div className="login__error">{error}</div>}

            <button type="submit" className="login__boton" disabled={loading}>
              {loading ? 'Cargando...' : 'Ingresar'}
            </button>
          </form>

          <p className="login__ayuda">
            ¿Olvidaste tu contraseña? <a href="#">Recupérala aquí</a>
          </p>
        </div>
      </main>

      <footer className="login__footer">
        <p>© 2026 Gasfipro - Todos los derechos reservados</p>
      </footer>
    </div>
  );
}

export default Login;