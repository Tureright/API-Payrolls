// ----------------------------------- Constantes ---------
const DRIVE_EMPLOYEE_FOLDER_ID = PropertiesService
  .getScriptProperties()
  .getProperty('DRIVE_EMPLOYEE_FOLDER_ID');

// ----------------- Manipulación de Documentos de Firestore -----------
const extractIdFromPath = (path) => path.split('/').pop();
const enrichWithId = (doc) => ({ id: extractIdFromPath(doc.path), ...doc.obj });
const mapDocsWithId = (docs) => docs.map(enrichWithId);

// -- Formato de los documentos 
const toDate = (d) => new Date(d);
const now = () => new Date();

/**
 * Normaliza una fecha de entrada a ISO 8601 en UTC.
 */
function normalizeDateToISO(input) {
  var date;
  if (input instanceof Date) {
    date = input;
  } else if (typeof input === 'object' && input !== null && 'year' in input && 'month' in input && 'day' in input) {
    date = new Date(
      Number(input.year),
      Number(input.month) - 1,
      Number(input.day),
      Number(input.hour) || 0,
      Number(input.minute) || 0,
      Number(input.second) || 0
    );
  } else if (typeof input === 'number' || (typeof input === 'string' && /^\d+$/.test(input))) {
    date = new Date(Number(input));
  } else if (typeof input === 'string') {
    date = new Date(input);
  } else if (typeof input === 'object') {
    date = new Date(input.toString());
  } else {
    throw new Error('Tipo de entrada no soportado para fecha: ' + typeof input);
  }

  if (isNaN(date.getTime())) {
    throw new Error('Fecha inválida tras parseo: ' + input);
  }
  return date.toISOString();
}

/**
 * Valida y convierte un string ISO 8601 a objeto Date.
 */
function parseISOToDate(isoInput) {
  const isoString = normalizeDateToISO(isoInput);
  var date = new Date(isoString);
  if (isNaN(date.getTime())) {
    throw new Error('String ISO inválido: ' + isoString);
  }
  return date;
}

/**
 * Formatea una fecha (Date o ISO string) a cadena legible según la zona del script.
 */
function formatDateLocal(input, pattern) {
  var date = (input instanceof Date) ? input : new Date(input);
  if (isNaN(date.getTime())) {
    throw new Error('Fecha inválida para formateo: ' + input);
  }
  var timeZone = Session.getScriptTimeZone();
  return Utilities.formatDate(date, timeZone, pattern);
}

/**
 * Formatea un objeto payrollData asegurando tipos correctos
 * y normalizando la fecha a ISO 8601 UTC.
 */
function formatPayrollData(data) {
  return {
    earnings: data.earnings,
    deductions: data.deductions,
    payrollDate: data.payrollDate
      ? normalizeDateToISO(data.payrollDate)
      : normalizeDateToISO(now()),
    payrollMonth: data.payrollMonth
      ? normalizeDateToISO(data.payrollMonth)
      : normalizeDateToISO(now()),
    volatile: data.volatile || false,
    driveId: data.driveId || "",
    type: data.type || "Mensual"
  };
}

/**
 * Valida la estructura de los datos de un rol de pago.

function validatePayrollData(data) {
  if (!data) {
    throw new Error('No se recibió payrollData.');
  }
  if (!Array.isArray(data.earnings)) {
    throw new Error('El campo "earnings" debe ser un array.');
  }
  if (!Array.isArray(data.deductions)) {
    throw new Error('El campo "deductions" debe ser un array.');
  }
  if (data.payrollDate) {
    try {
      normalizeDateToISO(data.payrollDate);
    } catch (e) {
      throw new Error('El campo "payrollDate" no es una fecha ISO válida.');
    }
  }
}
 */

function getEmployeeFolderName(employeeData) {
  return `${employeeData.firstName} ${employeeData.lastName}/${employeeData.nationalId}`;
}

function buildEmployeeData(dataRaw) {
  const base = {
    firstName: dataRaw.firstName,
    lastName: dataRaw.lastName,
    nationalId: dataRaw.nationalId,
    birthDate: normalizeDateToISO(dataRaw.birthDate),
    workPeriods: (dataRaw.workPeriods || []).map(period => ({
      jobPosition: period.jobPosition,
      startDate: normalizeDateToISO(period.startDate),
      endDate: period.endDate === "Actualmente trabajando"
        ? period.endDate
        : normalizeDateToISO(period.endDate)
    })),
    institutionalEmail: dataRaw.institutionalEmail,
    adminId: dataRaw.adminId || "",
    suspended: dataRaw.suspended || false,
    calendarId: dataRaw.calendarId || "",
  };
  if (dataRaw.driveFolderId) base.driveFolderId = dataRaw.driveFolderId;
  return base;
}

function buildRecurringEvent(eventData) {
  return {
    summary: eventData.summary,
    description: eventData.description || "",
    start: {
      dateTime: eventData.startDate, // e.g. "2025-06-20T10:00:00-05:00"
      timeZone: "America/Guayaquil"
    },
    end: {
      dateTime: eventData.endDate,
      timeZone: "America/Guayaquil"
    },
    recurrence: [
      `RRULE:FREQ=WEEKLY;UNTIL=${eventData.until}` // ISO date format: YYYYMMDDTHHMMSSZ
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 15 }
      ]
    }
  };
}


