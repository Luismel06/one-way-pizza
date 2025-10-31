// src/index.js
export { default as App } from './App';

// 🌙 Tema y Sidebar
export * from './components/organismos/ToggleTema';
export * from './components/organismos/sidebar/Sidebar';

// 🏠 Templates principales
export * from './components/templates/HomeAdminTemplate.jsx';
export * from './components/templates/HomeEmpleadoTemplate.jsx';
export * from './components/templates/LoginTemplate';
export * from './components/templates/CajaTemplate';
export * from './components/templates/FinanzasTemplate';
export * from './components/templates/VentasTemplate';
export * from './components/templates/DetallesVentasTemplate.jsx';
export * from './components/templates/HorariosTemplate.jsx';

// 📄 Páginas
export * from './pages/HomeAdmin.jsx';
export * from './pages/HomeEmpleado.jsx';
export * from './pages/Login';
export * from './pages/Caja';
export * from './pages/Finanzas';
export * from './pages/Ventas';
export * from './pages/detalles-ventas.jsx';
export * from './pages/AuthCallback.jsx';
export * from './pages/Horarios.jsx';

// 🧭 Rutas
export * from './routers/routes';

// 🎨 Estilos
export * from './styles/GlobalStyles';
export * from './styles/breakpoints';
export * from './styles/themes';
export * from './styles/variables';

// 🧱 Utils y Store
export * from './utils/dataEstatica';
export * from './store/ThemeStore';
export * from './store/AuthStore';
export * from './context/AuthContent.jsx';
export * from './hooks/ProtectedRoute.jsx';

// 💾 Supabase y CRUDs
export * from './supabase/supabase.config.jsx';
export * from './supabase/crudCommon.jsx';
export * from './supabase/crudCategorias.jsx';
export * from './supabase/crudProductos.jsx';
export * from './supabase/crudUsuarios.jsx';
export * from './supabase/crudCaja.jsx';
export * from './supabase/crudVentas.jsx';

// ⚙️ Componentes atómicos
export * from './components/atomos/Title';
export * from './components/atomos/Icono';
export * from './components/atomos/Linea';
export * from './components/moleculas/Btnsave';
export * from './components/organismos/formularios/InputText2';
export * from './components/organismos/Footer';
export * from './main';
