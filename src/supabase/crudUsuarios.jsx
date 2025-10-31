// 📁 supabase/crudUsuarios.jsx
import { supabase } from "../index";
import { showSuccess, showError, confirmDelete } from "./crudCommon";

/**
 * 🟢 Insertar nuevo usuario
 */
export async function insertUsuario({
  nombre,
  correo,
  rol = "empleado",
  activo = true,
}) {
  try {
    const { data, error } = await supabase
      .from("usuarios")
      .insert([{ nombre, correo, rol, activo }])
      .select();

    if (error) throw error;
    showSuccess("Usuario creado correctamente");
    return data && data[0];
  } catch (err) {
    showError(`Error insertando usuario: ${err.message}`);
    return null;
  }
}

/**
 * 🟡 Actualizar usuario
 */
export async function updateUsuario({
  id_usuario,
  nombre,
  correo,
  rol,
  activo,
}) {
  try {
    const { data, error } = await supabase
      .from("usuarios")
      .update({ nombre, correo, rol, activo })
      .eq("id_usuario", id_usuario)
      .select();

    if (error) throw error;
    showSuccess("Usuario actualizado correctamente");
    return data && data[0];
  } catch (err) {
    showError(`Error actualizando usuario: ${err.message}`);
    return null;
  }
}

/**
 * 🔴 Eliminar usuario
 */
export async function deleteUsuario(id_usuario) {
  try {
    const confirmed = await confirmDelete("¿Deseas eliminar este usuario?");
    if (!confirmed) return null;

    const { data, error } = await supabase
      .from("usuarios")
      .delete()
      .eq("id_usuario", id_usuario)
      .select();

    if (error) throw error;
    showSuccess("Usuario eliminado correctamente");
    return data;
  } catch (err) {
    showError(`Error eliminando usuario: ${err.message}`);
    return null;
  }
}

/**
 * 🔍 Mostrar usuarios (filtrar por rol o estado)
 */
export async function mostrarUsuarios(filtro = {}) {
  try {
    let query = supabase.from("usuarios").select("*");

    if (filtro.rol) query = query.eq("rol", filtro.rol);
    if (filtro.activo !== undefined) query = query.eq("activo", filtro.activo);

    const { data, error } = await query.order("nombre", { ascending: true });
    if (error) throw error;

    return data;
  } catch (err) {
    showError(`Error cargando usuarios: ${err.message}`);
    return [];
  }
}
