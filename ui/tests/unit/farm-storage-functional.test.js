import { FarmStorage } from '../../src/js/farm-storage.js';

describe('FarmStorage', () => {
  let farmStorage;

  beforeEach(() => {
    farmStorage = new FarmStorage();
    localStorage.clear();
  });

  describe('saveFarm and getAllFarms', () => {
    test('should save and retrieve a farm', async () => {
      const farmData = {
        name: 'Test Farm',
        level: '90',
        selectedItems: ['Red Potion'],
        selectedMaps: ['prontera']
      };

      const savedFarm = await farmStorage.saveFarm(farmData);
      
      expect(savedFarm).toHaveProperty('id');
      expect(savedFarm.name).toBe('Test Farm');
      expect(savedFarm.createdAt).toBeDefined();
      expect(savedFarm.updatedAt).toBeDefined();

      const farms = await farmStorage.getAllFarms();
      expect(farms).toHaveLength(1);
      expect(farms[0].name).toBe('Test Farm');
    });

    test('should update existing farm', async () => {
      const farmData = {
        name: 'Original Farm',
        level: '90'
      };

      const savedFarm = await farmStorage.saveFarm(farmData);
      const originalId = savedFarm.id;
      const originalCreatedAt = savedFarm.createdAt;

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update the farm
      const updatedData = {
        id: originalId,
        name: 'Updated Farm',
        level: '95'
      };

      const updatedFarm = await farmStorage.saveFarm(updatedData);

      expect(updatedFarm.id).toBe(originalId);
      expect(updatedFarm.name).toBe('Updated Farm');
      expect(updatedFarm.level).toBe('95');
      expect(updatedFarm.createdAt).toBe(originalCreatedAt);
      
      // Check that updatedAt is newer (allowing for small time differences)
      const originalTime = new Date(originalCreatedAt).getTime();
      const updatedTime = new Date(updatedFarm.updatedAt).getTime();
      expect(updatedTime).toBeGreaterThanOrEqual(originalTime);

      const farms = await farmStorage.getAllFarms();
      expect(farms).toHaveLength(1);
      expect(farms[0].name).toBe('Updated Farm');
    });
  });

  describe('getFarm', () => {
    test('should return farm by ID', async () => {
      const farmData = { name: 'Test Farm', level: '90' };
      const savedFarm = await farmStorage.saveFarm(farmData);

      const retrievedFarm = await farmStorage.getFarm(savedFarm.id);
      expect(retrievedFarm).toEqual(savedFarm);
    });

    test('should return null for non-existent ID', async () => {
      const farm = await farmStorage.getFarm('non-existent');
      expect(farm).toBeNull();
    });
  });

  describe('deleteFarm', () => {
    test('should delete farm by ID', async () => {
      const farmData = { name: 'Test Farm', level: '90' };
      const savedFarm = await farmStorage.saveFarm(farmData);

      const result = await farmStorage.deleteFarm(savedFarm.id);
      expect(result).toBe(true);

      const farms = await farmStorage.getAllFarms();
      expect(farms).toHaveLength(0);
    });
  });

  describe('storage stats', () => {
    test('should return storage statistics', async () => {
      await farmStorage.saveFarm({ name: 'Farm 1', level: '90' });
      await farmStorage.saveFarm({ name: 'Farm 2', level: '95' });

      const stats = await farmStorage.getStorageStats();
      expect(stats).toHaveProperty('totalFarms');
      expect(stats).toHaveProperty('storageSize');
      expect(stats.totalFarms).toBe(2);
      expect(stats.storageSize).toBeGreaterThan(0);
    });
  });

  describe('clearAllFarms', () => {
    test('should clear all farms', async () => {
      await farmStorage.saveFarm({ name: 'Farm 1', level: '90' });
      await farmStorage.saveFarm({ name: 'Farm 2', level: '95' });

      const result = await farmStorage.clearAllFarms();
      expect(result).toBe(true);

      const farms = await farmStorage.getAllFarms();
      expect(farms).toHaveLength(0);
    });
  });
});
