// ---------------------- HANDLERS GET ----------------------

/**
 * Lista todos los calendarios válidos (uno por empleado).
 */
function handleListCalendars() {
  return listCalendarsForEmployees();
}

/**
 * Lista los eventos próximos en los próximos 6 meses de un calendario.
 * @param {string} calendarId
 */
function handleListEvents(calendarId) {
  if (!calendarId) {
    throw new Error("Falta el parámetro 'calendarId'.");
  }
  return listUpcomingEvents(calendarId);
}

/**
 * Devuelve todos los eventos de un calendario (sin límite de fecha).
 * @param {string} calendarId
 */
function handleGetAllEvents(calendarId) {
  if (!calendarId) {
    throw new Error("Falta el parámetro 'calendarId'.");
  }
  return getAllEvents(calendarId);
}

/**
 * Devuelve los datos de un calendario específico.
 * @param {string} calendarId
 */
function handleGetCalendarById(calendarId) {
  if (!calendarId) {
    throw new Error("Falta el parámetro 'calendarId'.");
  }
  return getCalendarById(calendarId);
}

// ---------------------- HANDLERS POST ----------------------

/**
 * Crea un nuevo calendario.
 * @param {string} summary
 * @param {string} description
 */
function handleCreateCalendar(summary, description) {
  if (!summary) {
    throw new Error("Falta el parámetro 'summary'.");
  }
  if (!description) {
    throw new Error("Falta el parámetro 'description'.");
  }
  return createCalendar(summary, description);
}

/**
 * Agrega un evento recurrente a un calendario.
 * @param {string} calendarId
 * @param {Object} eventData
 */
function handleAddRecurringEvent(calendarId, eventData) {
  if (!calendarId || !eventData) {
    throw new Error("Faltan 'calendarId' o 'eventData'.");
  }
  return addRecurringEvent(calendarId, eventData);
}

/**
 * Elimina un calendario.
 * @param {string} calendarId
 */
function handleDeleteCalendar(calendarId) {
  if (!calendarId) {
    throw new Error("Falta el parámetro 'calendarId'.");
  }
  return deleteCalendar(calendarId);
}

/**
 * Elimina un evento específico.
 * @param {string} calendarId
 * @param {string} instanceId
 */
function handleDeleteEvent(calendarId, instanceId) {
  if (!calendarId || !instanceId) {
    throw new Error("Faltan 'calendarId' o 'instanceId'.");
  }
  return deleteEvent(calendarId, instanceId);
}

/**
 * Comparte un calendario con un usuario por correo electrónico y envía un email.
 * @param {string} to - correo del empleado
 * @param {string} calendarId
 */
function handleSendCalendarToEmployee(to, calendarId) {
  if (!to || !calendarId) {
    throw new Error("Faltan 'to' o 'calendarId'.");
  }
  return sendCalendarToEmployee(to, calendarId);
}

/**
 * Quita el acceso de un usuario a un calendario.
 * @param {string} calendarId
 * @param {string} userEmail
 */
function handleRemoveAccess(calendarId, userEmail) {
  if (!calendarId || !userEmail) {
    throw new Error("Faltan 'calendarId' o 'userEmail'.");
  }
  return removeCalendarAccess(calendarId, userEmail);
}
