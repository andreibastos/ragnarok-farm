const { By, until } = require('selenium-webdriver');
const { createBrowser, hasPageError } = require('../utils/browser');
const { insertOrUpdateItem, insertContainerDrops } = require('../db/insert-items');

// Mapeamento de containers e suas URLs na random_db
const CONTAINERS = {
    'Old Blue Box': { gid: 1, name: 'Old Blue Box', itemId: 603},
    'Old Purple Box ': { gid: 2, name: 'Old Purple Box ', itemId: 617 },
    'Old Card Album': { gid: 3, name: 'Old Card Album', itemId: 616 },
    'Gift Box': { gid: 4, name: 'Gift Box', itemId: 665 },
    'Wrapped Mask': { gid: 25, name: 'Wrapped Mask', itemId: 12107 },
    'Jewelry Box': { gid: 26, name: 'Jewelry Box', itemId: 12106 },
    'Old Red Box': { gid: 40, name: 'Old Red Box', itemId: 12186 },
    'Old Red Box 2': { gid: 38, name: 'Old Red Box 2', itemId: 12189 },
    'Old Yellow Box': { gid: 42, name: 'Old Yellow Box', itemId: 12240 },
    'Old Gift Box': { gid: 43, name: 'Old Gift Box', itemId: 12244 },
    'Mystical Card Album': { gid: 44, name: 'Mystical Card Album', itemId: 12246 },
    'Fancy Ball Box': { gid: 46, name: 'Fancy Ball Box', itemId: 12248 },
    'Masquerade Ball Box 2': { gid: 48, name: 'Masquerade Ball Box 2', itemId: 12286 },
    'Treasure Ed. Helm Box': { gid: 51, name: 'Treasure Ed. Helm Box', itemId: 12334 },
    'Treasure Ed. Box': { gid: 52, name: 'Treasure Ed. Box', itemId: 12339 }
};

/**
 * Lista todos os containers disponíveis para scraping
 * @returns {Array<string>} Lista de nomes dos containers
 */
function listAvailableContainers() {
    return Object.keys(CONTAINERS);
}

/**
 * Faz scraping de itens que saem de um container específico
 * @param {string} containerName Nome do container (ex: 'Old Blue Box')
 * @returns {Promise<Array>} Lista de itens que saem do container
 */
async function scrapeContainerItems(containerName) {
    const container = CONTAINERS[containerName];
    if (!container) {
        throw new Error(`Container '${containerName}' não encontrado. Containers disponíveis: ${Object.keys(CONTAINERS).join(', ')}`);
    }

    const driver = await createBrowser();
    const itemsData = [];

    try {
        console.log(`🔍 Coletando itens do container: ${containerName}...`);
        await driver.get(`https://ratemyserver.net/index.php?page=random_db&op=1&gid=${container.gid}`);
        await driver.wait(until.elementLocated(By.css('body')), 1000);

        // Verifica se há erro na página
        if (await hasPageError(driver)) {
            console.log(`Erro ao acessar página de itens do ${containerName}`);
            return [];
        }

        // Busca todas as tabelas de itens na página
        const itemTables = await driver.findElements(By.css('table.content_box_db'));
        
        for (let tableIndex = 0; tableIndex < itemTables.length; tableIndex++) {
            const table = itemTables[tableIndex];
            
            // Obter categoria da tabela (ex: Weapon, Armor, Ammunition, Usable Item)
            const categoryElement = await table.findElement(By.css('tr.filled_header_db th')).catch(() => null);
            if (!categoryElement) continue;
            
            const category = await categoryElement.getText();
            console.log(`   📦 Processando categoria: ${category}`);
            
            // Buscar todas as linhas de dados (pular cabeçalho)
            const dataRows = await table.findElements(By.css('tr:not(.filled_header_db)'));
            
            for (const row of dataRows) {
                const cells = await row.findElements(By.css('td.bborder'));
                
                // Processar células de 2 em 2 (item + slot)
                for (let i = 0; i < cells.length; i += 2) {
                    if (i + 1 < cells.length) {
                        const itemCell = cells[i];
                        const slotCell = cells[i + 1];
                        
                        try {
                            // Verificar se a célula não está vazia
                            const itemText = await itemCell.getText();
                            if (itemText.trim() === '-' || itemText.trim() === '') continue;
                            
                            // Extrair informações do item
                            const linkElement = await itemCell.findElement(By.css('a')).catch(() => null);
                            if (!linkElement) continue;
                            
                            const itemName = await linkElement.getText();
                            const itemUrl = await linkElement.getAttribute('href');
                            
                            // Extrair item_id da URL
                            const itemIdMatch = itemUrl.match(/item_id=(\d+)/);
                            const itemId = itemIdMatch ? parseInt(itemIdMatch[1]) : null;
                            
                            // Extrair informação de slot
                            const slotText = await slotCell.getText();
                            const slots = slotText.includes('[') ? 
                                parseInt(slotText.match(/\[(\d+)\]/)?.[1] || '0') : 
                                (slotText === '-' ? null : 0);
                            
                            // Extrair URL da imagem
                            const imgElement = await itemCell.findElement(By.css('img')).catch(() => null);
                            const imageUrl = imgElement ? await imgElement.getAttribute('src') : null;
                            
                            // Adicionar item aos dados
                            itemsData.push({
                                containerName: containerName,
                                containerGid: container.gid,
                                containerItemId: container.itemId,
                                category: category,
                                itemId: itemId,
                                itemName: itemName.trim(),
                                slots: slots,
                                itemUrl: itemUrl,
                                imageUrl: imageUrl,
                                scrapedAt: new Date().toISOString()
                            });
                            
                        } catch (cellError) {
                            console.log(`     ⚠️  Erro ao processar célula: ${cellError.message}`);
                            continue;
                        }
                    }
                }
            }
        }
        
        console.log(`✅ Coletados ${itemsData.length} itens do ${containerName}`);

    } catch (error) {
        console.error(`Error fetching items from ${containerName}:`, error.message);
    } finally {
        await driver.quit();
    }

    return itemsData;
}

