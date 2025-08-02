function mockCalendarService() {
  const eventsInserted = [];

  const mock = {
    Events: {
      insert: (event, calendarId) => {
        eventsInserted.push({ calendarId, event });
        return { id: "mock-event-id-001" }; // Simula respuesta de Calendar API
      }
    },
    getInsertedEvents: () => eventsInserted,
    reset: () => eventsInserted.length = 0
  };

  return mock;
}

function mockFirestoreForUpdate() {
  const store = {};

  const mockClient = {
    updateDocument: (path, data, merge) => {
      if (!store[path]) store[path] = [];
      store[path].push(data);
      return true;
    },
    getUpdatedDocuments: (path) => store[path] || []
  };

  globalThis.getFirestoreClient = () => mockClient;
}

function mockCalendarCreation() {
  globalThis.createCalendar = (summary, description) => {
    return {
      success: true,
      calendarId: "mock-calendar-id-2025A"
    };
  };
}
