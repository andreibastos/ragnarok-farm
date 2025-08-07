// UI management module
import { SearchManager } from './search.js';

export class UIManager {
  displayItemResults(items, container) {
    container.innerHTML = '';
    
    items.forEach(item => {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'border rounded p-2 mb-2 cursor-pointer search-result';
      resultDiv.style.cursor = 'pointer';
      
      const itemImageUrl = SearchManager.generateItemImageUrl(item);
      
      resultDiv.innerHTML = `
        <div class="d-flex align-items-center">
          <img src="${itemImageUrl}" 
               class="me-3" width="24" height="24" alt="${item.name}" 
               onerror="this.src='${SearchManager.getDefaultItemImage()}'" />
          <div>
            <strong>📝 ${item.name}</strong>
            <br><small class="text-muted">🔢 ID: ${item.id}</small>
            ${item.name && item.name.toLowerCase().includes('card') ? '<br><small class="text-info">🃏 Carta</small>' : ''}
          </div>
        </div>
      `;
      
      resultDiv.addEventListener('click', () => {
        if (window.farmApp && window.farmApp.search.showItemDetailsCallback) {
          window.farmApp.search.showItemDetailsCallback(item);
        }
      });
      container.appendChild(resultDiv);
    });
  }

  displayMobResults(mobs, container) {
    container.innerHTML = '';
    
    mobs.forEach(mob => {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'border rounded p-2 mb-2 cursor-pointer search-result';
      resultDiv.style.cursor = 'pointer';
      
      const mobImageUrls = SearchManager.generateMobImageUrls(mob.id);
      
      resultDiv.innerHTML = `
        <div class="d-flex align-items-center">
          <img src="${mobImageUrls[0]}" 
               class="me-3 mob-image" width="32" height="32" alt="${mob.name}"
               data-mob-id="${mob.id}"
               onerror="tryNextMobImage(this, ${JSON.stringify(mobImageUrls).replace(/"/g, '&quot;')}, 1)" />
          <div>
            <strong>👹 ${mob.name}</strong>
            <br><small class="text-muted">🔢 ID: ${mob.id}</small>
          </div>
        </div>
      `;
      
      resultDiv.addEventListener('click', () => {
        if (window.farmApp && window.farmApp.search.showMobDetailsCallback) {
          window.farmApp.search.showMobDetailsCallback(mob);
        }
      });
      container.appendChild(resultDiv);
    });
  }

  displayMapSelection(item, mapData, addCallback, cancelCallback) {
    const resultsDiv = document.getElementById('itemResults');
    resultsDiv.innerHTML = `
      <div class="border rounded p-3 bg-light">
        <h6 class="sticky-top bg-light py-2 mb-3 border-bottom">🎯 Mapas onde encontrar: ${item.name}</h6>
        <div id="mapSelectionList" style="max-height: 200px; overflow-y: auto;"></div>
        <div class="sticky-bottom bg-light pt-3 mt-3 border-top">
          <div class="btn-group-responsive">
            <button class="btn btn-primary btn-sm" onclick="window.farmApp.addSelectedItemAndMaps(${item.id}, '${item.name}')">
              ✅ Adicionar Item e Mapas Selecionados
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.farmApp.clearItemSearch()">
              ❌ Cancelar
            </button>
          </div>
        </div>
      </div>
    `;

    const mapList = document.getElementById('mapSelectionList');
    mapData.forEach((mapInfo, index) => {
      const mapDiv = document.createElement('div');
      mapDiv.className = 'form-check mb-2';
      mapDiv.innerHTML = `
        <input class="form-check-input" type="checkbox" id="map_${index}" data-map="${mapInfo.map}" data-mob-id="${mapInfo.mobId}">
        <label class="form-check-label" for="map_${index}">
          📍 <strong>${mapInfo.map}</strong> - 🔢 ${mapInfo.count}x ${mapInfo.mobName}
          <br><small class="text-muted">📄 ${mapInfo.respawnRule}</small>
        </label>
      `;
      mapList.appendChild(mapDiv);
    });
  }

