// Modal management module
import { SearchManager } from './search.js';

export class ModalManager {
  constructor(database) {
    this.db = database;
  }

  async showMapMobs(buttonElement) {
    const cardBody = buttonElement.closest('.card-body');
    const mapNameInput = cardBody.querySelector('input[name="mapName[]"]');
    const mapName = mapNameInput.value.trim();
    
    if (!mapName) {
      alert('Por favor, digite o nome do mapa primeiro.');
      mapNameInput.focus();
      return;
    }
    
    try {
      const respawns = await this.db.getMapRespawns(mapName);
      
      if (respawns.length === 0) {
        alert(`Nenhum monstro encontrado no mapa "${mapName}". Verifique se o nome está correto.`);
        return;
      }
      
      const mobIds = respawns.map(respawn => respawn.mob_id);
      const mobs = await this.db.getMobsByIds(mobIds);
      
      const mobsMap = {};
      mobs.forEach(mob => {
        mobsMap[mob.id] = mob;
      });
      
      const mobsList = respawns.map(respawn => {
        const mob = mobsMap[respawn.mob_id];
        return {
          mob: mob || { id: respawn.mob_id, name: 'Monstro desconhecido' },
          count: respawn.count || 1,
          rule: respawn.rule || 'normal'
        };
      }).sort((a, b) => b.count - a.count);
      
      this.showMapMobsModal(mapName, mobsList, true);
      
    } catch (err) {
      console.error('Erro ao buscar monstros do mapa:', err);
      alert('Erro ao buscar monstros do mapa. Verifique o console.');
    }
  }

  async showMapMobsFromCard(buttonElement) {
    const cardBody = buttonElement.closest('.card-body');
    const mapNameHidden = cardBody.querySelector('input[name="mapName[]"]');
    const mapName = mapNameHidden ? mapNameHidden.value.trim() : '';
    
    if (!mapName) {
      alert('Nome do mapa não encontrado.');
      return;
    }
    
    try {
      const respawns = await this.db.getMapRespawns(mapName);
      
      if (respawns.length === 0) {
        alert(`Nenhum monstro encontrado no mapa "${mapName}". Verifique se o nome está correto.`);
        return;
      }
      
      const mobIds = respawns.map(respawn => respawn.mob_id);
      const mobs = await this.db.getMobsByIds(mobIds);
      
      const mobsMap = {};
      mobs.forEach(mob => {
        mobsMap[mob.id] = mob;
      });
      
      const mobsList = respawns.map(respawn => {
        const mob = mobsMap[respawn.mob_id];
        return {
          mob: mob || { id: respawn.mob_id, name: 'Monstro desconhecido' },
          count: respawn.count || 1,
          rule: respawn.rule || 'normal'
        };
      }).sort((a, b) => b.count - a.count);
      
      this.showMapMobsModal(mapName, mobsList, false);
      
    } catch (err) {
      console.error('Erro ao buscar monstros do mapa:', err);
      alert('Erro ao buscar monstros do mapa. Verifique o console.');
    }
  }

  showMapMobsModal(mapName, mobsList, allowSelection = false) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.zIndex = '1050';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    let mobsHtml = '';
    mobsList.forEach(mobInfo => {
      const mobImageUrls = SearchManager.generateMobImageUrls(mobInfo.mob.id);
      
      const selectButton = allowSelection ? `
        <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); window.farmApp.selectMapMob('${mobInfo.mob.name}', ${mobInfo.count})">
          ✅ Selecionar
        </button>
      ` : '';
      
      mobsHtml += `
        <div class="d-flex align-items-center p-2 border-bottom cursor-pointer" onclick="window.farmApp.showMobDrops(${mobInfo.mob.id}, '${mobInfo.mob.name}')" style="cursor: pointer;">
          <img src="${mobImageUrls[0]}" 
               class="me-3 mob-image" width="32" height="32" alt="${mobInfo.mob.name}"
               data-mob-id="${mobInfo.mob.id}"
               onerror="tryNextMobImage(this, ${JSON.stringify(mobImageUrls).replace(/"/g, '&quot;')}, 1)" />
          <div class="flex-grow-1">
            <strong>${mobInfo.mob.name}</strong>
            <br><small class="text-muted">🔢 ID: ${mobInfo.mob.id} • 📍 ${mobInfo.count}x • 📄 ${mobInfo.rule}</small>
            <br><small class="text-info">🖱️ Clique para ver os drops</small>
          </div>
          ${selectButton}
        </div>
      `;
    });
    
