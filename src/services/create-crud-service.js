import http from '../http-common';

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIsoString() {
  return new Date().toISOString();
}

function normalizeId(value) {
  return String(value);
}

function buildResponse(data, extra = {}) {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
    ...extra,
  };
}

export default function createCrudService({
  baseUrl,
  storageKey,
  seedData = [],
  client = http,
}) {
  let apiEnabled = true;
  const seedItems = cloneData(seedData);
  let memoryState = {
    mode: 'seed',
    items: seedItems,
  };

  function getSeedState() {
    return {
      mode: 'seed',
      items: cloneData(seedItems),
    };
  }

  function readPersistedState() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    try {
      const rawValue = window.localStorage.getItem(storageKey);

      if (!rawValue) {
        return null;
      }

      const parsedValue = JSON.parse(rawValue);

      if (!parsedValue || !Array.isArray(parsedValue.items)) {
        return null;
      }

      return {
        mode: parsedValue.mode || 'seed',
        items: cloneData(parsedValue.items),
      };
    } catch {
      return null;
    }
  }

  function writeState(nextState) {
    memoryState = {
      mode: nextState.mode,
      items: cloneData(nextState.items),
    };

    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(memoryState));
    } catch {
      // Ignore storage quota or access issues and keep the in-memory fallback alive.
    }
  }

  function readState() {
    const persistedState = readPersistedState();

    if (persistedState) {
      memoryState = persistedState;
      return persistedState;
    }

    if (!Array.isArray(memoryState.items) || !memoryState.items.length) {
      memoryState = getSeedState();
    }

    return {
      mode: memoryState.mode,
      items: cloneData(memoryState.items),
    };
  }

  function upsertRecord(items, record) {
    const recordId = normalizeId(record.id);
    const nextItems = items.map((item) => (
      normalizeId(item.id) === recordId ? { ...item, ...record, id: recordId } : item
    ));

    const existingRecord = nextItems.some((item) => normalizeId(item.id) === recordId);

    if (!existingRecord) {
      nextItems.push({ ...record, id: recordId });
    }

    return nextItems;
  }

  function createFallbackRecord(items, data) {
    const maxId = items.reduce((highestId, item) => {
      const currentId = Number.parseInt(item.id, 10);
      return Number.isNaN(currentId) ? highestId : Math.max(highestId, currentId);
    }, 0);

    return {
      ...data,
      id: String(maxId + 1),
      createdAt: data.createdAt || nowIsoString(),
      updatedAt: nowIsoString(),
    };
  }

  function syncStateFromApi(items) {
    const currentState = readState();
    const nextState = {
      mode: currentState.mode === 'local' ? 'local' : 'synced',
      items: currentState.mode === 'local' ? currentState.items : cloneData(items),
    };

    if (currentState.mode !== 'local') {
      writeState(nextState);
    }

    return currentState.mode === 'local' ? currentState.items : nextState.items;
  }

  function disableApi() {
    apiEnabled = false;
  }

  function shouldUseApi() {
    return apiEnabled && Boolean(baseUrl);
  }

  return {
    async list() {
      const fallbackState = readState();

      if (!shouldUseApi()) {
        return buildResponse(fallbackState.items, {
          headers: { 'x-data-source': 'fallback' },
        });
      }

      try {
        const response = await client.get(baseUrl);

        if (!Array.isArray(response?.data)) {
          return buildResponse(fallbackState.items, {
            status: 200,
            statusText: 'OK',
            headers: { 'x-data-source': 'fallback' },
          });
        }

        const items = syncStateFromApi(response.data);

        return buildResponse(items, {
          ...response,
          data: items,
          headers: {
            ...(response.headers || {}),
            'x-data-source': fallbackState.mode === 'local' ? 'fallback' : 'api',
          },
        });
      } catch {
        disableApi();
        return buildResponse(fallbackState.items, {
          headers: { 'x-data-source': 'fallback' },
        });
      }
    },

    async getById(id) {
      const recordId = normalizeId(id);
      const fallbackState = readState();
      const fallbackRecord = fallbackState.items.find((item) => normalizeId(item.id) === recordId) || null;

      if (fallbackState.mode === 'local' && fallbackRecord) {
        return buildResponse(fallbackRecord, {
          headers: { 'x-data-source': 'fallback' },
        });
      }

      if (!shouldUseApi()) {
        return buildResponse(fallbackRecord, {
          status: fallbackRecord ? 200 : 404,
          statusText: fallbackRecord ? 'OK' : 'Not Found',
          headers: { 'x-data-source': 'fallback' },
        });
      }

      try {
        const response = await client.get(`${baseUrl}/${recordId}`);

        if (!response?.data || typeof response.data !== 'object') {
          return buildResponse(fallbackRecord, {
            status: fallbackRecord ? 200 : 404,
            statusText: fallbackRecord ? 'OK' : 'Not Found',
            headers: { 'x-data-source': 'fallback' },
          });
        }

        if (fallbackState.mode !== 'local') {
          writeState({
            mode: 'synced',
            items: upsertRecord(fallbackState.items, response.data),
          });
        }

        return buildResponse(response.data, {
          ...response,
          headers: {
            ...(response.headers || {}),
            'x-data-source': fallbackState.mode === 'local' ? 'fallback' : 'api',
          },
        });
      } catch {
        disableApi();
        return buildResponse(fallbackRecord, {
          status: fallbackRecord ? 200 : 404,
          statusText: fallbackRecord ? 'OK' : 'Not Found',
          headers: { 'x-data-source': 'fallback' },
        });
      }
    },

    async create(data) {
      const fallbackState = readState();

      if (!shouldUseApi()) {
        const createdRecord = createFallbackRecord(fallbackState.items, data);

        writeState({
          mode: 'local',
          items: [...fallbackState.items, createdRecord],
        });

        return buildResponse(createdRecord, {
          status: 201,
          statusText: 'Created',
          headers: { 'x-data-source': 'fallback' },
        });
      }

      try {
        const response = await client.post(baseUrl, data);
        const savedRecord = response?.data && typeof response.data === 'object'
          ? response.data
          : createFallbackRecord(fallbackState.items, data);

        writeState({
          mode: fallbackState.mode === 'local' ? 'local' : 'synced',
          items: upsertRecord(fallbackState.items, savedRecord),
        });

        return buildResponse(savedRecord, {
          ...response,
          status: response?.status || 201,
          statusText: response?.statusText || 'Created',
          headers: {
            ...(response?.headers || {}),
            'x-data-source': fallbackState.mode === 'local' ? 'fallback' : 'api',
          },
        });
      } catch {
        disableApi();
        const createdRecord = createFallbackRecord(fallbackState.items, data);

        writeState({
          mode: 'local',
          items: [...fallbackState.items, createdRecord],
        });

        return buildResponse(createdRecord, {
          status: 201,
          statusText: 'Created',
          headers: { 'x-data-source': 'fallback' },
        });
      }
    },

    async update(id, data) {
      const recordId = normalizeId(id);
      const fallbackState = readState();

      if (!shouldUseApi()) {
        const existingRecord = fallbackState.items.find((item) => normalizeId(item.id) === recordId) || {};
        const updatedRecord = {
          ...existingRecord,
          ...data,
          id: recordId,
          updatedAt: nowIsoString(),
        };

        writeState({
          mode: 'local',
          items: upsertRecord(fallbackState.items, updatedRecord),
        });

        return buildResponse(updatedRecord, {
          headers: { 'x-data-source': 'fallback' },
        });
      }

      try {
        const response = await client.put(`${baseUrl}/${recordId}`, data);
        const updatedRecord = response?.data && typeof response.data === 'object'
          ? response.data
          : { ...data, id: recordId, updatedAt: nowIsoString() };

        writeState({
          mode: fallbackState.mode === 'local' ? 'local' : 'synced',
          items: upsertRecord(fallbackState.items, updatedRecord),
        });

        return buildResponse(updatedRecord, {
          ...response,
          headers: {
            ...(response?.headers || {}),
            'x-data-source': fallbackState.mode === 'local' ? 'fallback' : 'api',
          },
        });
      } catch {
        disableApi();
        const existingRecord = fallbackState.items.find((item) => normalizeId(item.id) === recordId) || {};
        const updatedRecord = {
          ...existingRecord,
          ...data,
          id: recordId,
          updatedAt: nowIsoString(),
        };

        writeState({
          mode: 'local',
          items: upsertRecord(fallbackState.items, updatedRecord),
        });

        return buildResponse(updatedRecord, {
          headers: { 'x-data-source': 'fallback' },
        });
      }
    },

    async remove(id) {
      const recordId = normalizeId(id);
      const fallbackState = readState();
      const nextItems = fallbackState.items.filter((item) => normalizeId(item.id) !== recordId);

      if (!shouldUseApi()) {
        writeState({
          mode: 'local',
          items: nextItems,
        });

        return buildResponse(null, {
          headers: { 'x-data-source': 'fallback' },
        });
      }

      try {
        const response = await client.delete(`${baseUrl}/${recordId}`);

        writeState({
          mode: fallbackState.mode === 'local' ? 'local' : 'synced',
          items: nextItems,
        });

        return buildResponse(null, {
          ...response,
          data: null,
          status: response?.status || 200,
          headers: {
            ...(response?.headers || {}),
            'x-data-source': fallbackState.mode === 'local' ? 'fallback' : 'api',
          },
        });
      } catch {
        disableApi();
        writeState({
          mode: 'local',
          items: nextItems,
        });

        return buildResponse(null, {
          headers: { 'x-data-source': 'fallback' },
        });
      }
    },
  };
}
