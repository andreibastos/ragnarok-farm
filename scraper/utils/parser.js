/**
 * Remove padrões comuns de texto
 * @param {string} text Texto a ser limpo
 * @returns {string} Texto limpo
 */
function cleanText(text) {
    return text.replace(/Mob-ID#\d+/, '').trim().split('(')[0].trim();
}

/**
 * Extrai nome do mob removendo informações extras
 * @param {string} mobName Nome bruto do mob
 * @returns {string} Nome limpo do mob
 */
function parseMobName(mobName) {
    const mobNameMatch = mobName.match(/(.+?)\s+\&nbsp;\((.+?)\)/);
    return mobNameMatch ? mobNameMatch[1].trim() : mobName;
}

/**
 * Extrai informações de respawn de texto
 * @param {string} respawnText Texto de respawn
 * @returns {object} Objeto com count, min, max
 */
function parseRespawnRules(respawnText) {
    const cleanText = respawnText.replace('&nbsp;', ' ').replace('+', '').trim();
    const respawnParts = cleanText.split('/');
    
    if (respawnParts.length === 2) {
        // pode ser  + 5x / 30 min ou + 5x / 10~20 min
        const countPart = respawnParts[0].trim();
        const timePart = respawnParts[1].trim();
        const countMatch = countPart.match(/(\d+)x/);
        const count = countMatch ? parseInt(countMatch[1]) : 1;
        let min = 0, max = 0;
        if (timePart.includes('~')) {
            const timeMatch = timePart.match(/(\d+)~(\d+)\s*min/);
            if (timeMatch) {
                min = parseInt(timeMatch[1]);
                max = parseInt(timeMatch[2]);
            }
            return { type: 'dynamic', count, min, max };
        } else {
            const timeMatch = timePart.match(/(\d+)\s*min/);
            if (timeMatch) {
                min = parseInt(timeMatch[1]);
                max = min;
            }
            return { type: 'fixed', count, min, max };
        }

    }
    return cleanText;
}

/**
 * Extrai mapa e quantidade de texto como "prt_maze03(1)"
 * @param {string} mapText Texto do mapa
 * @returns {object} {mapCode, count}
 */
function parseMapInfo(mapText) {
    const mapMatch = mapText.match(/^(.+?)\((\d+)\)$/);
    return {
        mapCode: mapMatch ? mapMatch[1] : mapText,
        count: mapMatch ? parseInt(mapMatch[2]) : 1
    };
}

/**
 * Extrai nome e rate de drop de texto como "Item Name(2.5%)"
 * @param {string} dropText Texto do drop
 * @returns {object} {name, rate}
 */
function parseDropInfo(dropText) {
    const dropParts = dropText.split('(');
    let name = dropText;
    let rate = 0;
    
    if (dropParts.length > 1) {
        name = dropParts[0].trim();
        let rateText = dropParts[1].replace(')', '').trim() || '1';
        if (rateText.includes('%')) {
            rateText = rateText.replace('%', '').trim();
        }
        rate = parseFloat(rateText);
    }
    
    return { name, rate };
}

module.exports = {
    cleanText,
    parseMobName,
    parseRespawnRules,
    parseMapInfo,
    parseDropInfo
};
