function loadMockDataForAdmin(adminId) {
  // Empleado único
  const EMPLEADO_MOCK = buildEmployeeData({
    firstName: "Juan",
    lastName: "Pérez",
    nationalId: "0102030405",
    birthDate: "1990-01-01",
    institutionalEmail: "juan@colegio.edu.ec",
    adminId: adminId
  });

  // 6 roles: 2 por tipo válido
  const ROLES_MOCK = [
    { type: "Mensual", employeeId: EMPLEADO_MOCK.adminId, volatile: false, adminId: adminId },
    { type: "Mensual", employeeId: EMPLEADO_MOCK.adminId, volatile: false, adminId: adminId },
    { type: "Decimotercer", employeeId: EMPLEADO_MOCK.adminId, volatile: false, adminId: adminId },
    { type: "Decimotercer", employeeId: EMPLEADO_MOCK.adminId, volatile: false, adminId: adminId },
    { type: "Decimocuarto", employeeId: EMPLEADO_MOCK.adminId, volatile: false, adminId: adminId },
    { type: "Decimocuarto", employeeId: EMPLEADO_MOCK.adminId, volatile: false, adminId: adminId }
  ].map(formatPayrollData); // Aplica formato si lo necesitas

  // Mock para getAllEmployees (retorna arreglo con un solo empleado)
  globalThis.getAllEmployees = () => [EMPLEADO_MOCK];

  // Mock para getAllPayrollsByEmployee
  globalThis.getAllPayrollsByEmployee = (empId) =>
    ROLES_MOCK.filter(p => p.employeeId === empId);
}

function loadMockDataForAllAccess() {
  const mockEmployeesRaw = [
    {
      id: "emp1",
      firstName: "Ana",
      lastName: "Ramírez",
      nationalId: "1234567890",
      birthDate: "1990-05-20",
      workPeriods: [
        {
          jobPosition: "Docente",
          startDate: "2018-01-01",
          endDate: "Actualmente trabajando"
        }
      ],
      institutionalEmail: "ana.ramirez@escuela.edu.ec"
    },
    {
      id: "emp2",
      firstName: "Carlos",
      lastName: "Lopez",
      nationalId: "0987654321",
      birthDate: "1985-08-15",
      workPeriods: [
        {
          jobPosition: "Docente",
          startDate: "2019-03-10",
          endDate: "2024-02-28"
        }
      ],
      institutionalEmail: "carlos.lopez@escuela.edu.ec"
    }
  ];

  const employees = mockEmployeesRaw.map(raw => {
    const emp = buildEmployeeData(raw);
    emp.id = raw.id;
    return emp;
  });

  const payrolls = [
    { employeeId: "emp1", month: "2024-01" },
    { employeeId: "emp1", month: "2024-02" },
    { employeeId: "emp2", month: "2024-01" },
    { employeeId: "emp2", month: "2024-02" }
  ];

  globalThis.getAllEmployees = () => employees;
  globalThis.getAllPayrollsByEmployee = (empId) => payrolls.filter(p => p.employeeId === empId);

  return {
    employees,
    expectedPayrollCount: payrolls.length
  };
}

function mockFirestoreForCreation() {
  const store = {};

  const mockClient = {
    createDocument: (path, data) => {
      if (!store[path]) store[path] = [];
      store[path].push(data);
      const id = `mock-${store[path].length}`;
      return { path: `${path}/${id}` };
    },
    getCreatedDocuments: (path) => store[path] || []
  };

  globalThis.getFirestoreClient = () => mockClient;
}

function loadMockDataForPayrollTemplate() {
  const mockEmployee = {
    id: "emp123",
    firstName: "Lucía",
    lastName: "Mendoza",
    nationalId: "1122334455",
    birthDate: "1980-12-12",
    workPeriods: [{
      jobPosition: "Docente de Inglés",
      startDate: "2021-01-01",
      endDate: "Actualmente trabajando"
    }],
    institutionalEmail: "lucia.mendoza@colegio.edu.ec"
  };

  const mockPayroll = {
    id: "pay001",
    employeeId: "emp123",
    earnings: [
      { description: "Sueldo básico", amount: 500 },
      { description: "Horas extras", amount: 100 }
    ],
    deductions: [
      { description: "IESS", amount: 45 }
    ],
    payrollDate: "2025-07-01",
    payrollMonth: "Julio 2025",
    volatile: false,
    driveId: "drive123",
    type: "Mensual"
  };

  globalThis.getEmployeeById = (id) => mockEmployee;
  globalThis.getPayrollById = (employeeId, payrollId) => mockPayroll;
}

