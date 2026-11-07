const express = require("express");
const cors = require("cors");
const helmet = require("helmet"); // ✅ NUEVO: Importar helmet

const app = express();

// ✅ CORRECCIÓN SONARCLOUD: Ocultar la cabecera X-Powered-By
app.disable('x-powered-by');

// ✅ CORRECCIÓN SONARCLOUD: Configurar cabeceras HTTP de seguridad con Helmet
app.use(helmet());

const PORT = process.env.PORT || 3000;

// ✅ CORRECCIÓN SONARCLOUD: Restringir CORS a orígenes específicos
const allowedOrigins = [
  'http://localhost:5173', 
  'http://127.0.0.1:5173'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir peticiones sin origen (como aplicaciones móviles o Postman)
    if (!origin) return callback(null, true);
    
    // Si el origen está en la lista blanca, permitir
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // ✅ Buena práctica: limitar métodos
  allowedHeaders: ['Content-Type', 'Authorization']   // ✅ Buena práctica: limitar headers
};

app.use(cors(corsOptions));

// ✅ CORRECCIÓN SONARCLOUD: Limitar el tamaño del payload (evita ataques DoS)
app.use(express.json({ limit: '10kb' }));

// Ruta de prueba
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Backend funcionando 🚀" });
});

app.listen(PORT, () => {
  // Nota: SonarCloud puede quejarse del console.log, pero en este archivo de arranque es aceptable.
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});