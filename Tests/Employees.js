function testCreateDriveFolderForEmployee(assert) {
  const originalDriveApp = globalThis.DriveApp;
  const originalFirestoreClient = globalThis.getFirestoreClient;

  try {
    // Mock Firestore y Drive
    mockFirestoreForCreation();
    globalThis.DriveApp = {
      getFolderById: (id) => ({
        createFolder: (folderName) => ({
          getId: () => `mock-folder-id-${folderName}`
        })
      })
    };

    const rawEmployee = {
      firstName: "Luis",
      lastName: "Martínez",
      nationalId: "1122334455",
      birthDate: "1988-03-15",
      workPeriods: [],
      institutionalEmail: "luis.martinez@instituto.edu.ec"
    };

    const employeeId = createEmployee(rawEmployee);

    const firestore = getFirestoreClient();
    const createdEmployees = firestore.getCreatedDocuments('employees');

    assert.equal(createdEmployees.length, 1, "Se debe haber creado un solo empleado con el nombre Luis Martinez y cédula 1122334455");

    const employee = createdEmployees[0];
    const expectedFolderName = "Luis Martínez/1122334455";
    const expectedFolderId = `mock-folder-id-${expectedFolderName}`;

    assert.equal(
      employee.driveFolderId,
      expectedFolderId,
      "El folder del Drive debe crearse correctamente con el Luis Martínez/1122334455 y retornar el ID simulado"
    );

  } finally {
    globalThis.DriveApp = originalDriveApp;
    globalThis.getFirestoreClient = originalFirestoreClient;
  }
}

function test13SueldoCalculation(assert) {
  const originalGetAllPayrollsByEmployee = globalThis.getAllPayrollsByEmployee;

  try {
    const mockEmployeeId = "mock-emp-1";

    mockPayrollsFor13Sueldo(mockEmployeeId);


    const resultado = get13erSueldoByEmployeeId(mockEmployeeId);
    Logger.log(JSON.stringify(resultado, null, 2))
    const now = new Date();
    const baseYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
    const monthsExpected = [
      `diciembre de ${baseYear - 1}`,
      `enero de ${baseYear}`,
      `febrero de ${baseYear}`,
      `marzo de ${baseYear}`,
      `abril de ${baseYear}`,
      `mayo de ${baseYear}`,
      `junio de ${baseYear}`,
      `julio de ${baseYear}`,
      `agosto de ${baseYear}`,
      `septiembre de ${baseYear}`,
      `octubre de ${baseYear}`,
      `noviembre de ${baseYear}`
    ];

    assert.equal(Object.keys(resultado).length, 12, "Debe haber 12 meses en el resultado");

    const resultadoMeses = Object.keys(resultado).sort();
    const mesesEsperadosOrdenados = monthsExpected.sort();

    assert.deepEqual(
      resultadoMeses,
      mesesEsperadosOrdenados,
      'El resultado debe incluir exactamente todos los meses del periodo de la decimotercera remuneración'
    );


    const ingresoEsperado = 1200;
    const doceavaParte = Number((ingresoEsperado / 12).toFixed(2));
    const mesEsperado = `enero de ${baseYear}`;

    assert.equal(
      resultado[mesEsperado],
      doceavaParte,
      `La doceava parte de ${ingresoEsperado} debe ser ${doceavaParte} en ${mesEsperado}`
    );

  } finally {
    globalThis.getAllPayrollsByEmployee = originalGetAllPayrollsByEmployee;
  }
}

function test14thSalaryCalculation(assert) {
  const employeeId = "teacher001";
  const originalGetAllPayrollsByEmployee = globalThis.getAllPayrollsByEmployee;

  try {
    loadMockPayrollsFor14thSalary(employeeId); // mock especializado

    const monthsWorked = getMonthsFor14Sueldo(employeeId);
    const sueldoMinimo = 460; // Ejemplo de sueldo mínimo

    const resultado = calcularDecimocuartaRemuneracion(monthsWorked.length, sueldoMinimo);
    const esperado = Math.round((monthsWorked.length / 12) * sueldoMinimo * 100) / 100;

    assert.equal(
      resultado,
      esperado,
      `La decimocuarta remuneración proporcional debe ser $${esperado} (por ${monthsWorked.length} meses trabajados)`
    );

  } finally {
    globalThis.getAllPayrollsByEmployee = originalGetAllPayrollsByEmployee;
  }
}

function testCreateThirteenthPayrollForTeacher(assert) {
  const originalCalculateThirteenthSalary = globalThis.calculateThirteenthSalary;
  const originalFirestoreClient = globalThis.getFirestoreClient;

  try {
    const mockEmployeeId = "empleado123";
    const mockThirteenthValue = 1350;

    // Mock valor decimotercera remuneración
    globalThis.calculateThirteenthSalary = (employeeId) => {
      assert.equal(employeeId, mockEmployeeId, "Debe calcular la decimotercera para el empleado indicado");
      return mockThirteenthValue;
    };

    // Mock Firestore
    mockFirestoreForCreation();

    // Función simulada para la prueba: se espera que ya exista en código real
    function createThirteenthPayroll(employeeId) {
      const amount = calculateThirteenthSalary(employeeId);
      const payrollData = {
        earnings: [{ name: "Decimotercera remuneración", value: amount }],
        deductions: [],
        type: "Decimotercer"
      };
      return createPayroll(employeeId, payrollData);
    }

    const payrollId = createThirteenthPayroll(mockEmployeeId);
    const firestore = getFirestoreClient();
    const createdPayrolls = firestore.getCreatedDocuments(`employees/${mockEmployeeId}/payrolls`);

    const payroll = createdPayrolls[0];

    assert.equal(payroll.type, "Decimotercer", "El rol de pago debe ser de tipo 'Decimotercer'");
    assert.equal(payroll.earnings.length, 1, "Debe haber solo un earning");
    assert.equal(payroll.earnings[0].name, "Decimotercera remuneración", "El earning debe ser 'Decimotercera remuneración'");
    assert.equal(payroll.earnings[0].value, mockThirteenthValue, "El valor debe coincidir con el cálculo esperado");

  } finally {
    globalThis.calculateThirteenthSalary = originalCalculateThirteenthSalary;
    globalThis.getFirestoreClient = originalFirestoreClient;
  }
}

