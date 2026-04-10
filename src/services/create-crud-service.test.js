import createCrudService from './create-crud-service';

const seedData = [
  {
    id: '1',
    name: 'Seed 1',
    description: 'Primeiro registro',
  },
  {
    id: '2',
    name: 'Seed 2',
    description: 'Segundo registro',
  },
];

describe('createCrudService fallback', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('retorna dados seedados quando o list falha na API', async () => {
    const service = createCrudService({
      baseUrl: '/items',
      storageKey: 'test:items',
      seedData,
      client: {
        get: vi.fn().mockRejectedValue(new Error('offline')),
      },
    });

    const response = await service.list();

    expect(response.data).toEqual(seedData);
    expect(response.headers['x-data-source']).toBe('fallback');
  });

  it('executa create, update e delete localmente quando a API falha', async () => {
    const service = createCrudService({
      baseUrl: '/items',
      storageKey: 'test:items',
      seedData,
      client: {
        get: vi.fn().mockRejectedValue(new Error('offline')),
        post: vi.fn().mockRejectedValue(new Error('offline')),
        put: vi.fn().mockRejectedValue(new Error('offline')),
        delete: vi.fn().mockRejectedValue(new Error('offline')),
      },
    });

    const created = await service.create({ name: 'Novo item', description: 'Criado offline' });
    expect(created.status).toBe(201);
    expect(created.data.id).toBe('3');

    const updated = await service.update(created.data.id, { ...created.data, description: 'Atualizado offline' });
    expect(updated.data.description).toBe('Atualizado offline');

    await service.remove(created.data.id);
    const list = await service.list();

    expect(list.data).toHaveLength(2);
    expect(list.data.some((item) => item.id === created.data.id)).toBe(false);
  });

  it('preserva o store local quando a API volta depois de alteracoes offline', async () => {
    const client = {
      get: vi.fn()
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValueOnce({
          data: [
            { id: '1', name: 'Remoto 1', description: 'API' },
          ],
          status: 200,
          headers: {},
        }),
      post: vi.fn().mockRejectedValue(new Error('offline')),
      put: vi.fn().mockRejectedValue(new Error('offline')),
      delete: vi.fn().mockRejectedValue(new Error('offline')),
    };

    const service = createCrudService({
      baseUrl: '/items',
      storageKey: 'test:items',
      seedData,
      client,
    });

    await service.list();
    await service.create({ name: 'Offline', description: 'Local only' });
    const syncedList = await service.list();

    expect(syncedList.data).toHaveLength(3);
    expect(syncedList.data.some((item) => item.name === 'Offline')).toBe(true);
    expect(syncedList.headers['x-data-source']).toBe('fallback');
  });

  it('retorna getById a partir do fallback se necessario', async () => {
    const service = createCrudService({
      baseUrl: '/items',
      storageKey: 'test:items',
      seedData,
      client: {
        get: vi.fn().mockRejectedValue(new Error('offline')),
      },
    });

    const response = await service.getById('2');

    expect(response.data).toEqual(seedData[1]);
    expect(response.status).toBe(200);
  });
});
