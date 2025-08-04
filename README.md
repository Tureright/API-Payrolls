## 📚 Table of Contents

* [🛠️ About This Project](#about-this-project)
* [🧱 Architecture Overview](#architecture-overview)
* [✅ Development Practices](#development-practices)
* [📁 Modules](#modules)

  * [👥 Employees Module](#employees-module)
  * [📄 Payroll Module](#payroll-module)
  * [📆 Calendar Module](#calendar-module)
* [🧪 Quality Assurance](#quality-assurance)

  * [✅ TDD with QUnitGS2](#tdd-with-qunitgs2)
  * [📄 Test Suite Overview](#test-suite-overview)
  * [🔍 Example: Testing Payroll Types for a Specific Admin](#example-testing-payroll-types-for-a-specific-admin)
  * [🧪 Summary](#summary)

## 🛠️ About This Project <a name="about-this-project"></a>

This repository contains the **backend implementation** of Gardner Academy's ERP system, developed using **Google Apps Script (GAS)**. It is deployed within the institution’s Google Workspace and managed exclusively by the institutional developer account:
📧 `developers@gardneracademy.edu.ec`.

The backend operates as a **serverless application**, with each feature exposed as an **HTTP-accessible handler**. Internally, it follows a modular design inspired by the **Model-View-Controller (MVC)** pattern to ensure separation of concerns and maintainability.

## 🧱 Architecture Overview <a name="architecture-overview"></a>

The application is structured around two main entry points (Routes.gs):

* `doGet(e)` – for **data retrieval**
* `doPost(e)` – for **mutations** (create, update, delete)

These functions interpret incoming HTTP requests by reading the `action` parameter and dispatch the call to a **controller function (handler)**. Controllers execute logic via **service layers**, which access Firestore or external APIs (e.g., Google Calendar).

> The frontend (View) sends requests → the router identifies the handler (Controller) → the controller processes business logic via services (Model) → response is returned.

This serverless + MVC architecture is documented as part of the system's C4 model.

## ✅ Development Practices <a name="development-practices"></a>

The backend was built using a **Test-Driven Development (TDD)** methodology. Automated tests were written using [**QUnitGS2**](https://github.com/artofthesmart/QUnitGS2), a GAS-compatible testing library. Each feature was implemented after a failing test was written, and then refactored to meet code quality standards.

## 📁 Modules <a name="modules"></a>

Each functional module follows the **MVC-inspired pattern** adapted for Google Apps Script. Controllers act as entry points and invoke service functions that interact with Firestore or Google APIs. Common utility functions for formatting and parsing are located in the `Utils` directory.

### 👥 Employees Module <a name="employees-module"></a>

This module manages the **teachers' data**, including profile information, work history, and document references. All employee records are stored in the Firestore collection `employees`.

#### 🔧 Example: Get All Employees

* **Controller**: `Controllers/EmployeeController.gs`

```js
/**
 * Returns a list of all employees.
 */
function handleGetAllEmployees() {
  return getAllEmployees();
}
```

* **Service**: `Services/EmployeeService.gs`

```js
function getAllEmployees() {
  const docs = getFirestoreClient().getDocuments('employees');
  return docs.map(doc => {
    const emp = enrichWithId(doc); // Utility function to inject Firestore doc ID
    emp.birthDate = formatDateLocal(parseISOToDate(emp.birthDate), 'yyyy-MM-dd');
    emp.workPeriods = emp.workPeriods.map(p => ({
      jobPosition: p.jobPosition,
      startDate: formatDateLocal(parseISOToDate(p.startDate), 'yyyy-MM-dd'),
      endDate: p.endDate === "Actualmente trabajando"
               ? p.endDate
               : formatDateLocal(parseISOToDate(p.endDate), 'yyyy-MM-dd')
    }));
    return emp;
  });
}
```

* 🧰 **Utils Used**:

  * `enrichWithId()`: Adds Firestore document ID as a field
  * `formatDateLocal()`, `parseISOToDate()`: Format and parse date fields

### 📄 Payroll Module <a name="payroll-module"></a>

Handles **salary records** for teachers. Each payroll is a subdocument inside an employee's Firestore document under the `payrolls` subcollection.

#### 🔧 Example: Get All Payrolls

* **Controller**: `Controllers/PayrollController.gs`

```js
function handleGetAllPayrolls() {
  const payrolls = getAllPayrolls();
  return payrolls.map(p => ({
    ...p,
    payrollDate: toLocalDateString(p.payrollDate, 'yyyy-MM-dd HH:mm:ss'),
    payrollMonth: toLocalDateString(p.payrollMonth, 'yyyy-MM')
  }));
}
```

* **Service**: `Services/PayrollService.gs`

```js
/**
 * Returns all payrolls from all employees.
 */
function getAllPayrolls() {
  const employees = getAllEmployees(); // Reuses EmployeeService
  const allPayrolls = [];

  employees.forEach(({ id: employeeId }) => {
    const payrolls = getAllPayrollsByEmployee(employeeId);
    allPayrolls.push(...payrolls);
  });

  return allPayrolls;
}
```

* 🧰 **Utils Used**:

  * `toLocalDateString()`: Formats timestamps to human-readable date strings

### 📆 Calendar Module <a name="calendar-module"></a>

This module uses the **Google Calendar API** to manage event schedules. Each employee stores a reference to their calendar via a `calendarId`.

#### 🔧 Example: List Valid Calendars for Employees

* **Controller**: `Controllers/CalendarController.gs`

```js
function handleListCalendars() {
  return listCalendarsForEmployees();
}
```

* **Service**: `Services/CalendarService.gs`

```js
/**
 * Lists all valid calendars assigned to employees.
 */
function listCalendarsForEmployees() {
  const employees = handleGetAllEmployees(); // Reuses the controller
  const validCalendars = [];

  const employeesWithCalendars = employees.filter(emp => !!emp.calendarId);

  for (const emp of employeesWithCalendars) {
    try {
      const cal = Calendar.Calendars.get(emp.calendarId);
      if (cal.primary || cal.id.includes('holiday')) continue;

      validCalendars.push({
        id: cal.id,
        summary: cal.summary,
        accessRole: cal.accessRole,
        employeeId: emp.id
      });
    } catch (error) {
      Logger.log(`Error with calendarId ${emp.calendarId} (employee ${emp.id}): ${error.message}`);
    }
  }

  return { success: true, calendars: validCalendars };
}
```

* 🧰 **Integration Used**:

  * `Google Calendar Advanced Service` (`Calendar.Calendars.get()`)

## 🧪 Quality Assurance <a name="quality-assurance"></a>

The backend for the ERP system was developed using **Test-Driven Development (TDD)** to ensure that the business logic meets the defined user requirements from the very beginning. The testing framework used is QUnitGS2, a unit testing library specifically built for Google Apps Script.

All core modules (Employees, Payroll, Calendars) are validated through automated tests written using QUnitGS2, executed directly via the `doGet()` entry point of a dedicated testing script file.

### ✅ TDD with QUnitGS2 <a name="tdd-with-qunitgs2"></a>

In accordance with TDD principles, each functionality starts with a failing test based on acceptance criteria derived from the user stories. The implementation is then iteratively written until the test passes, followed by code refactoring if needed.

### 📄 Test Suite Overview <a name="test-suite-overview"></a>

Here's an overview of the test suite as registered in the `doGet()` method of the test runner:

```js
QUnit.test("PUnit02: HU1-Criterio3: Se deben mostrar todos los tipos de roles de pago del profesor", function (assert) {
  testPayrollTypesByAdmin(assert);
});
```

Each test maps directly to a **User Story** (HU) and a specific **acceptance criterion**, forming a complete traceable test plan that aligns the implementation with business requirements.

### 🔍 Example: Testing Payroll Types for a Specific Admin <a name="example-testing-payroll-types-for-a-specific-admin"></a>

#### 🌟 Objective

Verify that a professor (identified via `adminId`) has payrolls of all valid types:

* `Mensual` (Monthly)
* `Decimotercer` (13th salary)
* `Decimocuarto` (14th salary)

#### 🧪 Test Function

```js
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

    assert.equal(
      allPayrolls.length,
      payrollsFiltrados.length,
      `Se deben obtener todos los roles con tipos ${tiposEsperados.join(", ")}`
    );
  } finally {
    // Restore original implementations
    globalThis.getAllEmployees = originalGetAllEmployees;
    globalThis.getAllPayrollsByEmployee = originalGetAllPayrollsByEmployee;
  }
}
```

#### 🧪 Mock Setup

To isolate the unit under test and remove dependency on live Firestore data, mocked data is injected using the following helper:

```js
function loadMockDataForAdmin(adminId) {
  const EMPLEADO_MOCK = buildEmployeeData({
    firstName: "Juan",
    lastName: "Pérez",
    nationalId: "0102030405",
    birthDate: "1990-01-01",
    institutionalEmail: "juan@colegio.edu.ec",
    adminId: adminId
  });

  const ROLES_MOCK = [
    { type: "Mensual" }, { type: "Mensual" },
    { type: "Decimotercer" }, { type: "Decimotercer" },
    { type: "Decimocuarto" }, { type: "Decimocuarto" }
  ].map(p => ({
    ...p,
    employeeId: EMPLEADO_MOCK.adminId,
    volatile: false,
    adminId: adminId
  }));

  globalThis.getAllEmployees = () => [EMPLEADO_MOCK];
  globalThis.getAllPayrollsByEmployee = (empId) =>
    ROLES_MOCK.filter(p => p.employeeId === empId);
}
```

This mock structure ensures that:

* All expected payroll types exist
* The behavior of services remains testable and predictable
* No connection to external systems (like Firestore or Drive) is needed

### 🧪 Summary <a name="summary"></a>

* Tests are run from a dedicated test endpoint (`doGet()`), making results observable in the browser
* Each test is named and organized by **HU (User Story)** and **Criterio (Acceptance Criteria)** for traceability
* Utility mocking patterns help isolate test logic from live systems
* All modules (Employees, Payrolls, Calendars) are covered through unit tests using this structure

You may run the test suite by deploying the test file and accessing its public `doGet()` endpoint in your browser.
