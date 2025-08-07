const { By, until } = require('selenium-webdriver');
const { createBrowser, hasPageError } = require('../utils/browser');

/**
 * Faz scraping de dados detalhados de um item específico por ID
 * URL: https://ratemyserver.net/item_db.php?item_id=13304&small=1&back=1
 * @param {number} itemId ID do item
 * @returns {Promise<object>} Dados completos do item
 */
async function scrapeItemDetails(itemId) {
    const driver = await createBrowser();
    const itemData = {};

    try {
        console.log(`🔍 Coletando dados detalhados do item ID: ${itemId}`);
        await driver.get(`https://ratemyserver.net/item_db.php?item_id=${itemId}&small=1&back=1`);
        await driver.wait(until.elementLocated(By.css('body')), 1000);

        // Verifica se o item existe
        if (await hasPageError(driver)) {
            console.log(`Item ID ${itemId} does not exist or is not found.`);
            return {};
        }

        itemData.id = itemId;
        
        // TODO: Implementar extração dos dados detalhados do item
        // - Nome do item
        // - Descrição
        // - Tipo
        // - Preço
        // - Peso
        // - Slots
        // - Nível necessário
        // - Jobs que podem usar
        // - Localização (equipamento)
        // - Refinável
        // - Etc.
        
        console.log('⚠️  Implementação pendente - scraper de dados detalhados de item individual');

    } catch (error) {
        console.error(`Error fetching detailed data for item ID ${itemId}:`, error.message);
    } finally {
        await driver.quit();
    }

    return itemData;
}

/**
 * Faz scraping de dados básicos de um item (para uso em listas)
 * @param {number} itemId ID do item
 * @returns {Promise<object>} Dados básicos do item
 */
async function scrapeItemBasicInfo(itemId) {
    const driver = await createBrowser();
    const itemData = {};

    try {
        console.log(`🔍 Coletando dados básicos do item ID: ${itemId}`);
        await driver.get(`https://ratemyserver.net/index.php?item_id=${itemId}&page=item_db`);
        await driver.wait(until.elementLocated(By.css('body')), 1000);

        if (await hasPageError(driver)) {
            console.log(`Item ID ${itemId} does not exist or is not found.`);
            return {};
        }

        itemData.id = itemId;
        
        // TODO: Implementar extração dos dados básicos
        // - Nome
        // - Imagem
        // - Tipo básico
        
        console.log('⚠️  Implementação pendente - scraper de dados básicos de item');

    } catch (error) {
        console.error(`Error fetching basic data for item ID ${itemId}:`, error.message);
    } finally {
        await driver.quit();
    }

    return itemData;
}

module.exports = {
    scrapeItemDetails,
    scrapeItemBasicInfo
};
