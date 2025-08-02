function TestCalendars() {
  // Crear calendario usando el handler
  const createResponse = handleCreateCalendar("Horario de Roberto", "Clases semanales de Julio");
  if (!createResponse.success) {
    Logger.log("Error creating calendar: " + JSON.stringify(createResponse));
    return;
  }
  const calendarId = createResponse.calendarId;

  const untilDate = "20251031T235900Z"; // 31 de octubre de 2025 en formato UTC

  // Crear eventos recurrentes usando el handler handleAddRecurringEvent
  const events = [
    {
      summary: "Matemática",
      startDate: "2025-06-23T09:00:00-05:00",
      endDate: "2025-06-23T11:00:00-05:00",
      until: untilDate
    },
    {
      summary: "Física",
      startDate: "2025-06-23T11:00:00-05:00",
      endDate: "2025-06-23T13:00:00-05:00",
      until: untilDate
    },
    {
      summary: "Matemática",
      startDate: "2025-06-24T08:00:00-05:00",
      endDate: "2025-06-24T09:00:00-05:00",
      until: untilDate
    },
    {
      summary: "Física",
      startDate: "2025-06-27T09:00:00-05:00",
      endDate: "2025-06-27T11:00:00-05:00",
      until: untilDate
    }
  ];

  events.forEach(eventData => {
    const addEventResponse = handleAddRecurringEvent(calendarId, eventData);
    if (!addEventResponse.success) {
      Logger.log("Error adding event '" + eventData.summary + "': " + JSON.stringify(addEventResponse));
    }
  });

  Logger.log("All events created in calendar: " + calendarId);
}



function GeneralCalendarTests () {
  const response = handleListEvents("c_09ae1ba9191faa9b8fad9e4308918054ba22176320eb96002d6f14490e0b8be6@group.calendar.google.com");
  Logger.log(JSON.stringify(response.events, null, 2))
}

function listarCalendariosAvanzado() {
  const resultado = Calendar.CalendarList.list();
  const items = resultado.items;
  Logger.log(JSON.stringify(items, null, 2))
}

function TestListCalendars (){
  const calendars = handleGetCalendarById("c_bf70a6c08e29321be30a02447922f1cb1ecda0bcaaeccde1609027a4bd37373e@group.calendar.google.com");
  Logger.log(JSON.stringify(calendars, null, 2))
}

function TestGetEvents () {
  const calendarId = "c_b53898e7732a92bcc9e45556121b38aca17f87c17460f8b53c293b62489d1a8a@group.calendar.google.com";
  const eventId = "4svhff5t8solngse6ao8nmuti8_20250620T190000Z";
  const events = handleGetAllEvents(calendarId);

  Logger.log(JSON.stringify(events, null, 2))

  handleDeleteEvent(calendarId,eventId);

  Logger.log(JSON.stringify(events, null, 2))
  
}

function TestSendEmail (){
  const calendarId = "c_bf70a6c08e29321be30a02447922f1cb1ecda0bcaaeccde1609027a4bd37373e@group.calendar.google.com"
  const email = "developers@gardneracademy.edu.ec";
  const response2 = handleSendCalendarToEmployee(email, calendarId)
  Logger.log(JSON.stringify(response2, null, 2))
}
