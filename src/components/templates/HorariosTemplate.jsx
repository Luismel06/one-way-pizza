import styled from "styled-components";
import { useEffect, useState } from "react";
import { supabase } from "../../supabase/supabase.config.jsx";
import Swal from "sweetalert2";

export function HorariosTemplate({ esAdmin = false, empleadoCorreo = null }) {
  const [horarios, setHorarios] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [filtroEmpleado, setFiltroEmpleado] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (esAdmin) cargarEmpleados();
    cargarHorarios();
  }, []);

  // 🔹 Cargar empleados (solo para admin)
  async function cargarEmpleados() {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id_usuario, nombre")
      .eq("activo", true)
      .neq("rol", "admin")
      .order("nombre", { ascending: true });
    if (!error) setEmpleados(data);
  }

  // 🔹 Cargar horarios con filtros
  async function cargarHorarios() {
    try {
      setCargando(true);

      let query = supabase
        .from("registro_horarios")
        .select(
          `
          id,
          fecha,
          hora_entrada,
          hora_salida,
          usuario_id,
          usuarios:usuario_id (nombre)
        `
        )
        .order("fecha", { ascending: false });

      // 👷 Si es empleado: solo sus registros
      if (!esAdmin && empleadoCorreo) {
        const { data: user } = await supabase
          .from("usuarios")
          .select("id_usuario")
          .eq("correo", empleadoCorreo)
          .single();

        if (user) {
          query = query.eq("usuario_id", user.id_usuario);
        }
      }

      // 👑 Si es admin y filtró empleado específico
      if (filtroEmpleado && esAdmin) {
        query = query.eq("usuario_id", filtroEmpleado);
      }

      // 📅 Filtros por fecha
      if (fechaInicio) query = query.gte("fecha", fechaInicio);
      if (fechaFin) query = query.lte("fecha", fechaFin);

      const { data, error } = await query;

      if (error) throw error;

      const formateados = data.map((h) => ({
        ...h,
        empleado_nombre: h.usuarios?.nombre || "—",
      }));
      setHorarios(formateados);
    } catch (err) {
      console.error("⚠️ Error cargando horarios:", err.message);
      Swal.fire("Error", "No se pudieron cargar los horarios", "error");
    } finally {
      setCargando(false);
    }
  }

  function limpiarFiltros() {
    setFiltroEmpleado("");
    setFechaInicio("");
    setFechaFin("");
    cargarHorarios();
  }

  return (
    <Container>
      <h2>📅 Registro de Horarios</h2>

      {/* Filtros */}
      <Filtros>
        {esAdmin && (
          <select
            value={filtroEmpleado}
            onChange={(e) => setFiltroEmpleado(e.target.value)}
          >
            <option value="">Todos los empleados</option>
            {empleados.map((e) => (
              <option key={e.id_usuario} value={e.id_usuario}>
                {e.nombre}
              </option>
            ))}
          </select>
        )}

        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
        />
        <input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
        />

        <button onClick={cargarHorarios}>Filtrar</button>
        <button className="limpiar" onClick={limpiarFiltros}>
          Limpiar
        </button>
      </Filtros>

      {/* Tabla */}
      {cargando ? (
        <p>Cargando registros...</p>
      ) : horarios.length === 0 ? (
        <p>No hay registros</p>
      ) : (
        <Tabla>
          <thead>
            <tr>
              {esAdmin && <th>Empleado</th>}
              <th>Fecha</th>
              <th>Entrada</th>
              <th>Salida</th>
            </tr>
          </thead>
          <tbody>
            {horarios.map((h) => (
              <tr key={h.id}>
                {esAdmin && <td>{h.empleado_nombre}</td>}
                <td>{new Date(h.fecha).toLocaleDateString("es-DO")}</td>
                <td>
                  {h.hora_entrada
                    ? new Date(h.hora_entrada).toLocaleTimeString("es-DO", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </td>
                <td>
                  {h.hora_salida
                    ? new Date(h.hora_salida).toLocaleTimeString("es-DO", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      )}
    </Container>
  );
}

/* 🎨 ESTILOS */
const Container = styled.div`
  padding: 25px;
  color: ${({ theme }) => theme.text};
`;

const Filtros = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;

  select,
  input {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.bg4};
    background-color: ${({ theme }) => theme.bgcards};
    color: ${({ theme }) => theme.text};
  }

  button {
    padding: 8px 16px;
    border-radius: 8px;
    border: none;
    font-weight: bold;
    cursor: pointer;
    background-color: ${({ theme }) => theme.color1};
    color: #fff;
    transition: all 0.2s ease;

    &:hover {
      background-color: ${({ theme }) => theme.colorToggle};
      transform: scale(1.05);
    }

    &.limpiar {
      background-color: #555;
      &:hover {
        background-color: #777;
      }
    }
  }
`;

const Tabla = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: center;

  th,
  td {
    border: 1px solid ${({ theme }) => theme.bg4};
    padding: 8px;
  }

  th {
    background-color: ${({ theme }) => theme.color1};
    color: white;
  }
`;
