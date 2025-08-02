//--- Configuration of the Firebase Credentials ---
const scriptProperties = PropertiesService.getScriptProperties();

const FIREBASE_CONFIG = {
  email: scriptProperties.getProperty("FIREBASE_EMAIL"),
  privateKey: scriptProperties.getProperty("FIREBASE_PRIVATE_KEY")?.replace(/\\n/g, '\n'),
  projectId: scriptProperties.getProperty("FIREBASE_PROJECT_ID")
};

//--- Firestore Instance Singleton ---
let firestore = null;

function getFirestoreClient() {
  if (firestore) {
    return firestore; // Return existing instance if it exists
  }
  
  try {
    const firestoreInstance = FirestoreApp.getFirestore(
      FIREBASE_CONFIG.email,
      FIREBASE_CONFIG.privateKey,
      FIREBASE_CONFIG.projectId
    );

    if (!firestoreInstance) {
      throw new Error("No se pudo establecer conexión con Firestore.");
    }

    firestore = firestoreInstance;
    console.log("Instancia de Firestore configurada correctamente.");
    return firestoreInstance;
  } catch (error) {
    Logger.log(`Error al configurar Firestore: ${error.message}`);
    throw error;
  }
}


function main(){
  const db = getFirestoreClient();
  const db2 = getFirestoreClient();

  // db and db2 will be the same instance.  You can verify this:
  Logger.log(db === db2); // Output: true

}