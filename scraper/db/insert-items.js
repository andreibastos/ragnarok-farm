const pool = require('./db');

/**
 * Insere ou atualiza um item na tabela items
 * @param {object} itemData Dados do item {id, name, image, type, description}
 * @returns {Promise<object>} Item inserido/atualizado
 */
async function insertOrUpdateItem(itemData) {
    const { id, name, image, type, description } = itemData;
    
    const result = await pool.query(`
        INSERT INTO items (id, name, image, type, description) 
        VALUES ($1, $2, $3, $4, $5) 
        ON CONFLICT (id) DO UPDATE SET 
            name = EXCLUDED.name,
            image = EXCLUDED.image,
            type = EXCLUDED.type,
            description = EXCLUDED.description,
            updated_at = CURRENT_TIMESTAMP
        RETURNING *
    `, [id, name, image, type, description]);
    
    return result.rows[0];
}

/**
 * Insere drops de um container
 * @param {number} containerGid GID do container
 * @param {Array} drops Array de drops [{item_id, rate, quantity}]
 * @returns {Promise<number>} Número de drops inseridos
 */
async function insertContainerDrops(containerGid, drops) {
    if (!drops || drops.length === 0) {
        console.log('Nenhum drop para inserir');
        return 0;
    }

    // Busca o ID do container pelo GID
    const containerResult = await pool.query(
        'SELECT id FROM containers WHERE gid = $1',
        [containerGid]
    );

    if (containerResult.rows.length === 0) {
        throw new Error(`Container com GID ${containerGid} não encontrado`);
    }

    const containerId = containerResult.rows[0].id;
    let insertedCount = 0;

    for (const drop of drops) {
        try {
            // Primeiro, insere/atualiza o item se necessário
            if (drop.item_data) {
                await insertOrUpdateItem(drop.item_data);
            }

            // Depois insere o drop do container
            await pool.query(`
                INSERT INTO container_drops (container_id, item_id, rate, quantity)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (container_id, item_id) DO UPDATE SET
                    rate = EXCLUDED.rate,
                    quantity = EXCLUDED.quantity
            `, [containerId, drop.item_id, drop.rate, drop.quantity || 1]);
            
            insertedCount++;
        } catch (error) {
            console.error(`Erro ao inserir drop ${drop.item_id}:`, error.message);
        }
    }

    console.log(`✅ ${insertedCount} drops inseridos para container GID ${containerGid}`);
    return insertedCount;
}

/**
 * Insere dados completos de um container (container + seus drops)
 * @param {object} containerData Dados do container {gid, name, items: []}
 * @returns {Promise<object>} Resultado da inserção
 */
async function insertCompleteContainer(containerData) {
    const { gid, name, items } = containerData;
    
    try {
        console.log(`📦 Inserindo container: ${name} (GID: ${gid})`);
        
        // O container já deve estar na tabela (inserido pelo seed)
        // Insere apenas os drops
        const dropsInserted = await insertContainerDrops(gid, items);
        
        return {
            gid,
            name,
            dropsInserted,
            success: true
        };
    } catch (error) {
        console.error(`❌ Erro ao inserir container ${name}:`, error.message);
        return {
            gid,
            name,
            dropsInserted: 0,
            success: false,
            error: error.message
        };
    }
}

/**
 * Busca itens por fonte (mob ou container)
 * @param {string} sourceType 'mob' ou 'container'
 * @param {number} sourceId ID do mob ou GID do container
 * @returns {Promise<Array>} Lista de itens da fonte
 */
async function getItemsBySource(sourceType, sourceId) {
    if (sourceType === 'mob') {
        const result = await pool.query(`
            SELECT 
                i.id, i.name, i.image, i.type,
                md.rate,
                'mob' as source_type,
                $1 as source_id
            FROM items i
            JOIN mob_drops md ON i.id = md.item_id
            WHERE md.mob_id = $1
            ORDER BY md.rate DESC
        `, [sourceId]);
        
        return result.rows;
    } else if (sourceType === 'container') {
        const result = await pool.query(`
            SELECT 
                i.id, i.name, i.image, i.type,
                cd.rate, cd.quantity,
                'container' as source_type,
                c.gid as source_id,
                c.name as source_name
            FROM items i
            JOIN container_drops cd ON i.id = cd.item_id
            JOIN containers c ON cd.container_id = c.id
            WHERE c.gid = $1
            ORDER BY cd.rate DESC
        `, [sourceId]);
        
        return result.rows;
    } else {
        throw new Error('sourceType deve ser "mob" ou "container"');
    }
}

/**
 * Busca todas as fontes de um item específico
 * @param {number} itemId ID do item
 * @returns {Promise<object>} Objeto com fontes {mobs: [], containers: []}
 */
async function getItemSources(itemId) {
    // Busca mobs que dropam o item
    const mobSources = await pool.query(`
        SELECT 
            m.id, m.name, m.image,
            md.rate,
            'mob' as source_type
        FROM mobs m
        JOIN mob_drops md ON m.id = md.mob_id
        WHERE md.item_id = $1
        ORDER BY md.rate DESC
    `, [itemId]);

    // Busca containers que dropam o item
    const containerSources = await pool.query(`
        SELECT 
            c.gid as id, c.name,
            cd.rate, cd.quantity,
            'container' as source_type
        FROM containers c
        JOIN container_drops cd ON c.id = cd.container_id
        WHERE cd.item_id = $1
        ORDER BY cd.rate DESC
    `, [itemId]);

    return {
        item_id: itemId,
        mobs: mobSources.rows,
        containers: containerSources.rows,
        total_sources: mobSources.rows.length + containerSources.rows.length
    };
}

module.exports = {
    insertOrUpdateItem,
    insertContainerDrops,
    insertCompleteContainer,
    getItemsBySource,
    getItemSources
};
