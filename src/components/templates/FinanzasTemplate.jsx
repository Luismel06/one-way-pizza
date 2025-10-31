// src/components/templates/FinanzasTemplate.jsx
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { supabase } from "../../supabase/supabase.config.jsx";
import { useNavigate } from "react-router-dom";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

// ===== Utilidades =====
const fmtMoney = (n) =>
  `RD$ ${Number(n || 0).toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const MESES_CORTOS = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

const finDelDiaISO = (d) => {
  const x = new Date(d);
  x.setHours(23,59,59,999);
  return x.toISOString();
};

// Rangos rápidos
function getRangeByKey(key) {
  const end = new Date();
  const start = new Date();
  switch (key) {
    case "hoy":
      start.setHours(0,0,0,0);
      return { start, end };
    case "7d":
      start.setDate(end.getDate() - 6);
      start.setHours(0,0,0,0);
      return { start, end };
    case "30d":
      start.setDate(end.getDate() - 29);
      start.setHours(0,0,0,0);
      return { start, end };
    case "12m":
      start.setMonth(end.getMonth() - 11);
      start.setDate(1);
      start.setHours(0,0,0,0);
      return { start, end };
    case "todo":
      return { start: null, end: null };
    default:
      return { start: null, end: null };
  }
}

export function FinanzasTemplate() {
  // Filtros
  const [periodKey, setPeriodKey] = useState("30d");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  // KPIs
  const [ventasTotales, setVentasTotales] = useState(0);
  const [unidadesVendidas, setUnidadesVendidas] = useState(0);
  const [ganancias, setGanancias] = useState(0);
  const [totalCaja, setTotalCaja] = useState(0);

  // Gráfico mensual
  const [graficoMeses, setGraficoMeses] = useState([]);

  // TOPs
  const [topCantidad, setTopCantidad] = useState([]);
  const [topMonto, setTopMonto] = useState([]);

  // Movimientos de caja
  const MOV_PAGE = 10;
  const [movimientos, setMovimientos] = useState([]);
  const [movOffset, setMovOffset] = useState(0);
  const [movHasMore, setMovHasMore] = useState(true);

  // === Resolución de rango activo ===
  const { startISO, endISO } = useMemo(() => {
    if (periodKey !== "custom") {
      const { start, end } = getRangeByKey(periodKey);
      return {
        startISO: start ? start.toISOString() : null,
        endISO: end ? end.toISOString() : null,
      };
    }
    if (desde && hasta) {
      return {
        startISO: new Date(desde + "T00:00:00").toISOString(),
        endISO: finDelDiaISO(hasta),
      };
    }
    return { startISO: null, endISO: null };
  }, [periodKey, desde, hasta]);

  // === Carga inicial y recargas por filtro ===
  useEffect(() => {
    cargarTodo();
    cargarMovimientos(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startISO, endISO]);

  const setQuick = (key) => {
    setPeriodKey(key);
    setDesde(""); setHasta("");
  };

  // === Carga global
  async function cargarTodo() {
    await Promise.all([
      cargarVentasYGrafico(),
      cargarTopProductos(),
      cargarCajaActual(),
    ]);
  }

  // Ventas totales + unidades + gráfico por mes
  async function cargarVentasYGrafico() {
    // Ventas (total y por mes)
    let q = supabase.from("ventas").select("id,total,fecha");
    if (startISO) q = q.gte("fecha", startISO);
    if (endISO) q = q.lte("fecha", endISO);

    const { data: ventas, error: eVentas } = await q;
    if (eVentas || !ventas) {
      setVentasTotales(0);
      setGanancias(0);
      setGraficoMeses([]);
    } else {
      const total = ventas.reduce((acc, v) => acc + Number(v.total || 0), 0);
      setVentasTotales(total);
      setGanancias(total * 0.1);

      const porMes = {};
      ventas.forEach((v) => {
        const d = v.fecha ? new Date(v.fecha) : null;
        if (!d) return;
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
        porMes[key] = (porMes[key] || 0) + Number(v.total || 0);
      });
      const dataMeses = Object.entries(porMes)
        .sort(([a],[b]) => (a > b ? 1 : -1))
        .map(([ym, total]) => {
          const monthIdx = Number(ym.split("-")[1]) - 1;
          return { mes: MESES_CORTOS[monthIdx], total: Number(total.toFixed(2)) };
        });
      setGraficoMeses(dataMeses);
    }

    // Unidades vendidas (detalles_venta filtradas por ventas del rango)
    let qIds = supabase.from("ventas").select("id");
    if (startISO) qIds = qIds.gte("fecha", startISO);
    if (endISO) qIds = qIds.lte("fecha", endISO);
    const { data: ventasIds, error: eIds } = await qIds;

    if (eIds || !ventasIds || ventasIds.length === 0) {
      setUnidadesVendidas(0);
    } else {
      const ids = ventasIds.map((v) => v.id);
      const { data: dets, error: eDets } = await supabase
        .from("detalles_venta")
        .select("cantidad")
        .in("venta_id", ids);
      if (eDets || !dets) setUnidadesVendidas(0);
      else {
        const unidades = dets.reduce(
          (acc, d) => acc + Number(d.cantidad || 0),
          0
        );
        setUnidadesVendidas(unidades);
      }
    }
  }

  // Top 5 cantidad y Top 10 monto
  async function cargarTopProductos() {
    // Ventas dentro del rango
    let q = supabase.from("ventas").select("id");
    if (startISO) q = q.gte("fecha", startISO);
    if (endISO) q = q.lte("fecha", endISO);
    const { data: ventasFiltradas, error: eV } = await q;
    if (eV || !ventasFiltradas || ventasFiltradas.length === 0) {
      setTopCantidad([]);
      setTopMonto([]);
      return;
    }
    const ids = ventasFiltradas.map((v) => v.id);

    // Detalles de esas ventas
    const { data: dets, error: eD } = await supabase
      .from("detalles_venta")
      .select("producto_id, cantidad, precio_unitario") // <- columna correcta
      .in("venta_id", ids);
    if (eD || !dets || dets.length === 0) {
      setTopCantidad([]);
      setTopMonto([]);
      return;
    }

    // Agregar por producto
    const acc = new Map(); // producto_id -> { unidades, monto }
    dets.forEach((d) => {
      const id = d.producto_id;
      if (!id) return;
      const prev = acc.get(id) || { unidades: 0, monto: 0 };
      prev.unidades += Number(d.cantidad || 0);
      prev.monto += Number(d.cantidad || 0) * Number(d.precio_unitario || 0);
      acc.set(id, prev);
    });

    const prodIds = Array.from(acc.keys());
    const { data: prods } = await supabase
      .from("productos")
      .select("id_productos, nombre")
      .in("id_productos", prodIds);
    const nameById = new Map((prods || []).map((p) => [p.id_productos, p.nombre]));

    const rows = prodIds.map((id) => ({
      id,
      nombre: nameById.get(id) || "Producto",
      unidades: acc.get(id).unidades,
      monto: acc.get(id).monto,
    }));

    const top5 = [...rows]
      .sort((a, b) => b.unidades - a.unidades)
      .slice(0, 5)
      .map((r) => ({ nombre: r.nombre, unidades: r.unidades }));

    const top10 = [...rows]
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 10)
      .map((r) => ({ nombre: r.nombre, monto: r.monto }));

    setTopCantidad(top5);
    setTopMonto(top10);
  }

  // Total en caja (caja abierta o última)
  async function cargarCajaActual() {
    const { data: abierta } = await supabase
      .from("caja")
      .select("total_final, abierta, hora_apertura")
      .eq("abierta", true)
      .order("hora_apertura", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (abierta) {
      setTotalCaja(Number(abierta.total_final || 0));
      return;
    }
    const { data: ultima } = await supabase
      .from("caja")
      .select("total_final, hora_apertura")
      .order("hora_apertura", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (ultima) setTotalCaja(Number(ultima.total_final || 0));
  }

  // Movimientos de caja (SOLO de la tabla movimientos_caja) + paginación
  // Movimientos de caja (SOLO de la tabla movimientos_caja) + paginación
// Movimientos de caja (desde la vista con nombre y correo del empleado)
async function cargarMovimientos(offset = 0, reset = false) {
  try {
    let q = supabase
      .from("vista_movimientos_caja")
      .select("fecha, tipo, monto, motivo, empleado_nombre, empleado_correo")
      .order("fecha", { ascending: false })
      .range(offset, offset + MOV_PAGE - 1);

    if (startISO) q = q.gte("fecha", startISO);
    if (endISO) q = q.lte("fecha", endISO);

    const { data, error } = await q;
    if (error || !data) throw error;

    const rows = data.map((m) => ({
      fecha: m.fecha ? new Date(m.fecha).toLocaleString("es-DO") : "-",
      tipo: m.tipo,
      usuario: m.empleado_nombre || "—",
      correo: m.empleado_correo || "",
      motivo: m.motivo || "—",
      monto: Number(m.monto || 0),
    }));

    if (reset) setMovimientos(rows);
    else setMovimientos((prev) => [...prev, ...rows]);

    setMovHasMore(data.length === MOV_PAGE);
    setMovOffset(offset + data.length);
  } catch (err) {
    console.error("Error cargando movimientos:", err.message);
    if (reset) {
      setMovimientos([]);
      setMovHasMore(false);
      setMovOffset(0);
    }
  }
}



  const gananciasFmt = useMemo(() => fmtMoney(ganancias), [ganancias]);
  const navigate = useNavigate();

  // ====== UI ======
  return (
    <Wrap>
      <Header>
        <Title>Dashboard <span>/ finanzas</span></Title>
      </Header>

      <NavBtns>
        <button onClick={() => navigate("/admin/detalles-ventas")}>
          Ver detalles de ventas →
        </button>
      </NavBtns>

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
              }}
            />
          </label>
        </div>
      </Filters>

      {/* KPIs */}
      <Cards>
        <Card>
          <h4>Ventas Totales</h4>
          <p>{fmtMoney(ventasTotales)}</p>
        </Card>
        <Card>
          <h4>Cant. Productos vendidos</h4>
          <p>{unidadesVendidas}</p>
        </Card>
        <Card>
          <h4>Ganancias (10%)</h4>
          <p>{gananciasFmt}</p>
        </Card>
        <Card>
          <h4>Total en Caja</h4>
          <p>{fmtMoney(totalCaja)}</p>
        </Card>
      </Cards>

      {/* Gráfico mensual */}
      <Panel>
        <PanelTitle>Resumen de ventas por mes</PanelTitle>
        <ChartBox>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={graficoMeses} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" />
              <XAxis dataKey="mes" stroke="#bdbdbd" />
              <YAxis stroke="#bdbdbd" />
              <Tooltip
                formatter={(v) => fmtMoney(v)}
                contentStyle={{
                  backgroundColor: "#1f1f1f",
                  border: "1px solid #333",
                  color: "#fff",
                }}
              />
              <defs>
                <linearGradient id="bars" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1cb0f6" />
                  <stop offset="100%" stopColor="#5e60ce" />
                </linearGradient>
              </defs>
              <Bar dataKey="total" fill="url(#bars)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </Panel>

      {/* TOPS */}
      <TopsGrid>
        <Panel>
          <PanelTitle>TOP 5 — productos por cantidad</PanelTitle>
          {topCantidad.length === 0 ? (
            <Empty>sin datos…</Empty>
          ) : (
            <List>
              {topCantidad.map((t, i) => (
                <li key={i}>
                  <span>{i + 1}.</span> <strong>{t.nombre}</strong>
                  <em>{t.unidades} uds</em>
                </li>
              ))}
            </List>
          )}
        </Panel>

        <Panel>
          <PanelTitle>TOP 10 — productos por monto</PanelTitle>
          {topMonto.length === 0 ? (
            <Empty>sin datos…</Empty>
          ) : (
            <List>
              {topMonto.map((t, i) => (
                <li key={i}>
                  <span>{i + 1}.</span> <strong>{t.nombre}</strong>
                  <em>{fmtMoney(t.monto)}</em>
                </li>
              ))}
            </List>
          )}
        </Panel>
      </TopsGrid>

      {/* MOVIMIENTOS DE CAJA */}
      <Panel>
        <PanelTitle>Movimientos de caja</PanelTitle>
        {movimientos.length === 0 ? (
          <Empty>sin movimientos…</Empty>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Usuario</th>
                  <th>Motivo</th>
                  <th style={{ textAlign: "right" }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m, idx) => (
                  <tr key={idx}>
                    <td>{m.fecha}</td>
                    <td className={`tipo ${m.tipo}`}>{m.tipo}</td>
                    <td title={m.correo}>{m.usuario}</td>
                    <td>{m.motivo}</td>
                    <td style={{ textAlign: "right" }}>{fmtMoney(m.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {movHasMore && (
              <MoreBtn onClick={() => cargarMovimientos(movOffset, false)}>
                Mostrar más
              </MoreBtn>
            )}
          </>
        )}
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
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
`;

