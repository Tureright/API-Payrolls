/**
 * Ejecuta fn() y devuelve { success, data?, error? }
 * @param {() => any} fn
 */
function safeExecute(fn) {
  try {
    return { success: true, data: fn() };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Crea un TextOutput JSON con el resultado.
 * @param {{ success: boolean, data?: any, error?: string }} result
 */
function respond(result) {
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