/**
 * Faz scraping de todos os containers disponíveis
 * @returns {Promise<object>} Objeto com dados de todos os containers
 */
async function scrapeAllContainers() {
    const allContainerData = {};
    
    for (const [containerName, containerInfo] of Object.entries(CONTAINERS)) {
        try {
            console.log(`� Processando container: ${containerName}`);
            const items = await scrapeContainerItems(containerName);
            allContainerData[containerName] = {
                info: containerInfo,
                items: items,
                itemCount: items.length
            };
        } catch (error) {
            console.error(`❌ Erro no container ${containerName}:`, error.message);
            allContainerData[containerName] = {
                info: containerInfo,
                items: [],
                itemCount: 0,
                error: error.message
            };
        }
    }
    
    return allContainerData;
}

/**
 * Processa e salva os dados de um container no banco de dados
 * @param {string} containerName Nome do container
 * @param {Array} itemsData Dados dos itens extraídos
 * @returns {Promise<object>} Resultado da operação
 */
async function processAndSaveContainerData(containerName, itemsData) {
    const container = CONTAINERS[containerName];
    if (!container) {
        throw new Error(`Container '${containerName}' não encontrado`);
    }

    console.log(`💾 Salvando dados do ${containerName} no banco...`);
    
    const drops = [];
    let itemsProcessed = 0;
    let itemsSkipped = 0;

    for (const item of itemsData) {
        try {
            // Inserir/atualizar o item na tabela items
            await insertOrUpdateItem({
                id: item.itemId,
                name: item.itemName,
                image: item.imageUrl,
                type: item.category,
                description: `Item from ${containerName}`
            });

            // Adicionar às drops (sem rate por enquanto, pois a página não mostra)
            drops.push({
                item_id: item.itemId,
                rate: null, // A página random_db não mostra rates
                quantity: 1,
                item_data: {
                    id: item.itemId,
                    name: item.itemName,
                    image: item.imageUrl,
                    type: item.category,
                    description: `Item from ${containerName}`
                }
            });

            itemsProcessed++;
        } catch (error) {
            console.error(`   ❌ Erro ao processar item ${item.itemName}:`, error.message);
            itemsSkipped++;
        }
    }

    // Inserir todas as drops do container
    const dropsInserted = await insertContainerDrops(container.gid, drops);

    const result = {
        containerName,
        containerGid: container.gid,
        itemsProcessed,
        itemsSkipped,
        dropsInserted,
        success: dropsInserted > 0
    };

    console.log(`✅ Container ${containerName} processado: ${itemsProcessed} itens, ${dropsInserted} drops inseridos`);
    return result;
}

/**
 * Faz scraping completo de um container e salva no banco
 * @param {string} containerName Nome do container
 * @returns {Promise<object>} Resultado da operação completa
 */
async function scrapeAndSaveContainer(containerName) {
    try {
        console.log(`🚀 Iniciando scraping completo do ${containerName}...`);
        
        // Fazer scraping dos dados
        const itemsData = await scrapeContainerItems(containerName);
        
        if (itemsData.length === 0) {
            console.log(`⚠️  Nenhum item encontrado para ${containerName}`);
            return { success: false, error: 'Nenhum item encontrado' };
        }

        // Processar e salvar no banco
        const saveResult = await processAndSaveContainerData(containerName, itemsData);
        
        return {
            success: true,
            scraping: {
                itemsFound: itemsData.length,
                categories: [...new Set(itemsData.map(item => item.category))]
            },
            database: saveResult
        };
        
    } catch (error) {
        console.error(`❌ Erro no scraping completo do ${containerName}:`, error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Lista todos os containers disponíveis
 * @returns {Array} Lista de containers disponíveis
 */
function listAvailableContainers() {
    return Object.keys(CONTAINERS);
}

module.exports = {
    scrapeContainerItems,
    scrapeAllContainers,
    scrapeAndSaveContainer,
    processAndSaveContainerData,
    listAvailableContainers,
    CONTAINERS
};
