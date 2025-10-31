# 🍕 One Way Pizza — Sistema de Gestión para Restaurantes

**One Way Pizza** es una aplicación web desarrollada con **React + Supabase** que permite administrar las operaciones de un restaurante: ventas, caja, empleados, horarios y reportes financieros.

Diseñada especialmente para negocios locales, ofrece una interfaz moderna, ágil y segura, con autenticación por Google y un control completo de la caja diaria.

---

## 🚀 Características principales

✅ **Autenticación con Google** (Supabase Auth)
✅ **Gestión de Caja** (apertura, cierre, movimientos)
✅ **Registro de Ventas y Detalles de Venta**
✅ **Panel de Administración y Empleado**
✅ **Gestión de Horarios de Empleados**
✅ **Reportes financieros y exportación CSV**
✅ **Interfaz moderna con Styled Components + SweetAlert2**
✅ **Modo oscuro y claro (Theme toggle)**
✅ **Desplegado en Vercel + Supabase (DB y Auth)**

---

## 🏗️ Tecnologías utilizadas

| Categoría | Herramienta / Librería |
|------------|------------------------|
| **Frontend** | React 19, Vite, Styled Components |
| **Backend / DB** | Supabase (PostgreSQL + Auth + Storage) |
| **UI / UX** | Material UI, SweetAlert2, Recharts |
| **Gestión de estado** | Zustand |
| **Hosting** | Vercel |
| **Control de versiones** | Git & GitHub |

---

## ⚙️ Instalación local

Si deseas probar el proyecto en tu máquina local:

```bash
# 1️⃣ Clonar el repositorio
git clone https://github.com/Luismel06/one-way-pizza.git

# 2️⃣ Entrar al directorio
cd one-way-pizza

# 3️⃣ Instalar dependencias
npm install

# 4️⃣ Crear archivo .env con tus credenciales de Supabase
VITE_APP_SUPABASE_URL=tu_url_de_supabase
VITE_APP_SUPABASE_ANON_KEY=tu_anon_key

# 5️⃣ Ejecutar en modo desarrollo
npm run dev
