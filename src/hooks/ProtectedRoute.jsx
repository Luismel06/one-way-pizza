import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../supabase/supabase.config.jsx";

export function ProtectedRoute({ redirectTo = "/login", rolRequerido }) {
  const [autorizado, setAutorizado] = useState(null);

  useEffect(() => {
    const verificarSesion = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session?.user) {
        setAutorizado(false);
        return;
      }

      const email = session.user.email;

      // Buscar usuario en la tabla
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("*")
        .eq("correo", email)
        .single();

      if (!usuario || !usuario.activo) {
        setAutorizado(false);
        return;
      }

      // Validar rol requerido
      if (rolRequerido === usuario.rol) {
        setAutorizado(true);
      } else {
        setAutorizado(false);
      }
    };

    verificarSesion();
  }, [rolRequerido]);

  if (autorizado === null) return <p>Cargando...</p>;
  if (!autorizado) return <Navigate to={redirectTo} replace />;

  return <Outlet />;
}
