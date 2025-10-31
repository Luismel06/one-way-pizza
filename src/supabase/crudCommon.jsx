// 📁 supabase/crudCommon.jsx
import { supabase } from "../index";
import Swal from "sweetalert2";

/**
 * 📤 Sube un archivo al bucket y devuelve la URL pública.
 * @param {string} bucket - Nombre del bucket en Supabase.
 * @param {File} file - Archivo a subir.
 * @param {boolean} upsert - Si se permite reemplazar un archivo existente.
 * @returns {Promise<string|null>} - URL pública del archivo o null si falla.
 */
export async function subirArchivo(bucket, file, upsert = false) {
  try {
    if (!file) return null;

    // Evita colisiones agregando timestamp al nombre
    const filePath = `imagenes/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { cacheControl: "3600", upsert });

    if (uploadError) throw uploadError;

    const { data: urlData, error: urlError } = await supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (urlError) throw urlError;

    return urlData.publicUrl;
  } catch (err) {
    showError(`Error al subir archivo: ${err.message}`);
    return null;
  }
}

/**
 * ✅ Muestra un mensaje de éxito con SweetAlert2.
 * @param {string} message
 */
export function showSuccess(message) {
  Swal.fire({
    icon: "success",
    title: "Éxito",
    text: message,
    timer: 2000,
    showConfirmButton: false,
  });
}

/**
 * ❌ Muestra un mensaje de error con SweetAlert2.
 * @param {string} message
 */
export function showError(message) {
  Swal.fire({
    icon: "error",
    title: "Error",
    text: message,
  });
}

/**
 * ⚠️ Confirmación antes de eliminar un registro.
 * @param {string} message - Mensaje a mostrar en la alerta.
 * @returns {Promise<boolean>} - True si el usuario confirma.
 */
export async function confirmDelete(message = "¿Seguro que deseas eliminar este registro?") {
  const result = await Swal.fire({
    title: "Confirmar eliminación",
    text: message,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  });
  return result.isConfirmed;
}
