import { useEffect } from "react";
import { supabase } from "../supabase/supabase.config.jsx";

export function AuthCallback() {
  useEffect(() => {
    const validar = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session?.user) {
        window.location.href = "/login";
        return;
      }

      const email = session.user.email;
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("*")
        .eq("correo", email)
        .single();

      if (!usuario || !usuario.activo) {
        await supabase.auth.signOut();
        window.location.href = "/login";
        return;
      }

      if (usuario.rol === "admin") {
        window.location.href = "/admin/home";
      } else if (usuario.rol === "empleado") {
        window.location.href = "/empleado/home";
      } else {
        await supabase.auth.signOut();
        window.location.href = "/login";
      }
    };

    validar();
  }, []);

  return <p>Validando sesión...</p>;
}
