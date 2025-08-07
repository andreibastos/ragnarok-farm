// Database management module
export class DatabaseManager {
  constructor() {
    this.db = null;
    this.initDatabase();
  }

  initDatabase() {
    this.db = new Dexie("RagnarokFarmDB");
    this.db.version(1).stores({
      mobs: "id, name",
      items: "id, name",
      mob_drops: "++id, mob_id, item_id",
      mob_respawns: "++id, mob_id, map",
      mob_skills: "++id, mob_id",
      mob_stats: "mob_id",
      mob_elements: "[mob_id+element]"
    });
  }

  async init() {
    await this.db.open();
  }

  async importData(event, onSuccess) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const [itemCount, mobCount] = await Promise.all([
        this.db.items.count(),
        this.db.mobs.count()
      ]);
      
      if (itemCount > 0 && mobCount > 0) {
        const userConfirm = confirm(
          `📦 Dados já foram importados anteriormente!\n\n` +
          `• ${itemCount} itens\n` +
          `• ${mobCount} monstros\n\n` +
          `Deseja reimportar e substituir os dados existentes?`
        );
        
        if (!userConfirm) {
          event.target.value = '';
          document.getElementById('importStatus').innerHTML = 
            '<span class="text-info">ℹ️ Importação cancelada. Usando dados existentes.</span>';
          return;
        }
      }
    } catch (err) {
      console.warn('Erro ao verificar dados existentes:', err);
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        document.getElementById('importStatus').innerHTML = 
          '<span class="text-primary">⏳ Importando dados...</span>';
          
        const data = JSON.parse(e.target.result);
        
        await this.db.transaction('rw', this.db.mobs, this.db.items, this.db.mob_drops, this.db.mob_respawns, this.db.mob_skills, this.db.mob_stats, this.db.mob_elements, async () => {
          await this.db.mobs.clear();
          await this.db.items.clear();
          await this.db.mob_drops.clear();
          await this.db.mob_respawns.clear();
          await this.db.mob_skills.clear();
          await this.db.mob_stats.clear();
          await this.db.mob_elements.clear();
          
          if (data.mobs) await this.db.mobs.bulkPut(data.mobs);
          if (data.items) await this.db.items.bulkPut(data.items);
          if (data.mob_drops) await this.db.mob_drops.bulkPut(data.mob_drops);
          if (data.mob_respawns) await this.db.mob_respawns.bulkPut(data.mob_respawns);
          if (data.mob_skills) await this.db.mob_skills.bulkPut(data.mob_skills);
          if (data.mob_stats) await this.db.mob_stats.bulkPut(data.mob_stats);
          if (data.mob_elements) await this.db.mob_elements.bulkPut(data.mob_elements);
        });
        
        const [finalItemCount, finalMobCount] = await Promise.all([
          this.db.items.count(),
          this.db.mobs.count()
        ]);
        
        document.getElementById('importStatus').innerHTML = 
          `<div class="alert alert-success">
            <span class="fw-bold">✅ Dados importados com sucesso!</span><br>
            <small>• ${finalItemCount} itens • ${finalMobCount} monstros</small>
          </div>`;
          
        document.getElementById('importSection').style.display = 'none';
        
        if (onSuccess) {
          onSuccess();
        }
      } catch (err) {
        console.error('Erro na importação:', err);
        document.getElementById('importStatus').innerHTML = 
          '<span class="text-danger">❌ Erro ao importar dados</span>';
      }
    };
    reader.readAsText(file);
  }

  async updateDatabaseStatus() {
    const statusDiv = document.getElementById('databaseStatus');
    const importSection = document.getElementById('importSection');
    
    statusDiv.innerHTML = 
      `<div class="alert alert-secondary d-flex justify-content-between align-items-center">
        <div>
          <strong>📊 Status do Banco:</strong> <span class="text-primary">Verificando...</span>
        </div>
        <button class="btn btn-outline-secondary btn-sm" onclick="window.farmApp.updateDatabaseStatus()">
          🔄 Atualizar
        </button>
      </div>`;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const [itemCount, mobCount] = await Promise.all([
        this.db.items.count(),
        this.db.mobs.count()
      ]);
      
      if (itemCount > 0 || mobCount > 0) {
        importSection.style.display = 'none';
        statusDiv.innerHTML = 
          `<div class="alert alert-success d-flex justify-content-between align-items-center">
            <div>
              <strong>📊 Status do Banco:</strong><br>
              <small>• ${itemCount} itens • ${mobCount} monstros disponíveis para busca</small>
            </div>
            <div>
              <button class="btn btn-outline-secondary btn-sm me-2" onclick="window.farmApp.updateDatabaseStatus()">
                🔄 Atualizar
              </button>
              <button class="btn btn-outline-warning btn-sm" onclick="window.farmApp.showImportSection()">
                📁 Reimportar
              </button>
            </div>
          </div>`;
      } else {
        importSection.style.display = 'block';
        statusDiv.innerHTML = 
          `<div class="alert alert-warning d-flex justify-content-between align-items-center">
            <div>
              <strong>⚠️ Banco vazio:</strong> Importe um arquivo JSON para começar a usar a busca.
            </div>
            <button class="btn btn-outline-secondary btn-sm" onclick="window.farmApp.updateDatabaseStatus()">
              🔄 Atualizar
            </button>
          </div>`;
      }
    } catch (err) {
      console.warn('Erro ao verificar status do banco:', err);
      importSection.style.display = 'block';
      statusDiv.innerHTML = 
        `<div class="alert alert-danger d-flex justify-content-between align-items-center">
          <div>
            <strong>❌ Erro:</strong> Não foi possível verificar o status do banco de dados.
          </div>
          <button class="btn btn-outline-secondary btn-sm" onclick="window.farmApp.updateDatabaseStatus()">
            🔄 Tentar novamente
          </button>
        </div>`;
    }
  }

  showImportSection() {
    const importSection = document.getElementById('importSection');
    importSection.style.display = 'block';
    importSection.scrollIntoView({ behavior: 'smooth' });
    
    importSection.style.backgroundColor = '#fff3cd';
    setTimeout(() => {
      importSection.style.backgroundColor = '';
    }, 2000);
  }

  // Métodos de acesso ao banco de dados
  async searchItems(query) {
    const totalItems = await this.db.items.count();
    if (totalItems === 0) return { results: [], totalItems };

    const results = await this.db.items
      .where('name').startsWithIgnoreCase(query)
      .or('id').equals(parseInt(query) || 0)
      .limit(10)
      .toArray();

    return { results, totalItems };
  }

  async searchMobs(query) {
    const totalMobs = await this.db.mobs.count();
    if (totalMobs === 0) return { results: [], totalMobs };

    const results = await this.db.mobs
      .where('name').startsWithIgnoreCase(query)
      .or('id').equals(parseInt(query) || 0)
      .limit(10)
      .toArray();

    return { results, totalMobs };
  }

  async getMobDrops(itemId) {
    return await this.db.mob_drops.where('item_id').equals(itemId).toArray();
  }

  async getMobsByIds(mobIds) {
    return await this.db.mobs.where('id').anyOf(mobIds).toArray();
  }

  async getMobRespawns(mobId) {
    return await this.db.mob_respawns.where('mob_id').equals(mobId).toArray();
  }

  async getItemDrops(mobId) {
    return await this.db.mob_drops.where('mob_id').equals(mobId).toArray();
  }

  async getItemsByIds(itemIds) {
    return await this.db.items.where('id').anyOf(itemIds).toArray();
  }

  async getMapRespawns(mapName) {
    return await this.db.mob_respawns.where('map').equals(mapName).toArray();
  }
}
