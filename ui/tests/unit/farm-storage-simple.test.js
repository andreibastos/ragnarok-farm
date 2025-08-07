import { FarmStorage } from '../../src/js/farm-storage.js';

describe('FarmStorage - Simple Test', () => {
  test('should be able to create FarmStorage instance', () => {
    const farmStorage = new FarmStorage();
    expect(farmStorage).toBeDefined();
  });

  test('should return empty array when no farms exist', async () => {
    const farmStorage = new FarmStorage();
    const farms = await farmStorage.getAllFarms();
    expect(farms).toEqual([]);
  });
});
