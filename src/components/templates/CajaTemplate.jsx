// src/components/templates/CajaTemplate.jsx
import styled from "styled-components";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { supabase } from "../../supabase/supabase.config.jsx";
import { mostrarProductos } from "../../supabase/crudProductos";
import { mostrarCategorias } from "../../supabase/crudCategorias";
import { insertVenta } from "../../supabase/crudVentas";
import { insertDetalleVenta } from "../../supabase/crudDetallesVentas";
//import { PreviewFactura } from "../../utils/previewFactura.jsx";
//import { imprimirFactura } from "../../utils/imprimirFactura";


const STORAGE_URL =
  "https://coyghdbczlwnvfjvrdao.supabase.co/storage/v1/object/public/productos";

/* =================== CONSTANTES =================== */
const LOG_VENTA_EN_MOVIMIENTOS = true; // ← en true SOLO si tu trigger NO genera movimiento de venta

/* =================== utils =================== */
function formatearNombre(nombre) {
  return nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").trim();
}
function getCarpetaCategoria(nombreCat) {
  const n = nombreCat?.toLowerCase() || "";
  if (n.includes("suprema")) return "Pizzas Supremas";
  if (n.includes("pizza")) return "Pizzas";
  if (n.includes("hamburg")) return "Hamburguesas";
  if (n.includes("papa")) return "Papas";
  if (n.includes("bebida")) return "Bebidas";
  return "Pizzas";
}

/* ===========================================================
   COMPONENTE
=========================================================== */
export function CajaTemplate() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [montoRecibido, setMontoRecibido] = useState("");
  const [devuelta, setDevuelta] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [tamanosSeleccionados, setTamanosSeleccionados] = useState({});
  const [mostrarCarrito, setMostrarCarrito] = useState(false);

  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [verificandoCaja, setVerificandoCaja] = useState(true);

  // Flags anti-duplicado
  const [procesandoApertura, setProcesandoApertura] = useState(false);
  const [procesandoIngreso, setProcesandoIngreso] = useState(false);
  const [procesandoRetiro, setProcesandoRetiro] = useState(false);
  const [procesandoVenta, setProcesandoVenta] = useState(false);
  const [procesandoCierre, setProcesandoCierre] = useState(false);
  const [empleado, setEmpleado] = useState(null);
  const [mostrarFactura, setMostrarFactura] = useState(false);
  const [datosFactura, setDatosFactura] = useState(null);

  /* =================== Session + preload =================== */
  useEffect(() => {
    async function obtenerEmpleado() {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session?.user) {
        window.location.href = "/login";
        return;
      }

      const correo = session.user.email;
      const { data: info, error: errUsuario } = await supabase
        .from("usuarios")
        .select("*")
        .eq("correo", correo)
        .maybeSingle();

      if (errUsuario || !info || !info.activo) {
        Swal.fire("Error", "Tu cuenta no está activa o no existe", "error");
        await supabase.auth.signOut();
        window.location.href = "/login";
        return;
      }

      setEmpleado(info);
      await verificarCajaInicial();
    }
    obtenerEmpleado();
  }, []);

  async function getCajaActiva() {
    const { data, error } = await supabase
      .from("caja")
      .select("*")
      .eq("abierta", true)
      .order("hora_apertura", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("getCajaActiva error:", error);
      return null;
    }
    return data || null;
  }

  async function verificarCajaInicial() {
  setVerificandoCaja(true);

  // 🧩 Calcula la fecha hace 24 horas en formato ISO
  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // 🔧 Cierra automáticamente cajas abiertas hace más de 1 día
  const { error: errCerrar } = await supabase
    .from("caja")
    .update({ abierta: false, hora_cierre: new Date().toISOString() })
    .lte("hora_apertura", hace24h) // ✅ ahora formato ISO correcto
    .eq("abierta", true);

  if (errCerrar) console.error("Error cerrando cajas antiguas:", errCerrar);

  // 🔍 Verifica si hay una caja abierta
  const caja = await getCajaActiva();
  if (caja) {
    setCajaAbierta(true);
    await cargarDatos();
  } else {
    setCajaAbierta(false);
  }

  setVerificandoCaja(false);
}


  async function cargarDatos() {
    const [prod, cats] = await Promise.all([
      mostrarProductos({ activo: true }),
      mostrarCategorias(),
    ]);
    setProductos(prod || []);
    setCategorias(cats || []);
  }

  /* =================== Apertura =================== */
  async function abrirCajaHandler() {
    if (procesandoApertura) return;
    setProcesandoApertura(true);
    try {
      const { value: monto } = await Swal.fire({
        title: "Monto inicial",
        input: "number",
        inputLabel: "Ingrese el fondo inicial de caja",
        inputAttributes: { min: 0, step: "0.01" },
        showCancelButton: true,
        confirmButtonText: "Aperturar",
      });
      if (monto === undefined) return;

      const ya = await getCajaActiva();
      if (ya) {
        await Swal.fire("Caja ya abierta", "", "info");
        setCajaAbierta(true);
        return;
      }

      const { error } = await supabase.from("caja").insert([
        {
          empleado_id_apertura: empleado?.id_usuario,
          fondo_inicial: parseFloat(monto),
          ingresos_varios: 0,
          gastos_varios: 0,
          ventas_efectivo: 0,
          ventas_totales: 0,
          total_final: parseFloat(monto),
          abierta: true,
          hora_apertura: new Date().toISOString(),
        },
      ]);
      if (error) throw error;

      setCajaAbierta(true);
      await cargarDatos();
      await Swal.fire("Caja abierta ✅", "", "success");
    } catch (e) {
      console.error(e);
      await Swal.fire("Error", e.message || "Error al aperturar", "error");
    } finally {
      setProcesandoApertura(false);
    }
  }

