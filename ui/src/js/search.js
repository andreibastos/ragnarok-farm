// Search functionality module
export class SearchManager {
  constructor(database) {
    this.db = database;
  }

  setupItemSearch(displayResultsCallback, showDetailsCallback) {
    const searchInput = document.querySelector('input[name="searchItem"]');
    const resultsDiv = document.getElementById('itemResults');
    
    if (!searchInput) {
      console.error('Campo de busca de item não encontrado!');
      return;
    }
    
    searchInput.addEventListener('input', async (e) => {
      const query = e.target.value.trim();
      if (query.length < 2) {
        resultsDiv.innerHTML = '';
        return;
      }

      try {
        const { results, totalItems } = await this.db.searchItems(query);
        
        if (totalItems === 0) {
          resultsDiv.innerHTML = '<div class="alert alert-warning">⚠️ Nenhum item encontrado na base de dados. Importe os dados primeiro.</div>';
          return;
        }

        displayResultsCallback(results);
      } catch (err) {
        console.error('Erro na busca por itens:', err);
        resultsDiv.innerHTML = '<div class="alert alert-danger">❌ Erro ao buscar itens. Verifique o console.</div>';
      }
    });

    // Store the callback for use in displayItemResults
    this.showItemDetailsCallback = showDetailsCallback;
  }

  setupMobSearch(displayResultsCallback, showDetailsCallback) {
    const searchInput = document.querySelector('input[name="searchMob"]');
    const resultsDiv = document.getElementById('mobResults');
    
    if (!searchInput) {
      console.error('Campo de busca de monstro não encontrado!');
      return;
    }
    
    searchInput.addEventListener('input', async (e) => {
      const query = e.target.value.trim();
      if (query.length < 2) {
        resultsDiv.innerHTML = '';
        return;
      }

      try {
        const { results, totalMobs } = await this.db.searchMobs(query);
        
        if (totalMobs === 0) {
          resultsDiv.innerHTML = '<div class="alert alert-warning">⚠️ Nenhum monstro encontrado na base de dados. Importe os dados primeiro.</div>';
          return;
        }

        displayResultsCallback(results);
      } catch (err) {
        console.error('Erro na busca por monstros:', err);
        resultsDiv.innerHTML = '<div class="alert alert-danger">❌ Erro ao buscar monstros. Verifique o console.</div>';
      }
    });

    // Store the callback for use in displayMobResults
    this.showMobDetailsCallback = showDetailsCallback;
  }

