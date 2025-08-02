var QUnit = QUnitGS2.QUnit;

function doGet() {
  QUnitGS2.init();

  QUnit.test("PUnit01: HU1-Criterio2: Los roles de pago devueltos deben pertenecer al profesor autenticado", function (assert) {
    testPayrollsByAdmin(assert);
  });

  QUnit.test("PUnit02: HU1-Criterio3: Se deben mostrar todos los tipos de roles de pago del profesor: mensuales, de decimotercera remuneración y decimocuarta remuneración", function (assert) {
    testPayrollTypesByAdmin(assert);
  });

  QUnit.test("PUnit03: HU2-Criterio1: Las UO2 y UO3 pueden acceder a todos los roles de todos los empleados", function (assert) {
    testGetAllPayrollsForOU2AndOU3(assert);
  });

  QUnit.test("PUnit04: HU2-Criterio2: Permite la creación de roles de pago mensuales de cada uno de los profesores de planta de la institución.", function (assert) {
    testCreateMonthlyPayrollForTeacher(assert);
  });

  QUnit.test("PUnit05: HU2-Criterio3: Los roles de pago deben tener toda la información detallada en la plantilla del rol de pago", function (assert) {
    testPayrollTemplateData(assert);
  });

  QUnit.test("PUnit06: HU2-Criterio4: Usa la información del rol de pago más reciente como plantilla precargada", function (assert) {
    testLatestPayrollTemplateFromHistory(assert);
  });

  QUnit.test("PUnit07: HU2-Criterio5: Permite modificar earnings en un rol de pago existente", function (assert) {
    testUpdatePayrollEarnings(assert);
  });

  QUnit.test("PUnit08: HU2-Criterio6: Permite el almacenamiento en Google Drive de los roles de pago de cada profesor, organizándolos en carpetas individuales por cada profesor.", function (assert) {
    testCreateDriveFolderForEmployee(assert);
  });

  QUnit.test("PUnit09: HU3-Criterio1: Cálculo correcto del valor mensual de la decimotercera remuneración para el periodo actual", function (assert) {
    test13SueldoCalculation(assert);
  });

  QUnit.test("PUnit10: HU3-Criterio2: Calcula la decimocuarta remuneración proporcional correctamente", function (assert) {
    test14thSalaryCalculation(assert);
  });


  QUnit.test("PUnit11: HU3-Criterio3: Genera el rol de pago con valor correcto de decimotercera remuneración", function (assert) {
    testCreateThirteenthPayrollForTeacher(assert);
  });

  QUnit.test("PUnit12: HU3-Criterio4: Genera el rol de pago con valor correcto de decimocuarta remuneración", function (assert) {
    testCreateFourteenthPayrollForTeacher(assert);
  });

  QUnit.test("PUnit13: HU3-Criterio5: Calcula la suma total de la decimotercera remuneración de todos los profesores de planta", function (assert) {
    testTotal13thSalaryForAllPlantTeachers(assert);
  });

  QUnit.test("PUnit14: HU3-Criterio6: Calcula correctamente el acumulado del decimocuarto sueldo", function (assert) {
    testTotal14thSalaryForAllPlantTeachers(assert);
  });

  QUnit.test("PUnit15: HU4-Criterio1: Se crean eventos recurrentes hasta la fecha indicada", function (assert) {
    testRecurringEventInsertion(assert);
  });

  QUnit.test("PUnit16: HU4-Criterio2: Cada profesor debe estar vinculado a un calendario del periodo académico vigente", function (assert) {
    testEmployeeCalendarLink(assert);
  });

  QUnit.test("PUnit17: HU4-Criterio3: El calendario se comparte únicamente con el profesor correspondiente", function (assert) {
    testSendCalendarToEmployee(assert);
  });


  QUnit.start();
  return QUnitGS2.getHtml();
}

function getResultsFromServer() {
  return QUnitGS2.getResultsFromServer();
}
