// Farm rendering utilities compatível com os testes unitários
export class FarmRenderer {
  // Cria e retorna um elemento DOM para o card do farm
  createFarmCard(farm) {
    const items = Array.isArray(farm.selectedItems) ? farm.selectedItems : [];
    const maps = Array.isArray(farm.selectedMaps) ? farm.selectedMaps : [];
    const itemCount = items.length;
    const mapCount = maps.length;
    const itemLabel = itemCount === 1 ? 'item' : 'itens';
    const mapLabel = mapCount === 1 ? 'mapa' : 'mapas';
    const level = farm.level ? `Level ${farm.level}` : '';
    const farmClass = farm.class || '';
    const server = farm.server || '';
    const createdAt = this.formatDate(farm.createdAt);

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-body">
        <h5 class="card-title">${this.escapeHtml(farm.name)}</h5>
        <h6 class="card-subtitle mb-2 text-muted">${level} ${this.escapeHtml(farmClass)} ${this.escapeHtml(server)}</h6>
        <p class="card-text">
          ${itemCount} ${itemLabel} | ${mapCount} ${mapLabel}
        </p>
        <p class="card-text"><small class="text-muted">Criado em: ${createdAt}</small></p>
        <div class="farm-actions">
          <button class="btn btn-outline-primary btn-sm" data-action="view" data-farm-id="${farm.id}">Visualizar</button>
          <button class="btn btn-outline-secondary btn-sm" data-action="edit" data-farm-id="${farm.id}">Editar</button>
          <button class="btn btn-outline-danger btn-sm" data-action="delete" data-farm-id="${farm.id}">Deletar</button>
        </div>
      </div>
    `;
    return card;
  }

  // Renderiza cards de farms no elemento #farmsList
  renderFarmCards(farms) {
    const farmsList = document.getElementById('farmsList');
    farmsList.innerHTML = '';
    if (!farms || farms.length === 0) {
      farmsList.innerHTML = '<div class="text-muted">Nenhum farm encontrado</div>';
      return;
    }
    farms.forEach(farm => {
      try {
        const card = this.createFarmCard(farm);
        farmsList.appendChild(card);
      } catch (e) {
        // Se farm incompleto, ainda renderiza o nome
        const fallback = document.createElement('div');
        fallback.className = 'card';
        fallback.textContent = farm.name || 'Farm sem nome';
        farmsList.appendChild(fallback);
      }
    });
  }

  // Renderiza detalhes do farm no elemento #farmDetailModalBody
  renderFarmDetail(farm) {
    const modalBody = document.getElementById('farmDetailModalBody');
    let html = '';
    html += `<h4>${this.escapeHtml(farm.name)}</h4>`;
    if (farm.level) html += `<div>Level ${farm.level}</div>`;
    if (farm.class) html += `<div>${this.escapeHtml(farm.class)}</div>`;
    if (farm.server) html += `<div>${this.escapeHtml(farm.server)}</div>`;
    if (farm.build) html += `<div>${this.escapeHtml(farm.build)}</div>`;
    if (farm.observation) html += `<div>${this.escapeHtml(farm.observation)}</div>`;
    // Itens
    if (Array.isArray(farm.selectedItems) && farm.selectedItems.length > 0) {
      html += `<div>Itens: ${farm.selectedItems.map(i => this.escapeHtml(i)).join(', ')}</div>`;
    } else {
      html += '<div>Nenhum item selecionado</div>';
    }
    // Mapas
    if (Array.isArray(farm.selectedMaps) && farm.selectedMaps.length > 0) {
      html += `<div>Mapas: ${farm.selectedMaps.map(m => this.escapeHtml(m)).join(', ')}</div>`;
    } else {
      html += '<div>Nenhum mapa selecionado</div>';
    }
    // Mobs
    if (Array.isArray(farm.selectedMapsWithMobs) && farm.selectedMapsWithMobs.length > 0) {
      html += '<div>Mobs: ' + farm.selectedMapsWithMobs.map(m => `${this.escapeHtml(m.map)}: ${Array.isArray(m.mobs) ? m.mobs.map(mob => this.escapeHtml(mob)).join(', ') : ''}`).join(' | ') + '</div>';
    } else {
      html += '<div>Nenhum mob selecionado</div>';
    }
    modalBody.innerHTML = html;
  }

  // Formata datas para dd/mm/yyyy hh:mm
  formatDate(date) {
    if (!date) return 'Data inválida';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Data inválida';
    const pad = n => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // Escapa HTML para evitar XSS
  escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
