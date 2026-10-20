import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import security from "eslint-plugin-security";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),

  // ─── Frontend (React + browser) ─────────────────────────────
  {
    files: ["src/**/*.{js,jsx}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      security, // 👈 nuevo: habilita reglas de SAST
    },
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Regla nueva de react-hooks v7, demasiado estricta para este proyecto
      "react-hooks/set-state-in-effect": "off",

      // 👇 SAST: reglas de seguridad recomendadas por el plugin
      ...security.configs.recommended.rules,
    },
  },

  // ─── Backend (Node + CommonJS) ──────────────────────────────
  {
    files: ["backend/**/*.js"],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
      sourceType: "commonjs",
    },
  },

  // ─── Archivos de configuración raíz (Vite, ESLint) ──────────
  {
    files: ["*.{js,mjs,cjs}"],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  },
]);