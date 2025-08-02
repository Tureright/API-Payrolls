// ------------------------------ GET ------------------------------

function getAllEmployees() {
  const docs = getFirestoreClient().getDocuments('employees');
  return docs.map(doc => {
    const emp = enrichWithId(doc);
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

function getEmployeeById(id) {
  const rec = getFirestoreClient().getDocument(`employees/${id}`);
  if (!rec) return null;
  const emp = { id, ...rec.obj };
  emp.birthDate = formatDateLocal(parseISOToDate(emp.birthDate), 'yyyy-MM-dd');
  emp.workPeriods = emp.workPeriods.map(p => ({
    jobPosition: p.jobPosition,
    startDate: formatDateLocal(parseISOToDate(p.startDate), 'yyyy-MM-dd'),
    endDate: p.endDate === "Actualmente trabajando"
             ? p.endDate
             : formatDateLocal(parseISOToDate(p.endDate), 'yyyy-MM-dd')
  }));
  return emp;
}

function getCurrentJobPosition(employeeId) {
  const employee = getEmployeeById(employeeId);
  if (!employee) {
    throw new Error(`Empleado con id ${employeeId} no encontrado`);
  }
  const current = employee.workPeriods.find(p => p.endDate === "Actualmente trabajando");
  return current ? current.jobPosition : null;
}

/**
 * Genera una lista con el décimo tercer sueldo de todos los empleados.
 * @returns {Array<{empleado: string, total13er: number, fullName: string}>}
 */
function getEmployees13erSueldo() {
  const employees = getAllEmployees();
  const result = [];

  employees.forEach(emp => {
    try {
      const total13er = calculate13Sueldo(emp.id);
      
      result.push({
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        fullName: `${emp.firstName} ${emp.lastName}`,
        nationalId: emp.nationalId,
        institutionalEmail: emp.institutionalEmail,
        workPeriods: emp.workPeriods, 
        total13er: total13er
      });

    } catch (e) {
      Logger.log(`Error calculando 13er sueldo para ${emp.firstName} ${emp.lastName}: ${e}`);
    }
  });

  return result;
}


function get13erSueldoByEmployeeId(employeeId) {
  const arrayOfMonths13 =  calculate13SueldoByMonth(employeeId);

  return arrayOfMonths13;
}

/**
 * Devuelve un empleado asociado a un adminId.
 * @param {string} adminId
 * @returns {Object|null}
 */
function getEmployeeByAdminId(adminId) {
  if (!adminId) throw new Error("Falta el parámetro 'adminId'.");
  const employees = getFirestoreClient().getDocuments('employees');
  const employee = employees.find(doc => doc.obj.adminId === adminId);
  if (!employee) return null;

  const emp = enrichWithId(employee);
  emp.birthDate = formatDateLocal(parseISOToDate(emp.birthDate), 'yyyy-MM-dd');
  emp.workPeriods = emp.workPeriods.map(p => ({
    jobPosition: p.jobPosition,
    startDate: formatDateLocal(parseISOToDate(p.startDate), 'yyyy-MM-dd'),
    endDate: p.endDate === "Actualmente trabajando"
      ? p.endDate
      : formatDateLocal(parseISOToDate(p.endDate), 'yyyy-MM-dd')
  }));
  return emp;
}



// ------------------------------ POST ------------------------------

function createEmployee(employeeDataRaw) {
  const data = buildEmployeeData(employeeDataRaw);
  data.driveFolderId = createEmployeeFolder(getEmployeeFolderName(employeeDataRaw));
  const document = getFirestoreClient().createDocument('employees', data);
  return extractIdFromPath(document.path);
}

function updateEmployee(employeeId, employeeDataRaw) {
  const data = buildEmployeeData(employeeDataRaw);
  getFirestoreClient().updateDocument(`employees/${employeeId}`, data, true);
}

function deleteEmployee(employeeId) {
  const emp = getEmployeeById(employeeId);
  if (emp?.driveFolderId) {
    deleteEmployeeFolderById(emp.driveFolderId);
  }
  getFirestoreClient().deleteDocument(`employees/${employeeId}`);
}

// --- EMPLOYEE FOLDERS ---

function createEmployeeFolder(folderName) {
  const root = DriveApp.getFolderById(DRIVE_EMPLOYEE_FOLDER_ID);
  const folder = root.createFolder(folderName);
  return folder.getId();
}

function updateEmployeeFolder(employeeId, newFolderName) {
  const emp = getEmployeeById(employeeId);
  if (!emp || !emp.driveFolderId) {
    throw new Error(`Empleado o carpeta no encontrado: ${employeeId}`);
  }
  const folder = DriveApp.getFolderById(emp.driveFolderId);
  if (folder.getName() !== newFolderName) {
    folder.setName(newFolderName);
  }
  return { folderId: emp.driveFolderId, newName: folder.getName() };
}

function deleteEmployeeFolderById(driveFolderId) {
  const folder = DriveApp.getFolderById(driveFolderId);
  folder.setTrashed(true);
}

// ---- OTHERS -----

function setProfilePicture(employeeId, blobIn) {
  const emp = getEmployeeById(employeeId);
  if (!emp || !emp.driveFolderId) {
    throw new Error(`Carpeta faltante para empleado ${employeeId}`);
  }

  const mime = blobIn.getContentType();
  if (mime !== 'image/png') {
    throw new Error('Solo se permiten imágenes en formato PNG.');
  }

  const fileName = 'profilePicture.png';
  blobIn.setName(fileName);

  const folder = DriveApp.getFolderById(emp.driveFolderId);
  const existing = folder.getFilesByName(fileName);
  while (existing.hasNext()) {
    existing.next().setTrashed(true);
  }

  const file = folder.createFile(blobIn);
  return { id: file.getId(), url: file.getUrl() };
}

function getProfilePictureBlob(employeeId) {
  const emp = getEmployeeById(employeeId);
  if (!emp || !emp.driveFolderId) {
    throw new Error(`Empleado o carpeta no encontrada: ${employeeId}`);
  }
  const folder = DriveApp.getFolderById(emp.driveFolderId);
  const files = folder.getFiles();
  while (files.hasNext()) {
    const f = files.next();
    if (f.getName().startsWith('profilePicture.')) {
      return f.getBlob();
    }
  }
  throw new Error(`No se encontró ninguna 'profilePicture.*' en la carpeta.`);
}
