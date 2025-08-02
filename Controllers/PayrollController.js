// PayrollController.gs
// ---------------------- Helpers para formatear en local ----------------------

/**
 * Convierte ISO 8601 UTC → Date → string según zona del script.
 */
function toLocalDateString(isoString, pattern) {
  return formatDateLocal(parseISOToDate(isoString), pattern);
}

// ---------------------- HANDLERS GET ----------------------

function handleGetAllPayrolls() {
  const payrolls = getAllPayrolls();
  return payrolls.map(p => ({
    ...p,
    payrollDate: toLocalDateString(p.payrollDate, 'yyyy-MM-dd HH:mm:ss'),
    payrollMonth: toLocalDateString(p.payrollMonth, 'yyyy-MM')
  }));
}

function handleGetPayrollById(employeeId, payrollId) {
  if (!employeeId || !payrollId) {
    throw new Error("Faltan 'employeeId' o 'payrollId'.");
  }
  const rec = getPayrollById(employeeId, payrollId);
  if (!rec) return null;
  return {
    ...rec,
    payrollDate: toLocalDateString(rec.payrollDate, 'yyyy-MM-dd HH:mm:ss'),
    payrollMonth: toLocalDateString(rec.payrollMonth, 'yyyy-MM')
  };
}

function handleGetAllPayrollsByEmployee(employeeId) {
  if (!employeeId) {
    throw new Error("Falta 'employeeId'.");
  }
  const payrolls = getAllPayrollsByEmployee(employeeId);
  return payrolls.map(p => ({
    ...p,
    payrollDate: toLocalDateString(p.payrollDate, 'yyyy-MM-dd HH:mm:ss')
  }));
}

function handleGetLatestPayroll(employeeId) {
  if (!employeeId) {
    throw new Error("Falta 'employeeId'.");
  }
  const info = getLatestPayrollInfoByEmployee(employeeId);
  return {
    ...info,
    payrollDate: toLocalDateString(info.payrollDate, 'yyyy-MM-dd HH:mm:ss'),
    payrollMonth: toLocalDateString(info.payrollMonth, 'yyyy-MM')
  };
}

function handleGetPayrollsByAdmin(adminId) {
  if (!adminId) throw new Error("Falta 'adminId'.");
  const payrolls = getAllPayrollsByAdmin(adminId);
  return payrolls.map(p => ({
    ...p,
    payrollDate: toLocalDateString(p.payrollDate, 'yyyy-MM-dd HH:mm:ss'),
    payrollMonth: toLocalDateString(p.payrollMonth, 'yyyy-MM'),
    adminId: adminId
  }));
}


// ---------------------- HANDLERS POST ----------------------

function handleCreatePayroll(employeeId, payrollData) {
  if (!employeeId || !payrollData) {
    throw new Error("Faltan 'employeeId' o 'payrollData'.");
  }

  validatePayrollData(payrollData);

  const result = evaluatePayrollExistence(employeeId, payrollData);
  return {
    message: result.type,
    payrollId: result.payrollId,
    driveId: result.driveId, // podría ser null si fue creación
  };
}


function handleUpdatePayroll(employeeId, payrollId, payrollData) {
  if (!employeeId || !payrollId || !payrollData) {
    throw new Error("Faltan 'employeeId', 'payrollId' o 'payrollData'.");
  }
  validatePayrollData(payrollData);
  const updatedData = updatePayroll(employeeId, payrollId, payrollData);
  return { message: "Rol de pago actualizado", updateData: updatedData };
}

function handleDeletePayroll(employeeId, payrollId) {
  if (!employeeId || !payrollId) {
    throw new Error("Faltan 'employeeId' o 'payrollId'.");
  }

  // Paso 1: Obtener el rol para acceder al driveId
  const payroll = handleGetPayrollById(employeeId, payrollId);

  // Paso 2: Si existe un driveId, intentar eliminar el archivo de Drive
  if (payroll && payroll.driveId) {
    try {
      const file = DriveApp.getFileById(payroll.driveId);
      file.setTrashed(true); // Alternativamente usa file.setTrashed(true) si no quieres borrarlo permanentemente
      Logger.log(`Archivo en Drive eliminado: ${payroll.driveId}`);
    } catch (e) {
      Logger.log(`No se pudo eliminar el archivo de Drive: ${e.message}`);
    }
  }

  // Paso 3: Eliminar de Firestore (tu base principal)
  deletePayroll(employeeId, payrollId);

  return { message: "Rol de pago eliminado correctamente (incluyendo archivo en Drive si existía)." };
}


function handleGeneratePDFfromHTML(contenidoHTML) {
  const html = HtmlService.createHtmlOutput(contenidoHTML).getContent();
  const blob = Utilities.newBlob(html, 'text/html', 'archivo.html');
  const pdf = blob.getAs('application/pdf');
  const archivo = DriveApp.createFile(pdf);
  archivo.setName("reporte_generado.pdf");

  return archivo.getUrl(); // Devuelve URL del PDF en Drive
}

function handlePayrollExists(employeeId, payrollMonth) {
  if (!employeeId || !payrollMonth) {
    throw new Error("Faltan 'employeeId' o 'payrollMonth'.");
  }

  const exists = payrollExists(employeeId, payrollMonth);
  return exists
}



