// src/routers/routes.jsx
import { Routes, Route } from "react-router-dom";
import {
  Login,
  Caja,
  Finanzas,
  Ventas,
  DetallesVentasPage,
  ProtectedRoute,
  HomeAdmin,
  HomeEmpleado,
  AuthCallback,
  Horarios,
} from "../index";

import { Landing } from "../pages/Landing"; // 🆕 Importa tu nueva landing page

export function MyRoutes() {
  return (
    <Routes>
      {/* 🌐 Página pública principal */}
      <Route path="/" element={<Landing />} />

      {/* 🔓 Ruta pública de login */}
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* 👑 Rutas para Administradores */}
      <Route element={<ProtectedRoute rolRequerido="admin" redirectTo="/login" />}>
        <Route path="/admin/home" element={<HomeAdmin />} />
        <Route path="/admin/finanzas" element={<Finanzas />} />
        <Route path="/admin/ventas" element={<Ventas />} />
        <Route path="/admin/detalles-ventas" element={<DetallesVentasPage />} />
        <Route path="/admin/horarios" element={<Horarios />} />
      </Route>

      {/* 👷 Rutas para Empleados */}
      <Route element={<ProtectedRoute rolRequerido="empleado" redirectTo="/login" />}>
        <Route path="/empleado/home" element={<HomeEmpleado />} />
        <Route path="/empleado/caja" element={<Caja />} />
        <Route path="/empleado/horarios" element={<Horarios />} />
      </Route>

      {/* 🚫 Ruta por defecto: si no existe, redirige a "/" */}
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
