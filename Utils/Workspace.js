//-------------- MAIN -------------
function initializeDocentes() {
  const employees = listarUsuariosDeDocentes();
  employees.forEach(employee => {
    handleCreateEmployee(employee);
  });
}


function listarUsuariosDeDocentes() {
  const customerId = "my_customer";
  const unidad = "/Docentes";
  let pageToken;
  const allEmployees = [];
  
  do {
    const response = AdminDirectory.Users.list({
      customer: customerId,
      query: `orgUnitPath='${unidad}'`,
      maxResults: 100,
      pageToken: pageToken,
      orderBy: 'email'
    });
    if (response.users && response.users.length > 0) {
      const filtered = response.users.filter(user => user.orgUnitPath === unidad);
      const transformed = formatDocentesToEmployees(filtered);
      allEmployees.push(...transformed);
    }

    pageToken = response.nextPageToken;
  } while (pageToken);
  Logger.log(JSON.stringify(allEmployees, null, 2));
  return allEmployees; 
}


function formatDocentesToEmployees(users) {
  return users.map(user => {
    const { firstName, lastName } = splitFullName(user.name.fullName);
    const orgUnit = user.orgUnitPath || "";
    const creationTime = user.creationTime || "1900-01-01T00:00:00Z";
    const lastLoginTime = user.lastLoginTime || "1900-01-02T00:00:00Z";
    const suspended = user.suspended || false;

    let startDate = creationTime;
    let endDate;

        // Buscar el externalId con type 'organization'
    const nationalId = (user.externalIds || []).find(id => id.type === "organization")?.value || "";


    if (orgUnit === "/Docentes") {
      endDate = "Actualmente trabajando";
    } else if (orgUnit === "/Docentes/Ex-Empleados") {
      endDate = lastLoginTime;
    } else {
      // Por si está en otra unidad organizativa no esperada
      endDate = "1900-01-02T00:00:00Z";
    }

    return {
      firstName: firstName || "",
      lastName: lastName || "",
      nationalId: nationalId || "0123456789",
      birthDate: "1900-01-01T00:00:00Z",
      workPeriods: [{
        jobPosition: "Profesor titular",
        startDate: startDate,
        endDate: endDate
      }],
      institutionalEmail: user.primaryEmail || "",
      adminId: user.id || "",
      suspended: suspended,
    };
  });
}


function splitFullName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 3) {
    // Asumimos los dos últimos son apellidos
    const lastName = parts.slice(-2).join(" ");
    const firstName = parts.slice(0, -2).join(" ");
    return { firstName, lastName };
  } else if (parts.length === 2) {
    return { firstName: parts[0], lastName: parts[1] };
  } else {
    return { firstName: fullName, lastName: "" };
  }
}

const DEFAULT_PAYROLL = {
  earnings: [
    {
      description: "Sueldo",
      amount: 460.0,
    },
    {
      description: "Fondo de reserva",
      amount: 38.32,
    },
  ],
  deductions: [
    {
      description: "Aporte personal",
      amount: 43.47,
    },
  ],
  payrollDate: "2025-01-13T10:15:00.000Z",
  payrollMonth: "2025-01-13T00:00:00.000Z",
  volatile: true,
};


function syncAllProfilePictures() {
  const allUsers = AdminDirectory.Users.list({
    customer: "my_customer",
    maxResults: 500,
    orderBy: "email"
  }).users;

  const docentes = allUsers.filter(user => user.orgUnitPath == "/Docentes");

  syncProfilePicturesFromWorkspace(docentes);
}


function syncProfilePicturesFromWorkspace(usersFromWorkspace) {
  const defaultPhotoUrl = "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"; // o cualquier otra URL pública
  const employees = getAllEmployees();

  employees.forEach(emp => {
    const workspaceUser = usersFromWorkspace.find(u => u.id === emp.adminId);
    if (!workspaceUser) {
      Logger.log(`No se encontró en Workspace al empleado ${emp.firstName} ${emp.lastName}`);
      return;
    }

    const photoUrl = workspaceUser.thumbnailPhotoUrl || defaultPhotoUrl;
    try {
      const blob = UrlFetchApp.fetch(photoUrl).getBlob();
      uploadProfilePictureToDrive(emp.driveFolderId, blob);
      Logger.log(`Foto cargada para: ${emp.firstName} ${emp.lastName}`);
    } catch (err) {
      Logger.log(`Error al descargar foto para ${emp.firstName} ${emp.lastName}: ${err}`);
    }
  });
}