function testCreateFourteenthPayrollForTeacher(assert) {
  const originalCalculateFourteenthSalary = globalThis.calculateFourteenthSalary;
  const originalFirestoreClient = globalThis.getFirestoreClient;

  try {
    const mockEmployeeId = "empleado123";
    const mockFourteenthValue = 450;

    // Mock valor decimocuarta remuneración
    globalThis.calculateFourteenthSalary = (employeeId) => {
      assert.equal(employeeId, mockEmployeeId, "Debe calcular la decimocuarta para el empleado indicado");
      return mockFourteenthValue;
    };

    // Mock Firestore
    mockFirestoreForCreation();

    // Función simulada para la prueba: se espera que exista en código real
    function createFourteenthPayroll(employeeId) {
      const amount = calculateFourteenthSalary(employeeId);
      const payrollData = {
        earnings: [{ name: "Decimocuarta remuneración", value: amount }],
        deductions: [],
        type: "Decimocuarto"
      };
      return createPayroll(employeeId, payrollData);
    }

    const payrollId = createFourteenthPayroll(mockEmployeeId);
    const firestore = getFirestoreClient();
    const createdPayrolls = firestore.getCreatedDocuments(`employees/${mockEmployeeId}/payrolls`);

    const payroll = createdPayrolls[0];

    assert.equal(payroll.type, "Decimocuarto", "El rol de pago debe ser de tipo 'Decimocuarto'");
    assert.equal(payroll.earnings.length, 1, "Debe haber solo un earning");
    assert.equal(payroll.earnings[0].name, "Decimocuarta remuneración", "El earning debe ser 'Decimocuarta remuneración'");
    assert.equal(payroll.earnings[0].value, mockFourteenthValue, "El valor debe coincidir con el cálculo esperado");

  } finally {
    globalThis.calculateFourteenthSalary = originalCalculateFourteenthSalary;
    globalThis.getFirestoreClient = originalFirestoreClient;
  }
}

function testTotal13thSalaryForAllPlantTeachers(assert) {
  const originalGetAllEmployees = globalThis.getAllEmployees;
  const originalCalculate13Sueldo = globalThis.calculate13Sueldo;

  try {
    // Arrange

    const empleadosMock = [
      {
        id: "emp1",
        firstName: "Ana",
        lastName: "López",
        nationalId: "1234567890",
        institutionalEmail: "ana@escuela.edu.ec",
      },
      {
        id: "emp2",
        firstName: "Carlos",
        lastName: "Pérez",
        nationalId: "0987654321",
        institutionalEmail: "carlos@escuela.edu.ec",
      }
    ];

    const valores13Mock = {
      emp1: 900,
      emp2: 1100
    };
    globalThis.getAllEmployees = () => empleadosMock;
    globalThis.calculate13Sueldo = (id) => valores13Mock[id];


    // Act
    const resultados = getEmployees13erSueldo();

    const totalCalculado = resultados.reduce((acc, emp) => acc + emp.total13er, 0);

    const totalEsperado = valores13Mock.emp1 + valores13Mock.emp2;

    assert.equal(
      totalCalculado,
      totalEsperado,
      `El total acumulado de la decimotercera remuneración debe ser ${totalEsperado}`
    );

  } finally {
    globalThis.getAllEmployees = originalGetAllEmployees;
    globalThis.calculate13Sueldo = originalCalculate13Sueldo;
  }
}

function testTotal14thSalaryForAllPlantTeachers(assert) {
  const originalGetAllEmployees = globalThis.getAllEmployees;
  const originalGetAllPayrollsByEmployee = globalThis.getAllPayrollsByEmployee;

  try {
    const mock = loadMockDataFor14thSalaryTest();

    const empleados = getAllEmployees();
    const valorMes = (30 / 360) * 470;
    let totalAcumulado = 0;

    empleados.forEach(emp => {
      const mesesValidos = getMonthsFor14Sueldo(emp.id);
      const totalEmpleado = mesesValidos.length * valorMes;
      totalAcumulado += totalEmpleado;

    });

    assert.equal(
      totalAcumulado,
      mock.expectedTotal,
      `El total acumulado del decimocuarto sueldo debe ser ${mock.expectedTotal}`
    );

  } finally {
    globalThis.getAllEmployees = originalGetAllEmployees;
    globalThis.getAllPayrollsByEmployee = originalGetAllPayrollsByEmployee;
  }
}

