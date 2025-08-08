// Dashboard main entry point
import { FarmStorage } from './farm-storage.js';
import { FarmRenderer } from './farm-renderer.js';
import { FarmManager } from './farm-manager.js';

class FarmDashboard {
  constructor() {
    this.storage = new FarmStorage();
    this.renderer = new FarmRenderer();
    this.manager = new FarmManager(this.storage, this.renderer);

    this.farms = [];
    this.filteredFarms = [];

    this.init();
  }

  init() {
    try {
      this.loadFarms();
      this.setupEventListeners();
      this.renderFarms();
      this.updateFarmsCount();
    } catch (error) {
      console.error('Erro na inicialização do dashboard:', error);
    }
  }

  loadFarms() {
    this.farms = this.storage.getAllFarms();
    this.filteredFarms = [...this.farms];
  }

  setupEventListeners() {
    // Busca
    const searchInput = document.getElementById('searchFarms');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterFarms(e.target.value);
      });
    }

    // Ordenação
    const sortSelect = document.getElementById('sortFarms');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortFarms(e.target.value);
      });
    }

    // Importação de arquivo
    const importFileInput = document.getElementById('importFileInput');
    if (importFileInput) {
      importFileInput.addEventListener('change', (e) => {
        this.handleFileImport(e);
      });
    }
  }

  filterFarms(searchTerm) {
    const term = searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredFarms = [...this.farms];
    } else {
      this.filteredFarms = this.farms.filter(farm =>
        farm.name.toLowerCase().includes(term) ||
        farm.description.toLowerCase().includes(term) ||
        farm.maps.some(map => map.name.toLowerCase().includes(term)) ||
        farm.items.some(item => item.name.toLowerCase().includes(term))
      );
    }

    this.renderFarms();
  }

  sortFarms(sortBy) {
    switch (sortBy) {
      case 'name':
        this.filteredFarms.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'date':
        this.filteredFarms.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'maps':
        this.filteredFarms.sort((a, b) => b.maps.length - a.maps.length);
        break;
      case 'items':
        this.filteredFarms.sort((a, b) => b.items.length - a.items.length);
        break;
    }

    this.renderFarms();
  }

  renderFarms() {
    const farmsList = document.getElementById('farmsList');
    const noFarmsMessage = document.getElementById('noFarmsMessage');

    if (this.filteredFarms.length === 0) {
      if (farmsList) farmsList.innerHTML = '';
      if (noFarmsMessage) noFarmsMessage.style.display = 'block';
    } else {
      if (noFarmsMessage) noFarmsMessage.style.display = 'none';
      if (farmsList) {
        farmsList.innerHTML = this.filteredFarms.map(farm =>
          this.renderer.renderFarmCard(farm)
        ).join('');

        // Adicionar event listeners aos botões
        this.attachCardEventListeners();
      }
    }
  }

  attachCardEventListeners() {
    // Botões de visualizar
    document.querySelectorAll('.btn-view-farm').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const farmId = e.target.dataset.farmId;
        this.viewFarm(farmId);
      });
    });

    // Botões de editar
    document.querySelectorAll('.btn-edit-farm').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const farmId = e.target.dataset.farmId;
        this.editFarm(farmId);
      });
    });

    // Botões de duplicar
    document.querySelectorAll('.btn-duplicate-farm').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const farmId = e.target.dataset.farmId;
        this.duplicateFarm(farmId);
      });
    });

    // Botões de exportar
    document.querySelectorAll('.btn-export-farm').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const farmId = e.target.dataset.farmId;
        this.exportFarm(farmId);
      });
    });

    // Botões de deletar
    document.querySelectorAll('.btn-delete-farm').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const farmId = e.target.dataset.farmId;
        this.deleteFarm(farmId);
      });
    });
  }

  updateFarmsCount() {
    const countElement = document.getElementById('farmsCount');
    if (countElement) {
      countElement.textContent = this.farms.length;
    }
  }

  // Métodos públicos para uso nos templates HTML
  async importFarm() {
    const fileInput = document.getElementById('importFileInput');
    fileInput.click();
  }

  async handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await this.manager.importFarm(file);
      if (result.success) {
        await this.loadFarms();
        this.renderFarms();
        this.updateFarmsCount();
        this.showImportStatus('success', `Farm "${result.farmName}" importado com sucesso!`);
      } else {
        this.showImportStatus('error', result.error);
      }
    } catch (error) {
      this.showImportStatus('error', 'Erro ao importar farm: ' + error.message);
    }

    // Limpar input
    event.target.value = '';
  }

  async exportAllFarms() {
    try {
      const result = await this.manager.exportAllFarms();
      if (result.success) {
        this.showImportStatus('success', `${result.count} farms exportados com sucesso!`);
      } else {
        this.showImportStatus('error', result.error);
      }
    } catch (error) {
      this.showImportStatus('error', 'Erro ao exportar farms: ' + error.message);
    }
  }

  async clearAllFarms() {
    if (this.farms.length === 0) {
      this.showImportStatus('warning', 'Nenhum farm para limpar.');
      return;
    }

    const confirmed = await this.showConfirmDialog(
      'Limpar Todos os Farms',
      `Tem certeza que deseja remover todos os ${this.farms.length} farms? Esta ação não pode ser desfeita.`
    );

    if (confirmed) {
      try {
        await this.storage.clearAllFarms();
        this.farms = [];
        this.filteredFarms = [];
        this.renderFarms();
        this.updateFarmsCount();
        this.showImportStatus('success', 'Todos os farms foram removidos.');
      } catch (error) {
        this.showImportStatus('error', 'Erro ao limpar farms: ' + error.message);
      }
    }
  }

  async viewFarm(farmId) {
    const farm = this.farms.find(f => f.id === farmId);
    if (farm) {
      this.showFarmDetails(farm);
    }
  }

  editFarm(farmId) {
    // Redirecionar para a página de criação com o farm carregado
    window.location.href = `create-farm.html?edit=${farmId}`;
  }

  async duplicateFarm(farmId) {
    try {
      const result = await this.manager.duplicateFarm(farmId);
      if (result.success) {
        await this.loadFarms();
        this.renderFarms();
        this.updateFarmsCount();
        this.showImportStatus('success', `Farm duplicado como "${result.newName}"`);
      } else {
        this.showImportStatus('error', result.error);
      }
    } catch (error) {
      this.showImportStatus('error', 'Erro ao duplicar farm: ' + error.message);
    }
  }

  async exportFarm(farmId) {
    try {
      const result = await this.manager.exportFarm(farmId);
      if (result.success) {
        this.showImportStatus('success', `Farm "${result.farmName}" exportado com sucesso!`);
      } else {
        this.showImportStatus('error', result.error);
      }
    } catch (error) {
      this.showImportStatus('error', 'Erro ao exportar farm: ' + error.message);
    }
  }

  async deleteFarm(farmId) {
    const farm = this.farms.find(f => f.id === farmId);
    if (!farm) return;

    const confirmed = await this.showConfirmDialog(
      'Deletar Farm',
      `Tem certeza que deseja deletar o farm "${farm.name}"? Esta ação não pode ser desfeita.`
    );

    if (confirmed) {
      try {
        await this.storage.deleteFarm(farmId);
        await this.loadFarms();
        this.renderFarms();
        this.updateFarmsCount();
        this.showImportStatus('success', `Farm "${farm.name}" foi deletado.`);
      } catch (error) {
        this.showImportStatus('error', 'Erro ao deletar farm: ' + error.message);
      }
    }
  }

  showFarmDetails(farm) {
    const modal = new bootstrap.Modal(document.getElementById('farmDetailsModal'));
    const content = document.getElementById('farmDetailsContent');

    content.innerHTML = this.renderer.renderFarmDetails(farm);

    // Configurar botão de editar
    document.getElementById('editFarmBtn').onclick = () => {
      modal.hide();
      this.editFarm(farm.id);
    };

    modal.show();
  }

  showImportStatus(type, message) {
    const statusDiv = document.getElementById('importStatus');
    const alertClass = type === 'success' ? 'alert-success' :
      type === 'warning' ? 'alert-warning' : 'alert-danger';

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
        bootstrap.Alert.getOrCreateInstance(alert).close();
      }
    }, 5000);
  }

  showConfirmDialog(title, message) {
    return new Promise((resolve) => {
      const modal = new bootstrap.Modal(document.getElementById('confirmModal'));

      document.querySelector('#confirmModal .modal-title').textContent = title;
      document.getElementById('confirmMessage').textContent = message;

      const confirmBtn = document.getElementById('confirmAction');
      confirmBtn.onclick = () => {
        modal.hide();
        resolve(true);
      };

      modal.show();

      // Resolver como false se o modal for fechado sem confirmar
      document.getElementById('confirmModal').addEventListener('hidden.bs.modal', () => {
        resolve(false);
      }, { once: true });
    });
  }
}


export { FarmDashboard };
