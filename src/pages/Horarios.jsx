import { HorariosTemplate } from "../components/templates/HorariosTemplate.jsx";
import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabase.config.jsx";

export function Horarios() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase.auth.getSession();
      const correo = data.session?.user?.email || null;

      if (!correo) {
        window.location.href = "/login";
        return;
      }

      const { data: info } = await supabase
        .from("usuarios")
        .select("*")
        .eq("correo", correo)
        .single();

      setUsuario(info);
    }

    cargar();
  }, []);

  if (!usuario) return <p>Cargando...</p>;

  const esAdmin = usuario.rol === "admin";

  return (
    <HorariosTemplate
      esAdmin={esAdmin}
      empleadoCorreo={usuario.correo}
    />
  );
}
