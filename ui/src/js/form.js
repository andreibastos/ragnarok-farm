// Form management module
export class FormManager {
  addSpell(updateCallback) {
    const container = document.getElementById('spellsContainer');
    const row = document.createElement('div');
    row.className = 'row g-3 mt-2';
    row.innerHTML = `
      <div class="col-md-3">
        <label class="form-label">Nome da Magia</label>
        <input type="text" name="spellName[]" class="form-control" onchange="window.farmApp.updateMapSpellOptions()" />
      </div>
      <div class="col-md-3">
        <label class="form-label">Tecla de Atalho</label>
        <input type="text" name="spellKey[]" class="form-control" />
      </div>
      <div class="col-md-3">
        <label class="form-label">Cooldown (ms)</label>
        <input type="number" name="spellCooldown[]" class="form-control" />
      </div>
      <div class="col-md-3">
        <label class="form-label">&nbsp;</label>
        <button type="button" class="btn btn-outline-danger w-100" onclick="window.farmApp.removeSpell(this)">❌ Remover</button>
      </div>`;
    container.appendChild(row);
    
    if (updateCallback) {
      updateCallback();
    }
  }

  removeSpell(button, updateCallback) {
    const row = button.closest('.row');
    row.remove();
    
    if (updateCallback) {
      updateCallback();
    }
  }

  updateMapSpellOptions() {
    const spellSelects = document.querySelectorAll('select[name="mapSpell[]"]');
    const spellNames = [];
    
    // Coletar nomes das magias
    document.querySelectorAll('input[name="spellName[]"]').forEach(input => {
      if (input.value.trim()) {
        spellNames.push(input.value.trim());
      }
    });
    
    // Atualizar todos os selects de magia nos mapas
    spellSelects.forEach(select => {
      const currentValue = select.value;
      select.innerHTML = '<option value="default">🌟 Usar magia padrão</option>';
      
      spellNames.forEach(spellName => {
        const option = document.createElement('option');
        option.value = spellName;
        option.textContent = `✨ ${spellName}`;
        select.appendChild(option);
      });
      
      // Restaurar valor selecionado se ainda existir
      if (currentValue && [...select.options].some(opt => opt.value === currentValue)) {
        select.value = currentValue;
      }
    });
  }

  handleFormSubmit(event, selectedItems, selectedMaps, selectedMapsWithMobs) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const farmConfig = this.collectFormData(formData, selectedItems, selectedMaps, selectedMapsWithMobs);

    // Exibir JSON gerado
    const output = document.getElementById('output');
    output.textContent = JSON.stringify(farmConfig, null, 2);
    output.scrollIntoView({ behavior: 'smooth' });
  }

  collectFormData(formData, selectedItems, selectedMaps, selectedMapsWithMobs) {
    return {
      // Definição inicial
      name: formData.get('farmName') || 'Farm sem nome',
      description: formData.get('farmDescription') || '',
      
      // Coleta extra
      lootRule: {
        byPercent: formData.get('lootByPercent') === 'on',
        percentValue: parseInt(formData.get('lootPercent')) || null,
        byCategory: formData.get('lootByCategory') === 'on',
        categories: formData.getAll('lootCategories')
      },
      
      // Magias
      spells: {
        default: {
          name: formData.get('defaultSpellName') || '',
          key: formData.get('defaultSpellKey') || '',
          cooldown: parseInt(formData.get('defaultSpellCooldown')) || 0
        },
        additional: this.collectAdditionalSpells(formData)
      },
      
      // Itens para coletar
      items: [...selectedItems].map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity || 1
      })),
      
      // Mapas e permanência
      maps: this.collectMapSettings(formData, selectedMapsWithMobs),
      globalSmartStay: formData.get('globalSmartStay') === 'on',
      
      // NPC de venda
      npc: {
        map: formData.get('npcMap') || '',
        coords: formData.get('npcCoords') || '',
        name: formData.get('npcName') || ''
      }
    };
  }

  collectAdditionalSpells(formData) {
    const spellNames = formData.getAll('spellName[]');
    const spellKeys = formData.getAll('spellKey[]');
    const spellCooldowns = formData.getAll('spellCooldown[]');
    
    const additionalSpells = [];
    for (let i = 0; i < spellNames.length; i++) {
      if (spellNames[i] && spellNames[i].trim()) {
        additionalSpells.push({
          name: spellNames[i].trim(),
          key: spellKeys[i] || '',
          cooldown: parseInt(spellCooldowns[i]) || 0
        });
      }
    }
    
    return additionalSpells;
  }

  collectMapSettings(formData, selectedMapsWithMobs) {
    const mapNames = formData.getAll('mapName[]');
    const mapStayValues = formData.getAll('mapStayValue[]');
    const mapSpells = formData.getAll('mapSpell[]');
    const mapMobNames = formData.getAll('mapMobName[]');
    const mapItems = formData.getAll('mapItems[]');
    
    const maps = [];
    
    // Processar mapas manuais (com mapMobName)
    for (let i = 0; i < mapNames.length; i++) {
      if (mapNames[i] && mapNames[i].trim()) {
        const mapConfig = {
          name: mapNames[i].trim(),
          stayValue: parseInt(mapStayValues[i]) || 1,
          spell: mapSpells[i] === 'default' ? null : mapSpells[i],
          source: 'manual'
        };
        
        // Se há um nome de mob correspondente, adicionar
        if (mapMobNames[i] && mapMobNames[i].trim()) {
          mapConfig.targetMob = mapMobNames[i].trim();
        }
        
        // Adicionar itens específicos do mapa se existirem
        if (mapItems[i] && mapItems[i].trim()) {
          try {
            mapConfig.specificItems = JSON.parse(mapItems[i]);
          } catch (error) {
            console.warn('Erro ao parsear itens do mapa:', error);
            mapConfig.specificItems = [];
          }
        } else {
          mapConfig.specificItems = [];
        }
        
        maps.push(mapConfig);
      }
    }
    
    // Processar mapas auto-gerados
    selectedMapsWithMobs.forEach(mapInfo => {
      // Verificar se já não foi adicionado como mapa manual
      const existingMap = maps.find(map => map.name === mapInfo.map);
      if (!existingMap) {
        maps.push({
          name: mapInfo.map,
          stayValue: parseInt(mapInfo.mobCount) || 1,
          spell: null, // Será definido pela configuração global
          source: mapInfo.source,
          targetMob: mapInfo.mobName,
          mobId: mapInfo.mobId,
          specificItems: [] // Mapas auto-gerados começam sem itens específicos
        });
      }
    });
    
    return maps;
  }
}
