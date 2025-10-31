// src/components/templates/HomeAdminTemplate.jsx
import styled from "styled-components";
import { useEffect, useState } from "react";
import { supabase } from "../../supabase/supabase.config.jsx";
import Swal from "sweetalert2";
import { Title, Btnsave, useAuthStore, Linea } from "../../index";
import { Device } from "../../styles/breakpoints";
import { useNavigate } from "react-router-dom";

export function HomeAdminTemplate() {
  const [adminData, setAdminData] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nuevoEmpleado, setNuevoEmpleado] = useState({
    nombre: "",
    correo: "",
    password: "",
  });
  const { cerrarSesion } = useAuthStore();
  const navigate = useNavigate();

  /* ================== FUNCIONES ================== */

  async function cargarEmpleados() {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("rol", "empleado")
      .order("nombre", { ascending: true });

    if (error) {
      Swal.fire("Error", "No se pudieron cargar los empleados", "error");
    } else {
      setEmpleados(data || []);
    }
  }

  async function toggleActivo(id, activo) {
    const { error } = await supabase
      .from("usuarios")
      .update({ activo: !activo })
      .eq("id_usuario", id);

    if (error) {
      Swal.fire("Error", "No se pudo actualizar el estado", "error");
    } else {
      setEmpleados((prev) =>
        prev.map((e) =>
          e.id_usuario === id ? { ...e, activo: !activo } : e
        )
      );
      Swal.fire(
        "Listo",
        `Empleado ${!activo ? "activado" : "desactivado"}`,
        "success"
      );
    }
  }

