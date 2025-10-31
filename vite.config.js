import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ✅ Configuración optimizada para Vercel
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": {}, // Evita errores de entorno en Vercel
  },
});
