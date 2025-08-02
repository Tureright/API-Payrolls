function testPayrollTypesByAdmin(assert) {
  const adminId = "admin123";

  const originalGetAllEmployees = globalThis.getAllEmployees;
  const originalGetAllPayrollsByEmployee = globalThis.getAllPayrollsByEmployee;

  try {
    loadMockDataForAdmin(adminId);

    const allPayrolls = getAllPayrollsByAdmin(adminId);

    const tiposEsperados = ["Mensual", "Decimotercer", "Decimocuarto"];
    const payrollsFiltrados = allPayrolls.filter(p => tiposEsperados.includes(p.type));

    const conteoPorTipo = tiposEsperados.reduce((acc, tipo) => {
      acc[tipo] = payrollsFiltrados.filter(p => p.type === tipo).length;
      return acc;
    }, {});

    tiposEsperados.forEach(tipo => {
      assert.ok(
        conteoPorTipo[tipo] > 0,
        `Se encontró al menos un rol de tipo: ${tipo}`
      );
    });

    const totalEsperado = payrollsFiltrados.length;

    assert.equal(
      allPayrolls.length,
      totalEsperado,
      `Se deben obtener todos los roles con tipos ${tiposEsperados.join(", ")} (total esperado: ${totalEsperado})`
    );
  } finally {
    // Restaurar funciones originales
    globalThis.getAllEmployees = originalGetAllEmployees;
    globalThis.getAllPayrollsByEmployee = originalGetAllPayrollsByEmployee;
  }
}

function testPayrollsByAdmin(assert) {
  const adminId = "admin123";

  const originalGetAllEmployees = globalThis.getAllEmployees;
  const originalGetAllPayrollsByEmployee = globalThis.getAllPayrollsByEmployee;

  try {
    loadMockDataForAdmin(adminId);

    const result = handleGetPayrollsByAdmin(adminId);
    Logger.log(JSON.stringify(result, null, 2))
    assert.ok(Array.isArray(result), "La respuesta debe ser un arreglo");
    assert.ok(result.length > 0, "Debe haber al menos un rol de pago devuelto");

    // Obtener el empleado mockeado para comparar IDs
    Logger.log("Imprimir empleado")
    const empleado = getAllEmployees().find(e => e.adminId === adminId);
    Logger.log(JSON.stringify(empleado, null, 2))

    assert.ok(
      result.every(p => p.adminId === empleado.adminId),
      "Todos los roles deben pertenecer al profesor autenticado"
    );


  } finally {
    globalThis.getAllEmployees = originalGetAllEmployees;
    globalThis.getAllPayrollsByEmployee = originalGetAllPayrollsByEmployee;
  }
}

function testGetAllPayrollsForOU2AndOU3(assert) {
  const originalGetAllEmployees = globalThis.getAllEmployees;
  const originalGetAllPayrollsByEmployee = globalThis.getAllPayrollsByEmployee;

  try {
    const mockData = loadMockDataForAllAccess();  // puede lanzar error


    const result = getAllPayrolls();
    assert.ok(Array.isArray(result), "La respuesta debe ser un arreglo");
    assert.equal(
      result.length,
      mockData.expectedPayrollCount,
      `Se deben obtener ${mockData.expectedPayrollCount} roles de pago en total`
    );

    const employeeIdsEsperados = mockData.employees.map(e => e.id);
    const idsUnicos = new Set(result.map(p => p.employeeId));

    assert.deepEqual(
      Array.from(idsUnicos).sort(),
      employeeIdsEsperados.sort(),
      "Los roles de pago deben pertenecer a todos los empleados simulados"
    );

  } catch (error) {
    Logger.log("Error durante testGetAllPayrollsForOU2AndOU3:");
    Logger.log(error.stack || error.message || error.toString());
    throw error; // Re-lanzamos para que QUnit lo registre como fallo
  } finally {
    globalThis.getAllEmployees = originalGetAllEmployees;
    globalThis.getAllPayrollsByEmployee = originalGetAllPayrollsByEmployee;
  }
}

