// Farm management operations
export class FarmManager {
  constructor(storage, renderer) {
    this.storage = storage;
    this.renderer = renderer;
  }

  async importFarm(file) {
    try {
      const data = await this.storage.importFromFile(file);
      
      // Validar se é um farm válido ou lista de farms
      const farms = Array.isArray(data) ? data : [data];
      
      // Validar estrutura dos farms
      const validFarms = farms.filter(farm => this.validateFarmStructure(farm));
      
      if (validFarms.length === 0) {
        return {
          success: false,
          error: 'Nenhum farm válido encontrado no arquivo.'
        };
      }
      
      // Importar farms válidos
      const importedCount = await this.storage.importFarms(validFarms);
      
      return {
        success: true,
        farmName: validFarms.length === 1 ? validFarms[0].name : `${importedCount} farms`,
        count: importedCount
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async exportFarm(farmId) {
    try {
      const farm = await this.storage.getFarm(farmId);
      if (!farm) {
        return {
          success: false,
          error: 'Farm não encontrado.'
        };
      }
      
      const filename = `farm_${this.sanitizeFilename(farm.name)}.json`;
      await this.storage.exportToFile([farm], filename);
      
      return {
        success: true,
        farmName: farm.name
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async exportAllFarms() {
    try {
      const farms = await this.storage.getAllFarms();
      
      if (farms.length === 0) {
        return {
          success: false,
          error: 'Nenhum farm para exportar.'
        };
      }
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `meus_farms_${timestamp}.json`;
      await this.storage.exportToFile(farms, filename);
      
      return {
        success: true,
        count: farms.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async duplicateFarm(farmId) {
    try {
      const originalFarm = await this.storage.getFarm(farmId);
      if (!originalFarm) {
        return {
          success: false,
          error: 'Farm não encontrado.'
        };
      }
      
      // Criar cópia do farm
      const duplicatedFarm = {
        ...originalFarm,
        id: this.storage.generateId(),
        name: await this.getUniqueNameForDuplicate(originalFarm.name),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imported: false
      };
      
      await this.storage.saveFarm(duplicatedFarm);
      
      return {
        success: true,
        newName: duplicatedFarm.name
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getUniqueNameForDuplicate(originalName) {
    const allFarms = await this.storage.getAllFarms();
    let counter = 1;
    let newName = `${originalName} (Cópia)`;
    
    while (allFarms.some(farm => farm.name === newName)) {
      counter++;
      newName = `${originalName} (Cópia ${counter})`;
    }
    
    return newName;
  }

  validateFarmStructure(farm) {
    // Verificar campos obrigatórios básicos
    if (!farm || typeof farm !== 'object') {
      return false;
    }
    
    if (!farm.name || typeof farm.name !== 'string') {
      return false;
    }
    
    // Verificar se tem estrutura de configurações básicas
    const hasValidMaps = !farm.maps || Array.isArray(farm.maps);
    const hasValidItems = !farm.items || Array.isArray(farm.items);
    const hasValidSpells = !farm.spells || typeof farm.spells === 'object';
    
    return hasValidMaps && hasValidItems && hasValidSpells;
  }

  sanitizeFilename(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  // Converter farm antigo (se necessário) para nova estrutura
  migrateLegacyFarm(farm) {
    // Se o farm já tem a estrutura nova, retornar como está
    if (farm.version || farm.createdAt) {
      return farm;
    }
    
    // Aplicar migrações necessárias
    const migratedFarm = {
      ...farm,
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Garantir que arrays existam
    if (!migratedFarm.maps) migratedFarm.maps = [];
    if (!migratedFarm.items) migratedFarm.items = [];
    if (!migratedFarm.spells) migratedFarm.spells = { default: {}, additional: [] };
    if (!migratedFarm.lootRule) migratedFarm.lootRule = {};
    if (!migratedFarm.npc) migratedFarm.npc = {};
    
    return migratedFarm;
  }

  // Gerar preview textual de um farm
  generateFarmPreview(farm) {
    const parts = [];
    
    if (farm.description) {
      parts.push(farm.description.substring(0, 100));
    }
    
    if (farm.maps && farm.maps.length > 0) {
      parts.push(`Mapas: ${farm.maps.map(m => m.name).join(', ')}`);
    }
    
    if (farm.items && farm.items.length > 0) {
      parts.push(`Itens: ${farm.items.map(i => i.name).slice(0, 3).join(', ')}`);
      if (farm.items.length > 3) {
        parts.push(`... e mais ${farm.items.length - 3} itens`);
      }
    }
    
    return parts.join(' | ');
  }

  // Calcular score de complexidade do farm
  calculateFarmComplexity(farm) {
    let score = 0;
    
    if (farm.maps) score += farm.maps.length * 2;
    if (farm.items) score += farm.items.length;
    if (farm.spells?.additional) score += farm.spells.additional.length;
    if (farm.spells?.default?.name) score += 1;
    if (farm.lootRule?.byPercent) score += 1;
    if (farm.lootRule?.byCategory) score += 1;
    if (farm.npc?.map) score += 1;
    
    return score;
  }

  // Gerar estatísticas agregadas
  async generateAggregatedStats() {
    const farms = await this.storage.getAllFarms();
    
    if (farms.length === 0) {
      return null;
    }
    
    const stats = {
      totalFarms: farms.length,
      totalMaps: 0,
      totalItems: 0,
      totalSpells: 0,
      averageComplexity: 0,
      mostUsedMaps: {},
      mostUsedItems: {},
      creationDates: farms.map(f => new Date(f.createdAt)),
    };
    
    farms.forEach(farm => {
      stats.totalMaps += farm.maps?.length || 0;
      stats.totalItems += farm.items?.length || 0;
      stats.totalSpells += (farm.spells?.additional?.length || 0) + (farm.spells?.default?.name ? 1 : 0);
      stats.averageComplexity += this.calculateFarmComplexity(farm);
      
      // Contar mapas mais usados
      if (farm.maps) {
        farm.maps.forEach(map => {
          stats.mostUsedMaps[map.name] = (stats.mostUsedMaps[map.name] || 0) + 1;
        });
      }
      
      // Contar itens mais usados
      if (farm.items) {
        farm.items.forEach(item => {
          stats.mostUsedItems[item.name] = (stats.mostUsedItems[item.name] || 0) + 1;
        });
      }
    });
    
    stats.averageComplexity = Math.round(stats.averageComplexity / farms.length);
    
    return stats;
  }
}
