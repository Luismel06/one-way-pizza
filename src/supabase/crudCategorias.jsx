// 📁 supabase/crudCategorias.jsx
import { supabase } from "../index";
import { subirArchivo, showSuccess, showError, confirmDelete } from "./crudCommon";

/* 🔹 Insertar nueva categoría */
export async function insertCategoria(nombre, activo = true, file = null) {
  try {
    const imagen_url = file ? await subirArchivo("categorias", file, false) : null;

    const { data, error } = await supabase
      .from("categorias")
      .insert([{ nombre, activo, imagen_url }])
      .select();

    if (error) throw error;

    showSuccess("Categoría agregada correctamente");
    return data;
  } catch (err) {
    showError(err.message);
    return null;
  }
}

/* 🔹 Actualizar categoría */
export async function updateCategoria(id, { nombre, activo, file = null }) {
  try {
    const imagen_url = file ? await subirArchivo("categorias", file, true) : null;

    const { data, error } = await supabase
      .from("categorias")
      .update({
        nombre,
        activo,
        ...(imagen_url && { imagen_url }),
      })
      .eq("id", id)
      .select();

    if (error) throw error;

    showSuccess("Categoría actualizada correctamente");
    return data;
  } catch (err) {
    showError(err.message);
    return null;
  }
}

/* 🔹 Eliminar categoría */
export async function deleteCategoria(id) {
  try {
    const confirmed = await confirmDelete("¿Deseas eliminar esta categoría?");
    if (!confirmed) return null;

    const { data, error } = await supabase
      .from("categorias")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw error;

    showSuccess("Categoría eliminada correctamente");
    return data;
  } catch (err) {
    showError(err.message);
    return null;
  }
}


/* 🔹 Mostrar todas las categorías */
export async function mostrarCategorias() {
  try {
    const { data, error } = await supabase
      .from("categorias")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;
    return data;
  } catch (err) {
    showError(err.message);
    return [];
  }
}

/* 🔹 Editar solo la imagen */
export async function editarImagenCategoria(id, file) {
  try {
    const nuevaURL = await subirArchivo("categorias", file, true);
    if (!nuevaURL) throw new Error("Error al subir la nueva imagen");

    const { data, error } = await supabase
      .from("categorias")
      .update({ imagen_url: nuevaURL })
      .eq("id", id)
      .select();

    if (error) throw error;

    showSuccess("Imagen actualizada correctamente");
    return data;
  } catch (err) {
    showError(err.message);
    return null;
  }
}