/* =================== Ingreso =================== */
async function ingresarDineroHandler() {
  if (procesandoIngreso) return;
  setProcesandoIngreso(true);
  try {
    const { value: formValues } = await Swal.fire({
      title: "Ingreso de dinero",
      html: `
        <div style="display:flex;flex-direction:column;gap:10px;text-align:left">
          <label><strong>Monto</strong></label>
          <input id="swal-monto" type="number" step="0.01" min="0" class="swal2-input" placeholder="0.00" />
          <label><strong>Motivo</strong></label>
          <textarea id="swal-motivo" class="swal2-textarea" placeholder="Descripción del ingreso (opcional)"></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      preConfirm: () => {
        const monto = parseFloat(document.getElementById("swal-monto").value);
        const motivo = document.getElementById("swal-motivo").value.trim();
        if (isNaN(monto) || monto <= 0) {
          Swal.showValidationMessage("Monto inválido");
          return false;
        }
        return { monto, motivo };
      },
    });

    if (!formValues) return;

    const caja = await getCajaActiva();
    if (!caja) return Swal.fire("Sin caja abierta", "", "warning");

    // 🧠 Llamamos la función RPC con el empleado_id
    const { error } = await supabase.rpc("incrementar_ingresos", {
      caja_id_param: caja.id,
      monto_param: formValues.monto,
      motivo_param: formValues.motivo || "Ingreso manual",
      empleado_id_param: empleado?.id_usuario,
    });

    if (error) throw error;

    await Swal.fire("Ingreso registrado ✅", "Se guardó correctamente", "success");
  } catch (e) {
    console.error("❌ Error en ingresarDineroHandler:", e);
    await Swal.fire("Error", e.message || "No se pudo registrar", "error");
  } finally {
    setProcesandoIngreso(false);
  }
}

/* =================== Retiro =================== */
async function retirarDineroHandler() {
  if (procesandoRetiro) return;
  setProcesandoRetiro(true);
  try {
    const { value: formValues } = await Swal.fire({
      title: "Retiro de dinero",
      html: `
        <div style="display:flex;flex-direction:column;gap:10px;text-align:left">
          <label><strong>Monto</strong></label>
          <input id="swal-monto" type="number" step="0.01" min="0" class="swal2-input" placeholder="0.00" />
          <label><strong>Motivo</strong></label>
          <textarea id="swal-motivo" class="swal2-textarea" placeholder="Descripción del retiro (opcional)"></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      preConfirm: () => {
        const monto = parseFloat(document.getElementById("swal-monto").value);
        const motivo = document.getElementById("swal-motivo").value.trim();
        if (isNaN(monto) || monto <= 0) {
          Swal.showValidationMessage("Monto inválido");
          return false;
        }
        return { monto, motivo };
      },
    });

    if (!formValues) return;

    const caja = await getCajaActiva();
    if (!caja) return Swal.fire("Sin caja abierta", "", "warning");

    // 🧠 Llamamos la función RPC con el empleado_id
    const { error } = await supabase.rpc("incrementar_gastos", {
      caja_id_param: caja.id,
      monto_param: formValues.monto,
      motivo_param: formValues.motivo || "Retiro manual",
      empleado_id_param: empleado?.id_usuario,
    });

    if (error) throw error;

    await Swal.fire("Retiro registrado ✅", "Se guardó correctamente", "success");
  } catch (e) {
    console.error("❌ Error en retirarDineroHandler:", e);
    await Swal.fire("Error", e.message || "No se pudo registrar", "error");
  } finally {
    setProcesandoRetiro(false);
  }
}



  /* =================== Corte / Cierre =================== */
  async function mostrarCorteHandler() {
    const caja = await getCajaActiva(); // refresco
    if (!caja) return Swal.fire("No hay caja abierta", "", "info");

    const totalEnCaja =
      (caja.fondo_inicial || 0) +
      (caja.ingresos_varios || 0) -
      (caja.gastos_varios || 0) +
      (caja.ventas_efectivo || 0);

    await Swal.fire({
      title: "📊 Corte de Caja",
      html: `
        <div style="font-family:'Poppins',sans-serif;color:#fff;text-align:left">
          <div style="display:flex;gap:20px;flex-wrap:wrap;justify-content:space-between">
            <div style="flex:1;min-width:260px;background:#2b2b2b;padding:16px;border-radius:10px">
              <h3 style="margin-bottom:10px">💰 Dinero en CAJA</h3>
              <p>Fondo inicial: <strong>RD$ ${(caja.fondo_inicial || 0).toFixed(2)}</strong></p>
              <p style="color:#00ff99">Ingresos varios: +RD$ ${(caja.ingresos_varios || 0).toFixed(2)}</p>
              <p style="color:#ff7676">Gastos varios: -RD$ ${(caja.gastos_varios || 0).toFixed(2)}</p>
              <p>Ventas efectivo: <strong>RD$ ${(caja.ventas_efectivo || 0).toFixed(2)}</strong></p>
              <hr/>
              <p><strong>Total caja: RD$ ${totalEnCaja.toFixed(2)}</strong></p>
            </div>
            <div style="flex:1;min-width:260px;background:#2b2b2b;padding:16px;border-radius:10px">
              <h3 style="margin-bottom:10px">📦 Ventas Totales</h3>
              <p>Total Ventas: <strong>RD$ ${(caja.ventas_totales || 0).toFixed(2)}</strong></p>
              <hr/>
              <p><strong>Gran Total: RD$ ${totalEnCaja.toFixed(2)}</strong></p>
            </div>
          </div>
        </div>
      `,
      background: "#1e1e1e",
      color: "#fff",
      showCancelButton: true,
      confirmButtonText: "Cerrar caja",
      cancelButtonText: "Volver",
    }).then(async (r) => {
      if (r.isConfirmed) await cerrarCajaHandler();
    });
  }

  async function cerrarCajaHandler() {
  if (procesandoCierre) return;
  setProcesandoCierre(true);
  try {
    const caja = await getCajaActiva();
    if (!caja) {
      await Swal.fire("No hay caja abierta", "", "info");
      return;
    }

    const { error } = await supabase
  .from("caja")
  .update({
    abierta: false,
    hora_cierre: new Date().toISOString(),
    empleado_id_cierre: empleado?.id_usuario || null,
  })
  .eq("id", caja.id);


    if (error) {
      console.error(error);
      await Swal.fire("Error", error.message, "error");
      return;
    }

    await Swal.fire({
      title: "Caja cerrada ✅",
      html: `Total final: <strong>RD$${(caja.total_final || 0).toFixed(2)}</strong>`,
      icon: "success",
    });

    setCajaAbierta(false);
    setProductos([]);
    setCategorias([]);
  } catch (err) {
    console.error("Error al cerrar caja:", err);
    await Swal.fire("Error", err.message, "error");
  } finally {
    setProcesandoCierre(false);
  }
}


  /* =================== Carrito / Venta =================== */
  const agregarAlCarrito = (producto, tamano, precio) => {
    const key = `${producto.id_productos}-${tamano}`;
    const existe = carrito.find((p) => p.key === key);
    if (existe) {
      setCarrito(
        carrito.map((p) => (p.key === key ? { ...p, cantidad: p.cantidad + 1 } : p))
      );
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1, tamano, precio, key }]);
    }
  };

  const eliminarDelCarrito = (key) => {
    const existe = carrito.find((p) => p.key === key);
    if (!existe) return;
    if (existe.cantidad > 1) {
      setCarrito(
        carrito.map((p) => (p.key === key ? { ...p, cantidad: p.cantidad - 1 } : p))
      );
    } else {
      setCarrito(carrito.filter((p) => p.key !== key));
    }
  };

  const calcularTotal = () =>
    carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  useEffect(() => {
    if (metodoPago === "Efectivo" && montoRecibido !== "") {
      const total = calcularTotal();
      const dev = parseFloat(montoRecibido) - total;
      setDevuelta(dev > 0 ? dev : 0);
    } else {
      setDevuelta(0);
    }
  }, [montoRecibido, metodoPago, carrito]);

  // ================= FACTURA PREVIEW (formato térmico) =================
  // (Usamos la utilidad importada desde ../../utils/previewFactura)

  async function confirmarVenta() {
  if (procesandoVenta) return;
  setProcesandoVenta(true);

  try {
    const caja = await getCajaActiva();
    if (!caja) {
      await Swal.fire("No hay caja abierta", "", "warning");
      return;
    }
    if (carrito.length === 0) {
      await Swal.fire("Carrito vacío", "", "warning");
      return;
    }

    const total = calcularTotal();

    if (
      metodoPago === "Efectivo" &&
      (!montoRecibido || parseFloat(montoRecibido) < total)
    ) {
      await Swal.fire(
        "Monto insuficiente",
        "El monto recibido no cubre el total",
        "error"
      );
      return;
    }

    // 1️⃣ Insertar venta
    const venta = await insertVenta({
      empleado_id: empleado?.id_usuario,
      caja_id: caja.id,
      total,
      metodo_pago: metodoPago,
      activo: true,
    });
    if (!venta) throw new Error("No se pudo crear la venta");

    // 2️⃣ Insertar detalles
    const detalles = carrito.map((item) => ({
      venta_id: venta.id,
      producto_id: item.id_productos,
      cantidad: item.cantidad,
      precio_unitario: item.precio,
      nombre: item.nombre,
      total: item.precio * item.cantidad,
    }));
    await insertDetalleVenta(detalles);

    // 3️⃣ Crear datos factura
    const ventaData = {
      id: venta.id,
      fecha: new Date(),
      empleado: empleado?.nombre || "Empleado",
    };
    const efectivoRecibido = parseFloat(montoRecibido) || 0;

    // 4️⃣ Abrir ventana factura (lista para imprimir)
    const ventanaFactura = window.open("", "_blank", "width=420,height=720,scrollbars=no,resizable=no");
    if (!ventanaFactura) {
      Swal.fire("Bloqueada", "Habilita las ventanas emergentes para imprimir.", "warning");
      return;
    }

    ventanaFactura.document.open();
    ventanaFactura.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>Factura - One Way Pizza</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              background: #fff;
              color: #000;
              width: 302px;
              margin: 0 auto;
              text-align: center;
              padding: 10px;
              font-size: 15px;
            }
            img.logo {
              width: 120px;
              height: auto;
              margin-bottom: 6px;
              filter: grayscale(100%);
            }
            h2 {
              margin: 6px 0;
              font-size: 22px;
              font-weight: bold;
            }
            p { margin: 3px 0; }
            .line {
              margin: 6px 0;
              border-bottom: 1px dashed #000;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
              font-size: 14px;
            }
            td {
              padding: 2px 0;
            }
            .right { text-align: right; }
            .center { text-align: center; }
          </style>
        </head>
        <body>
          <img src="/OWP-LOGO.png" class="logo" alt="One Way Pizza" />
          <h2>ONE WAY PIZZA</h2>
          <p>Carretera Los Jovillos - Puerto Viejo de Azua</p>
          <p>Tel: +1 (829) 255-7898</p>
          <div class="line"></div>

          <p><b>Factura #${ventaData.id}</b></p>
          <p>${ventaData.fecha.toLocaleString()}</p>
          <div class="line"></div>

          <table>
            <thead>
              <tr>
                <td><b>Producto</b></td>
                <td class="center"><b>Cant</b></td>
                <td class="right"><b>Precio</b></td>
              </tr>
            </thead>
            <tbody>
              ${detalles.map(item => `
                <tr>
                  <td>${item.nombre}</td>
                  <td class="center">${item.cantidad}</td>
                  <td class="right">RD$${item.precio_unitario.toFixed(2)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="line"></div>
          <p class="right"><b>Total:</b> RD$${total.toFixed(2)}</p>
          <p class="right"><b>Efectivo:</b> RD$${efectivoRecibido.toFixed(2)}</p>
          <p class="right"><b>Devuelta:</b> RD$${(efectivoRecibido - total).toFixed(2)}</p>
          <div class="line"></div>
          <p>Atendido por: <b>${ventaData.empleado}</b></p>
          <div class="line"></div>
          <p>¡Gracias por su compra!</p>
          <p>Síguenos en <b>@onewaypizza</b></p>

          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);
    ventanaFactura.document.close();

    // 5️⃣ Limpieza final
    await Swal.fire("Venta completada ✅", "", "success");
    setCarrito([]);
    setMontoRecibido("");
    setDevuelta(0);
    setMostrarCarrito(false);
  } catch (err) {
    console.error("Error al confirmar venta:", err);
    await Swal.fire("Error", err.message, "error");
  } finally {
    setProcesandoVenta(false);
  }
}


  /* =================== UI =================== */
  if (verificandoCaja) return <p style={{ padding: 20 }}>Cargando...</p>;

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <Container>
      <Header>Caja / Punto de Venta</Header>
      {mostrarFactura && datosFactura && (
  <div style={{ textAlign: "center", marginBottom: "20px" }}>
    <PreviewFactura
      venta={datosFactura.venta}
      detalles={datosFactura.detalles}
      efectivo={datosFactura.efectivo}
    />
    <button
      style={{
        marginTop: "10px",
        padding: "8px 20px",
        borderRadius: "8px",
        backgroundColor: "#007bff",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        marginRight: "8px",
      }}
      onClick={() =>
        imprimirFactura(
          datosFactura.venta,
          datosFactura.detalles,
          datosFactura.efectivo
        )
      }
    >
      🖨️ Imprimir factura
    </button>
    <button
      style={{
        marginTop: "10px",
        padding: "8px 20px",
        borderRadius: "8px",
        backgroundColor: "#dc3545",
        color: "#fff",
        border: "none",
        cursor: "pointer",
      }}
      onClick={() => setMostrarFactura(false)}
    >
      ❌ Cerrar factura
    </button>
  </div>
)}

      {!cajaAbierta ? (
        <BotonesCaja>
          <button onClick={abrirCajaHandler} disabled={procesandoApertura}>
            {procesandoApertura ? "Aperturando..." : "Aperturar caja"}
          </button>
        </BotonesCaja>
      ) : (
        <>
          <BotonesCaja>
            <button onClick={abrirCajaHandler} disabled>
              Caja abierta
            </button>
            <button onClick={ingresarDineroHandler} disabled={procesandoIngreso}>
              {procesandoIngreso ? "Guardando..." : "Ingresar dinero"}
            </button>
            <button onClick={retirarDineroHandler} disabled={procesandoRetiro}>
              {procesandoRetiro ? "Guardando..." : "Retirar dinero"}
            </button>
            <button onClick={mostrarCorteHandler} disabled={procesandoCierre}>
              {procesandoCierre ? "Cerrando..." : "Corte de caja"}
            </button>
          </BotonesCaja>

          <Busqueda>
            <input
              type="text"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </Busqueda>

          {categorias.map((cat) => {
            const productosDeCategoria = productosFiltrados.filter(
              (p) => p.categoria_id === cat.id
            );
            if (productosDeCategoria.length === 0) return null;

            return (
              <Section key={cat.id}>
                <SectionTitle>{cat.nombre}</SectionTitle>
                <ProductosGrid>
                  {productosDeCategoria.map((p) => {
                    const imageUrl = `${STORAGE_URL}/${getCarpetaCategoria(
                      p.categoria_nombre
                    )}/${formatearNombre(p.nombre)}.jpg`;

                    const esYaroa = p.nombre.toLowerCase().includes("yaroa");
                    const precios = esYaroa
                      ? [
                          { label: "P", value: p.precio_pequeno },
                          { label: "M", value: p.precio_mediano },
                          { label: "G", value: p.precio_grande },
                        ].filter((t) => t.value !== null)
                      : [
                          { label: "4", value: p.precio_pequeno },
                          { label: "6", value: p.precio_mediano },
                          { label: "8", value: p.precio_grande },
                          { label: "10", value: p.precio },
                        ].filter((t) => t.value !== null);

                    const tamanoSel =
                      tamanosSeleccionados[p.id_productos] ||
                      precios[0]?.label ||
                      "normal";

                    const precioActual =
                      precios.find((t) => t.label === tamanoSel)?.value ||
                      p.precio;

                    const enCarrito = carrito.find(
                      (item) =>
                        item.id_productos === p.id_productos &&
                        item.tamano === tamanoSel
                    );

                    return (
                      <ProductoCard
                        key={p.id_productos + tamanoSel}
                        $seleccionado={!!enCarrito}
                        onClick={() =>
                          agregarAlCarrito(p, tamanoSel, precioActual)
                        }
                      >
                        <img
                          src={imageUrl}
                          alt={p.nombre}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `${STORAGE_URL}/${getCarpetaCategoria(
                              p.categoria_nombre
                            )}/${formatearNombre(p.nombre)}.png`;
                          }}
                        />
                        <h4>{p.nombre}</h4>

                        {precios.length > 1 && (
                          <Tamanos>
                            {precios.map((t) => (
                              <button
                                key={t.label}
                                className={tamanoSel === t.label ? "activo" : ""}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTamanosSeleccionados((prev) => ({
                                    ...prev,
                                    [p.id_productos]: t.label,
                                  }));
                                }}
                              >
                                {t.label}
                              </button>
                            ))}
                          </Tamanos>
                        )}

                        <p className="precio-animado">RD${precioActual}</p>

                        {enCarrito && (
                          <Controles>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                eliminarDelCarrito(enCarrito.key);
                              }}
                            >
                              ➖
                            </button>
                            <span>{enCarrito.cantidad}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                agregarAlCarrito(p, tamanoSel, precioActual);
                              }}
                            >
                              ➕
                            </button>
                          </Controles>
                        )}
                      </ProductoCard>
                    );
                  })}
                </ProductosGrid>
              </Section>
            );
          })}

          {/* 🛒 Icono flotante */}
          <CarritoIcon onClick={() => setMostrarCarrito(true)}>🛒</CarritoIcon>

          {/* 💬 Modal del carrito */}
          {mostrarCarrito && (
            <ModalOverlay onClick={() => setMostrarCarrito(false)}>
              <ModalContent onClick={(e) => e.stopPropagation()}>
                <h2>🛒 Carrito</h2>
                {carrito.length === 0 ? (
                  <p>No hay productos seleccionados</p>
                ) : (
                  <>
                    <Table>
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Tamaño</th>
                          <th>Cantidad</th>
                          <th>Precio</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {carrito.map((item) => (
                          <tr key={item.key}>
                            <td>{item.nombre}</td>
                            <td>{item.tamano}</td>
                            <td>{item.cantidad}</td>
                            <td>RD${item.precio}</td>
                            <td>RD${(item.precio * item.cantidad).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>

                    <TotalModal>
                      <h3>Total: RD${calcularTotal().toFixed(2)}</h3>

                      <select
                        value={metodoPago}
                        onChange={(e) => setMetodoPago(e.target.value)}
                      >
                        <option value="Efectivo">Efectivo</option>
                        <option value="Tarjeta">Tarjeta</option>
                        <option value="Transferencia">Transferencia</option>
                      </select>

                      {metodoPago === "Efectivo" && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            gap: "6px",
                            marginTop: "10px",
                          }}
                        >
                          <label>
                            💵 Monto recibido:
                            <input
                              type="number"
                              value={montoRecibido}
                              onChange={(e) => setMontoRecibido(e.target.value)}
                              placeholder="0.00"
                              style={{
                                marginLeft: "10px",
                                borderRadius: "8px",
                                padding: "5px 10px",
                                border: "1px solid #777",
                                background: "#222",
                                color: "#fff",
                                width: "120px",
                              }}
                            />
                          </label>
                          <p>
                            🔁 Devuelta: <strong>RD${devuelta.toFixed(2)}</strong>
                          </p>
                        </div>
                      )}

                      <button
                        onClick={() => setCarrito([])}
                        style={{
                          backgroundColor: "#ff5555",
                          color: "#fff",
                          border: "none",
                          padding: "14px 30px",
                          borderRadius: "12px",
                          cursor: "pointer",
                          fontSize: "1.1em",
                          fontWeight: "bold",
                        }}
                      >
                        Vaciar carrito
                      </button>

                      <button onClick={confirmarVenta} disabled={procesandoVenta}>
                        {procesandoVenta ? "Procesando..." : "Confirmar venta"}
                      </button>
                    </TotalModal>
                  </>
                )}
              </ModalContent>
            </ModalOverlay>
          )}
        </>
      )}
    </Container>
  );
}

/* 🎨 ESTILOS */
const Container = styled.div`
  padding: 20px;
  background-color: ${({ theme }) => theme.bgtotal};
  color: ${({ theme }) => theme.text};
`;
const Header = styled.h2`
  text-align: center;
  margin-bottom: 15px;
`;

const BotonesCaja = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 18px;

  button {
    background-color: ${({ theme }) => theme.color1};
    color: #fff;
    border: none;
    padding: 10px 18px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.25s ease;

    &:disabled {
      opacity: .6;
      cursor: not-allowed;
    }

    &:hover:not(:disabled) {
      background-color: ${({ theme }) => theme.colorToggle};
      transform: scale(1.05);
    }
  }
`;

const Busqueda = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 25px;

  input {
    width: 50%;
    padding: 10px;
    border-radius: 12px;
    border: 1px solid ${({ theme }) => theme.bg4};
    font-size: 1em;
    outline: none;
  }
`;

const Section = styled.div`
  margin-bottom: 30px;
`;

const SectionTitle = styled.h3`
  color: ${({ theme }) => theme.colortitlecard};
  margin-bottom: 10px;
`;

const ProductosGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 15px;
`;

const ProductoCard = styled.div`
  position: relative;
  background-color: ${({ theme }) => theme.bgcards};
  border-radius: 12px;
  padding: 10px;
  text-align: center;
  cursor: pointer;
  color: ${({ theme }) => theme.colorsubtitlecard};
  transition: all 0.25s ease;
  border: ${({ $seleccionado, theme }) =>
    $seleccionado ? `3px solid ${theme.color1}` : "2px solid transparent"};
  box-shadow: ${({ $seleccionado, theme }) =>
    $seleccionado ? `0px 0px 12px ${theme.color1}` : "none"};

  &:hover {
    transform: scale(1.05);
  }

  img {
    width: 100%;
    height: 120px;
    object-fit: cover;
    border-radius: 8px;
  }

  .precio-animado {
    display: inline-block;
    transition: transform 0.3s ease, opacity 0.3s ease;
    animation: pop 0.3s ease;
    font-weight: bold;
  }

  @keyframes pop {
    0% { opacity: 0.2; transform: scale(0.8); }
    100% { opacity: 1; transform: scale(1); }
  }
`;

const Tamanos = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 6px 0;

  button {
    background: ${({ theme }) => theme.bg4};
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    font-weight: bold;
    color: ${({ theme }) => theme.text};
    cursor: pointer;
    transition: all 0.2s ease;

    &.activo {
      background-color: ${({ theme }) => theme.color1};
      color: #fff;
      transform: scale(1.1);
    }

    &:hover {
      background-color: ${({ theme }) => theme.colorToggle};
      color: #fff;
    }
  }
`;

const Controles = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  gap: 10px;

  button {
    background-color: ${({ theme }) => theme.primary};
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 5px 10px;
    cursor: pointer;
    font-size: 1.1em;
    transition: all 0.2s ease;
  }
`;

const CarritoIcon = styled.button`
  position: fixed;
  bottom: 30px;
  right: 30px;
  background-color: ${({ theme }) => theme.color1};
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 70px;
  height: 70px;
  font-size: 2rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  transition: all 0.25s ease;
  z-index: 1200;

  &:hover {
    transform: scale(1.1);
    background-color: ${({ theme }) => theme.colorToggle};
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
`;

const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.bgcards};
  color: ${({ theme }) => theme.text};
  padding: 25px;
  border-radius: 15px;
  width: 90%;
  max-width: 900px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0px 4px 30px rgba(0, 0, 0, 0.3);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;

  th,
  td {
    border: 1px solid ${({ theme }) => theme.bg4};
    padding: 8px;
    text-align: center;
  }

  th {
    background-color: ${({ theme }) => theme.bg2};
  }
`;

const TotalModal = styled.div`
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;

  select {
    padding: 10px 15px;
    font-size: 1.1em;
    border-radius: 8px;
    border: 2px solid ${({ theme }) => theme.primary};
  }

  button {
    background-color: ${({ theme }) => theme.color1};
    color: #fff;
    border: none;
    padding: 14px 30px;
    border-radius: 12px;
    cursor: pointer;
    font-size: 1.2em;
    font-weight: bold;
    transition: all 0.25s ease;
  }

  button:disabled {
    opacity: .6;
    cursor: not-allowed;
  }

  button:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colorToggle};
    transform: scale(1.05);
  }
`;
