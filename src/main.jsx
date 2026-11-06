import React from "react";
import ReactDOM from "react-dom/client";
import App from "./front-jsx/App.jsx";

// ✅ NUEVO - Importar el proveedor de Google
import { GoogleOAuthProvider } from "@react-oauth/google";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* ✅ NUEVO - Envolver la App con tu Client ID de Google */}
    <GoogleOAuthProvider clientId="129169394896-kbkqsaqoa29nkqek35pc315kb19eae1c.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);