/**
 * Calcula el décimo tercer sueldo de un empleado,
 * considerando solo roles no volátiles y excluyendo "Fondo de reserva".
 * @param {string} employeeId
 * @returns {number} total13er
 */
function calculate13Sueldo(employeeId) {
  const payrolls = getAllPayrollsByEmployee(employeeId);
  const now = new Date();

  const baseYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();

  const start = new Date(`${baseYear - 1}-12-01T00:00:00`);
  const end = new Date(`${baseYear}-11-30T23:59:59`);

  const total = payrolls
    .filter(p => {
      const date = new Date(p.payrollDate);
      return (
        date >= start &&
        date <= end &&
        p.volatile === false &&
        p.type !== "Decimotercer" &&
        p.type !== "Decimocuarto"
      );
    })
    .reduce((acc, p) => {
      const totalEarnings = (p.earnings || [])
        .filter(e => e.description !== "Fondo de reserva")
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      return acc + totalEarnings;
    }, 0);

  const total13er = total / 12;
  return Number(total13er.toFixed(2));
}



function calculate13SueldoByMonth(employeeId) {
  const payrolls = getAllPayrollsByEmployee(employeeId);
  const now = new Date();

  // Ajuste del ciclo según el mes actual
  const baseYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();

  const start = new Date(`${baseYear - 1}-12-01T00:00:00`);
  const end   = new Date(`${baseYear}-11-30T23:59:59`);

  const monthOrder = [
    { name: "diciembre",  monthIndex: 11, year: baseYear - 1 },
    { name: "enero",      monthIndex: 0,  year: baseYear },
    { name: "febrero",    monthIndex: 1,  year: baseYear },
    { name: "marzo",      monthIndex: 2,  year: baseYear },
    { name: "abril",      monthIndex: 3,  year: baseYear },
    { name: "mayo",       monthIndex: 4,  year: baseYear },
    { name: "junio",      monthIndex: 5,  year: baseYear },
    { name: "julio",      monthIndex: 6,  year: baseYear },
    { name: "agosto",     monthIndex: 7,  year: baseYear },
    { name: "septiembre", monthIndex: 8,  year: baseYear },
    { name: "octubre",    monthIndex: 9,  year: baseYear },
    { name: "noviembre",  monthIndex: 10, year: baseYear }
  ];

  const result = {};
  monthOrder.forEach(({ name, year }) => {
    result[`${name} de ${year}`] = "---";
  });

  const filteredPayrolls = payrolls.filter(p => {
    const date = new Date(p.payrollDate);
    return (
      date >= start &&
      date <= end &&
      p.volatile === false &&
      p.type !== "Decimotercer" &&
      p.type !== "Decimocuarto"
    );
  });

  filteredPayrolls.forEach(p => {
    const date = new Date(p.payrollMonth);
    const monthIndex = date.getUTCMonth();
    const year = date.getUTCFullYear();
    const monthName = monthOrder.find(
      m => m.monthIndex === monthIndex && m.year === year
    )?.name;

    if (!monthName) return;

    const label = `${monthName} de ${year}`;

    const earnings = (p.earnings || [])
      .filter(e => e.description !== "Fondo de reserva")
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    result[label] = Number((earnings / 12).toFixed(2));
  });

  return result;
}

function getMonthsFor14Sueldo(employeeId) {
  const payrolls = getAllPayrollsByEmployee(employeeId);
  const now = new Date();

  // Si estamos en agosto (mes 7) o después, el período termina el próximo julio
  const baseYear = now.getMonth() >= 7 ? now.getFullYear() + 1 : now.getFullYear();

  const start = new Date(`${baseYear - 1}-08-01T00:00:00`);
  const end = new Date(`${baseYear}-07-31T23:59:59`);

  // Lista de meses en orden: agosto (año anterior) a julio (año actual)
  const monthLabels = [
    { label: "agosto", monthIndex: 7, year: baseYear - 1 },
    { label: "septiembre", monthIndex: 8, year: baseYear - 1 },
    { label: "octubre", monthIndex: 9, year: baseYear - 1 },
    { label: "noviembre", monthIndex: 10, year: baseYear - 1 },
    { label: "diciembre", monthIndex: 11, year: baseYear - 1 },
    { label: "enero", monthIndex: 0, year: baseYear },
    { label: "febrero", monthIndex: 1, year: baseYear },
    { label: "marzo", monthIndex: 2, year: baseYear },
    { label: "abril", monthIndex: 3, year: baseYear },
    { label: "mayo", monthIndex: 4, year: baseYear },
    { label: "junio", monthIndex: 5, year: baseYear },
    { label: "julio", monthIndex: 6, year: baseYear },
  ];

  const monthsWithPayrolls = new Set();

  payrolls.forEach((p) => {
    const date = new Date(p.payrollDate);
    if (
      date >= start &&
      date <= end &&
      p.volatile === false &&
      p.type !== "Decimotercer" &&
      p.type !== "Decimocuarto"
    ) {
      const month = date.getMonth();
      const year = date.getFullYear();

      const match = monthLabels.find(
        (m) => m.monthIndex === month && m.year === year
      );

      if (match) {
        monthsWithPayrolls.add(`${match.label} de ${match.year}`);
      }
    }
  });

  // Retornar un array ordenado con los meses válidos
  return monthLabels
    .map((m) => `${m.label} de ${m.year}`)
    .filter((label) => monthsWithPayrolls.has(label));
}



