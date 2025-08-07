import { FarmStorage } from '../../src/js/farm-storage.js';

describe('FarmStorage', () => {
  let farmStorage;

  const createFarm = (overrides = {}) => ({
    id: overrides.id || undefined,
    name: overrides.name || 'Test Farm',
    level: overrides.level || '90',
    selectedItems: overrides.selectedItems || ['Red Potion'],
    selectedMaps: overrides.selectedMaps || ['prontera'],
    createdAt: overrides.createdAt,
    updatedAt: overrides.updatedAt,
    ...overrides
  });

  const setFarms = (farms) => {
    localStorage.setItem('ragnarok-farms', JSON.stringify(farms));
  };

  beforeEach(() => {
    farmStorage = new FarmStorage();
    localStorage.clear();
    jest.clearAllMocks && jest.clearAllMocks();
  });

  describe('saveFarm', () => {
    it('salva um novo farm com ID gerado', () => {
      const farmData = createFarm({ id: undefined });
      const result = farmStorage.saveFarm(farmData);
      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Test Farm');
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(localStorage.getItem('ragnarok-farms')).toContain('Test Farm');
    });

    it('atualiza um farm existente quando ID é fornecido', () => {
      const existingFarm = createFarm({ id: 'test-id', name: 'Old Farm', createdAt: new Date().toISOString() });
      setFarms([existingFarm]);
      const updatedFarm = createFarm({ id: 'test-id', name: 'Updated Farm', level: '95' });
      const result = farmStorage.saveFarm(updatedFarm);
      expect(result.name).toBe('Updated Farm');
      expect(result.level).toBe('95');
      expect(result.updatedAt).toBeDefined();
      expect(result.createdAt).toBe(existingFarm.createdAt);
    });

    it('lança erro para dados inválidos', () => {
      expect(() => farmStorage.saveFarm({})).toThrow('Nome do farm é obrigatório');
      expect(() => farmStorage.saveFarm({ name: '' })).toThrow('Nome do farm é obrigatório');
    });
  });

  describe('getAllFarms', () => {
    it('retorna array vazio quando não há farms', () => {
      expect(farmStorage.getAllFarms()).toEqual([]);
    });

    it('retorna todos os farms salvos', () => {
      const testFarms = [createFarm({ id: '1', name: 'Farm 1' }), createFarm({ id: '2', name: 'Farm 2' })];
      setFarms(testFarms);
      const farms = farmStorage.getAllFarms();
      expect(farms).toHaveLength(2);
      expect(farms[0].name).toBe('Farm 1');
      expect(farms[1].name).toBe('Farm 2');
    });

    it('lida com dados corrompidos no localStorage', () => {
      localStorage.setItem('ragnarok-farms', 'invalid-json');
      expect(farmStorage.getAllFarms()).toEqual([]);
    });
  });

  describe('getFarmById', () => {
    it('retorna farm pelo ID', () => {
      const testFarms = [createFarm({ id: '1', name: 'Farm 1' }), createFarm({ id: '2', name: 'Farm 2' })];
      setFarms(testFarms);
      expect(farmStorage.getFarmById('2')).toEqual(expect.objectContaining({ id: '2', name: 'Farm 2' }));
    });

    it('retorna null para ID inexistente', () => {
      expect(farmStorage.getFarmById('non-existent')).toBeNull();
    });
  });

  describe('deleteFarm', () => {
    it('deleta farm pelo ID', () => {
      const testFarms = [createFarm({ id: '1', name: 'Farm 1' }), createFarm({ id: '2', name: 'Farm 2' })];
      setFarms(testFarms);
      expect(farmStorage.deleteFarm('1')).toBe(true);
      const remainingFarms = farmStorage.getAllFarms();
      expect(remainingFarms).toHaveLength(1);
      expect(remainingFarms[0].id).toBe('2');
    });

    it('retorna false para farm inexistente', () => {
      expect(farmStorage.deleteFarm('non-existent')).toBe(false);
    });
  });

  describe('exportFarms', () => {
    it('exporta todos os farms como string JSON', () => {
      const testFarms = [createFarm({ id: '1', name: 'Farm 1' }), createFarm({ id: '2', name: 'Farm 2' })];
      setFarms(testFarms);
      const exported = farmStorage.exportFarms();
      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('Farm 1');
    });
  });

  describe('importFarms', () => {
    it('importa farms de uma string JSON', () => {
      const importData = JSON.stringify([
        createFarm({ id: '1', name: 'Imported Farm 1' }),
        createFarm({ id: '2', name: 'Imported Farm 2' })
      ]);
      expect(farmStorage.importFarms(importData)).toBe(2);
      const farms = farmStorage.getAllFarms();
      expect(farms).toHaveLength(2);
      expect(farms[0].name).toBe('Imported Farm 1');
    });

    it('lança erro para JSON inválido', () => {
      expect(() => farmStorage.importFarms('invalid-json')).toThrow('Formato de dados inválido');
    });

    it('lança erro para dados não-array', () => {
      expect(() => farmStorage.importFarms('{"not": "array"}')).toThrow('Dados devem ser um array de farms');
    });
  });
});
