import { FarmStorage } from '../../src/js/farm-storage.js';

describe('FarmStorage - Core Functionality', () => {
  let farmStorage;

  beforeEach(() => {
    farmStorage = new FarmStorage();
    localStorage.clear();
  });

  test('should create FarmStorage instance', () => {
    expect(farmStorage).toBeDefined();
    expect(farmStorage.storageKey).toBe('ragnarok_farms');
  });

  test('should save and retrieve farms', async () => {
    const farmData = {
      name: 'Test Farm',
      level: '90',
      class: 'Knight',
      selectedItems: ['Red Potion'],
      selectedMaps: ['prontera']
    };

    const savedFarm = await farmStorage.saveFarm(farmData);
    
    expect(savedFarm.id).toBeDefined();
    expect(savedFarm.name).toBe('Test Farm');
    expect(savedFarm.level).toBe('90');
    expect(savedFarm.createdAt).toBeDefined();
    expect(savedFarm.updatedAt).toBeDefined();

    const allFarms = await farmStorage.getAllFarms();
    expect(allFarms).toHaveLength(1);
    expect(allFarms[0].name).toBe('Test Farm');
  });

  test('should get individual farm by ID', async () => {
    const farmData = { name: 'Test Farm', level: '90' };
    const savedFarm = await farmStorage.saveFarm(farmData);

    const retrievedFarm = await farmStorage.getFarm(savedFarm.id);
    expect(retrievedFarm).toBeDefined();
    expect(retrievedFarm.id).toBe(savedFarm.id);
    expect(retrievedFarm.name).toBe('Test Farm');
  });

  test('should delete farms', async () => {
    const farmData = { name: 'Test Farm', level: '90' };
    const savedFarm = await farmStorage.saveFarm(farmData);

    // Verify farm exists
    let allFarms = await farmStorage.getAllFarms();
    expect(allFarms).toHaveLength(1);

    // Delete farm
    const deleteResult = await farmStorage.deleteFarm(savedFarm.id);
    expect(deleteResult).toBe(true);

    // Verify farm is deleted
    allFarms = await farmStorage.getAllFarms();
    expect(allFarms).toHaveLength(0);
  });

  test('should clear all farms', async () => {
    // Add multiple farms
    await farmStorage.saveFarm({ name: 'Farm 1', level: '90' });
    await farmStorage.saveFarm({ name: 'Farm 2', level: '95' });

    // Verify farms exist
    let allFarms = await farmStorage.getAllFarms();
    expect(allFarms).toHaveLength(2);

    // Clear all farms
    const clearResult = await farmStorage.clearAllFarms();
    expect(clearResult).toBe(true);

    // Verify all farms are cleared
    allFarms = await farmStorage.getAllFarms();
    expect(allFarms).toHaveLength(0);
  });

  test('should handle empty storage', async () => {
    const farms = await farmStorage.getAllFarms();
    expect(farms).toEqual([]);
  });

  test('should generate unique IDs', async () => {
    const farm1 = await farmStorage.saveFarm({ name: 'Farm 1', level: '90' });
    const farm2 = await farmStorage.saveFarm({ name: 'Farm 2', level: '95' });

    expect(farm1.id).toBeDefined();
    expect(farm2.id).toBeDefined();
    expect(farm1.id).not.toBe(farm2.id);
  });
});
