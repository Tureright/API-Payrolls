/**
 * Maneja todas las solicitudes GET y centraliza el control de errores.
 */
function doGetTest(e) {
  const action = e.parameter.action;
  if (!action) {
    return respond({ success: false, error: "Acción no especificada." });
  }

  const actions = {
    //-- Payroll GET
    getAllPayrolls: () => handleGetAllPayrolls(),
    getPayrollById: () => handleGetPayrollById(e.parameter.employeeId, e.parameter.id),
    getAllPayrollsByEmployee: () => handleGetAllPayrollsByEmployee(e.parameter.employeeId),
    getLatestPayroll: () => handleGetLatestPayroll(e.parameter.employeeId),
    downloadPayroll: () => handleDownloadPayroll(e.parameter.employeeId, e.parameter.payrollId),
    getPayrollsByAdmin: () => handleGetPayrollsByAdmin(e.parameter.adminId),
    payrollExists: () => handlePayrollExists(e.parameter.employeeId, e.parameter.payrollMonth),
    //-- Employee GET
    getAllEmployees: () => handleGetAllEmployees(),
    getEmployeeById: () => handleGetEmployeeById(e.parameter.id),
    getProfilePicture: () => {
      const blob = handleGetProfilePicture(e.parameter.employeeId);
      const base64 = Utilities.base64Encode(blob.getBytes());
      return { base64, mimeType: blob.getContentType() };
    },
    getEmployees13erSueldo: () => handleGetEmployees13erSueldo(),
    get13erSueldoByEmployeeId: () => handleGet13erSueldoByEmployeeId(e.parameter.employeeId),
    getMonthsFor14Sueldo: () => handleGetMonthsFor14Sueldo(e.parameter.employeeId),
    getEmployeeByAdminId: () => handleGetEmployeeByAdminId(e.parameter.adminId),
    //-- Calendar GET
    listCalendars: () => handleListCalendars(),
    listEvents: () => handleListEvents(e.parameter.calendarId),
    getAllEvents: () => handleGetAllEvents(e.parameter.calendarId),
    getCalendarById: () => handleGetCalendarById(e.parameter.calendarId),

  };

  const fn = actions[action];
  if (!fn) {
    return respond({ success: false, error: `GET no soportado: ${action}` });
  }

  // Ejecuta el handler de forma segura
  const result = safeExecute(fn);

  return respond(result);
}



/**
 * Maneja todas las solicitudes POST y centraliza el control de errores.
 */
function doPost(e) {
  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return respond({ success: false, error: "JSON inválido en POST." });
  }

  const action = payload.action;
  if (!action) {
    return respond({ success: false, error: "Acción no especificada." });
  }

  // Mapeo de acciones POST a sus handlers
  const actions = {
    //-- Payroll POST
    createPayroll: () => handleCreatePayroll(payload.employeeId, payload.payrollData),
    updatePayroll: () => handleUpdatePayroll(payload.employeeId, payload.payrollId, payload.payrollData),
    deletePayroll: () => handleDeletePayroll(payload.employeeId, payload.payrollId),
    setPayrollTemplate: () => handlePayrollResponse(payload.newPayroll),
    //-- Employee POST
    createEmployee: () => handleCreateEmployee(payload.employeeData),
    updateEmployee: () => handleUpdateEmployee(payload.employeeId, payload.employeeData),
    deleteEmployee: () => handleDeleteEmployee(payload.employeeId),
    setProfilePicture: () => handleSetProfilePicture(payload.employeeId, payload.base64Data),
    syncNewDocentes: () => handleSyncNewDocentesWithFirestore(),
    //-- Calendar POST
    createCalendar: () => handleCreateCalendar(payload.summary, payload.description),
    addRecurringEvent: () => handleAddRecurringEvent(payload.calendarId, payload.eventData),
    deleteCalendar: () => handleDeleteCalendar(payload.calendarId),
    deleteEvent: () => handleDeleteEvent(payload.calendarId, payload.eventId),
    sendCalendarToEmployee: () => handleSendCalendarToEmployee(payload.to, payload.calendarId),
  };

  const fn = actions[action];
  if (!fn) {
    return respond({ success: false, error: `POST no soportado: ${action}` });
  }

  // Ejecuta el handler de forma segura
  const result = safeExecute(() => fn());

  return respond(result);
}
