const { By, until } = require('selenium-webdriver');
const { createBrowser, hasPageError } = require('../utils/browser');
const { cleanText, parseMobName, parseRespawnRules, parseMapInfo, parseDropInfo } = require('../utils/parser');


const DEBUG_LOG = false;
/**
 * Faz scraping de dados de um mob específico
 * @param {number} mobId ID do mob para coletar dados
 * @returns {Promise<object>} Dados do mob coletados
 */
async function scrapeMobData(mobId) {
    const driver = await createBrowser();
    const mobData = {};

    try {
        await driver.get(`https://ratemyserver.net/index.php?mob_id=${mobId}&page=mob_db&quick=1&f=1&mob_search=Search`);
        await driver.wait(until.elementLocated(By.css('.wrapper')), 1000);

        // Verifica se o mob existe
        if (await hasPageError(driver)) {
            console.log(`Mob ID ${mobId} does not exist or is not found.`);
            return {};
        }

        // Nome do mob
        let mobName = await driver.findElement(By.css('.mob_stat_head .filled_header_text')).getText();
        mobName = parseMobName(cleanText(mobName));
        console.log(`Mob Name: ${mobName} (ID: ${mobId})`);

        mobData.id = mobId;
        mobData.name = mobName;

        // Imagem
        const mobImageElement = await driver.findElement(By.css('.mob_img'));
        mobData.image = await mobImageElement.getAttribute('src');
        if (DEBUG_LOG)
            console.log(`Mob Image: ${mobData.image}`);

        // Stats do mob
        mobData.stats = await scrapeMobStats(driver);

        // Respawn
        mobData.respawn = await scrapeMobRespawn(driver);

        // Elementos
        mobData.elements = await scrapeMobElements(driver);

        // Mode
        mobData.mode = await scrapeMobMode(driver);

        // Drops
        mobData.drops = await scrapeMobDrops(driver);

        // Skills
        mobData.skills = await scrapeMobSkills(driver);

    } catch (error) {
        console.error(`Error fetching data for mob ID ${mobId}:`, error.message);
    } finally {
        await driver.quit();
    }

    return mobData;
}

/**
 * Coleta stats do mob
 */
async function scrapeMobStats(driver) {
    const mobStats = await driver.findElements(By.css('.mob_stat table tbody tr'));
    const mobStatsData = {};

    for (const stat of mobStats) {
        const cols = await stat.findElements(By.css('th, td'));

        let statName = '';
        let statValue = '';

        if (cols.length == 3 || cols.length == 2) {
            statName = await cols[0].getText();
            statValue = await cols[1].getText();
            if (statName) mobStatsData[statName] = statValue

        } else if (cols.length == 4) {
            statName = await cols[0].getText();
            statValue = await cols[1].getText();
            if (statName) mobStatsData[statName] = statValue

            statName = await cols[2].getText();
            statValue = await cols[3].getText();
            if (statName) mobStatsData[statName] = statValue


        } else if (cols.length == 6) {
            statName = await cols[0].getText();
            statValue = await cols[1].getText();
            if (statName) mobStatsData[statName] = statValue

            statName = await cols[2].getText();
            statValue = await cols[3].getText();
            if (statName) mobStatsData[statName] = statValue

            statName = await cols[4].getText();
            statValue = await cols[5].getText();
            if (statName) mobStatsData[statName] = statValue

        }

    }

    if (DEBUG_LOG) {
        console.log('Mob Stats:');
        for (const [key, value] of Object.entries(mobStatsData)) {
            console.log(`\t${key}: ${value}`);
        }
    }

    return mobStatsData;
}

/**
 * Coleta informações de respawn
 */