  displayMobDropsAndMaps(mob, items, respawns, addCallback, cancelCallback) {
    const resultsDiv = document.getElementById('mobResults');
    
    const mobImageUrls = SearchManager.generateMobImageUrls(mob.id);
    
    resultsDiv.innerHTML = `
      <div class="border rounded p-3 bg-light">
        <div class="d-flex align-items-center mb-3 sticky-top bg-light py-2 border-bottom">
          <img src="${mobImageUrls[0]}" 
               class="me-3 mob-image" width="32" height="32" alt="${mob.name}"
               data-mob-id="${mob.id}"
               onerror="tryNextMobImage(this, ${JSON.stringify(mobImageUrls).replace(/"/g, '&quot;')}, 1)" />
          <h6>👹 ${mob.name} - Drops e Mapas</h6>
        </div>
        
        <div style="max-height: 300px; overflow-y: auto;">
          <div class="mb-3">
            <h6 class="h6">🎁 Drops:</h6>
            <div id="mobDropsList"></div>
          </div>
          
          <div class="mb-3">
            <h6 class="h6">📍 Mapas:</h6>
            <div id="mobMapsList"></div>
          </div>
        </div>
        
        <div class="sticky-bottom bg-light pt-3 mt-3 border-top">
          <div class="btn-group-responsive">
            <button class="btn btn-primary btn-sm" onclick="window.farmApp.addSelectedMobItems(${mob.id}, '${mob.name}')">
              ✅ Adicionar Itens e Mapas Selecionados
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.farmApp.clearMobSearch()">
              ❌ Cancelar
            </button>
          </div>
        </div>
      </div>
    `;

    // Exibir drops
    const dropsList = document.getElementById('mobDropsList');
    items.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'form-check mb-2';
      
      const itemImageUrl = SearchManager.generateItemImageUrl(item);
      
      itemDiv.innerHTML = `
        <input class="form-check-input" type="checkbox" id="drop_${index}" data-item-id="${item.id}">
        <label class="form-check-label" for="drop_${index}">
          <img src="${itemImageUrl}" 
               width="20" height="20" class="me-2" alt="${item.name}"
               onerror="this.style.display='none'" />
          ${item.name} <small class="text-muted">(${item.id})</small>
          ${item.name && item.name.toLowerCase().includes('card') ? ' <span class="badge bg-info text-dark">🃏</span>' : ''}
        </label>
      `;
      dropsList.appendChild(itemDiv);
    });

    // Exibir mapas
    const mapsList = document.getElementById('mobMapsList');
    respawns.forEach((respawn, index) => {
      const mapDiv = document.createElement('div');
      mapDiv.className = 'form-check mb-2';
      mapDiv.innerHTML = `
        <input class="form-check-input" type="checkbox" id="mobmap_${index}" data-map="${respawn.map}">
        <label class="form-check-label" for="mobmap_${index}">
          📍 ${respawn.map} - 🔢 ${respawn.count || 1}x
          <br><small class="text-muted">📄 ${respawn.rule || 'normal'}</small>
        </label>
      `;
      mapsList.appendChild(mapDiv);
    });
  }

  renderAddedItems(selectedItems, updateQuantityCallback, removeCallback) {
    const list = document.getElementById("addedItemsList");
    list.innerHTML = "";

    selectedItems.forEach(item => {
      const li = document.createElement("li");
      li.className = "list-group-item";
      
      const itemImageUrl = SearchManager.generateItemImageUrl(item);
      
      li.innerHTML = `
        <div class="d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center flex-grow-1">
            <img src="${itemImageUrl}" 
                 class="me-3" width="24" height="24" alt="${item.name}"
                 onerror="this.src='${SearchManager.getDefaultItemImage()}'" />
            <div class="flex-grow-1">
              <span class="fw-medium">${item.name}</span>
              <small class="text-muted d-block">🔢 ID: ${item.id}</small>
              ${item.name && item.name.toLowerCase().includes('card') ? '<small class="text-info d-block">🃏 Carta</small>' : ''}
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <div class="d-flex align-items-center">
              <label class="form-label small me-2 mb-0">Qtd:</label>
              <input type="number" 
                     class="form-control form-control-sm" 
                     style="width: 80px;" 
                     name="itemQuantity_${item.id}"
                     value="${item.quantity || 1}" 
                     min="1" 
                     placeholder="1"
                     onchange="window.farmApp.updateItemQuantity(${item.id}, this.value)" />
            </div>
            <button class="btn btn-sm btn-outline-danger" onclick="window.farmApp.removeItem(${item.id})">
              ❌ Remover
            </button>
          </div>
        </div>
      `;
      list.appendChild(li);
    });
  }
}