const Title = styled.h1`
  font-size: 2.1rem;
  margin: 0;
  color: ${({ theme }) => theme.color1};
  span {
    font-size: .65em;
    color: ${({ theme }) => theme.colorSubtitle}; margin-left: 6px; }
`;

const Filters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin: 8px 0 16px;

  .quick {
    display: flex; flex-wrap: wrap; gap: 8px;
  }

  .quick button {
    background: ${({ theme }) => theme.bg3};
    color: ${({ theme }) => theme.text};
    border: 1px solid ${({ theme }) => theme.bg4};
    padding: 8px 14px;
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
    display: flex; gap: 10px; align-items: center;
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
`;

const Cards = styled.div`
  display: grid; gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  margin-bottom: 18px;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.bgcards};
  border-radius: 16px; padding: 18px 20px;
  box-shadow: 0 6px 18px rgba(0,0,0,.28);
  h4{ margin:0 0 8px; color: ${({ theme }) => theme.colortitlecard}; font-weight:600; }
  p{ margin:0; font-size:1.35rem; font-weight:800; color: ${({ theme }) => theme.color1}; }
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

const ChartBox = styled.div`
  width: 100%;
`;

const TopsGrid = styled.div`
  display: grid; gap: 18px;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  margin-bottom: 18px;
`;