function testCreateMonthlyPayrollForTeacher(assert) {
  const originalCreateEmployeeFolder = globalThis.createEmployeeFolder;
  const originalFirestoreClient = globalThis.getFirestoreClient;

  try {
    mockFirestoreForCreation();
    globalThis.createEmployeeFolder = (name) => `mock-folder-id-${name}`;

    const rawEmployee = {
      firstName: "Daniela",
      lastName: "Gómez",
      nationalId: "1234567890",
      birthDate: "1990-06-20",
      workPeriods: [{
        jobPosition: "Docente",
        startDate: "2023-01-01",
        endDate: "Actualmente trabajando"
      }],
      institutionalEmail: "daniela.gomez@instituto.edu.ec"
    };

    const rawPayroll = {
      earnings: 1200,
      deductions: 200,
      payrollDate: "2024-07-01",
      payrollMonth: "2024-07-01",
      type: "Mensual"
    };

    const employeeId = createEmployee(rawEmployee);
    const payrollId = createPayroll(employeeId, rawPayroll);

    const firestore = getFirestoreClient();
    const createdEmployees = firestore.getCreatedDocuments('employees');
    const createdPayrolls = firestore.getCreatedDocuments(`employees/${employeeId}/payrolls`);

    assert.equal(createdEmployees.length, 1, "Se debe crear un empleado");
    assert.equal(createdPayrolls.length, 1, "Se debe crear un rol de pago");
    assert.equal(createdPayrolls[0].type, "Mensual", "El rol de pago debe ser de tipo Mensual");

  } finally {
    globalThis.createEmployeeFolder = originalCreateEmployeeFolder;
    globalThis.getFirestoreClient = originalFirestoreClient;
  }
}

function testPayrollTemplateData(assert) {
  const originalGetEmployeeById = globalThis.getEmployeeById;
  const originalGetPayrollById = globalThis.getPayrollById;

  try {
    loadMockDataForPayrollTemplate(); // carga mocks necesarios

    const employeeId = "emp123";
    const payrollId = "pay001";

    const employee = getEmployeeById(employeeId);
    const payroll = getPayrollById(employeeId, payrollId);

    const plantilla = {
      firstName: employee.firstName,
      lastName: employee.lastName,
      nationalId: employee.nationalId,
      jobPosition: employee.workPeriods[0].jobPosition,
      earnings: payroll.earnings,
      deductions: payroll.deductions,
      payrollDate: payroll.payrollDate,
      payrollMonth: payroll.payrollMonth,
    };

    const requiredFields = [
      'firstName', 'lastName', 'nationalId', 'jobPosition',
      'earnings', 'deductions', 'payrollDate', 'payrollMonth',
    ];

    requiredFields.forEach(field => {
      assert.ok(
        plantilla[field] !== undefined,
        `El campo ${field} debe estar presente en la plantilla`
      );
    });

    assert.ok(Array.isArray(plantilla.earnings), "earnings debe ser un arreglo");
    assert.ok(
      plantilla.deductions === null || Array.isArray(plantilla.deductions),
      "deductions debe ser null o un arreglo"
    );

  } finally {
    globalThis.getEmployeeById = originalGetEmployeeById;
    globalThis.getPayrollById = originalGetPayrollById;
  }
}

