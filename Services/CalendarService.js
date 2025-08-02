// ---------------------- SERVICIOS GET ----------------------

/**
 * Lista los calendarios válidos asociados a empleados.
 * @returns {Object} Lista de calendarios con IDs de empleados.
 */
function listCalendarsForEmployees() {
  const employees = handleGetAllEmployees();
  const validCalendars = [];

  const employeesWithCalendars = employees.filter(emp => !!emp.calendarId);

  for (const emp of employeesWithCalendars) {
    try {
      const cal = Calendar.Calendars.get(emp.calendarId);
      if (cal.primary || cal.id.includes('holiday')) continue;

      validCalendars.push({
        id: cal.id,
        summary: cal.summary,
        accessRole: cal.accessRole,
        employeeId: emp.id
      });
    } catch (error) {
      Logger.log(`Error con calendarId ${emp.calendarId} (empleado ${emp.id}): ${error.message}`);
    }
  }

  return { success: true, calendars: validCalendars };
}

/**
 * Obtiene un calendario por su ID.
 * @param {string} calendarId
 * @returns {Object}
 */
function getCalendarById(calendarId) {
  try {
    const calendar = Calendar.Calendars.get(calendarId);
    return {
      success: true,
      calendar: {
        id: calendar.id,
        summary: calendar.summary,
        description: calendar.description,
        timeZone: calendar.timeZone
      }
    };
  } catch (error) {
    return {
      success: false,
      message: "No se pudo obtener el calendario.",
      error: error.message
    };
  }
}

/**
 * Lista eventos próximos (6 meses) de un calendario.
 * @param {string} calendarId
 * @returns {Object}
 */
function listUpcomingEvents(calendarId) {
  const now = new Date();
  const future = new Date();
  future.setMonth(future.getMonth() + 6);

  const events = Calendar.Events.list(calendarId, {
    timeMin: now.toISOString(),
    timeMax: future.toISOString(),
    singleEvents: true,
    orderBy: "startTime"
  }).items;

  const formattedEvents = events.map(event => ({
    id: event.id,
    summary: event.summary,
    startDate: event.start.dateTime || event.start.date,
    endDate: event.end.dateTime || event.end.date,
  }));

  return { success: true, events: formattedEvents };
}

/**
 * Obtiene todos los eventos (pasado y futuro) de un calendario.
 * @param {string} calendarId
 * @returns {Object}
 */
function getAllEvents(calendarId) {
  try {
    const events = [];
    let pageToken;

    do {
      const response = Calendar.Events.list(calendarId, {
        maxResults: 2500,
        pageToken,
        singleEvents: true,
        orderBy: "startTime",
      });

      if (response.items?.length > 0) {
        const pageEvents = response.items.map(event => ({
          id: event.id,
          summary: event.summary,
          startDate: event.start?.dateTime || event.start?.date,
          endDate: event.end?.dateTime || event.end?.date,
        }));
        events.push(...pageEvents);
      }

      pageToken = response.nextPageToken;
    } while (pageToken);

    return { success: true, events };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ---------------------- SERVICIOS POST ----------------------

/**
 * Crea un nuevo calendario con zona horaria local.
 * @param {string} summary
 * @param {string} description
 * @returns {Object}
 */
function createCalendar(summary, description) {
  const newCalendar = {
    summary,
    description,
    timeZone: "America/Guayaquil"
  };
  const calendar = Calendar.Calendars.insert(newCalendar);
  return { success: true, calendarId: calendar.id };
}

/**
 * Agrega un evento recurrente a un calendario.
 * @param {string} calendarId
 * @param {Object} eventData
 * @returns {Object}
 */
function addRecurringEvent(calendarId, eventData) {
  const event = buildRecurringEvent(eventData);
  const createdEvent = Calendar.Events.insert(event, calendarId);
  return { success: true, eventId: createdEvent.id };
}

/**
 * Elimina un calendario (solo si se tiene permiso).
 * @param {string} calendarId
 * @returns {Object}
 */
function deleteCalendar(calendarId) {
  Calendar.Calendars.remove(calendarId);
  return { success: true };
}

/**
 * Elimina un evento individual (por ID de instancia).
 * @param {string} calendarId
 * @param {string} instanceId
 * @returns {Object}
 */
function deleteEvent(calendarId, instanceId) {
  const masterId = instanceId.split("_")[0];
  Calendar.Events.remove(calendarId, masterId);
  return { success: true, deletedId: masterId };
}

/**
 * Comparte un calendario con un usuario por email y envía notificación.
 * @param {string} to
 * @param {string} calendarId
 * @returns {Object}
 */
function sendCalendarToEmployee(to, calendarId) {
  const logoUrl = "https://cdigardnermini.edu.ec/img/header/centro-infantil-gardner-mini-academy-quito-valle-de-los-chillos.png";
  const logoBlob = UrlFetchApp.fetch(logoUrl).getBlob().setName("logo.png");

  const aclList = Calendar.Acl.list(calendarId).items;
  const alreadyShared = aclList.some(entry => entry.scope?.type === "user" && entry.scope?.value === to);

  if (!alreadyShared) {
    Calendar.Acl.insert({
      scope: { type: "user", value: to },
      role: "reader"
    }, calendarId);
  }

  const htmlBody = `...`;  // Mantener limpio, opcional: extraer a función
  const plainTextBody = `...`;

  GmailApp.sendEmail(to, "Horario Académico", plainTextBody, {
    htmlBody,
    inlineImages: { "logo.png": logoBlob }
  });

  return {
    message: "Correo electrónico enviado",
    embedded: `https://calendar.google.com/calendar/embed?src=${calendarId}&mode=WEEK&ctz=America%2FGuayaquil`
  };
}

/**
 * Elimina el acceso de un usuario a un calendario.
 * @param {string} calendarId
 * @param {string} userEmail
 * @returns {Object}
 */
function removeCalendarAccess(calendarId, userEmail) {
  try {
    const aclList = Calendar.Acl.list(calendarId).items;
    const rule = aclList.find(entry =>
      entry.scope?.type === "user" && entry.scope?.value === userEmail
    );

    if (rule) {
      Calendar.Acl.delete(calendarId, rule.id);
      return { success: true, message: `Acceso eliminado para ${userEmail}` };
    } else {
      return { success: false, message: `No se encontró permiso para ${userEmail}` };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}
