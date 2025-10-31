import styled from "styled-components";
import { useEffect, useState } from "react";
import { supabase } from "../../supabase/supabase.config.jsx";
import Swal from "sweetalert2";
import { Title, Btnsave, useAuthStore } from "../../index";
import { Device } from "../../styles/breakpoints.jsx";

export function HomeEmpleadoTemplate() {
  const [usuario, setUsuario] = useState(null);
  const [registroHoy, setRegistroHoy] = useState(null);
  const [cargando, setCargando] = useState(true);
  const { cerrarSesion } = useAuthStore();

  useEffect(() => {
    const obtenerUsuario = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session?.user) {
        window.location.href = "/login";
        return;
      }

      const correo = session.user.email;
      const { data: infoUsuario } = await supabase
        .from("usuarios")
        .select("*")
        .eq("correo", correo)
        .single();

      if (!infoUsuario || !infoUsuario.activo) {
        Swal.fire("Error", "Tu cuenta no está activa o no existe", "error");
        await supabase.auth.signOut();
        window.location.href = "/login";
        return;
      }

      setUsuario(infoUsuario);
      await verificarRegistro(infoUsuario);
      setCargando(false);
    };

    obtenerUsuario();
  }, []);

  const verificarRegistro = async (usuario) => {
    const hoy = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("registro_horarios")
      .select("*")
      .eq("usuario_id", usuario.id_usuario)
      .eq("fecha", hoy)
      .maybeSingle();

    if (error) console.error("Error al verificar registro:", error);
    setRegistroHoy(data);
  };

  const marcarEntrada = async () => {
    const hoy = new Date().toISOString().split("T")[0];
    const horaActual = new Date().toISOString();

    const { error } = await supabase.from("registro_horarios").insert([
      {
        usuario_id: usuario.id_usuario,
        correo: usuario.correo,
        fecha: hoy,
        hora_entrada: horaActual,
      },
    ]);

    if (error) {
      Swal.fire("Error", "No se pudo registrar la entrada", "error");
      console.error(error);
    } else {
      Swal.fire("Listo", "Has marcado tu entrada", "success");
      await verificarRegistro(usuario);
    }
  };

  const marcarSalida = async () => {
    const hoy = new Date().toISOString().split("T")[0];
    const horaActual = new Date().toISOString();

    const { error } = await supabase
      .from("registro_horarios")
      .update({ hora_salida: horaActual })
      .eq("usuario_id", usuario.id_usuario)
      .eq("fecha", hoy);

    if (error) {
      Swal.fire("Error", "No se pudo registrar la salida", "error");
      console.error(error);
    } else {
      Swal.fire("Listo", "Has marcado tu salida", "success");
      await verificarRegistro(usuario);
    }
  };

  if (cargando) return <p>Cargando...</p>;

  return (
    <Container>
      <Header>
        <Title>Bienvenido, {usuario?.nombre}</Title>

        <Btnsave
          titulo="Cerrar sesión"
          bgcolor="#e63946"
          color="255,255,255"
          width="180px"
          funcion={cerrarSesion}
        />
      </Header>

      <Cards>
        {/* Tarjeta de información */}
        <Card>
          <h3>Tu información</h3>
          <Avatar src="/default-avatar.jpg"/> {/* ✅ Imagen fija */}
          <p><strong>Nombre:</strong> {usuario?.nombre}</p>
          <p><strong>Correo:</strong> {usuario?.correo}</p>
          <p><strong>Rol:</strong> {usuario?.rol}</p>
          <p><strong>Estado:</strong> {usuario?.activo ? "Activo" : "Inactivo"}</p>
        </Card>

        {/* Tarjeta de reloj */}
        <Card>
          <h3>Registro diario</h3>
          {registroHoy ? (
            <>
              <p>Entrada: {new Date(registroHoy.hora_entrada).toLocaleTimeString()}</p>
              <p>
                Salida:{" "}
                {registroHoy.hora_salida
                  ? new Date(registroHoy.hora_salida).toLocaleTimeString()
                  : "Aún no registrada"}
              </p>
              {!registroHoy.hora_salida && (
                <Btnsave
                  titulo="Marcar salida"
                  bgcolor="#fa6003"
                  color="255,255,255"
                  width="100%"
                  funcion={marcarSalida}
                />
              )}
            </>
          ) : (
            <Btnsave
              titulo="Marcar entrada"
              bgcolor="#fa6003"
              color="255,255,255"
              width="100%"
              funcion={marcarEntrada}
            />
          )}
        </Card>
      </Cards>
    </Container>
  );
}

/* 💅 ESTILOS */
const Container = styled.div`
  padding: 30px;
  min-height: 100vh;
  color: ${({ theme }) => theme.text};
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url("/fondo2.jpg");
    background-size: cover;
    background-position: center;
    opacity: 0.05;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
`;

const Cards = styled.section`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-top: 20px;

  @media ${Device.tablet} {
    grid-template-columns: 1fr 1fr;
  }
`;

const Card = styled.div`
  background-color: ${({ theme }) => theme.card};
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0px 4px 10px rgba(0,0,0,0.1);
  text-align: center;
`;

const Avatar = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 10px 0;
  object-fit: cover;
  border: 2px solid #fa6003;
`;