function testLatestPayrollTemplateFromHistory(assert) {
  const EMPLOYEE_ID = "emp-abc";

  // Guardar funciones originales
  const originalGetAllPayrollsByEmployee = globalThis.getAllPayrollsByEmployee;
  const originalGetEmployeeById = globalThis.getEmployeeById;
  const originalGetCurrentJobPosition = globalThis.getCurrentJobPosition;

  try {
    // Datos de prueba
    const payrolls = [
      {
        type: "Mensual",
        payrollDate: "2024-01-01",
        payrollMonth: "2024-01",
        firstName: "Pedro",
        lastName: "González",
        nationalId: "1234567890",
        earnings: [{ description: "Sueldo", amount: 500 }],
        deductions: [{ description: "IESS", amount: 50 }]
      },
      {
        type: "Mensual",
        payrollDate: "2024-05-15",
        payrollMonth: "2024-05",
        firstName: "Pedro",
        lastName: "González",
        nationalId: "1234567890",
        earnings: [{ description: "Sueldo", amount: 550 }],
        deductions: [{ description: "IESS", amount: 55 }]
      },
      {
        type: "Decimotercer", // Este tipo debe ser ignorado
        payrollDate: "2024-06-01",
        payrollMonth: "2024-06",
        firstName: "Pedro",
        lastName: "González",
        nationalId: "1234567890",
        earnings: [{ description: "Décimo", amount: 100 }],
        deductions: []
      }
    ];

    const employee = {
      id: EMPLOYEE_ID,
      firstName: "Pedro",
      lastName: "González",
      nationalId: "1234567890",
      workPeriods: [{
        jobPosition: "Docente",
        startDate: "2020-01-01",
        endDate: "Actualmente trabajando"
      }]
    };

    // Mock de dependencias
    globalThis.getAllPayrollsByEmployee = () => payrolls;
    globalThis.getEmployeeById = () => employee;
    globalThis.getCurrentJobPosition = () => "Docente";

    // Llamada a la función bajo prueba
    const plantilla = getLatestPayrollInfoByEmployee(EMPLOYEE_ID);

    // Asserts
    assert.equal(plantilla.firstName, "Pedro", "Se debe mantener el nombre del empleado del perfil del profesor");
    assert.equal(plantilla.lastName, "González", "Se debe mantener el apellido del empleado del perfil del profesor");
    assert.equal(plantilla.nationalId, "1234567890", "Se debe mantener la cédula del empleado del perfil del profesor");
    assert.equal(plantilla.jobPosition, "Docente", "Se debe mantener el cargo actual del perfil del profesor");
    assert.equal(plantilla.payrollDate, "2024-05-15", "Se debe usar la fecha del rol de pago más reciente");
    assert.equal(plantilla.earnings[0].amount, 550, "Debe tomar los ingresos del rol de pago más reciente");
    assert.equal(plantilla.deductions[0].amount, 55, "Debe tomar las deducciones del rol de pago más reciente");

  } finally {
    // Restaurar funciones originales
    globalThis.getAllPayrollsByEmployee = originalGetAllPayrollsByEmployee;
    globalThis.getEmployeeById = originalGetEmployeeById;
    globalThis.getCurrentJobPosition = originalGetCurrentJobPosition;
  }
}

function testUpdatePayrollEarnings(assert) {
  const originalGetFirestoreClient = globalThis.getFirestoreClient;
  const originalGetPayrollById = globalThis.getPayrollById;

  try {
    // Mocks necesarios
    const mockDriveId = "mock-drive-123";
    const mockPayrollId = "payroll-001";
    const employeeId = "emp-001";

    const mockStorage = {};
    const mockClient = {
      updateDocument: (path, data, merge) => {
        mockStorage[path] = { data, merge };
      }
    };

    const mockPayroll = {
      driveId: mockDriveId,
      earnings: [{ description: "Sueldo básico", amount: 500 }],
      deductions: [],
      payrollDate: "2025-07-01",
      payrollMonth: "Julio 2025",
      type: "Mensual",
    };

    globalThis.getFirestoreClient = () => mockClient;
    globalThis.getPayrollById = () => mockPayroll;

    // Datos actualizados
    const updatedData = {
      earnings: [
        { description: "Sueldo básico", amount: 600 },
        { description: "Horas extras", amount: 100 }
      ],
      deductions: [],
      payrollDate: "2025-07-01",
      payrollMonth: "Julio 2025",
      type: "Mensual"
    };

    // Ejecutar
    const result = updatePayroll(employeeId, mockPayrollId, updatedData);

    // Verificaciones
    const expectedPath = `employees/${employeeId}/payrolls/${mockPayrollId}`;
    const savedData = mockStorage[expectedPath]?.data;

    assert.ok(savedData, "Se debe haber llamado a updateDocument con la ruta esperada");
    assert.deepEqual(
      savedData.earnings,
      updatedData.earnings,
      "Los earnings deben haberse actualizado correctamente"
    );

  } finally {
    globalThis.getFirestoreClient = originalGetFirestoreClient;
    globalThis.getPayrollById = originalGetPayrollById;
  }
}