function uploadProfilePictureToDrive(folderId, blob) {
  const folder = DriveApp.getFolderById(folderId);
  const fileName = "profilePicture.png";

  // Elimina anteriores si existen
  const existing = folder.getFilesByName(fileName);
  while (existing.hasNext()) {
    existing.next().setTrashed(true);
  }

  // Sube la nueva foto
  blob.setName(fileName);
  folder.createFile(blob);
}

function syncProfilePicturesOfNewEmployees(nuevos) {
  if (!nuevos || nuevos.length === 0) return;

  const docentesFromWorkspace = AdminDirectory.Users.list({
    customer: "my_customer",
    maxResults: 500,
    orderBy: "email"
  }).users.filter(user => user.orgUnitPath === "/Docentes");

  const defaultPhotoUrl = "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png";

  nuevos.forEach(emp => {
    if (!emp.driveFolderId) {
      Logger.log(`Empleado ${emp.firstName} ${emp.lastName} no tiene carpeta aún, se omite`);
      return;
    }

    const workspaceUser = docentesFromWorkspace.find(u => u.id === emp.adminId);
    if (!workspaceUser) {
      Logger.log(`No se encontró en Workspace al nuevo docente ${emp.firstName} ${emp.lastName}`);
      return;
    }

    const photoUrl = workspaceUser.thumbnailPhotoUrl || defaultPhotoUrl;

    try {
      const blob = UrlFetchApp.fetch(photoUrl).getBlob();
      uploadProfilePictureToDrive(emp.driveFolderId, blob);
      Logger.log(`Foto cargada para nuevo docente: ${emp.firstName} ${emp.lastName}`);
    } catch (err) {
      Logger.log(`Error al descargar foto para ${emp.firstName} ${emp.lastName}: ${err}`);
    }
  });
}





//---------- EXTRAS ------------------
function listarExDocentesSinTransformacion() {
  const customerId = "my_customer";
  const unidad = "/Docentes"; // Asegúrate que el nombre esté bien escrito
  let pageToken;
  const allUsers = [];

  do {
    const response = AdminDirectory.Users.list({
      customer: customerId,
      query: `orgUnitPath='${unidad}'`,
      maxResults: 100,
      pageToken: pageToken,
      orderBy: 'email'
    });

    if (response.users && response.users.length > 0) {
      allUsers.push(...response.users); // Sin transformación
    }

    pageToken = response.nextPageToken;
  } while (pageToken);

  Logger.log(JSON.stringify(allUsers, null, 2));
  return allUsers;
}



function listarUnidadesOrganizativas() {
  const customerId = 'my_customer'; 
  const orgUnitPath = '/'; 

  const response = AdminDirectory.Orgunits.list(customerId, {
    orgUnitPath: orgUnitPath,
    type: 'all'  // puede ser 'all', 'children' o 'descendants'
  });

  if (response.organizationUnits && response.organizationUnits.length > 0) {
    response.organizationUnits.forEach(ou => {
      Logger.log(`Nombre: ${ou.name}, Ruta: ${ou.orgUnitPath}`);
    });
  } else {
    Logger.log("No se encontraron unidades organizativas.");
  }
}

function deleteAllEmployeesExceptOne() {
  const keepId = "tclYs9eNPIDTDLDwBs82";
  const allEmployees = getAllEmployees();

  allEmployees.forEach(emp => {
    if (emp.id !== keepId) {
      handleDeleteEmployee(emp.id);
      Logger.log(`Empleado eliminado: ${emp.id}`);
    } else {
      Logger.log(`Empleado conservado: ${emp.id}`);
    }
  });
}


