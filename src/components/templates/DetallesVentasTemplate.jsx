// src/components/templates/DetallesVentasTemplate.jsx
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { supabase } from "../../supabase/supabase.config.jsx";

// ===== Utilidades =====
const PAGE_SIZE = 20;

const fmtMoney = (n) =>
  `RD$ ${Number(n || 0).toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const finDelDiaISO = (yyyy_mm_dd) => {
  const d = new Date(yyyy_mm_dd);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
};

function getQuickRange(key) {
  const end = new Date();
  const start = new Date();
  switch (key) {
    case "hoy":
      start.setHours(0, 0, 0, 0);
      break;
    case "7d":
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case "30d":
      start.setDate(end.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      break;
    case "12m":
      start.setMonth(end.getMonth() - 11);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "todo":
    default:
      return { startISO: null, endISO: null };
  }
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

export function DetallesVentasTemplate() {
  // -------- Filtros ----------
  const [periodKey, setPeriodKey] = useState("30d"); // hoy | 7d | 30d | 12m | todo | custom
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [empleadoId, setEmpleadoId] = useState("");
  const [buscarProducto, setBuscarProducto] = useState("");
  const [soloActivas, setSoloActivas] = useState(true);

  // -------- Datos ----------
  const [productos, setProductos] = useState([]); // cache para mapear nombre
  const [rows, setRows] = useState([]);           // filas enriquecidas
  const [totalRows, setTotalRows] = useState(0);

  // -------- Paginación ----------
  const [page, setPage] = useState(1);
  const maxPage = useMemo(
    () => Math.max(1, Math.ceil(totalRows / PAGE_SIZE)),
    [totalRows]
  );

  // ======= Resuelve rango activo a ISO =======
  const { startISO, endISO } = useMemo(() => {
    if (periodKey !== "custom") return getQuickRange(periodKey);
    if (desde && hasta) {
      return {
        startISO: new Date(desde + "T00:00:00").toISOString(),
        endISO: finDelDiaISO(hasta),
      };
    }
    return { startISO: null, endISO: null };
  }, [periodKey, desde, hasta]);

  // ======= Carga inicial: productos (para nombres) =======
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("productos")
        .select("id_productos, nombre");
      if (!error && data) setProductos(data);
    })();
  }, []);

  // ======= Cargar datos cuando cambian filtros/página =======
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startISO, endISO, empleadoId, buscarProducto, soloActivas, page]);

  // ======= Handler quick filters =======
  const setQuick = (key) => {
    setPeriodKey(key);
    setDesde("");
    setHasta("");
    setPage(1);
  };

  // ======= Core: cargar datos según filtros =======
  async function cargar() {
    // 1) Buscar ventas en rango/empleado/activas
    let ventasQ = supabase
      .from("ventas")
      .select("id, fecha, empleado_id, metodo_pago, activo");

    if (startISO) ventasQ = ventasQ.gte("fecha", startISO);
    if (endISO) ventasQ = ventasQ.lte("fecha", endISO);
    if (soloActivas) ventasQ = ventasQ.eq("activo", true);
    if (empleadoId.trim()) ventasQ = ventasQ.eq("empleado_id", empleadoId.trim());

    const { data: ventasData, error: eVentas } = await ventasQ;
    if (eVentas || !ventasData || ventasData.length === 0) {
      setRows([]);
      setTotalRows(0);
      return;
    }
    const ventasMap = new Map(ventasData.map(v => [v.id, v]));
    const ventasIds = ventasData.map(v => v.id);

    // 2) Si hay filtro por nombre de producto, obtengo ids de productos que matchean
    let productoIdsFilter = null;
    if (buscarProducto.trim()) {
      const term = buscarProducto.trim().toLowerCase();
      const coincidencias = productos
        .filter(p => (p.nombre || "").toLowerCase().includes(term))
        .map(p => p.id_productos);
      productoIdsFilter = coincidencias.length > 0 ? coincidencias : ["__NO_MATCH__"]; // Forzar vacío si no hay match
    }

    // 3) Consultar detalles_venta filtrando por ventas (y por producto si aplica) + paginación + count
let detQ = supabase
  .from("detalles_venta")
  .select(
    `
    id,
    venta_id,
    producto_id,
    cantidad,
    precio_unitario,
    subtotal
    `,
    { count: "exact" }
  )
  .in("venta_id", ventasIds);

if (productoIdsFilter) detQ = detQ.in("producto_id", productoIdsFilter);

// Orden local luego por fecha de la venta; aquí traemos un rango por página
const from = (page - 1) * PAGE_SIZE;
const to = from + PAGE_SIZE - 1;
detQ = detQ.range(from, to);

const { data: dets, error: eDets, count } = await detQ;
if (eDets || !dets) {
  console.error("Error cargando detalles_venta:", eDets);
  setRows([]);
  setTotalRows(0);
  return;
}

setTotalRows(count || 0);


    // 4) Para mostrar el nombre del empleado, buscamos los usuarios involucrados
    const empleadoIds = Array.from(
      new Set(
        dets
          .map((d) => ventasMap.get(d.venta_id))
          .filter(Boolean)
          .map((v) => v.empleado_id)
          .filter(Boolean)
      )
    );
    let usuariosMap = new Map();
    if (empleadoIds.length > 0) {
      const { data: usuarios, error: eUsers } = await supabase
        .from("usuarios")
        .select("id_usuario, nombre")
        .in("id_usuario", empleadoIds);
      if (!eUsers && usuarios) {
        usuariosMap = new Map(usuarios.map((u) => [u.id_usuario, u.nombre]));
      }
    }

    // 5) Mapear producto_id->nombre
    const prodNameMap = new Map(productos.map(p => [p.id_productos, p.nombre]));


    // 6) Enriquecer filas con datos de venta, usuario y producto
    const enriched = dets
      .map((d) => {
        const v = ventasMap.get(d.venta_id);
        if (!v) return null;
        const fecha = v.fecha ? new Date(v.fecha) : null;
        return {
          id: d.id,
          fecha,
          venta_id: d.venta_id,
          producto: prodNameMap.get(d.producto_id) || "Producto",
          cantidad: Number(d.cantidad || 0),
          precio_unitario: Number(d.precio_unitario || 0),
          subtotal: Number(d.subtotal || 0),
          empleado: usuariosMap.get(v.empleado_id) || v.empleado_id || "—",
          metodo_pago: v.metodo_pago || "—",
          activa: v.activo === true,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b.fecha?.getTime() || 0) - (a.fecha?.getTime() || 0));

    setRows(enriched);
  }
    // ======= Exportar CSV =======
    function exportarCSV() {
  if (rows.length === 0) return;

  const headers = ["Fecha", "Producto", "Cantidad", "Precio Unitario", "Subtotal", "Empleado", "Método", "Activa"];
  const csvRows = [
    headers.join(","),
    ...rows.map(r =>
      [
        r.fecha ? r.fecha.toLocaleString("es-DO") : "-",
        `"${r.producto}"`,
        r.cantidad,
        r.precio_unitario,
        r.subtotal,
        `"${r.empleado}"`,
        r.metodo_pago,
        r.activa ? "Sí" : "No"
      ].join(",")
    )
  ];

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `detalles_ventas_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
  return (
    <Wrap>
      <Header>
        <Title>Detalles de ventas</Title>
        <Sub>Consulta y filtra los ítems vendidos</Sub>
      </Header>

      {/* Filtros */}
      <Filters>
        <div className="quick">
          {[
            { key: "todo", label: "Todo" },
            { key: "hoy", label: "Hoy" },
            { key: "7d", label: "7 días" },
            { key: "30d", label: "30 días" },
            { key: "12m", label: "12 meses" },
          ].map((f) => (
            <button
              key={f.key}
              className={periodKey === f.key ? "active" : ""}
              onClick={() => setQuick(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="range">
          <label>
            Desde
            <input
              type="date"
              value={desde}
              onChange={(e) => {
                setDesde(e.target.value);
                setPeriodKey("custom");
                setPage(1);
              }}
            />
          </label>
          <label>
            Hasta
            <input
              type="date"
              value={hasta}
              onChange={(e) => {
                setHasta(e.target.value);
                setPeriodKey("custom");
                setPage(1);
              }}
            />
          </label>
        </div>

        <div className="more">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={buscarProducto}
            onChange={(e) => {
              setBuscarProducto(e.target.value);
              setPage(1);
            }}
          />
          <input
            type="text"
            placeholder="Empleado (id_usuario)"
            value={empleadoId}
            onChange={(e) => {
              setEmpleadoId(e.target.value);
              setPage(1);
            }}
          />
          <label className="check">
            <input
              type="checkbox"
              checked={soloActivas}
              onChange={(e) => {
                setSoloActivas(e.target.checked);
                setPage(1);
              }}
            />
            Solo ventas activas
          </label>
        </div>
      </Filters>

      {/* Tabla */}
      <Panel>
        <PanelTitle>Resultados</PanelTitle>
        <ExportBtn onClick={exportarCSV}>Exportar CSV</ExportBtn>
        {rows.length === 0 ? (
          <Empty>Sin resultados para el filtro seleccionado…</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <th style={{ minWidth: 140 }}>Fecha</th>
                <th>Producto</th>
                <th style={{ textAlign: "right" }}>Cant.</th>
                <th style={{ textAlign: "right" }}>Precio U.</th>
                <th style={{ textAlign: "right" }}>Subtotal</th>
                <th>Empleado</th>
                <th>Método</th>
                <th>Activa</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.fecha ? r.fecha.toLocaleString("es-DO") : "—"}</td>
                  <td>{r.producto}</td>
                  <td style={{ textAlign: "right" }}>{r.cantidad}</td>
                  <td style={{ textAlign: "right" }}>{fmtMoney(r.precio_unitario)}</td>
                  <td style={{ textAlign: "right" }}>{fmtMoney(r.subtotal)}</td>
                  <td>{r.empleado}</td>
                  <td>{r.metodo_pago}</td>
                  <td>{r.activa ? "Sí" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {/* Paginación */}
        <Pager>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Anterior
          </button>
          <span>
            Página <strong>{page}</strong> de <strong>{maxPage}</strong> —{" "}
            <em>{totalRows}</em> ítems
          </span>
          <button
            disabled={page >= maxPage}
            onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
          >
            Siguiente →
          </button>
        </Pager>
      </Panel>
    </Wrap>
  );
}

/* ===== Estilos (oscuro, usando tu theme) ===== */
const Wrap = styled.div`
  padding: 24px;
  background: ${({ theme }) => theme.bgtotal};
  min-height: 100vh;
  color: ${({ theme }) => theme.text};
`;

const Header = styled.div`
  margin-bottom: 10px;
  text-align: center;
`;
const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.color1};
  font-size: 2rem;
  font-weight: 800;
`;
const Sub = styled.p`
  margin: 6px 0 0;
  color: ${({ theme }) => theme.colorSubtitle};
`;

const Filters = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1.2fr;
  gap: 12px;
  align-items: center;
  margin: 12px 0 16px;

  .quick {
    display: flex; flex-wrap: wrap; gap: 8px;
  }
  .quick button {
    background: ${({ theme }) => theme.bg3};
    color: ${({ theme }) => theme.text};
    border: 1px solid ${({ theme }) => theme.bg4};
    padding: 8px 12px;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
    transition: 0.2s;
  }
  .quick button.active {
    background: ${({ theme }) => theme.color1};
    color: #fff;
    border-color: transparent;
  }

  .range {
    display: flex; gap: 10px; align-items: center; justify-content: center;
  }
  .range label {
    display: flex; gap: 8px; align-items: center;
    color: ${({ theme }) => theme.colorsubtitlecard};
    font-size: .95rem;
  }
  .range input {
    background: ${({ theme }) => theme.bg3};
    color: ${({ theme }) => theme.text};
    border: 1px solid ${({ theme }) => theme.bg4};
    padding: 6px 10px; border-radius: 8px;
    outline: none;
  }

  .more {
    display: flex; gap: 10px; align-items: center; justify-content: flex-end;
  }
  .more input[type="text"]{
    background: ${({ theme }) => theme.bg3};
    color: ${({ theme }) => theme.text};
    border: 1px solid ${({ theme }) => theme.bg4};
    padding: 8px 10px; border-radius: 8px;
    outline: none;
  }
  .more .check {
    display: flex; align-items: center; gap: 8px;
    color: ${({ theme }) => theme.colorsubtitlecard};
  }

  @media (max-width: 1024px){
    grid-template-columns: 1fr;
    .more{ justify-content: flex-start; flex-wrap: wrap; }
  }
`;

const Panel = styled.div`
  background: ${({ theme }) => theme.bgcards};
  border-radius: 16px; padding: 18px 20px;
  box-shadow: 0 6px 18px rgba(0,0,0,.28);
  margin-bottom: 18px;
`;

const PanelTitle = styled.h3`
  margin: 0 0 12px;
  color: ${({ theme }) => theme.colortitlecard};
  font-weight: 700;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  thead th{
    text-align: left; padding: 10px 8px;
    color: ${({ theme }) => theme.colortitlecard};
    border-bottom: 1px solid ${({ theme }) => theme.bg4};
    white-space: nowrap;
  }
  tbody td{
    padding: 10px 8px;
    border-bottom: 1px solid ${({ theme }) => theme.bg4};
    color: ${({ theme }) => theme.colorsubtitlecard};
    vertical-align: top;
  }
`;

const Empty = styled.div`
  padding: 18px 6px; color: ${({ theme }) => theme.colorSubtitle};
`;

const Pager = styled.div`
  margin-top: 12px;
  display: flex; gap: 12px; align-items: center; justify-content: space-between;

  button{
    background: ${({ theme }) => theme.color1};
    color: #fff;
    border: none; padding: 9px 14px;
    border-radius: 10px; cursor: pointer; font-weight: 700;
    transition: .2s;
  }
  button:disabled{ opacity: .5; cursor: not-allowed; }
  span{ color: ${({ theme }) => theme.colorsubtitlecard}; }
`;
const ExportBtn = styled.button`
  background: ${({ theme }) => theme.bg3};
  color: ${({ theme }) => theme.text};
  border: 1px solid ${({ theme }) => theme.bg4};
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 10px;
  font-weight: 600;
  transition: 0.25s;

  &:hover {
    background: ${({ theme }) => theme.color1};
    color: #fff;
    border-color: transparent;
  }
`;
