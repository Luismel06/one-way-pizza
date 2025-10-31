import { create } from "zustand";
import Swal from "sweetalert2";
import { supabase } from "../supabase/supabase.config.jsx";

export const useAuthStore = create((set) => ({
  // 🔹 LOGIN GOOGLE (solo admins)
  loginGoogle: async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/admin/home`, // ✅ Forzamos redirección después del login
      },
    });

    if (error) {
      Swal.fire("Error", "No se pudo iniciar sesión con Google", "error");
      return;
    }
  } catch (err) {
    Swal.fire("Error inesperado", err.message, "error");
  }

    // Escuchar el estado de autenticación
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const email = session.user.email;
        console.log("Correo autenticado:", email);

        // Buscar en la tabla usuarios
        const { data: usuario } = await supabase
          .from("usuarios")
          .select("*")
          .eq("correo", email)
          .single();

        if (!usuario || !usuario.activo) {
          Swal.fire("Cuenta inactiva", "Tu cuenta no está activa o no existe", "error");
          await supabase.auth.signOut();
          return;
        }

        // Solo permitir admin para Google
        if (usuario.rol !== "admin") {
          await supabase.auth.signOut();
          Swal.fire(
            "Acceso denegado",
            "Tu cuenta no tiene permisos de administrador",
            "error"
          );
          return;
        }

        // Si todo está bien, redirigir al home del admin
        window.location.href = "/admin/home";
      }
    });
  },

  // 🔹 LOGIN EMPLEADOS (email + password)
  loginEmpleado: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Swal.fire("Error", "Correo o contraseña incorrectos", "error");
      return;
    }

    // Verificar datos en la tabla usuarios
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("*")
      .eq("correo", email)
      .single();

    if (!usuario || !usuario.activo) {
      Swal.fire("Cuenta inactiva", "Tu cuenta no está activa o no existe", "error");
      await supabase.auth.signOut();
      return;
    }

    // Redirección según rol
    if (usuario.rol === "empleado") {
      window.location.href = "/empleado/home";
    } else if (usuario.rol === "admin") {
      window.location.href = "/admin/home";
    } else {
      Swal.fire("Error", "Tu cuenta no tiene un rol válido", "error");
      await supabase.auth.signOut();
    }
  },

  // 🔹 CERRAR SESIÓN
  cerrarSesion: async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  },
}));