async function agregarEmpleado() {
  if (
    !nuevoEmpleado.nombre ||
    !nuevoEmpleado.correo ||
    !nuevoEmpleado.password
  ) {
    Swal.fire("Atención", "Completa todos los campos", "warning");
    return;
  }

  // 1️⃣ Crear usuario en auth
  const { data, error: signupError } = await supabase.auth.signUp({
    email: nuevoEmpleado.correo,
    password: nuevoEmpleado.password,
    options: {
      data: { full_name: nuevoEmpleado.nombre, rol: "empleado" },
    },
  });

  if (signupError) {
    Swal.fire("Error", signupError.message, "error");
    return;
  }

  const newUser = data?.user; // ✅ Aquí está el ID real
  if (!newUser) {
    Swal.fire("Error", "No se pudo obtener el usuario creado", "error");
    return;
  }

  // 2️⃣ Insertar en tabla usuarios (usa id_usuario correcto)
  const { error: insertError } = await supabase.from("usuarios").insert([
    {
      id_usuario: newUser.id, // ✅ Este es el UUID correcto
      nombre: nuevoEmpleado.nombre,
      correo: nuevoEmpleado.correo,
      rol: "empleado",
      activo: true,
    },
  ]);

  if (insertError) {
    console.error("Insert error:", insertError);
    Swal.fire("Error", "No se pudo guardar en la base de datos", "error");
    return;
  }

  // 3️⃣ Confirmar éxito
  Swal.fire("Éxito", "Empleado agregado correctamente", "success");
  setNuevoEmpleado({ nombre: "", correo: "", password: "" });
  cargarEmpleados();
}



  /* ================== CARGAS ================== */

  useEffect(() => {
    async function cargarHorarios() {
      const { data, error } = await supabase
        .from("registro_horarios")
        .select("id, fecha, hora_entrada, hora_salida, usuario_id, usuarios(nombre)")
        .order("fecha", { ascending: false })
        .limit(5);

      if (!error && data) {
        const formateados = data.map((h) => ({
          ...h,
          empleado_nombre: h.usuarios?.nombre || "—",
        }));
        setHorarios(formateados);
      }
    }
    cargarHorarios();
  }, []);

  useEffect(() => {
    async function cargarDatosAdmin() {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session?.user) {
        window.location.href = "/login";
        return;
      }

      const user = session.user;
      setAdminData({
        nombre: user.user_metadata?.full_name || "Administrador",
        correo: user.email,
        foto: "/default-avatar.jpg",
        rol: "Administrador",
      });

      await cargarEmpleados();
      setCargando(false);
    }

    cargarDatosAdmin();
  }, []);

  if (cargando) return <p style={{ padding: 20 }}>Cargando...</p>;

  /* ================== RENDER ================== */

  return (
    <Container>
      <Header>
        <Title>Panel de Administrador</Title>
        <Btnsave
          titulo="Cerrar sesión"
          bgcolor="#e63946"
          color="255,255,255"
          width="180px"
          funcion={cerrarSesion}
        />
      </Header>

      <Cards>
        {/* 🧑‍💼 ADMIN */}
        <Card>
          <h3>Tu cuenta</h3>
          {adminData ? (
            <>
              <Avatar src={adminData.foto} alt="Foto del administrador" />
              <p>
                <strong>Nombre:</strong> {adminData.nombre}
              </p>
              <p>
                <strong>Correo:</strong> {adminData.correo}
              </p>
              <p>
                <strong>Rol:</strong> {adminData.rol}
              </p>
            </>
          ) : (
            <p>Cargando datos...</p>
          )}
        </Card>

        {/* 👥 EMPLEADOS */}
        <Card>
          <CardHeader>
            <h3>👥 Empleados</h3>
          </CardHeader>

          {empleados.length > 0 ? (
            <TablaWrapper>
              <TablaEmpleados>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {empleados.map((e) => (
                    <tr key={e.id_usuario}>
                      <td>{e.nombre}</td>
                      <td className="correo">{e.correo}</td>
                      <td>{e.rol}</td>
                      <td>
                        <Estado $activo={e.activo}>
                          {e.activo ? "Activo" : "Inactivo"}
                        </Estado>
                      </td>
                      <td>
                        <BotonAccion
                          $activo={e.activo}
                          onClick={() => toggleActivo(e.id_usuario, e.activo)}
                        >
                          {e.activo ? "Desactivar" : "Activar"}
                        </BotonAccion>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TablaEmpleados>
            </TablaWrapper>
          ) : (
            <p>No hay empleados registrados</p>
          )}

          <Linea />

          <FormularioAgregar>
            <h4>➕ Agregar nuevo empleado</h4>
            <div className="form-grid">
              <input
                type="text"
                placeholder="Nombre completo"
                value={nuevoEmpleado.nombre}
                onChange={(e) =>
                  setNuevoEmpleado({
                    ...nuevoEmpleado,
                    nombre: e.target.value,
                  })
                }
              />
              <input
                type="email"
                placeholder="Correo electrónico"
                value={nuevoEmpleado.correo}
                onChange={(e) =>
                  setNuevoEmpleado({
                    ...nuevoEmpleado,
                    correo: e.target.value,
                  })
                }
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={nuevoEmpleado.password}
                onChange={(e) =>
                  setNuevoEmpleado({
                    ...nuevoEmpleado,
                    password: e.target.value,
                  })
                }
              />
            </div>
            <BotonAgregar onClick={agregarEmpleado}>
              Agregar empleado
            </BotonAgregar>
          </FormularioAgregar>
        </Card>

        {/* 🕒 REGISTRO HORARIOS */}
        <Card>
          <CardHeader>
            <h3>🕒 Registro de Horarios</h3>
            <VerMasButton onClick={() => navigate("/admin/horarios")}>
              Ver más
            </VerMasButton>
          </CardHeader>

          <CardContent>
            {horarios.length === 0 ? (
              <p>No hay registros recientes</p>
            ) : (
              <TablaWrapper>
                <TablaEmpleados>
                  <thead>
                    <tr>
                      <th>Empleado</th>
                      <th>Fecha</th>
                      <th>Entrada</th>
                      <th>Salida</th>
                    </tr>
                  </thead>
                  <tbody>
                    {horarios.map((h) => (
                      <tr key={h.id}>
                        <td>{h.empleado_nombre}</td>
                        <td>
                          {new Date(h.fecha).toLocaleDateString("es-DO")}
                        </td>
                        <td>{h.hora_entrada?.slice(0, 5) || "-"}</td>
                        <td>{h.hora_salida?.slice(0, 5) || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </TablaEmpleados>
              </TablaWrapper>
            )}
          </CardContent>
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
  z-index: 0;

  &::before {
    content: "";
    position: fixed; /* antes estaba absolute */
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url("/fondo2.jpg");
    background-size: cover;
    background-position: center;
    opacity: 0.05;
    z-index: -1; /* 🔥 mueve la capa al fondo para no bloquear clics */
    pointer-events: none; /* 🔥 desactiva clics sobre el fondo */
  }
`;


const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  position: relative;
  z-index: 1;
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
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CardContent = styled.div`
  margin-top: 10px;
`;

const Avatar = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 10px 0;
  object-fit: cover;
  border: 2px solid #fa6003;
`;

const VerMasButton = styled.button`
  background: linear-gradient(135deg, #fa6003, #ff944d);
  color: #fff;
  border: none;
  padding: 8px 18px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.95rem;
  transition: 0.25s;

  &:hover {
    transform: translateY(-2px) scale(1.05);
  }
`;

const TablaWrapper = styled.div`
  overflow-x: auto;
`;

const TablaEmpleados = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
  font-size: 0.9rem;

  th,
  td {
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    padding: 10px 8px;
    text-align: center;
  }

  th {
    background: linear-gradient(135deg, #fa6003, #ff944d);
    color: white;
    font-weight: 600;
  }

  tr:hover {
    background-color: rgba(250, 96, 3, 0.05);
  }

  @media (max-width: 768px) {
    font-size: 0.85rem;
    th,
    td {
      padding: 8px 4px;
    }
  }
`;

const Estado = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 10px;
  font-weight: 600;
  color: white;
  background-color: ${({ $activo }) => ($activo ? "#06d6a0" : "#e63946")};
`;

const BotonAccion = styled.button`
  background-color: ${({ $activo }) => ($activo ? "#e63946" : "#06d6a0")};
  color: #fff;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: 0.2s;

  &:hover {
    transform: scale(1.05);
    opacity: 0.9;
  }
`;

const FormularioAgregar = styled.div`
  margin-top: 25px;
  text-align: left;

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 10px;
  }

  input {
    width: 100%;
    padding: 10px;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.15);
    outline: none;
    background-color: ${({ theme }) => theme.body};
    color: ${({ theme }) => theme.text};
  }

  input:focus {
    border-color: #fa6003;
    box-shadow: 0 0 4px rgba(250, 96, 3, 0.4);
  }
`;

const BotonAgregar = styled.button`
  width: 100%;
  background: linear-gradient(135deg, #fa6003, #ff944d);
  color: #fff;
  border: none;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: 0.25s;

  &:hover {
    transform: translateY(-2px);
  }
`;
