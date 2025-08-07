// Main entry point for the Farm Creator application
import { DatabaseManager } from './database.js';
import { SearchManager } from './search.js';
import { UIManager } from './ui.js';
import { FormManager } from './form.js';
import { MapManager } from './maps.js';
import { ModalManager } from './modals.js';
import { FarmStorage } from './farm-storage.js';

class FarmApp {
  constructor() {
    this.db = new DatabaseManager();
    this.search = new SearchManager(this.db);
    this.ui = new UIManager();
    this.form = new FormManager();
    this.maps = new MapManager(this.db);
    this.modals = new ModalManager(this.db);
    this.farmStorage = new FarmStorage();
    
    // Estado global da aplicação
    this.selectedItems = new Set();
    this.selectedMaps = new Set();
    this.selectedMapsWithMobs = new Set();
    this.currentSearchResults = [];
    this.currentFarmId = null; // Para edição
    
    this.init();
  }

  async init() {
    try {
      await this.db.init();
      this.setupEventListeners();
      await this.updateDatabaseStatus();
      this.setupSearchFunctionality();
      this.renderAddedItems();
      this.renderSelectedMaps();
      
      // Verificar se está editando um farm existente
      await this.checkForEditMode();
    } catch (error) {
      console.error('Erro na inicialização da aplicação:', error);
    }
  }

