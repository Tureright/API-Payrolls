// ------------------------------ PAYROLL SERVICE ------------------------------

/**
 * Devuelve todos los roles de pago de todos los empleados.
 */
function getAllPayrolls() {
  const employees = getAllEmployees();
  const allPayrolls = [];

  employees.forEach(({ id: employeeId }) => {
    const payrolls = getAllPayrollsByEmployee(employeeId);
    allPayrolls.push(...payrolls);
  });

  return allPayrolls;
}

// ------------------------------ GET ------------------------------

/**
 * Obtiene todos los roles de pago de un empleado.
 */
function getAllPayrollsByEmployee(employeeId) {
  const path = `employees/${employeeId}/payrolls`;
  const docs = getFirestoreClient().getDocuments(path);
  return mapDocsWithId(docs).map(doc => ({
    id: doc.id,
    employeeId: employeeId,
    earnings: doc.earnings,
    deductions: doc.deductions,
    payrollDate: doc.payrollDate,
    payrollMonth: doc.payrollMonth,
    volatile: doc.volatile,
    driveId: doc.driveId,
    type: doc.type,
  }));
}

/**
 * Obtiene un rol de pago específico de un empleado.
 */
function getPayrollById(employeeId, payrollId) {
  const docPath = `employees/${employeeId}/payrolls/${payrollId}`;
  const rec = getFirestoreClient().getDocument(docPath);
  if (!rec) return null;
  const doc = { id: payrollId, employeeId, ...rec.obj };
  return {
    id: doc.id,
    employeeId: doc.employeeId,
    earnings: doc.earnings,
    deductions: doc.deductions,
    payrollDate: doc.payrollDate,
    payrollMonth: doc.payrollMonth,
    volatile: doc.volatile,
    driveId: doc.driveId,
    type: doc.type,
  };
}

/**
 * Obtiene la información del rol de pago más reciente de un empleado.
 */

function getLatestPayrollInfoByEmployee(employeeId) {
  const payrolls = getAllPayrollsByEmployee(employeeId)
    .filter(p => !p.type || p.type === "Mensual") // Solo tipo "Mensual"
    .map(p => ({
      ...p,
      __ts: Date.parse(p.payrollDate)
    }));
  const employee = getEmployeeById(employeeId);
  const jobPosition = getCurrentJobPosition(employeeId);
  if (!payrolls.length) {
    const defaultDate = normalizeDateToISO(now()); // Por ejemplo: "2025-01-13T00:00:00.000Z"

    return {
      firstName: employee.firstName,
      lastName: employee.lastName,
      nationalId: employee.nationalId,
      jobPosition: jobPosition,
      earnings: [
        {
          description: "Sueldo",
          amount: 470.0
        },
        {
          description: "Fondo de reserva",
          amount: 38.32
        }
      ],
      deductions: [
        {
          description: "Aporte personal",
          amount: 43.47
        }
      ],
      payrollDate: defaultDate, // hora fija opcional
      payrollMonth: defaultDate,
      volatile: true
    };
  }

  payrolls.sort((a, b) => b.__ts - a.__ts);
  const latest = payrolls[0];

  const emp = getEmployeeById(employeeId);

  return {
    firstName: latest.firstName || emp.firstName,
    lastName: latest.lastName || emp.lastName,
    nationalId: latest.nationalId || emp.nationalId,
    jobPosition: getCurrentJobPosition(employeeId),
    payrollDate: latest.payrollDate,
    payrollMonth: latest.payrollMonth,
    earnings: latest.earnings,
    deductions: latest.deductions
  };
}



function getAllPayrollsByAdmin(adminId) {
  const allEmployees = getAllEmployees();
  const filteredEmployees = allEmployees.filter(e => e.adminId === adminId);

  const allPayrolls = [];
  filteredEmployees.forEach(emp => {
    const payrolls = getAllPayrollsByEmployee(emp.id)
      .filter(p => p.volatile === false); // Filtramos aquí
    allPayrolls.push(...payrolls);
  });

  return allPayrolls;
}



// ------------------------------ POST ------------------------------

function createPayroll(employeeId, payrollData) {
  const data = formatPayrollData(payrollData);
  const path = `employees/${employeeId}/payrolls`;
  const documento = getFirestoreClient().createDocument(path, data);
  return extractIdFromPath(documento.path);
}

function evaluatePayrollExistence(employeeId, payrollData) {
  if (payrollData.type !== "Mensual") {
    const payrollId = createPayroll(employeeId, payrollData);
    return { payrollId, data: null, type: "create"  }; // <- estructura estándar
  }

  const existingPayrolls = getAllPayrollsByEmployee(employeeId)
    .filter(p => !p.volatile && p.type === "Mensual");

  const newPayrollDate = new Date(normalizeDateToISO(payrollData.payrollMonth));
  const newMonth = newPayrollDate.getUTCMonth();
  const newYear = newPayrollDate.getUTCFullYear();

  const matchingPayroll = existingPayrolls.find(p => {
    const existingDate = new Date(p.payrollMonth);
    return (
      existingDate.getUTCMonth() === newMonth &&
      existingDate.getUTCFullYear() === newYear
    );
  });

  if (matchingPayroll) {
    // Ya existe → actualizamos
    const {payrollId, driveId} = updatePayroll(employeeId, matchingPayroll.id, payrollData);
    return {payrollId, driveId, type: "update"};
  } else {
    const payrollId = createPayroll(employeeId, payrollData);
    return { payrollId, driveId: null, type: "create" }; // estructura uniforme
  }
}


function payrollExists(employeeId, payrollMonth) {
  const existingPayrolls = getAllPayrollsByEmployee(employeeId)
    .filter(p => !p.volatile && p.type === "Mensual");
  Logger.log(JSON.stringify(existingPayrolls, null, 2))

  const newPayrollDate = new Date(normalizeDateToISO(payrollMonth));
  const newMonth = newPayrollDate.getUTCMonth();
  const newYear = newPayrollDate.getUTCFullYear();

  const matchingPayroll = existingPayrolls.find(p => {
    const existingDate = new Date(p.payrollMonth);
    return (
      existingDate.getUTCMonth() === newMonth &&
      existingDate.getUTCFullYear() === newYear
    );
  });

  return !!matchingPayroll;
}


// ------------------------------ UPDATE ------------------------------

function updatePayroll(employeeId, payrollId, payrollData) {
  const data = formatPayrollData(payrollData);
  const docPath = `employees/${employeeId}/payrolls/${payrollId}`;
  const driveId = getPayrollById(employeeId, payrollId).driveId;
  getFirestoreClient().updateDocument(docPath, data, true);
  return {payrollId, driveId};
}

function testGet (){
  const driveId = getPayrollById("BOYUl5zyoza7RlP841LY","fxIyy1CxvKtGXsCZF0m2").driveId;
  Logger.log(JSON.stringify(driveId,null, 2))
}

// ------------------------------ DELETE ------------------------------

function deletePayroll(employeeId, payrollId) {
  const docPath = `employees/${employeeId}/payrolls/${payrollId}`;
  getFirestoreClient().deleteDocument(docPath);
}

function deleteAllPayrollsByEmployee(employeeId) {
  const payrolls = getAllPayrollsByEmployee(employeeId);
  const firestore = getFirestoreClient();

  payrolls.forEach(payroll => {
    const docPath = `employees/${employeeId}/payrolls/${payroll.id}`;
    firestore.deleteDocument(docPath);
    Logger.log("Payroll eliminado");
  });
}


