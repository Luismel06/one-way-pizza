// supabase/crudVentas.jsx
import { supabase } from "../index";
import Swal from "sweetalert2";

/**
 * Inserta una nueva venta en la base de datos
 * @param {object} venta - { empleado_id, caja_id, total, metodo_pago, activo }
 * @returns {object|null} Venta insertada o null si hay error
 */
export async function insertVenta({ empleado_id, caja_id, total, metodo_pago, activo = true }) {
  try {
    // 🧩 Validación previa — evita inserts vacíos o incompletos
    if (!empleado_id || !caja_id) {
      throw new Error("Faltan datos obligatorios (empleado_id o caja_id)");
    }

    // 🧾 Insertar venta en Supabase
    const { data, error } = await supabase
      .from("ventas")
      .insert([{ empleado_id, caja_id, total, metodo_pago, activo }]) // ahora incluye caja_id
      .select()
      .maybeSingle();

    if (error) throw error;

    console.log("✅ Venta creada:", data);
    return data;
  } catch (err) {
    console.error("❌ Error insertando venta:", err.message);
    Swal.fire("Error insertando venta", err.message, "error");
    return null;
  }
}


/**
 * Obtener todas las ventas (opcional: por empleado o rango de fecha)
 */
export async function mostrarVentas(filtro = {}) {
  try {
    let q = supabase.from("ventas").select("*, usuarios(nombre)").order("created_at", { ascending: false });

    if (filtro.empleado_id) q = q.eq("empleado_id", filtro.empleado_id);
    if (filtro.fecha_inicio && filtro.fecha_fin)
      q = q.gte("created_at", filtro.fecha_inicio).lte("created_at", filtro.fecha_fin);

    const { data, error } = await q;
    if (error) throw error;

    return data.map(v => ({
      ...v,
      empleado_nombre: v.usuarios?.nombre || "Desconocido",
    }));
  } catch (err) {
    Swal.fire("Error al mostrar ventas", err.message, "error");
    return [];
  }
}

/**
 * Eliminar venta por ID
 */
export async function deleteVenta(id) {
  try {
    const confirmar = await Swal.fire({
      title: "¿Eliminar venta?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmar.isConfirmed) return;

    const { error } = await supabase.from("ventas").delete().eq("id", id);
    if (error) throw error;

    Swal.fire("Venta eliminada", "La venta fue eliminada correctamente", "success");
  } catch (err) {
    Swal.fire("Error al eliminar venta", err.message, "error");
  }
}
