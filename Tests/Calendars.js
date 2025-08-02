function testRecurringEventInsertion(assert) {
  const originalCalendar = globalThis.Calendar;

  try {
    // Arrange
    const mockCalendar = mockCalendarService();
    globalThis.Calendar = mockCalendar;

    const calendarId = "mock-calendar-id-123";
    const eventData = {
      summary: "Clase de Biología",
      description: "8vo grado",
      startDate: "2025-08-01T08:00:00-05:00",
      endDate: "2025-08-01T09:00:00-05:00",
      until: "20251130T000000Z"
    };

    mockCalendar.reset();

    // Act
    const result = addRecurringEvent(calendarId, eventData);

    // Assert
    const inserted = mockCalendar.getInsertedEvents();
    assert.equal(inserted.length, 1, "Debe haberse insertado un solo evento");

    const event = inserted[0].event;

    assert.ok(event.recurrence && event.recurrence.length > 0, "El evento debe tener recurrencia definida");
    assert.ok(event.recurrence[0].startsWith("RRULE:FREQ=WEEKLY"), "El evento debe ser recurrente semanalmente");
    assert.ok(event.recurrence[0].includes(`UNTIL=${eventData.until}`), `El evento recurrente debe finalizar en la fecha: ${eventData.until}`);

  } finally {
    globalThis.Calendar = originalCalendar;
  }
}

function testEmployeeCalendarLink(assert) {
  const originalGetFirestoreClient = globalThis.getFirestoreClient;
  const originalCreateCalendar = globalThis.createCalendar;

  try {
    // Simular firestore y calendario
    mockFirestoreForUpdate();
    mockCalendarCreation();

    // Paso 1: Empleado con calendarId vacío
    const employeeMock = buildEmployeeData({
      firstName: "Mario",
      lastName: "López",
      nationalId: "1234567890",
      birthDate: "1980-04-01",
      workPeriods: [{
        jobPosition: "Docente",
        startDate: "2020-01-01",
        endDate: "Actualmente trabajando"
      }],
      institutionalEmail: "mario.lopez@escuela.edu.ec",
      adminId: "admin-test",
      calendarId: "" // ← sin calendarId aún
    });
    employeeMock.id = "emp-test-001";

    assert.equal(employeeMock.calendarId, "", "El empleado debe iniciar sin calendarId");

    // Paso 2: Crear calendario simulado
    const calendarioCreado = createCalendar("Periodo Académico 2025A", "Calendario oficial del periodo");
    assert.ok(calendarioCreado.success, "El calendario debe crearse correctamente");

    // Paso 3: Actualizar employee con el nuevo calendarId
    const updatedEmployee = {
      ...employeeMock,
      calendarId: calendarioCreado.calendarId
    };

    updateEmployee(employeeMock.id, updatedEmployee);

    // Paso 4: Validar que el documento fue actualizado correctamente
    const firestore = getFirestoreClient();
    const docs = firestore.getUpdatedDocuments(`employees/${employeeMock.id}`);

    assert.equal(docs.length, 1, "Debe haberse realizado una actualización del documento");
    assert.equal(docs[0].calendarId, calendarioCreado.calendarId, "El calendarId debe estar vinculado al empleado");

  } finally {
    globalThis.getFirestoreClient = originalGetFirestoreClient;
    globalThis.createCalendar = originalCreateCalendar;
  }
}

function testSendCalendarToEmployee(assert) {
  const originalAclList = globalThis.Calendar?.Acl?.list;
  const originalAclInsert = globalThis.Calendar?.Acl?.insert;
  const originalSendEmail = globalThis.GmailApp?.sendEmail;
  const originalFetch = globalThis.UrlFetchApp?.fetch;

  try {
    const CALENDAR_ID = "calendar-profesor-123";
    const PROFESOR_EMAIL = "juan.perez@colegio.edu.ec";

    // Empleado simulado
    const empleado = {
      calendarId: CALENDAR_ID,
      institutionalEmail: PROFESOR_EMAIL
    };

    // Simular Calendar.Acl.list
    globalThis.Calendar = {
      Acl: {
        list: function (calendarId) {
          assert.equal(calendarId, CALENDAR_ID, "Se consulta la lista de control de acceso del calendarId correcto");
          return { items: [] }; // aún no compartido
        },
        insert: function (entry, calendarId) {
          assert.deepEqual(entry, {
            scope: { type: "user", value: PROFESOR_EMAIL },
            role: "reader"
          }, "Se comparten permisos de lector con el profesor");
          return { id: "mock-acl-id" };
        }
      }
    };

    // Simular UrlFetchApp
    globalThis.UrlFetchApp = {
      fetch: function () {
        return {
          getBlob: function () {
            return {
              setName: function () {
                return { name: "logo.png", content: "<mocked>" };
              }
            };
          }
        };
      }
    };

    // Registrar si se envió correo
    let correoEnviado = null;
    globalThis.GmailApp = {
      sendEmail: function (to, subject, plainText, options) {
        correoEnviado = { to, subject, plainText, options };
      }
    };

    // Ejecutar función
    const resultado = sendCalendarToEmployee(empleado.institutionalEmail, empleado.calendarId);

    // Verificaciones
    assert.ok(correoEnviado, "Se debe enviar un correo");
    assert.equal(correoEnviado.to, PROFESOR_EMAIL, "El correo debe enviarse al profesor correcto");

    assert.ok(
      resultado.embedded.includes(empleado.calendarId),
      "El correo debe contener el iframe con el calendarId correcto"
    );
  } finally {
    // Restaurar originales
    if (originalAclList) globalThis.Calendar.Acl.list = originalAclList;
    if (originalAclInsert) globalThis.Calendar.Acl.insert = originalAclInsert;
    if (originalSendEmail) globalThis.GmailApp.sendEmail = originalSendEmail;
    if (originalFetch) globalThis.UrlFetchApp.fetch = originalFetch;
  }
}