    modalContent.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0">🗺️ Monstros em: ${mapName}</h5>
        <button class="btn btn-sm btn-outline-secondary" onclick="window.farmApp.closeMapMobsModal()">
          ❌ Fechar
        </button>
      </div>
      <div class="mb-3">
        <small class="text-muted">Encontrados ${mobsList.length} tipos de monstros neste mapa:</small>
      </div>
      <div style="max-height: 400px; overflow-y: auto;">
        ${mobsHtml}
      </div>
      <div class="mt-3 text-center">
        <button class="btn btn-secondary" onclick="window.farmApp.closeMapMobsModal()">
          Fechar
        </button>
      </div>
    `;
    
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
    
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        this.closeMapMobsModal();
      }
    });
  }

  selectMapMob(mobName, mobCount) {
    const manualCards = document.querySelectorAll('.card-body:has(input[name="mapMobName[]"])');
    const lastCard = manualCards[manualCards.length - 1];
    
    if (lastCard) {
      const mobNameInput = lastCard.querySelector('input[name="mapMobName[]"]');
      const stayValueInput = lastCard.querySelector('input[name="mapStayValue[]"]');
      
      if (mobNameInput) {
        mobNameInput.value = mobName;
      }
      
      if (stayValueInput) {
        stayValueInput.value = mobCount;
        stayValueInput.placeholder = `Auto: ${mobCount} mobs`;
      }
    }
    
    this.closeMapMobsModal();
  }

  closeMapMobsModal() {
    const modal = document.querySelector('.modal-overlay[style*="z-index: 1050"]');
    if (modal) {
      modal.remove();
    }
  }

  async showMobDrops(mobId, mobName) {
    try {
      const drops = await this.db.getItemDrops(mobId);
      
      if (drops.length === 0) {
        alert(`O monstro "${mobName}" não possui drops cadastrados.`);
        return;
      }
      
      const itemIds = drops.map(drop => drop.item_id);
      const items = await this.db.getItemsByIds(itemIds);
      
      const itemsMap = {};
      items.forEach(item => {
        itemsMap[item.id] = item;
      });
      
      const dropsList = drops.map(drop => {
        const item = itemsMap[drop.item_id];
        return {
          item: item || { id: drop.item_id, name: 'Item desconhecido' },
          drop: drop
        };
      }).sort((a, b) => a.item.name.localeCompare(b.item.name));
      
      this.showMobDropsModal(mobName, dropsList);
      
    } catch (err) {
      console.error('Erro ao buscar drops do monstro:', err);
      alert('Erro ao buscar drops do monstro. Verifique o console.');
    }
  }

  showMobDropsModal(mobName, dropsList) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.zIndex = '1060';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.maxWidth = '500px';
    
    let dropsHtml = '';
    dropsList.forEach(dropInfo => {
      const itemImageUrl = SearchManager.generateItemImageUrl(dropInfo.item);
      
      dropsHtml += `
        <div class="d-flex align-items-center p-2 border-bottom">
          <img src="${itemImageUrl}" 
               class="me-3" width="24" height="24" alt="${dropInfo.item.name}"
               onerror="this.src='${SearchManager.getDefaultItemImage()}'" />
          <div class="flex-grow-1">
            <strong>${dropInfo.item.name}</strong>
            <br><small class="text-muted">🔢 ID: ${dropInfo.item.id}</small>
            ${dropInfo.item.name && dropInfo.item.name.toLowerCase().includes('card') ? '<br><small class="text-info">🃏 Carta</small>' : ''}
          </div>
        </div>
      `;
    });
    
    modalContent.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0"> Drops de: ${mobName}</h5>
        <button class="btn btn-sm btn-outline-secondary" onclick="window.farmApp.closeMobDropsModal()">
          ❌ Fechar
        </button>
      </div>
      <div class="mb-3">
        <small class="text-muted">Encontrados ${dropsList.length} itens que este monstro pode dropar:</small>
      </div>
      <div style="max-height: 400px; overflow-y: auto;">
        ${dropsHtml}
      </div>
      <div class="mt-3 text-center">
        <button class="btn btn-secondary" onclick="window.farmApp.closeMobDropsModal()">
          Fechar
        </button>
      </div>
    `;
    
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
    
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        this.closeMobDropsModal();
      }
    });
  }

  closeMobDropsModal() {
    const modal = document.querySelector('.modal-overlay[style*="z-index: 1060"]');
    if (modal) {
      modal.remove();
    }
  }
}
