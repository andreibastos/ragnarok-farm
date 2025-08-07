import { FarmRenderer } from '../../src/js/farm-renderer.js';

describe('FarmRenderer', () => {
  let farmRenderer;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="farmsList"></div>
      <div id="farmDetailModalBody"></div>
    `;
    
    farmRenderer = new FarmRenderer();
  });

  describe('renderFarmCards', () => {
    test('should render farm cards correctly', () => {
      const farms = [
        {
          id: '1',
          name: 'Test Farm 1',
          level: '90',
          class: 'Knight',
          server: 'bRO',
          selectedItems: ['Red Potion'],
          selectedMaps: ['prontera'],
          createdAt: '2025-01-01T00:00:00.000Z'
        },
        {
          id: '2',
          name: 'Test Farm 2',
          level: '95',
          class: 'Wizard',
          server: 'iRO',
          selectedItems: ['Blue Potion', 'Yellow Potion'],
          selectedMaps: ['geffen', 'morocc'],
          createdAt: '2025-01-02T00:00:00.000Z'
        }
      ];

      farmRenderer.renderFarmCards(farms);

      const farmsList = document.getElementById('farmsList');
      expect(farmsList.children).toHaveLength(2);
      
      const firstCard = farmsList.children[0];
      expect(firstCard.textContent).toContain('Test Farm 1');
      expect(firstCard.textContent).toContain('Level 90');
      expect(firstCard.textContent).toContain('Knight');
      expect(firstCard.textContent).toContain('bRO');
      expect(firstCard.textContent).toContain('1 item');
      expect(firstCard.textContent).toContain('1 mapa');
    });

    test('should handle empty farms array', () => {
      farmRenderer.renderFarmCards([]);

      const farmsList = document.getElementById('farmsList');
      expect(farmsList.innerHTML).toContain('Nenhum farm encontrado');
    });

    test('should handle farms with missing data', () => {
      const farms = [
        {
          id: '1',
          name: 'Incomplete Farm'
          // Missing other fields
        }
      ];

      expect(() => {
        farmRenderer.renderFarmCards(farms);
      }).not.toThrow();

      const farmsList = document.getElementById('farmsList');
      expect(farmsList.textContent).toContain('Incomplete Farm');
    });
  });

  describe('renderFarmDetail', () => {
    test('should render farm details correctly', () => {
      const farm = {
        id: '1',
        name: 'Detailed Farm',
        level: '90',
        class: 'Knight',
        server: 'bRO',
        build: 'Test build',
        observation: 'Test observation',
        selectedItems: ['Red Potion', 'Blue Potion'],
        selectedMaps: ['prontera'],
        selectedMapsWithMobs: [
          { map: 'prontera', mobs: ['Poring', 'Drops'] }
        ],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z'
      };

      farmRenderer.renderFarmDetail(farm);

      const modalBody = document.getElementById('farmDetailModalBody');
      
      expect(modalBody.textContent).toContain('Detailed Farm');
      expect(modalBody.textContent).toContain('Level 90');
      expect(modalBody.textContent).toContain('Knight');
      expect(modalBody.textContent).toContain('bRO');
      expect(modalBody.textContent).toContain('Test build');
      expect(modalBody.textContent).toContain('Test observation');
      expect(modalBody.textContent).toContain('Red Potion');
      expect(modalBody.textContent).toContain('Blue Potion');
      expect(modalBody.textContent).toContain('prontera');
      expect(modalBody.textContent).toContain('Poring');
      expect(modalBody.textContent).toContain('Drops');
    });

    test('should handle farm with no items or maps', () => {
      const farm = {
        id: '1',
        name: 'Empty Farm',
        selectedItems: [],
        selectedMaps: [],
        selectedMapsWithMobs: []
      };

      farmRenderer.renderFarmDetail(farm);

      const modalBody = document.getElementById('farmDetailModalBody');
      expect(modalBody.textContent).toContain('Nenhum item selecionado');
      expect(modalBody.textContent).toContain('Nenhum mapa selecionado');
      expect(modalBody.textContent).toContain('Nenhum mob selecionado');
    });
  });

  describe('formatDate', () => {
    test('should format date correctly', () => {
      const date = '2025-01-01T12:30:45.000Z';
      const formatted = farmRenderer.formatDate(date);
      
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
    });

    test('should handle invalid date', () => {
      const formatted = farmRenderer.formatDate('invalid-date');
      expect(formatted).toBe('Data inválida');
    });

    test('should handle null or undefined date', () => {
      expect(farmRenderer.formatDate(null)).toBe('Data inválida');
      expect(farmRenderer.formatDate(undefined)).toBe('Data inválida');
    });
  });

  describe('createFarmCard', () => {
    test('should create farm card with all action buttons', () => {
      const farm = {
        id: '1',
        name: 'Test Farm',
        level: '90',
        class: 'Knight',
        server: 'bRO',
        selectedItems: ['Red Potion'],
        selectedMaps: ['prontera'],
        createdAt: '2025-01-01T00:00:00.000Z'
      };

      const card = farmRenderer.createFarmCard(farm);

      expect(card.classList.contains('card')).toBe(true);
      expect(card.querySelector('[data-action="view"]')).toBeTruthy();
      expect(card.querySelector('[data-action="edit"]')).toBeTruthy();
      expect(card.querySelector('[data-action="delete"]')).toBeTruthy();
      
      expect(card.textContent).toContain('Test Farm');
      expect(card.textContent).toContain('Level 90');
    });

    test('should handle pluralization correctly', () => {
      const farmSingle = {
        id: '1',
        name: 'Single Farm',
        selectedItems: ['Red Potion'],
        selectedMaps: ['prontera']
      };

      const farmPlural = {
        id: '2',
        name: 'Plural Farm',
        selectedItems: ['Red Potion', 'Blue Potion'],
        selectedMaps: ['prontera', 'geffen']
      };

      const cardSingle = farmRenderer.createFarmCard(farmSingle);
      const cardPlural = farmRenderer.createFarmCard(farmPlural);

      expect(cardSingle.textContent).toContain('1 item');
      expect(cardSingle.textContent).toContain('1 mapa');
      
      expect(cardPlural.textContent).toContain('2 itens');
      expect(cardPlural.textContent).toContain('2 mapas');
    });
  });
});
