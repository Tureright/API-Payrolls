// ---------------------- HANDLERS GET ----------------------

/**
 * Devuelve todos los empleados.
 */
function handleGetAllEmployees() {
  return getAllEmployees();
}

/**
 * Devuelve un empleado por ID.
 * @param {string} id
 */
function handleGetEmployeeById(id) {
  if (!id) {
    throw new Error("Falta el parámetro 'id'.");
  }
  return getEmployeeById(id);
}

/**
 * Devuelve el blob de la foto de perfil de un empleado.
 * @param {string} employeeId
 */
function handleGetProfilePicture(employeeId) {
  if (!employeeId) {
    throw new Error("Falta el parámetro 'employeeId'.");
  }
  return getProfilePictureBlob(employeeId);
}

function handleGetEmployees13erSueldo() {
  return getEmployees13erSueldo();
}

function handleGet13erSueldoByEmployeeId(employeeId) {
  return get13erSueldoByEmployeeId(employeeId);
}

function handleGetMonthsFor14Sueldo(employeeId) {
  return getMonthsFor14Sueldo(employeeId);
}

/**
 * Devuelve un empleado por adminId.
 * @param {string} adminId
 */
function handleGetEmployeeByAdminId(adminId) {
  if (!adminId) {
    throw new Error("Falta el parámetro 'adminId'.");
  }
  return getEmployeeByAdminId(adminId);
}


// ---------------------- HANDLERS POST ----------------------

/**
 * Crea un nuevo empleado.
 * @param {Object} employeeData
 */
function handleCreateEmployee(employeeData) {
  if (!employeeData) {
    throw new Error("Falta el parámetro 'employeeData'.");
  }
  validateEmployeeData(employeeData);
  const employeeId = createEmployee(employeeData);
  return { message: "Empleado creado", employeeId: employeeId};
}

/**
 * Actualiza un empleado existente y sincroniza carpeta de Drive.
 * @param {string} employeeId
 * @param {Object} employeeData
 */
function handleUpdateEmployee(employeeId, employeeData) {
  if (!employeeId || !employeeData) {
    throw new Error("Faltan 'employeeId' o 'employeeData'.");
  }
  validateEmployeeData(employeeData);
  updateEmployee(employeeId, employeeData);
  const folderName = getEmployeeFolderName(employeeData);
  const info = updateEmployeeFolder(employeeId, folderName);
  return {
    message: "Empleado actualizado y carpeta sincronizada",
    folderId: info.folderId,
    folderName: info.newName
  };
}

/**
 * Elimina un empleado y su carpeta.
 * @param {string} employeeId
 */
function handleDeleteEmployee(employeeId) {
  if (!employeeId) {
    throw new Error("Falta el parámetro 'employeeId'.");
  }
  deleteAllPayrollsByEmployee(employeeId);
  deleteEmployee(employeeId);
  return { message: "Empleado eliminado y carpeta Drive descartada" };
}

/**
 * Guarda la foto de perfil de un empleado (recibe base64 PNG).
 * @param {string} employeeId
 * @param {string} base64Data
 */
function handleSetProfilePicture(employeeId, base64Data) {
  if (!employeeId || !base64Data) {
    throw new Error("Faltan 'employeeId' o 'base64Data'.");
  }
  // Decodificar y crear blob
  const decoded = Utilities.base64Decode(base64Data);
  const blob = Utilities.newBlob(decoded, 'image/png', 'profilePicture.png');
  const fileInfo = setProfilePicture(employeeId, blob);
  return {
    message: "Foto de perfil guardada",
    fileId: fileInfo.id,
    fileUrl: fileInfo.url
  };
}

function handleSyncNewDocentesWithFirestore() {
  const existingDocs = getAllEmployees();
  const existingIds = existingDocs.map(doc => doc.adminId);

  const currentEmployees = listarUsuariosDeDocentes();
  const nuevosRaw = currentEmployees.filter(e => !existingIds.includes(e.adminId));
  Logger.log("Nuevos\n");
  Logger.log(JSON.stringify(nuevosRaw, null, 2));

  const nuevosCreados = nuevosRaw.map((employeeRaw) => {
    const { employeeId } = handleCreateEmployee(employeeRaw); // Crea carpeta también

    // Crear rol de pagos default
    try {
      handleCreatePayroll(employeeId, DEFAULT_PAYROLL);
    } catch (e) {
      Logger.log(`❌ Error al crear rol de pagos default para ${employeeId}: ${e.message}`);
    }

    return getEmployeeById(employeeId); // aquí ya tiene driveFolderId
  });

  // Solo sincronizar fotos de los nuevos ya creados y completos
  syncProfilePicturesOfNewEmployees(nuevosCreados);

  Logger.log(`${nuevosCreados.length} nuevos docentes sincronizados.`);
}