async function scrapeMobRespawn(driver) {
    const mobileSpawnElements = await driver.findElements(By.css('.mob_spawn'));
    const mobRespawn = [];

    const [mobRespawnDiv] = mobileSpawnElements;
    if (!mobRespawnDiv) {
        console.log('No respawn div found for this mob.');
        return mobRespawn;
    }

    const spawnDivs = await mobRespawnDiv.findElements(By.css('div[style*="margin"]'));

    for (const spawnDiv of spawnDivs) {
        const linkElement = await spawnDiv.findElement(By.css('a'));
        const mapCodeText = await linkElement.getText();

        const { mapCode, count } = parseMapInfo(mapCodeText);

        const tipsElements = await spawnDiv.findElements(By.css('.tips_mm'));
        let mapName = '';
        let respawnRules = {};

        for (const tip of tipsElements) {
            const tipText = await tip.getText();
            if (tipText.startsWith('- ')) {
                mapName = tipText.replace('- ', '').trim();
            } else if (tipText.includes('+')) {
                respawnRules = parseRespawnRules(tipText);
            }
        }

        mobRespawn.push({
            map: mapCode,
            count: respawnRules?.count || count,
            respawnRules,
        });
    }

    if (DEBUG_LOG) {
        console.log('Mob Respawn:');
        for (const respawn of mobRespawn) {
            console.log(`\tMap: ${respawn.map} - Count: ${respawn.count} - Respawn Info: ${JSON.stringify(respawn.respawnRules)}`);
        }
    }

    return mobRespawn;
}

/**
 * Coleta elementos do mob
 */
async function scrapeMobElements(driver) {
    const elements = await driver.findElements(By.css('.mob_ele .ele_grid_container .ele_grid_mob'));
    const elementsData = {};

    for (let i = 0; i < elements.length; i += 2) {
        const elementName = await elements[i].getText();
        const elementValue = (await elements[i + 1].getText()).replace('%', '').trim();
        elementsData[elementName] = parseInt(elementValue);
    }

    if (DEBUG_LOG) {
        console.log('Mob Elements:');
        for (const [key, value] of Object.entries(elementsData)) {
            console.log(`\t${key}: ${value}`);
        }
    }

    return elementsData;
}

/**
 * Coleta mode do mob
 */
async function scrapeMobMode(driver) {
    const mode = await driver.findElements(By.css('.mob_mode .tips_mm ul li'));
    const modeData = [];

    for (const m of mode) {
        const modeName = await m.getText();
        modeData.push(modeName);
    }

    if (DEBUG_LOG) {
        console.log('Mob Mode:');
        for (const m of modeData) {
            console.log(`\t${m}`);
        }
    }

    return modeData;
}

/**
 * Coleta drops do mob
 */
async function scrapeMobDrops(driver) {
    const drops = await driver.findElements(By.css('.drop_grid_container a'));
    const dropsData = [];

    for (const drop of drops) {
        let dropName = await drop.findElement(By.css('.grid_cell')).getText();
        const { name, rate } = parseDropInfo(dropName);

        const dropLink = await drop.getAttribute('href');
        const dropId = dropLink.split('item_id=')[1].split('&')[0];
        const dropImage = await drop.findElement(By.css('.mob_drop_icon img')).getAttribute('src');

        dropsData.push({ dropId, name, image: dropImage, rate });
    }

    if (DEBUG_LOG) {
        console.log('Mob Drops:');
        for (const drop of dropsData) {
            console.log(`\tDrop: ${drop.name} - Rate: ${drop.rate}% - Image: ${drop.image}`);
        }
    }

    return dropsData;
}

/**
 * Coleta skills do mob
 */
async function scrapeMobSkills(driver) {
    const skills = await driver.findElements(By.css('.mob_skill_grid .grid_cell'));
    const skillsData = [];

    for (const skill of skills) {
        const skillName = await skill.findElement(By.css('a')).getText();
        const skillLink = await skill.findElement(By.css('a')).getAttribute('href');
        skillsData.push({ name: skillName, link: skillLink });
    }

    if (DEBUG_LOG) {
        console.log('Mob Skills:');
        for (const skill of skillsData) {
            console.log(`\tSkill: ${skill.name}`);
        }
    }

    return skillsData;
}

module.exports = {
    scrapeMobData
};
