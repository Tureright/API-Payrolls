function handlePayrollResponse(newPayroll) {
  const formattedPayroll = formatPayrollTemplate(newPayroll);

  // 1. Eliminar el documento anterior si ya tiene driveId
  if (formattedPayroll.driveId && formattedPayroll.driveId.trim() !== "") {
    try {
      deleteDriveFile(formattedPayroll.driveId);
      console.log(`📁 Documento anterior con driveId ${formattedPayroll.driveId} eliminado correctamente.`);
    } catch (error) {
      console.error(`❌ Error al eliminar el documento anterior:`, error);
    }
  }

  // 2. Obtener info del empleado
  const employeeInfo = handleGetEmployeeById(formattedPayroll.employeeId);
  const folderId = employeeInfo.driveFolderId || "1_pXy3g0fHjVK6_SqoGckRXCuvaA7p8I3";
  const email = ""; // o employeeInfo.institutionalEmail si quieres enviar por correo

  // 3. Generar nuevo documento y obtener payroll actualizado con nuevo driveId
  const updatedPayroll = generatePayrollDocAndSend(formattedPayroll, folderId, email);

  // 4. Guardar nuevo payroll (con nuevo driveId) en Firestore
  handleUpdatePayroll(updatedPayroll.employeeId, updatedPayroll.id, updatedPayroll);

  return {
    message: "Empleado actualizado, rol generado y sincronizado en Firestore",
    formattedPayroll: updatedPayroll
  };
}



function formatPayrollTemplate(payrollData) {
  return {
    id: payrollData.id,
    employeeId: payrollData.employeeId,
    firstName: payrollData.firstName,
    lastName: payrollData.lastName,
    nationalId: payrollData.nationalId,
    birthDate: payrollData.birthDate,
    jobPosition: payrollData.jobPosition,
    earnings: payrollData.earnings,
    deductions: payrollData.deductions,
    payrollDate: payrollData.payrollDate,
    payrollMonth: payrollData.payrollMonth,
    summary: payrollData.summary,
    driveId: payrollData.driveId || "",
    type: payrollData.type || "Mensual"
  };
}

function deleteDriveFile(fileId) {
  const file = DriveApp.getFileById(fileId);
  file.setTrashed(true);
}

function testGeneratePDFF() {
  const PAYROLLDATA_MOCK = {
    id: "PrJkfOc83eY03dmNAA1B",
    employeeId: "BOYUl5zyoza7RlP841LY",
    firstName: "PruebasDocentes",
    lastName: "Dev",
    nationalId: "0123456789",
    birthDate: "1899-12-05",
    jobPosition: "Profesor titular",
    earnings: [
      { description: "Decimotercera remuneración", amount: 470 },
      { description: "Fondo de reserva", amount: 39.15 }
    ],
    deductions: [
      { description: "Aporte personal", amount: 44.41 }
    ],
    payrollDate: "2025-07-09T20:43:46.756Z",
    payrollMonth: "2025-07-09T20:43:46.756Z",
    summary: "Yo, PruebasDocentes Dev, con la cédula de identidad N.° 0123456789, declaro haber recibido a conformidad la cantidad de Cuatrocientos Sesenta y Cuatro dólares americanos con Setenta y Cuatro centavos.",
    driveId: "148iPo-EwNaVauQiJY-XBMkrXobaCSvSx",
    type: "Mensual"
  };
  const folerId = "1gBBVZ1VTlmCAf-P2XKOfc7r-1A7IYEKS"
  generatePayrollDocAndSend(PAYROLLDATA_MOCK, folerId, "")
}

