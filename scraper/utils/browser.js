const { Builder } = require('selenium-webdriver');

/**
 * Cria e configura uma instância do navegador
 * @returns {Promise<WebDriver>} Driver configurado
 */
async function createBrowser() {
    const driver = new Builder().forBrowser('chrome').build();
    await driver.manage().setTimeouts({ implicit: 2000 });
    return driver;
}

/**
 * Verifica se há erro na página (elemento .eitext)
 * @param {WebDriver} driver 
 * @returns {Promise<boolean>} true se houver erro
 */
async function hasPageError(driver) {
    const { By } = require('selenium-webdriver');
    const errorElements = await driver.findElements(By.css('.eitext'));
    return errorElements.length > 0;
}

module.exports = {
    createBrowser,
    hasPageError
};
