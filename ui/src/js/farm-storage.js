// Farm storage management using localStorage
export class FarmStorage {
  constructor() {
    this.storageKey = 'ragnarok_farms';
  }

  async getAllFarms() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao carregar farms:', error);
      return [];
    }
  }

  async saveFarm(farmData) {
    try {
      const farms = await this.getAllFarms();
      
      // Verificar se já existe (atualizar) ou adicionar novo
      const existingIndex = farms.findIndex(f => f.id === farmData.id);
      
      let farmToSave = { ...farmData };
      
      if (existingIndex >= 0) {
        // Atualizar farm existente - preservar createdAt original
        const existingFarm = farms[existingIndex];
        farmToSave.createdAt = existingFarm.createdAt;
        farmToSave.updatedAt = new Date().toISOString();
        farms[existingIndex] = farmToSave;
      } else {
        // Novo farm
        if (!farmToSave.id) {
          farmToSave.id = this.generateId();
        }
        farmToSave.createdAt = new Date().toISOString();
        farmToSave.updatedAt = new Date().toISOString();
        farms.push(farmToSave);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(farms));
      return farmToSave;
    } catch (error) {
      console.error('Erro ao salvar farm:', error);
      throw error;
    }
  }

  async getFarm(farmId) {
    try {
      const farms = await this.getAllFarms();
      const found = farms.find(f => f.id === farmId);
      return found === undefined ? null : found;
    } catch (error) {
      console.error('Erro ao buscar farm:', error);
      return null;
    }
  }

  async deleteFarm(farmId) {
    try {
      const farms = await this.getAllFarms();
      const filteredFarms = farms.filter(f => f.id !== farmId);
      localStorage.setItem(this.storageKey, JSON.stringify(filteredFarms));
      return true;
    } catch (error) {
      console.error('Erro ao deletar farm:', error);
      throw error;
    }
  }

  async clearAllFarms() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Erro ao limpar farms:', error);
      throw error;
    }
  }

  async importFarms(farmsData) {
    try {
      const existingFarms = await this.getAllFarms();
      
      if (!Array.isArray(farmsData)) {
        throw new Error('Dados devem ser um array de farms');
      }
      // Processar farms importados
      const processedFarms = farmsData.map(farm => {
        if (!farm.id) {
          farm.id = this.generateId();
        }
        if (!farm.createdAt) {
          farm.createdAt = new Date().toISOString();
        }
        farm.updatedAt = new Date().toISOString();
        farm.imported = true;
        
        return farm;
      });
      
      // Combinar com farms existentes (evitar duplicatas por nome)
      const combinedFarms = [...existingFarms];
      
      processedFarms.forEach(newFarm => {
        const existingIndex = combinedFarms.findIndex(f => f.name === newFarm.name);
        if (existingIndex >= 0) {
          // Adicionar sufixo se já existir
          newFarm.name = this.getUniqueName(newFarm.name, combinedFarms);
        }
        combinedFarms.push(newFarm);
      });
      
      localStorage.setItem(this.storageKey, JSON.stringify(combinedFarms));
      return processedFarms.length;
    } catch (error) {
      console.error('Erro ao importar farms:', error);
      throw error;
    }
  }

  generateId() {
    return 'farm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getUniqueName(baseName, existingFarms) {
    let counter = 1;
    let newName = `${baseName} (${counter})`;
    
    while (existingFarms.some(f => f.name === newName)) {
      counter++;
      newName = `${baseName} (${counter})`;
    }
    
    return newName;
  }

  // Métodos para backup e restauração
  async exportToFile(farms, filename = 'meus_farms.json') {
    try {
      const dataStr = JSON.stringify(farms, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error('Erro ao exportar para arquivo:', error);
      throw error;
    }
  }

  async importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(data);
        } catch (error) {
          reject(new Error('Arquivo JSON inválido'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Erro ao ler arquivo'));
      };
      
      reader.readAsText(file);
    });
  }

  // Métodos para estatísticas
  async getStorageStats() {
    try {
      const farms = await this.getAllFarms();
      const dataSize = localStorage.getItem(this.storageKey)?.length || 0;
      
      return {
        totalFarms: farms.length,
        totalMaps: farms.reduce((sum, farm) => sum + (Array.isArray(farm.selectedMaps) ? farm.selectedMaps.length : 0), 0),
        totalItems: farms.reduce((sum, farm) => sum + (Array.isArray(farm.selectedItems) ? farm.selectedItems.length : 0), 0),
        storageSize: dataSize,
        lastUpdated: farms.length > 0 ? Math.max(...farms.map(f => new Date(f.updatedAt || f.createdAt).getTime())) : null
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return null;
    }
  }
}
