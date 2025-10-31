// supabase/crudDetallesVentas.jsx
import { supabase } from "../index";
import Swal from "sweetalert2";

/**
 * Inserta uno o varios detalles de venta
 * @param {Array} detalles - Lista de objetos con { venta_id, producto_id, cantidad, precio_unitario }
 */
export async function insertDetalleVenta(detalles) {
  try {
    if (!detalles || detalles.length === 0) {
      throw new Error("No hay detalles para insertar");
    }

    const { data, error } = await supabase
      .from("detalles_venta")
      .insert(detalles)
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    Swal.fire("Error insertando detalle de venta", err.message, "error");
    return null;
  }
}

/**
 * Obtener detalles de una venta por su ID
 */
export async function mostrarDetallesVenta(venta_id) {
  try {
    const { data, error } = await supabase
      .from("detalles_venta")
      .select(`
        *,
        productos(nombre, precio)
      `)
      .eq("venta_id", venta_id);

    if (error) throw error;
    return data.map((d) => ({
      ...d,
      producto_nombre: d.productos?.nombre || "Desconocido",
    }));
  } catch (err) {
    Swal.fire("Error mostrando detalles de venta", err.message, "error");
    return [];
  }
}

/**
 * Eliminar detalle por ID
 */
export async function deleteDetalleVenta(id) {
  try {
    const confirmar = await Swal.fire({
      title: "¿Eliminar detalle?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmar.isConfirmed) return;

    const { error } = await supabase.from("detalles_venta").delete().eq("id", id);
    if (error) throw error;

    Swal.fire("Detalle eliminado", "El detalle fue eliminado correctamente", "success");
  } catch (err) {
    Swal.fire("Error al eliminar detalle", err.message, "error");
  }
}