const List = styled.ul`
  list-style: none; margin: 0; padding: 0;
  li{
    display: grid; grid-template-columns: 32px 1fr auto;
    align-items: center; gap: 10px;
    padding: 10px 8px; border-bottom: 1px solid ${({ theme }) => theme.bg4};
  }
  li:last-child{ border-bottom: none; }
  span{ color: ${({ theme }) => theme.colorSubtitle}; }
  strong{ color: ${({ theme }) => theme.colorsubtitlecard}; }
  em{ color: ${({ theme }) => theme.color1}; font-style: normal; font-weight: 700; }
`;

const Empty = styled.div`
  padding: 20px 6px; color: ${({ theme }) => theme.colorSubtitle};
`;

const Table = styled.table`
  width: 100%; border-collapse: collapse;
  thead th{
    text-align: left; padding: 10px 8px;
    color: ${({ theme }) => theme.colortitlecard};
    border-bottom: 1px solid ${({ theme }) => theme.bg4};
  }
  tbody td{
    padding: 10px 8px;
    border-bottom: 1px solid ${({ theme }) => theme.bg4};
    color: ${({ theme }) => theme.colorsubtitlecard};
  }
  .tipo.apertura{ color:#1cb0f6; font-weight:700; }
  .tipo.ingreso{ color:#22c55e; font-weight:700; }
  .tipo.retiro{ color:#ef4444; font-weight:700; }
  .tipo.cierre{ color:#f59e0b; font-weight:700; }
  .tipo.venta{ color:#00bfff; font-weight:700; }
`;

const MoreBtn = styled.button`
  margin-top: 12px; padding: 10px 16px;
  border-radius: 10px; border: none; cursor: pointer;
  background: ${({ theme }) => theme.color1}; color: #fff; font-weight: 700;
  &:hover{ filter: brightness(1.05); transform: translateY(-1px); }
`;

const NavBtns = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;

  button {
    background: ${({ theme }) => theme.color1};
    color: #fff;
    border: none;
    padding: 10px 16px;
    border-radius: 10px;
    font-weight: 700;
    cursor: pointer;
    transition: 0.25s;
  }

  button:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }
`;