  setupMapItemSearch(inputElement, resultsContainer, mapName) {
    if (!inputElement || !resultsContainer) {
      console.error('Elementos de busca de item do mapa não encontrados!');
      return;
    }
    
    inputElement.addEventListener('input', async (e) => {
      const query = e.target.value.trim();
      if (query.length < 2) {
        resultsContainer.innerHTML = '';
        resultsContainer.style.display = 'none';
        return;
      }

      try {
        const { results, totalItems } = await this.db.searchItems(query);
        
        if (totalItems === 0) {
          resultsContainer.innerHTML = '<div class="alert alert-warning small">⚠️ Nenhum item encontrado</div>';
          resultsContainer.style.display = 'block';
          return;
        }

        // Mostrar até 5 resultados
        const limitedResults = results.slice(0, 5);
        this.displayMapItemResults(limitedResults, resultsContainer, inputElement, mapName);
        resultsContainer.style.display = 'block';
      } catch (err) {
        console.error('Erro na busca por itens do mapa:', err);
        resultsContainer.innerHTML = '<div class="alert alert-danger small">❌ Erro ao buscar itens</div>';
        resultsContainer.style.display = 'block';
      }
    });

    // Navegação por teclado
    inputElement.addEventListener('keydown', (e) => {
      const visibleResults = resultsContainer.querySelectorAll('.map-item-result:not([style*="display: none"])');
      const currentSelected = resultsContainer.querySelector('.map-item-result.selected');
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!currentSelected && visibleResults.length > 0) {
          visibleResults[0].classList.add('selected');
        } else if (currentSelected) {
          const currentIndex = Array.from(visibleResults).indexOf(currentSelected);
          currentSelected.classList.remove('selected');
          if (currentIndex < visibleResults.length - 1) {
            visibleResults[currentIndex + 1].classList.add('selected');
          } else {
            visibleResults[0].classList.add('selected');
          }
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!currentSelected && visibleResults.length > 0) {
          visibleResults[visibleResults.length - 1].classList.add('selected');
        } else if (currentSelected) {
          const currentIndex = Array.from(visibleResults).indexOf(currentSelected);
          currentSelected.classList.remove('selected');
          if (currentIndex > 0) {
            visibleResults[currentIndex - 1].classList.add('selected');
          } else {
            visibleResults[visibleResults.length - 1].classList.add('selected');
          }
        }
      } else if (e.key === 'Enter' && currentSelected) {
        e.preventDefault();
        currentSelected.click();
      } else if (e.key === 'Escape') {
        resultsContainer.style.display = 'none';
      }
    });

    // Esconder resultados quando clicar fora
    document.addEventListener('click', (e) => {
      if (!inputElement.contains(e.target) && !resultsContainer.contains(e.target)) {
        resultsContainer.style.display = 'none';
      }
    });
  }

  displayMapItemResults(items, container, inputElement, mapName) {
    container.innerHTML = '';
    
    items.forEach(item => {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'map-item-result border-bottom p-2 cursor-pointer';
      resultDiv.style.cursor = 'pointer';
      
      const itemImageUrl = SearchManager.generateItemImageUrl(item);
      
      resultDiv.innerHTML = `
        <div class="d-flex align-items-center">
          <img src="${itemImageUrl}" 
               class="me-2" width="20" height="20" alt="${item.name}" 
               onerror="this.src='${SearchManager.getDefaultItemImage()}'" />
          <div>
            <small class="fw-medium">${item.name}</small>
            <br><small class="text-muted">🔢 ID: ${item.id}</small>
            ${item.name && item.name.toLowerCase().includes('card') ? '<br><small class="text-info">🃏 Carta</small>' : ''}
          </div>
        </div>
      `;
      
      // Hover effect
      resultDiv.addEventListener('mouseenter', () => {
        // Remove seleção de outros itens
        container.querySelectorAll('.map-item-result').forEach(r => r.classList.remove('selected'));
        resultDiv.classList.add('selected');
      });
      
      resultDiv.addEventListener('mouseleave', () => {
        resultDiv.classList.remove('selected');
      });
      
      resultDiv.addEventListener('click', () => {
        inputElement.value = item.name;
        container.style.display = 'none';
        // Adicionar automaticamente o item ao mapa
        window.farmApp.addItemToMap(inputElement);
      });
      
      container.appendChild(resultDiv);
    });
  }

  async getItemMapData(item) {
    try {
      const drops = await this.db.getMobDrops(item.id);
      const mobIds = drops.map(drop => drop.mob_id);
      
      if (mobIds.length === 0) {
        return [];
      }

      const mobs = await this.db.getMobsByIds(mobIds);
      const mapData = [];

      for (const mob of mobs) {
        const respawns = await this.db.getMobRespawns(mob.id);
        respawns.forEach(respawn => {
          mapData.push({
            map: respawn.map,
            count: respawn.count || 1,
            mobName: mob.name,
            mobId: mob.id,
            respawnRule: respawn.rule || 'normal'
          });
        });
      }

      return mapData.sort((a, b) => b.count - a.count);
    } catch (err) {
      console.error('Erro ao buscar detalhes do drop:', err);
      return [];
    }
  }

  async getMobDetails(mob) {
    try {
      const [drops, respawns] = await Promise.all([
        this.db.getItemDrops(mob.id),
        this.db.getMobRespawns(mob.id)
      ]);

      const itemIds = drops.map(drop => drop.item_id);
      const items = itemIds.length > 0 ? await this.db.getItemsByIds(itemIds) : [];

      return { items, respawns };
    } catch (err) {
      console.error('Erro ao buscar detalhes do monstro:', err);
      return { items: [], respawns: [] };
    }
  }

  // Utility methods for image handling
  static generateMobImageUrls(mobId) {
    return [
      `https://file5s.ratemyserver.net/mobs/${mobId}.gif`,
      `https://ratemyserver.net/mob_db.php?mob_id=${mobId}&small=1`,
      `https://www.divine-pride.net/img/mobs/png/${mobId}.png`,
      `https://irowiki.org/images/${mobId}.gif`
    ];
  }

  static generateItemImageUrl(item) {
    if (item.name && item.name.toLowerCase().includes('card')) {
      return 'https://file5s.ratemyserver.net/items/small/card.gif';
    } else {
      return `https://file5s.ratemyserver.net/items/small/${item.id}.gif`;
    }
  }

  static getDefaultItemImage() {
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  }

  static getDefaultMobImage() {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iI0Y4RjlGQSIvPgo8dGV4dCB4PSIxNiIgeT0iMjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzY5NzU4MyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+PC90ZXh0Pgo8L3N2Zz4K';
  }
}

// Global function for trying next mob image URL
window.tryNextMobImage = function(imgElement, urls, currentIndex) {
  if (currentIndex < urls.length) {
    console.log(`Tentando URL ${currentIndex + 1}/${urls.length} para mob ID ${imgElement.dataset.mobId}: ${urls[currentIndex]}`);
    imgElement.src = urls[currentIndex];
    imgElement.onerror = function() {
      window.tryNextMobImage(imgElement, urls, currentIndex + 1);
    };
  } else {
    console.log(`Todas as URLs falharam para mob ID ${imgElement.dataset.mobId}, usando ícone padrão`);
    imgElement.src = SearchManager.getDefaultMobImage();
    imgElement.onerror = null;
  }
};
