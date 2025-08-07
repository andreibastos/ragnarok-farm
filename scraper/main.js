const { insertCompleteMob } = require('./db/insert');
const { scrapeMobData } = require('./scrapers/mob-scraper');
const { scrapeContainerItems, scrapeAllContainers, listAvailableContainers } = require('./scrapers/item-scraper');
const { scrapeItemDetails } = require('./scrapers/item-details-scraper');
const { insertCompleteContainer, getItemSources } = require('./db/insert-items');
const { getDatabaseStats, getDuplicateItems } = require('./db/queries');
const pool = require('./db/db');

async function getExistingMobIds() {
  const result = await pool.query(`SELECT id FROM mobs`);
  return new Set(result.rows.map(row => parseInt(row.id)));
}

async function main() {
  const existingIds = await getExistingMobIds();
  let startMobId = 1839 ; // ID inicial para scraping de mobs

  for (let i = 0; i <= 11; i++) {
    const mobId = startMobId + i;
    if (existingIds.has(mobId)) {
      console.log(`🔁 Pulando mob ${mobId}, já existe no banco.`);
      continue;
    }

    try {
      const mobData = await scrapeMobData(mobId);
      if (mobData && mobData.id && mobData.name && mobData.stats && mobData.drops) {
        // await insertCompleteMob(mobData);
      } else {
        console.warn(`⚠️  Mob ${mobId} inválido`);
      }
    } catch (error) {
      console.error(`❌ Erro no mob ${mobId}: ${error.message}`);
    }
  }

  await pool.end();
  console.log('✅ Finalizado.');
}

// Função para executar scraping de itens de containers específicos
async function scrapeContainerItemsFunction() {
  try {
    console.log('📦 Containers disponíveis:');
    const containers = listAvailableContainers();
    containers.forEach((container, index) => {
      console.log(`${index + 1}. ${container}`);
    });
    
    // Exemplo: coletar itens do Old Blue Box
    console.log('\n🎁 Iniciando coleta de itens do Old Blue Box...');
    const oldBlueBoxItems = await scrapeContainerItems('Old Blue Box');
    console.log(`✅ Coletados ${oldBlueBoxItems.length} itens do Old Blue Box`);
    
    // Insere no banco de dados
    if (oldBlueBoxItems.length > 0) {
      const containerData = {
        gid: 1, // Old Blue Box
        name: 'Old Blue Box',
        items: oldBlueBoxItems
      };
      
      const result = await insertCompleteContainer(containerData);
      if (result.success) {
        console.log(`✅ ${result.dropsInserted} itens inseridos no banco`);
      } else {
        console.error(`❌ Erro ao inserir: ${result.error}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao coletar itens de containers:', error.message);
  }
}

// Função para executar scraping de TODOS os containers
async function scrapeAllContainersFunction() {
  try {
    console.log('📦 Iniciando coleta de TODOS os containers...');
    const allContainerData = await scrapeAllContainers();
    
    // Exibe resumo
    console.log('\n📊 Resumo da coleta:');
    let totalInserted = 0;
    
    for (const [containerName, data] of Object.entries(allContainerData)) {
      if (data.error) {
        console.log(`❌ ${containerName}: ERRO - ${data.error}`);
      } else {
        console.log(`✅ ${containerName}: ${data.itemCount} itens coletados`);
        
        // Insere no banco
        if (data.items.length > 0) {
          const containerData = {
            gid: data.info.gid,
            name: containerName,
            items: data.items
          };
          
          const result = await insertCompleteContainer(containerData);
          if (result.success) {
            totalInserted += result.dropsInserted;
            console.log(`   → ${result.dropsInserted} itens inseridos no banco`);
          }
        }
      }
    }
    
    console.log(`\n🎯 Total de itens inseridos: ${totalInserted}`);
    
  } catch (error) {
    console.error('❌ Erro ao coletar todos os containers:', error.message);
  }
}

// Função para mostrar estatísticas do banco
async function showDatabaseStats() {
  try {
    console.log('📊 Estatísticas do Banco de Dados:');
    const stats = await getDatabaseStats();
    
    console.log(`📦 Total de itens: ${stats.total_items}`);
    console.log(`🐉 Total de mobs: ${stats.total_mobs}`);
    console.log(`📦 Total de containers: ${stats.total_containers}`);
    console.log(`🎯 Itens de mobs: ${stats.items_from_mobs}`);
    console.log(`📦 Itens de containers: ${stats.items_from_containers}`);
    console.log(`🔄 Itens híbridos (mobs + containers): ${stats.hybrid_items}`);
    
    // Mostra alguns itens duplicados
    console.log('\n🔄 Exemplos de itens híbridos:');
    const duplicates = await getDuplicateItems();
    duplicates.slice(0, 5).forEach(item => {
      console.log(`   • ${item.name} - ${item.mob_sources} mobs, ${item.container_sources} containers`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error.message);
  }
}

// Função para buscar fontes de um item específico
async function showItemSources(itemId) {
  try {
    console.log(`🔍 Buscando fontes do item ID: ${itemId}`);
    const sources = await getItemSources(itemId);
    
    console.log(`\n📊 Item ${itemId} tem ${sources.total_sources} fontes:`);
    
    if (sources.mobs.length > 0) {
      console.log(`\n🐉 Mobs (${sources.mobs.length}):`);
      sources.mobs.forEach(mob => {
        console.log(`   • ${mob.name} - ${mob.rate}% drop rate`);
      });
    }
    
    if (sources.containers.length > 0) {
      console.log(`\n📦 Containers (${sources.containers.length}):`);
      sources.containers.forEach(container => {
        console.log(`   • ${container.name} - ${container.rate}% drop rate`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar fontes do item:', error.message);
  }
}

// Executa scraping de mobs
main();

// Para executar scraping de itens de um container específico:
// scrapeContainerItemsFunction();

// Para executar scraping de TODOS os containers:
// scrapeAllContainersFunction();

// Para ver estatísticas do banco:
// showDatabaseStats();

// Para ver fontes de um item específico (substitua 13304 pelo ID desejado):
// showItemSources(13304);
