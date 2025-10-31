// src/components/templates/VentasTemplate.jsx
import styled from "styled-components";
import { useState, useEffect } from "react";
import { supabase } from "../../supabase/supabase.config.jsx";
import Swal from "sweetalert2";

export function VentasTemplate() {
  const [ventas, setVentas] = useState([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [detalles, setDetalles] = useState([]);

  useEffect(() => {
    cargarVentas();
  }, []);

  async function cargarVentas() {
    const { data, error } = await supabase
      .from("ventas")
      .select(`
        id,
        fecha,
        total,
        metodo_pago,
        activo,
        empleado_id,
        usuarios:empleado_id (nombre)
      `)
      .order("fecha", { ascending: false });

    if (error) {
      console.error(error);
      Swal.fire("Error al cargar ventas", error.message, "error");
    } else {
      setVentas(data || []);
    }
  }

  async function verDetalles(venta) {
    setVentaSeleccionada(venta);

    const { data, error } = await supabase
      .from("detalles_venta")
      .select(`
        cantidad,
        precio_unitario,
        productos(nombre),
        ventas:venta_id (
          empleado_id,
          usuarios:empleado_id (nombre)
        )
      `)
      .eq("venta_id", venta.id);

    if (error) {
      console.error(error);
      Swal.fire("Error al cargar detalles", error.message, "error");
    } else {
      setDetalles(data || []);
      mostrarModalDetalles(data);
    }
  }

  function mostrarModalDetalles(data) {
    const detalleHTML = data
      .map(
        (d) => `
        <tr>
          <td>${d.productos?.nombre || "—"}</td>
          <td>${d.cantidad}</td>
          <td>RD$${Number(d.precio_unitario).toFixed(2)}</td>
          <td>RD$${(Number(d.cantidad) * Number(d.precio_unitario)).toFixed(2)}</td>
        </tr>`
      )
      .join("");

    const empleado = data[0]?.ventas?.usuarios?.nombre || "—";

    Swal.fire({
      title: "🧾 Detalles de Venta",
      html: `
        <div style="text-align:left;font-family:'Poppins',sans-serif;color:#fff">
          <p><strong>Empleado:</strong> ${empleado}</p>
          <p><strong>Total:</strong> RD$${ventaSeleccionada.total.toFixed(2)}</p>
          <p><strong>Método de pago:</strong> ${ventaSeleccionada.metodo_pago}</p>
          <hr/>
          <table style="width:100%;border-collapse:collapse;margin-top:10px">
            <thead>
              <tr style="background-color:#2c2c2c;">
                <th style="padding:6px;border-bottom:1px solid #444">Producto</th>
                <th style="padding:6px;border-bottom:1px solid #444">Cant.</th>
                <th style="padding:6px;border-bottom:1px solid #444">Precio</th>
                <th style="padding:6px;border-bottom:1px solid #444">Subtotal</th>
              </tr>
            </thead>
            <tbody>${detalleHTML}</tbody>
          </table>
        </div>
      `,
      background: "#1e1e1e",
      color: "#fff",
      confirmButtonText: "Cerrar",
    });
  }

  return (
    <Container>
      <Header>📊 Ventas Registradas</Header>

      <Tabla>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Empleado</th>
            <th>Total</th>
            <th>Método</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {ventas.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                No hay ventas registradas
              </td>
            </tr>
          ) : (
            ventas.map((v) => (
              <tr key={v.id}>
                <td>{new Date(v.fecha).toLocaleString("es-DO")}</td>
                <td>{v.usuarios?.nombre || "—"}</td>
                <td>RD${v.total?.toFixed(2)}</td>
                <td>{v.metodo_pago}</td>
                <td
                  style={{
                    color: v.activo ? "#00ff99" : "#ff6666",
                    fontWeight: "bold",
                  }}
                >
                  {v.activo ? "Activa" : "Anulada"}
                </td>
                <td>
                  <button onClick={() => verDetalles(v)}>Ver Detalle</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Tabla>
    </Container>
  );
}

/* 🎨 Estilos */
const Container = styled.div`
  padding: 24px;
  background-color: ${({ theme }) => theme.bgtotal};
  color: ${({ theme }) => theme.text};
  min-height: 100vh;
`;

const Header = styled.h2`
  text-align: center;
  margin-bottom: 20px;
  color: ${({ theme }) => theme.color1};
`;

const Tabla = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: ${({ theme }) => theme.bgcards};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);

  th, td {
    padding: 12px;
    border-bottom: 1px solid ${({ theme }) => theme.bg4};
    text-align: center;
  }

  th {
    background-color: ${({ theme }) => theme.bg2};
    color: ${({ theme }) => theme.colortitlecard};
    font-weight: 700;
  }

  button {
    background-color: ${({ theme }) => theme.color1};
    color: #fff;
    border: none;
    padding: 8px 14px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.25s ease;

    &:hover {
      background-color: ${({ theme }) => theme.colorToggle};
      transform: scale(1.05);
    }
  }
`;