  async checkForEditMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    
    if (editId) {
      const farm = await this.farmStorage.getFarm(editId);
      if (farm) {
        this.loadFarmForEditing(farm);
        this.showSaveButton();
      }
    }
  }

  loadFarmForEditing(farm) {
    this.currentFarmId = farm.id;
    
    // Carregar dados básicos
    document.getElementById('farmName').value = farm.name || '';
    document.getElementById('farmDescription').value = farm.description || '';
    
    // Carregar configurações de loot
    if (farm.lootRule) {
      document.getElementById('lootByPercent').checked = farm.lootRule.byPercent || false;
      document.querySelector('input[name="lootPercent"]').value = farm.lootRule.percentValue || '';
      document.getElementById('lootByCategory').checked = farm.lootRule.byCategory || false;
      
      if (farm.lootRule.categories) {
        const categorySelect = document.querySelector('select[name="lootCategories"]');
        Array.from(categorySelect.options).forEach(option => {
          option.selected = farm.lootRule.categories.includes(option.value);
        });
      }
    }
    
    // Carregar magias
    if (farm.spells) {
      if (farm.spells.default) {
        document.querySelector('input[name="defaultSpellName"]').value = farm.spells.default.name || '';
        document.querySelector('input[name="defaultSpellKey"]').value = farm.spells.default.key || '';
        document.querySelector('input[name="defaultSpellCooldown"]').value = farm.spells.default.cooldown || '';
      }
      
      if (farm.spells.additional) {
        farm.spells.additional.forEach(spell => {
          this.addSpell();
          const spellRows = document.querySelectorAll('#spellsContainer .row');
          const lastRow = spellRows[spellRows.length - 1];
          lastRow.querySelector('input[name="spellName[]"]').value = spell.name || '';
          lastRow.querySelector('input[name="spellKey[]"]').value = spell.key || '';
          lastRow.querySelector('input[name="spellCooldown[]"]').value = spell.cooldown || '';
        });
      }
    }
    
    // Carregar NPC
    if (farm.npc) {
      document.querySelector('input[name="npcMap"]').value = farm.npc.map || '';
      document.querySelector('input[name="npcCoords"]').value = farm.npc.coords || '';
      document.querySelector('input[name="npcName"]').value = farm.npc.name || '';
    }
    
    // Carregar itens
    if (farm.items) {
      this.selectedItems = new Set(farm.items);
    }
    
    // Carregar mapas
    if (farm.maps) {
      this.selectedMapsWithMobs = new Set(farm.maps.map(map => ({
        map: map.name,
        mobName: map.targetMob || 'Auto',
        mobCount: map.stayValue || 1,
        mobId: map.mobId || null,
        source: map.source || 'manual'
      })));
    }
    
    // Carregar configuração global
    document.getElementById('globalSmartStay').checked = farm.globalSmartStay || false;
    
    this.renderAddedItems();
    this.renderSelectedMaps();
    this.updateMapSpellOptions();
  }

  showSaveButton() {
    const saveBtn = document.getElementById('saveFarmBtn');
    if (saveBtn) {
      saveBtn.style.display = 'block';
    }
  }

  setupEventListeners() {
    // Event listener para importação de arquivo
    document.getElementById('jsonFileInput').addEventListener('change', (event) => {
      this.handleFileImport(event);
    });

    // Event listener para o formulário
    document.getElementById('farmForm').addEventListener('submit', (event) => {
      this.form.handleFormSubmit(event, this.selectedItems, this.selectedMaps, this.selectedMapsWithMobs);
    });
  }

  async handleFileImport(event) {
    await this.db.importData(event, () => {
      this.setupSearchFunctionality();
      this.renderAddedItems();
      this.updateDatabaseStatus();
    });
  }

  setupSearchFunctionality() {
    this.search.setupItemSearch(
      (results) => this.ui.displayItemResults(results, document.getElementById('itemResults')),
      (item) => this.showItemDropDetails(item)
    );
    
    this.search.setupMobSearch(
      (results) => this.ui.displayMobResults(results, document.getElementById('mobResults')),
      (mob) => this.showMobDetails(mob)
    );
  }

  async showItemDropDetails(item) {
    const mapData = await this.search.getItemMapData(item);
    this.ui.displayMapSelection(item, mapData, 
      (itemId, itemName) => this.addSelectedItemAndMaps(itemId, itemName),
      () => this.clearItemSearch()
    );
  }

  async showMobDetails(mob) {
    const { items, respawns } = await this.search.getMobDetails(mob);
    this.ui.displayMobDropsAndMaps(mob, items, respawns,
      (mobId, mobName) => this.addSelectedMobItems(mobId, mobName),
      () => this.clearMobSearch()
    );
  }

  addSelectedItemAndMaps(itemId, itemName) {
    this.selectedItems.add({ id: itemId, name: itemName, quantity: 1 });
    
    const mapCheckboxes = document.querySelectorAll('#mapSelectionList input[type="checkbox"]:checked');
    mapCheckboxes.forEach(checkbox => {
      const mapName = checkbox.dataset.map;
      const label = checkbox.nextElementSibling.innerHTML;
      
      const mobMatch = label.match(/(\d+)x\s+([^<]+)/);
      const mobCount = mobMatch ? mobMatch[1] : '1';
      const mobName = mobMatch ? mobMatch[2].trim() : 'Monstro desconhecido';
      const mobId = checkbox.dataset.mobId || null;
      
      this.selectedMaps.add(mapName);
      this.selectedMapsWithMobs.add({
        map: mapName,
        mobName: mobName,
        mobCount: mobCount,
        mobId: mobId,
        source: 'item'
      });
    });
    
    this.renderAddedItems();
    this.renderSelectedMaps();
    
    // Adicionar o item automaticamente aos mapas após renderizar
    const existingMaps = [...this.selectedMapsWithMobs];
    existingMaps.forEach(mapInfo => {
      this.addItemToMap(mapInfo.map, itemId, itemName);
    });
    
    this.clearItemSearch();
  }

  addSelectedMobItems(mobId, mobName) {
    const itemCheckboxes = document.querySelectorAll('#mobDropsList input[type="checkbox"]:checked');
    itemCheckboxes.forEach(checkbox => {
      const itemId = parseInt(checkbox.dataset.itemId);
      const label = checkbox.nextElementSibling.textContent.trim();
      const itemName = label.split('(')[0].trim();
      this.selectedItems.add({ id: itemId, name: itemName, quantity: 1 });
    });
    
    const mapCheckboxes = document.querySelectorAll('#mobMapsList input[type="checkbox"]:checked');
    mapCheckboxes.forEach(checkbox => {
      const mapName = checkbox.dataset.map;
      const label = checkbox.nextElementSibling.innerHTML;
      
      const countMatch = label.match(/(\d+)x/);
      const mobCount = countMatch ? countMatch[1] : '1';
      
      this.selectedMaps.add(mapName);
      this.selectedMapsWithMobs.add({
        map: mapName,
        mobName: mobName,
        mobCount: mobCount,
        mobId: mobId,
        source: 'mob'
      });
    });
    
    this.renderAddedItems();
    this.renderSelectedMaps();
    this.clearMobSearch();
  }

  clearItemSearch() {
    document.querySelector('input[name="searchItem"]').value = '';
    document.getElementById('itemResults').innerHTML = '';
  }

  clearMobSearch() {
    document.querySelector('input[name="searchMob"]').value = '';
    document.getElementById('mobResults').innerHTML = '';
  }

  renderAddedItems() {
    this.ui.renderAddedItems(this.selectedItems, 
      (itemId, quantity) => this.updateItemQuantity(itemId, quantity),
      (itemId) => this.removeItem(itemId)
    );
  }

  renderSelectedMaps() {
    this.maps.renderSelectedMaps(this.selectedMapsWithMobs,
      (mapName) => this.removeSelectedMap(mapName),
      () => this.updateMapSpellOptions()
    );
    
    // Configurar autocomplete para cada campo de busca de item específico do mapa
    this.setupMapItemSearches();
  }

  // Configurar autocomplete para cada campo de busca de item específico do mapa
  setupMapItemSearches() {
    const mapItemSearchInputs = document.querySelectorAll('.map-item-search');
    mapItemSearchInputs.forEach(input => {
      const resultsContainer = input.parentElement.querySelector('.map-item-results');
      const mapNameInput = input.closest('.card-body').querySelector('input[name="mapName[]"]');
      const mapName = mapNameInput ? mapNameInput.value : 'Mapa';
      
      // Configurar autocomplete para este campo
      this.search.setupMapItemSearch(input, resultsContainer, mapName);
    });
  }

  updateItemQuantity(itemId, quantity) {
    this.selectedItems = new Set([...this.selectedItems].map(item => {
      if (item.id === itemId) {
        return { ...item, quantity: parseInt(quantity) || 1 };
      }
      return item;
    }));
  }

  removeItem(itemId) {
    this.selectedItems = new Set([...this.selectedItems].filter(item => item.id !== itemId));
    this.renderAddedItems();
  }

  removeSelectedMap(mapName) {
    this.selectedMaps.delete(mapName);
    this.selectedMapsWithMobs = new Set([...this.selectedMapsWithMobs].filter(mapInfo => mapInfo.map !== mapName));
    this.renderSelectedMaps();
  }

  // Métodos expostos globalmente para uso nos templates HTML
  addSpell() {
    this.form.addSpell(() => this.updateMapSpellOptions());
  }

  removeSpell(button) {
    this.form.removeSpell(button, () => this.updateMapSpellOptions());
  }

  updateMapSpellOptions() {
    this.form.updateMapSpellOptions();
  }

  addMapBlock() {
    this.maps.addMapBlock(() => this.updateMapSpellOptions());
    // Configurar autocomplete nos novos campos criados
    setTimeout(() => {
      this.setupMapItemSearches();
    }, 100);
  }

  async showMapMobs(buttonElement) {
    await this.modals.showMapMobs(buttonElement);
  }

  async showMapMobsFromCard(buttonElement) {
    await this.modals.showMapMobsFromCard(buttonElement);
  }

  selectMapMob(mobName, mobCount) {
    this.modals.selectMapMob(mobName, mobCount);
  }

  closeMapMobsModal() {
    this.modals.closeMapMobsModal();
  }

  async showMobDrops(mobId, mobName, mapName = null) {
    await this.modals.showMobDrops(mobId, mobName, mapName);
  }

  closeMobDropsModal() {
    this.modals.closeMobDropsModal();
  }

  async updateDatabaseStatus() {
    await this.db.updateDatabaseStatus();
  }

  showImportSection() {
    this.db.showImportSection();
  }

  async saveFarm() {
    try {
      const formData = new FormData(document.getElementById('farmForm'));
      const farmConfig = this.form.collectFormData(formData, this.selectedItems, this.selectedMaps, this.selectedMapsWithMobs);
      
      // Se está editando, manter o ID
      if (this.currentFarmId) {
        farmConfig.id = this.currentFarmId;
      }
      
      const savedFarm = await this.farmStorage.saveFarm(farmConfig);
      
      // Mostrar mensagem de sucesso
      this.showSaveStatus('success', `Farm "${savedFarm.name}" salvo com sucesso!`);
      
      // Atualizar estado
      this.currentFarmId = savedFarm.id;
      this.showSaveButton();
      
    } catch (error) {
      console.error('Erro ao salvar farm:', error);
      this.showSaveStatus('error', 'Erro ao salvar farm: ' + error.message);
    }
  }

  showSaveStatus(type, message) {
    // Criar ou atualizar elemento de status
    let statusDiv = document.getElementById('saveStatus');
    if (!statusDiv) {
      statusDiv = document.createElement('div');
      statusDiv.id = 'saveStatus';
      statusDiv.className = 'mb-3';
      document.querySelector('.container.main-container').insertBefore(statusDiv, document.querySelector('.text-center'));
    }
    
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    
    statusDiv.innerHTML = `
      <div class="alert ${alertClass} alert-dismissible fade show">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;

    // Auto-hide after 5 seconds
    setTimeout(() => {
      const alert = statusDiv.querySelector('.alert');
      if (alert) {
        const alertInstance = bootstrap.Alert.getOrCreateInstance(alert);
        alertInstance.close();
      }
    }, 5000);
  }

  // Método para adicionar item específico a um mapa
  async addItemToMap(inputElementOrMapName, eventOrItemId, itemName) {
    // Sobrecarga 1: addItemToMap(inputElement, event) - chamada do UI
    if (typeof inputElementOrMapName === 'object' && inputElementOrMapName.value !== undefined) {
      const inputElement = inputElementOrMapName;
      const event = eventOrItemId;
      
      if (event && typeof event === 'object' && event.preventDefault) {
        event.preventDefault();
      }
      
      const searchTerm = inputElement.value.trim();
      if (!searchTerm) return;

      try {
        // Buscar item na base de dados
        const { results: items, totalItems } = await this.search.db.searchItems(searchTerm);
        
        if (totalItems === 0) {
          alert('⚠️ Nenhum item encontrado na base de dados. Importe os dados primeiro.');
          return;
        }
        
        if (items.length === 0) {
          alert('Item não encontrado na base de dados');
          return;
        }

        // Se encontrou apenas um item, adicionar diretamente
        let selectedItem = items[0];
        
        // Se encontrou múltiplos, usar o primeiro item encontrado
        if (items.length > 1) {
          selectedItem = items[0];
        }

        // Encontrar o container de itens do mapa
        const mapCard = inputElement.closest('.card-body');
        const itemsList = mapCard.querySelector('.map-items-list');
        const hiddenInput = mapCard.querySelector('input[name="mapItems[]"]');
        
        // Verificar se já não foi adicionado
        const existingItems = JSON.parse(hiddenInput.value || '[]');
        if (existingItems.find(item => item.id === selectedItem.id)) {
          alert('Este item já foi adicionado a este mapa');
          return;
        }

        // Adicionar item à lista
        existingItems.push({
          id: selectedItem.id,
          name: selectedItem.name
        });

        // Atualizar input hidden
        hiddenInput.value = JSON.stringify(existingItems);

        // Atualizar interface
        this.renderMapItems(itemsList, existingItems);

        // Limpar input
        inputElement.value = '';

      } catch (error) {
        console.error('Erro ao adicionar item ao mapa:', error);
        alert('Erro ao buscar item');
      }
    }
    // Sobrecarga 2: addItemToMap(mapName, itemId, itemName) - chamada programática
    else if (typeof inputElementOrMapName === 'string') {
      const mapName = inputElementOrMapName;
      const itemId = eventOrItemId;
      
      try {
        // Encontrar o card do mapa específico
        const mapCards = document.querySelectorAll('.card-body');
        let targetMapCard = null;
        
        for (const card of mapCards) {
          const mapNameInput = card.querySelector('input[name="mapName[]"]');
          if (mapNameInput && mapNameInput.value === mapName) {
            targetMapCard = card;
            break;
          }
        }
        
        if (!targetMapCard) {
          console.warn(`Mapa ${mapName} não encontrado para adicionar item ${itemName}`);
          return;
        }

        const itemsList = targetMapCard.querySelector('.map-items-list');
        const hiddenInput = targetMapCard.querySelector('input[name="mapItems[]"]');
        
        if (!itemsList || !hiddenInput) {
          console.warn(`Container de itens não encontrado para o mapa ${mapName}`);
          return;
        }
        
        // Verificar se já não foi adicionado
        const existingItems = JSON.parse(hiddenInput.value || '[]');
        if (existingItems.find(item => item.id === itemId)) {
          return; // Item já existe, não adicionar novamente
        }

        // Adicionar item à lista
        existingItems.push({
          id: itemId,
          name: itemName
        });

        // Atualizar input hidden
        hiddenInput.value = JSON.stringify(existingItems);

        // Atualizar interface
        this.renderMapItems(itemsList, existingItems);

      } catch (error) {
        console.error('Erro ao adicionar item ao mapa programaticamente:', error);
      }
    }
  }

  // Método para renderizar lista de itens de um mapa
  renderMapItems(container, items) {
    if (items.length === 0) {
      container.innerHTML = '<small class="text-muted">Nenhum item específico adicionado</small>';
      return;
    }

    const itemsHtml = items.map(item => {
      const itemImageUrl = SearchManager.generateItemImageUrl(item);
      return `
        <div class="d-flex justify-content-between align-items-center mb-1">
          <div class="d-flex align-items-center">
            <img src="${itemImageUrl}" 
                 width="20" height="20" class="me-2" alt="${item.name}"
                 onerror="this.src='${SearchManager.getDefaultItemImage()}'" />
            <small class="text-primary">${item.name}</small>
          </div>
          <button type="button" class="btn btn-sm btn-outline-danger" 
                  onclick="window.farmApp.removeItemFromMap(this, '${item.id}')">
            ❌
          </button>
        </div>
      `;
    }).join('');

    container.innerHTML = itemsHtml;
  }

  // Método para remover item específico de um mapa
  removeItemFromMap(buttonElement, itemId) {
    const mapCard = buttonElement.closest('.card-body');
    const itemsList = mapCard.querySelector('.map-items-list');
    const hiddenInput = mapCard.querySelector('input[name="mapItems[]"]');
    
    // Atualizar dados - converter para comparação adequada
    const existingItems = JSON.parse(hiddenInput.value || '[]');
    const filteredItems = existingItems.filter(item => {
      // Comparar tanto como string quanto como número para garantir compatibilidade
      return item.id != itemId && item.id !== parseInt(itemId) && item.id !== itemId.toString();
    });
    
    hiddenInput.value = JSON.stringify(filteredItems);
    
    // Atualizar interface
    this.renderMapItems(itemsList, filteredItems);
  }

  // Método para selecionar item de drop de monstro
  selectDropItem(itemId, itemName, mobName, specificMapName = null) {
    // 1. Adicionar à lista geral de itens selecionados
    this.selectedItems.add({ id: itemId, name: itemName, quantity: 1 });
    
    // 2. Determinar quais mapas devem receber o item
    let mapsToAddItem = [];
    
    if (specificMapName) {
      // Se um mapa específico foi fornecido, adicionar apenas a ele
      mapsToAddItem = [...this.selectedMapsWithMobs].filter(mapInfo => 
        mapInfo.map === specificMapName
      );
    } else {
      // Caso contrário, encontrar todos os mapas que contêm este monstro
      mapsToAddItem = [...this.selectedMapsWithMobs].filter(mapInfo => 
        mapInfo.mobName === mobName
      );
    }
    
    // 3. Adicionar o item aos mapas identificados
    mapsToAddItem.forEach(mapInfo => {
      this.addItemToMap(mapInfo.map, itemId, itemName);
    });
    
    // 4. Atualizar as visualizações
    this.renderAddedItems();
    
    // 5. Mostrar feedback visual
    let alertMessage;
    if (specificMapName && mapsToAddItem.length > 0) {
      alertMessage = `Item "${itemName}" adicionado à lista geral e ao mapa "${specificMapName}"`;
    } else if (mapsToAddItem.length > 0) {
      alertMessage = `Item "${itemName}" adicionado à lista geral e aos ${mapsToAddItem.length} mapa(s) que contêm "${mobName}"`;
    } else {
      alertMessage = `Item "${itemName}" adicionado à lista geral`;
    }
    
    // Criar notificação temporária
    this.showTemporaryAlert(alertMessage, 'success');
  }

  // Método para mostrar alerta temporário
  showTemporaryAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '2000';
    alertDiv.style.maxWidth = '400px';
    
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-remove após 4 segundos
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.remove();
      }
    }, 4000);
  }
}

// Inicializar aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.farmApp = new FarmApp();
});

export { FarmApp };
