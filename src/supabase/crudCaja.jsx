// src/supabase/crudCaja.jsx
import { supabase } from "../index";
import Swal from "sweetalert2";

/* 🟢 Apertura de caja */
export async function abrirCaja({ empleado_id, fondo_inicial }) {
  try {
    const { data, error } = await supabase
      .from("caja")
      .insert([
        {
          empleado_id_apertura: empleado_id,
          fondo_inicial: Number(fondo_inicial),
          ingresos_varios: 0,
          gastos_varios: 0,
          ventas_efectivo: 0,
          ventas_totales: 0,
          total_final: Number(fondo_inicial),
          abierta: true,
          hora_apertura: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    Swal.fire("Caja abierta ✅", "La caja se ha aperturado correctamente", "success");
    return data;
  } catch (err) {
    Swal.fire("Error al abrir caja", err.message, "error");
    return null;
  }
}

/* 🟢 Ingreso de dinero con motivo */
export async function ingresarDinero(caja_id, monto, motivo) {
  try {
    const { error } = await supabase.rpc("incrementar_ingresos", {
      caja_id_param: caja_id,
      monto_param: monto,
      motivo_param: motivo || "Ingreso manual",
    });
    if (error) throw error;

    Swal.fire("Ingreso registrado ✅", "El dinero fue agregado correctamente", "success");
  } catch (err) {
    Swal.fire("Error al ingresar dinero", err.message, "error");
  }
}

/* 🔴 Retiro de dinero con motivo */
export async function retirarDinero(caja_id, monto, motivo) {
  try {
    const { error } = await supabase.rpc("incrementar_gastos", {
      caja_id_param: caja_id,
      monto_param: monto,
      motivo_param: motivo || "Retiro manual",
    });
    if (error) throw error;

    Swal.fire("Retiro registrado ✅", "El dinero fue retirado correctamente", "success");
  } catch (err) {
    Swal.fire("Error al retirar dinero", err.message, "error");
  }
}


/* ⚫ Cierre de caja */
export async function cerrarCaja(caja_id) {
  try {
    const { error } = await supabase
      .from("caja")
      .update({
        abierta: false,
        hora_cierre: new Date().toISOString(),
      })
      .eq("id", caja_id);

    if (error) throw error;

    Swal.fire("Caja cerrada ✅", "El cierre se ha realizado correctamente", "success");
  } catch (err) {
    Swal.fire("Error al cerrar caja", err.message, "error");
  }
}

/* 📊 Consultar caja activa */
export async function obtenerCajaActiva() {
  try {
    const { data, error } = await supabase
      .from("caja")
      .select("*")
      .eq("abierta", true)
      .order("hora_apertura", { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error obteniendo caja activa:", err.message);
    return null;
  }
}
