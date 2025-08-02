function mockPayrollsFor13Sueldo(employeeId) {
  const now = new Date();
  const baseYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();

  const MOCK_PAYROLLS = [
    {
      employeeId,
      payrollDate: `${baseYear}-01-25`,
      payrollMonth: `${baseYear}-01-01`,
      type: "Mensual",
      volatile: false,
      earnings: [
        { description: "Sueldo básico", amount: 1000 },
        { description: "Bonificación", amount: 200 },
        { description: "Fondo de reserva", amount: 100 } // no cuenta
      ]
    },
    {
      employeeId,
      payrollDate: `${baseYear}-02-25`,
      payrollMonth: `${baseYear}-02-01`,
      type: "Mensual",
      volatile: false,
      earnings: [
        { description: "Sueldo básico", amount: 1100 }
      ]
    },
    {
      employeeId,
      payrollDate: `${baseYear}-01-15`,
      payrollMonth: `${baseYear}-01-01`,
      type: "Decimotercer",
      volatile: false,
      earnings: [
        { description: "Décimo tercero", amount: 300 }
      ]
    },
    {
      employeeId,
      payrollDate: `${baseYear}-03-10`,
      payrollMonth: `${baseYear}-03-01`,
      type: "Mensual",
      volatile: true,
      earnings: [
        { description: "Sueldo básico", amount: 1000 }
      ]
    },
    {
      employeeId,
      payrollDate: `${baseYear - 1}-12-20`,
      payrollMonth: `${baseYear - 1}-12-01`,
      type: "Mensual",
      volatile: false,
      earnings: [
        { description: "Sueldo básico", amount: 960 }
      ]
    }
  ];

  globalThis.getAllPayrollsByEmployee = (empId) => {
    return empId === employeeId ? MOCK_PAYROLLS : [];
  };
}

function loadMockPayrollsFor14thSalary(employeeId) {
  const payrolls = [
    // Simulamos que trabajó de agosto a abril (9 meses)
    { payrollDate: "2024-08-15", type: "Mensual", volatile: false },
    { payrollDate: "2024-09-15", type: "Mensual", volatile: false },
    { payrollDate: "2024-10-15", type: "Mensual", volatile: false },
    { payrollDate: "2024-11-15", type: "Mensual", volatile: false },
    { payrollDate: "2024-12-15", type: "Mensual", volatile: false },
    { payrollDate: "2025-01-15", type: "Mensual", volatile: false },
    { payrollDate: "2025-02-15", type: "Mensual", volatile: false },
    { payrollDate: "2025-03-15", type: "Mensual", volatile: false },
    { payrollDate: "2025-04-15", type: "Mensual", volatile: false },

    // Ignorados por tipo
    { payrollDate: "2025-05-15", type: "Decimotercer", volatile: false },
    { payrollDate: "2025-06-15", type: "Decimocuarto", volatile: false },
    { payrollDate: "2025-07-15", type: "Mensual", volatile: true },
  ];

  globalThis.getAllPayrollsByEmployee = (id) => id === employeeId ? payrolls : [];
}

function calcularDecimocuartaRemuneracion(mesesTrabajados, sueldoMinimo) {
  return Math.round((mesesTrabajados / 12) * sueldoMinimo * 100) / 100;
}

function loadMockDataFor14thSalaryTest() {
  const now = new Date();
  const baseYear = now.getMonth() >= 7 ? now.getFullYear() + 1 : now.getFullYear();

  function payrollDate(monthIndex, yearOffset = 0) {
    return new Date(baseYear - 1 + yearOffset, monthIndex, 5).toISOString();
  }

  const empleados = [
    {
      id: "emp1",
      firstName: "Lucía",
      lastName: "González",
      nationalId: "1111111111",
      institutionalEmail: "lucia@escuela.edu.ec",
      workPeriods: []
    },
    {
      id: "emp2",
      firstName: "Marco",
      lastName: "Vega",
      nationalId: "2222222222",
      institutionalEmail: "marco@escuela.edu.ec",
      workPeriods: []
    }
  ];

  const payrolls = {
    emp1: Array.from({ length: 12 }, (_, i) => ({
      payrollDate: payrollDate((7 + i) % 12, i < 5 ? 0 : 1),
      volatile: false,
      type: "Mensual"
    })),
    emp2: Array.from({ length: 6 }, (_, i) => ({
      payrollDate: payrollDate((7 + i) % 12, i < 5 ? 0 : 1),
      volatile: false,
      type: "Mensual"
    }))
  };

  globalThis.getAllEmployees = () => empleados;
  globalThis.getAllPayrollsByEmployee = (empId) => payrolls[empId] || [];

  const valorMes = (30 / 360) * 470;
  const expectedTotal = (12 + 6) * valorMes;

  return {
    employees: empleados,
    expectedTotal
  };
}



