import { useEffect } from "react";
import { LoginTemplate } from "../index";
import { supabase } from "../supabase/supabase.config.jsx";
import Swal from "sweetalert2";

export function Login() {
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (session?.user) {
        const email = session.user.email;
        const adminEmails = ["tucorreo@gmail.com", "correodesocia@gmail.com"];

        if (adminEmails.includes(email)) {
          // Si es admin, redirigir al panel de admin
          window.location.href = "/admin/home";
        } else {
          // Si no es admin, verificar si está en la tabla empleados
          const { data: empleado } = await supabase
            .from("empleados")
            .select("*")
            .eq("correo", email)
            .single();

          if (empleado && empleado.activo) {
            if (empleado.rol === "empleado") {
              window.location.href = "/empleado/home";
            } else if (empleado.rol === "admin") {
              window.location.href = "/admin/home";
            }
          } else {
            Swal.fire(
              "Cuenta inactiva",
              "Tu cuenta no está activa o no existe",
              "error"
            );
            await supabase.auth.signOut();
          }
        }
      }
    };

    checkSession();
  }, []);

  return <LoginTemplate />;
}
