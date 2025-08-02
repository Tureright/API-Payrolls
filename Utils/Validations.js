// --------------------------- EMPLOYEE VALIDATIONS ---------------------------
/**
 * Valida los datos del empleado.
 * @param {Object} data - Objeto con los datos del empleado.
 * @throws {Error} Si algún campo no cumple las especificaciones.
 */
function validateEmployeeData(data) {
  if (data.firstName === undefined || typeof data.firstName !== "string") {
    throw new Error("El campo 'firstName' es obligatorio y debe ser string.");
  }

  if (data.lastName === undefined || typeof data.lastName !== "string") {
    throw new Error("El campo 'lastName' es obligatorio y debe ser string.");
  }

  if (data.nationalId === undefined || typeof data.nationalId !== "string") {
    throw new Error("El campo 'nationalId' es obligatorio y debe ser string.");
  }

  if (
    data.birthDate === undefined ||
    (data.birthDate !== "" && isNaN(new Date(data.birthDate).valueOf()))
  ) {
    throw new Error("El campo 'birthDate' es obligatorio y debe tener formato de fecha válido o estar vacío.");
  }

  if (data.institutionalEmail === undefined || typeof data.institutionalEmail !== "string") {
    throw new Error("El campo 'institutionalEmail' es obligatorio y debe ser string.");
  }

  if (!Array.isArray(data.workPeriods)) {
    throw new Error("El campo 'workPeriods' es obligatorio y debe ser un arreglo.");
  }

  data.workPeriods.forEach((period, index) => {
    if (
      period.startDate === undefined ||
      (period.startDate !== "" && isNaN(new Date(period.startDate).valueOf()))
    ) {
      throw new Error(
        `El campo 'startDate' es obligatorio y debe tener formato válido o estar vacío en el periodo de trabajo #${index + 1}.`
      );
    }

    if (
      period.endDate === undefined ||
      (period.endDate !== "" &&
        period.endDate !== "Actualmente trabajando" &&
        isNaN(new Date(period.endDate).valueOf()))
    ) {
      throw new Error(
        `El campo 'endDate' es obligatorio y debe ser 'Actualmente trabajando', tener formato válido o estar vacío en el periodo de trabajo #${index + 1}.`
      );
    }

    if (period.jobPosition === undefined || typeof period.jobPosition !== "string") {
      throw new Error(
        `El campo 'jobPosition' es obligatorio y debe ser string en el periodo de trabajo #${index + 1}.`
      );
    }
  });
}


/**
 * Ajusta los periodos de trabajo activos, garantizando solo uno.
 * @param {Array<Object>} oldWorkPeriods - Periodos previos.
 * @param {Array<Object>} newWorkPeriods - Periodos nuevos.
 * @returns {Array<Object>} Periodos ordenados y con un solo activo.
 * @throws {Error} Si los parámetros no son arrays.
 */
function validationCurrentWorkPeriod(oldWorkPeriods, newWorkPeriods) {
  const ACTIVE_LABEL = "Actualmente trabajando";
  if (!Array.isArray(oldWorkPeriods) || !Array.isArray(newWorkPeriods)) {
    throw new Error('Los workPeriods deben ser arreglos.');
  }

  const newActives = newWorkPeriods.filter((p) => p.endDate === ACTIVE_LABEL);
  if (newActives.length <= 1) return newWorkPeriods;

  function isSamePeriod(a, b) {
    return a.jobPosition === b.jobPosition && a.startDate === b.startDate;
  }

  const oldActive = oldWorkPeriods.find((p) => p.endDate === ACTIVE_LABEL);

  let chosen = null;
  if (oldActive) {
    chosen = newActives.find((p) => !isSamePeriod(p, oldActive));
  }

  if (!chosen) {
    chosen = newActives.reduce((prev, curr) =>
      new Date(prev.startDate) > new Date(curr.startDate) ? prev : curr
    );
  }

  const sorted = newWorkPeriods.slice().sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  return sorted.map((current, index, array) => {
    if (current.endDate === ACTIVE_LABEL && current !== chosen) {
      const next = array[index + 1];
      return {
        jobPosition: current.jobPosition,
        startDate: current.startDate,
        endDate: next ? next.startDate : current.endDate,
      };
    }
    return current;
  });
}

// --------------------------- PAYROLLS VALIDATIONS ---------------------------
/**
 * Valida los datos del rol de pago.
 * @param {Object} payrollData - Datos del rol de pago.
 * @throws {Error} Si los datos no son válidos.
 */
function validatePayrollData(payrollData) {
  if (!payrollData || typeof payrollData !== 'object') {
    throw new Error('El parámetro payrollData debe ser un objeto válido.');
  }
  if (!Array.isArray(payrollData.earnings)) {
    throw new Error("El campo 'earnings' es obligatorio y debe ser un arreglo.");
  }
  if (!Array.isArray(payrollData.deductions)) {
    throw new Error("El campo 'deductions' es obligatorio y debe ser un arreglo.");
  }
  if (!payrollData.payrollDate || isNaN(new Date(payrollData.payrollDate).valueOf())) {
    throw new Error("El campo 'payrollDate' es obligatorio y debe tener formato de fecha válido.");
  }
  if (payrollData.payrollMonth && isNaN(new Date(payrollData.payrollMonth).valueOf())) {
    throw new Error("El campo 'payrollMonth' debe tener formato de fecha válido.");
  }

  payrollData.earnings.forEach(validateTransaction);
  payrollData.deductions.forEach(validateTransaction);
}

/**
 * Valida una transacción de ingreso o deducción.
 * @param {Object} transaction - Transacción a validar.
 * @throws {Error} Si la transacción no es válida.
 */
function validateTransaction(transaction) {
  if (!transaction.description || typeof transaction.description !== 'string') {
    throw new Error("Cada transacción debe tener una 'description' de tipo string.");
  }
  if (typeof transaction.amount !== 'number' || isNaN(transaction.amount)) {
    throw new Error("Cada transacción debe tener un 'amount' de tipo number.");
  }
}