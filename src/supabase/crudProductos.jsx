// 📁 supabase/crudProductos.jsx
import { supabase } from "../index";
import Swal from "sweetalert2";
import { subirArchivo, showSuccess, showError, confirmDelete } from "./crudCommon";

/**
 * 🟢 Insertar producto
 */
export async function insertProducto({
  nombre,
  categoria_id,
  descripcion = "",
  precio_pequeno = null,
  precio_mediano = null,
  precio_grande = null,
  precio = null,
  activo = true,
  file = null,
  usuario_id = null,
}) {
  try {
    const imagen_url = file ? await subirArchivo("productos", file, false) : null;

    const { data, error } = await supabase
      .from("productos")
      .insert([
        {
          nombre,
          descripcion,
          categoria_id,
          precio_pequeno,
          precio_mediano,
          precio_grande,
          precio,
          activo,
          imagen_url,
          usuario_id,
        },
      ])
      .select();

    if (error) throw error;

    showSuccess("Producto agregado correctamente");
    return data && data[0];
  } catch (err) {
    showError(`Error insertando producto: ${err.message}`);
    return null;
  }
}

/**
 * 🟡 Actualizar producto
 */
export async function updateProducto({
  id_productos,
  nombre,
  categoria_id,
  descripcion = "",
  precio_pequeno = null,
  precio_mediano = null,
  precio_grande = null,
  precio = null,
  activo = true,
  file = null,
  usuario_id = null,
}) {
  try {
    const imagen_url = file ? await subirArchivo("productos", file, true) : null;

    const { data, error } = await supabase
      .from("productos")
      .update({
        nombre,
        descripcion,
        categoria_id,
        precio_pequeno,
        precio_mediano,
        precio_grande,
        precio,
        activo,
        usuario_id,
        ...(imagen_url && { imagen_url }),
      })
      .eq("id_productos", id_productos)
      .select();

    if (error) throw error;

    showSuccess("Producto actualizado correctamente");
    return data && data[0];
  } catch (err) {
    showError(`Error actualizando producto: ${err.message}`);
    return null;
  }
}

/**
 * 🔴 Eliminar producto
 */
export async function deleteProducto(id_productos) {
  try {
    const confirmed = await confirmDelete("¿Deseas eliminar este producto?");
    if (!confirmed) return null;

    const { data, error } = await supabase
      .from("productos")
      .delete()
      .eq("id_productos", id_productos)
      .select();

    if (error) throw error;

    showSuccess("Producto eliminado correctamente");
    return data;
  } catch (err) {
    showError(`Error eliminando producto: ${err.message}`);
    return null;
  }
}

/**
 * 🔍 Mostrar productos (puedes filtrar por categoría o estado)
 */
export async function mostrarProductos(filtro = {}) {
  try {
    let q = supabase
      .from("productos")
      .select("*, categorias(nombre)")
      .eq("activo", true);

    if (filtro.categoria_id) q = q.eq("categoria_id", filtro.categoria_id);
    const { data, error } = await q.order("nombre", { ascending: true });
    if (error) throw error;

    // Renombra el campo para usarlo directamente en el render
    const productos = data.map((p) => ({
      ...p,
      categoria_nombre: p.categorias?.nombre || "",
    }));

    return productos;
  } catch (err) {
    Swal.fire("Error al cargar productos", err.message, "error");
    return [];
  }
}