function generatePayrollDocAndSend(payrollData, driveFolderId, recipientEmail) {
  try {
    Logger.log("Iniciando generación de Rol de Pagos...");

    const folder = DriveApp.getFolderById(driveFolderId);
    const templateId = '1O0umPDW9pilUzF5E5NBTRJ3cIH8SGxAP03gvYRNAnyM'; // ID de tu plantilla
    const docTemplate = DriveApp.getFileById(templateId);

    const monthYear = formatDateToMonthYear(payrollData.payrollMonth);
    let prefix = "RP";
    if (payrollData.type === "Decimotercer") {
      prefix = "RP_Decimotercer";
    } else if (payrollData.type === "Decimocuarto") {
      prefix = "RP_Decimocuarto";
    }

    const docTitle = `${prefix}_${monthYear}_${payrollData.nationalId}_${payrollData.firstName}${payrollData.lastName}`;

    const docCopy = docTemplate.makeCopy(docTitle);
    const docId = docCopy.getId();
    const doc = DocumentApp.openById(docId);
    const body = doc.getBody();

    // Reemplazo de variables generales
    body.replaceText('{{NOMBRE_EMPLEADO}}', `${payrollData.firstName} ${payrollData.lastName}`);
    body.replaceText('{{CEDULA}}', payrollData.nationalId);
    body.replaceText('{{PUESTO}}', payrollData.jobPosition);
    body.replaceText('{{FECHA_NOMINA}}', formatDateToString(payrollData.payrollDate));
    body.replaceText('{{MES_NOMINA}}', formatMonthYearDisplay(payrollData.payrollMonth));
    body.replaceText('{{SUMMARY}}', payrollData.summary);

    // Generar detalles de ingresos y descuentos
    const earningsDescriptions = payrollData.earnings
      .map(e => e.description)
      .join('\n');

    const earningsAmounts = payrollData.earnings
      .map(e => `$${e.amount.toFixed(2)}`)
      .join('\n');

    const deductionsDescriptions = payrollData.deductions
      .map(d => d.description)
      .join('\n');

    const deductionsAmounts = payrollData.deductions
      .map(d => `$${d.amount.toFixed(2)}`)
      .join('\n');

    const totalEarnings = payrollData.earnings.reduce((sum, e) => sum + e.amount, 0);
    const totalDeductions = payrollData.deductions.reduce((sum, d) => sum + d.amount, 0);
    const netPay = totalEarnings - totalDeductions;

    // Reemplazo en plantilla
    body.replaceText('{{DESC_INGRESOS}}', earningsDescriptions);
    body.replaceText('{{AMT_INGR}}', earningsAmounts);
    body.replaceText('{{DESC_DESCUENTOS}}', deductionsDescriptions);
    body.replaceText('{{AMT_DESC}}', deductionsAmounts);
    body.replaceText('{{TOTAL_INGRESOS}}', `$${totalEarnings.toFixed(2)}`);
    body.replaceText('{{TOTAL_DESCUENTOS}}', `$${totalDeductions.toFixed(2)}`);
    body.replaceText('{{SUELDO_NETO}}', `$${netPay.toFixed(2)}`);

    doc.saveAndClose();

    // Convertir a PDF y guardar
    const pdf = doc.getAs(MimeType.PDF);
    pdf.setName(docTitle);
    const pdfFile = folder.createFile(pdf);

    // Asignar el driveId al payroll
    payrollData.driveId = pdfFile.getId();

    // Eliminar el documento de trabajo temporal
    DriveApp.getFileById(docId).setTrashed(true);

    // Enviar por correo si hay email
    if (recipientEmail && recipientEmail !== '') {
      MailApp.sendEmail({
        to: recipientEmail,
        subject: `Rol de Pagos - ${monthYear} - ${payrollData.firstName} ${payrollData.lastName}`,
        body: `Adjunto encontrará el Rol de Pagos correspondiente al mes de ${monthYear}.`,
        attachments: [pdf],
        name: "Gestor de Nómina"
      });
    }

    Logger.log("Rol de Pagos generado exitosamente.");
    return payrollData; // con driveId agregado

  } catch (error) {
    Logger.log("Error en generatePayrollDocAndSend: " + error.message);
    return null;
  }
}



function formatDateToString(dateStr) {
  const date = new Date(dateStr);
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "dd/MM/yyyy");
}

function formatMonthYearDisplay(dateStr) {
  const date = new Date(dateStr);
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];
  return `${capitalizeFirstLetter(months[date.getMonth()])} de ${date.getFullYear()}`;
}

function formatDateToMonthYear(dateStr) {
  const date = new Date(dateStr);
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];
  return `${capitalizeFirstLetter(months[date.getMonth()])}${date.getFullYear()}`; // Sin espacio
}

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}


function handleDownloadPayroll(employeeId, payrollId) {
  try {
    const payroll = handleGetPayrollById(employeeId, payrollId);
    if (!payroll || !payroll.driveId) {
      throw new Error("No se encontró el archivo del rol de pagos.");
    }

    const file = DriveApp.getFileById(payroll.driveId);

    // IMPORTANTE: Este enlace solo funcionará si el usuario autenticado tiene permisos
    const downloadUrl = file.getDownloadUrl();

    return { success: true, downloadUrl };
  } catch (error) {
    Logger.log("Error en handleDownloadPayroll: " + error.message);
    return { success: false, error: error.message };
  }
}




function testGeneratePayrollDoc() {

  const reponse = handleDownloadPayroll("QJCxIiA4xXthqCQbWcpM", "MnLq3betd1C5lzIXs3B2");

  Logger.log(reponse)

}


