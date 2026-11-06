// src/front-jsx/Login.jsx
import { useState } from "react";
import { useAuth } from "../jsx/hooks/useAuth";
import { useGoogleLogin } from '@react-oauth/google';
import "../scss/login.scss";

function Login() {
  const { login, loginWithGoogle, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  // ✅ Hook para obtener el código de autorización
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      // En este flujo, Google nos devuelve un 'code' en lugar de un 'credential'
      console.log("Código de autorización recibido:", tokenResponse);
      await loginWithGoogle(tokenResponse.code);
    },
    onError: () => console.log('El inicio de sesión con Google falló o fue cancelado'),
    flow: 'auth-code', // ✅ CLAVE: Forzar el flujo de código para obtener refresh_token
    // ✅ NUEVO: Pedir exactamente los mismos permisos que el backend
    scope: 'openid email profile https://www.googleapis.com/auth/calendar', 
  });

  return (
    <div className="login">
      <header className="login__header">
        <div className="login__logo-wrapper">
          <span className="login__logo-text">Gasfipro</span>
        </div>
        <nav className="login__nav">
          <a href="/">Inicio</a>
          <a href="/cotizacion">Cotización</a>
          <a href="/reservar">Reservar</a>
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
              {loading ? "Cargando..." : "Ingresar"}
            </button>
          </form>

          <div style={{ margin: "20px 0", textAlign: "center", color: "#888", fontSize: "0.9rem" }}>
            — O ingresa con Google —
          </div>

          {/* ✅ Botón personalizado que activa el hook */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => handleGoogleLogin()}
              className="login__boton"
              disabled={loading}
              style={{
                backgroundColor: "#db4437", // Color oficial de Google
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                boxShadow: "0 4px 14px rgba(219, 68, 55, 0.4)"
              }}
            >
              {/* Icono de Google simple en SVG */}
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#fff" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#fff" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#fff" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#fff" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Acceder con Google
            </button>
          </div>

          <p className="login__ayuda" style={{ marginTop: "20px" }}>
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