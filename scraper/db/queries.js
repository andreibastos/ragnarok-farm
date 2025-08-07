const pool = require('./db');

/**
 * Cria views para consultas unificadas de itens
 */
async function createItemViews() {
    // View que une todas as fontes de itens
    await pool.query(`
        CREATE OR REPLACE VIEW item_sources_unified AS
        -- Itens de mobs
        SELECT 
            i.id as item_id,
            i.name as item_name,
            i.image as item_image,
            i.type as item_type,
            'mob' as source_type,
            m.id as source_id,
            m.name as source_name,
            m.image as source_image,
            md.rate,
            1 as quantity,
            NULL as container_item_id
        FROM items i
        JOIN mob_drops md ON i.id = md.item_id
        JOIN mobs m ON md.mob_id = m.id
        
        UNION ALL
        
        -- Itens de containers
        SELECT 
            i.id as item_id,
            i.name as item_name,
            i.image as item_image,
            i.type as item_type,
            'container' as source_type,
            c.gid as source_id,
            c.name as source_name,
            NULL as source_image,
            cd.rate,
            cd.quantity,
            c.item_id as container_item_id
        FROM items i
        JOIN container_drops cd ON i.id = cd.item_id
        JOIN containers c ON cd.container_id = c.id
    `);

    // View de estatísticas de itens
    await pool.query(`
        CREATE OR REPLACE VIEW item_statistics AS
        SELECT 
            i.id,
            i.name,
            i.image,
            i.type,
            COUNT(CASE WHEN source_type = 'mob' THEN 1 END) as mob_sources,
            COUNT(CASE WHEN source_type = 'container' THEN 1 END) as container_sources,
            COUNT(*) as total_sources,
            MIN(rate) as min_rate,
            MAX(rate) as max_rate,
            AVG(rate) as avg_rate
        FROM item_sources_unified
        GROUP BY i.id, i.name, i.image, i.type
    `);

    console.log('✅ Views criadas com sucesso.');
}

/**
 * Busca itens com estatísticas completas
 * @param {object} filters Filtros opcionais
 * @returns {Promise<Array>} Lista de itens com estatísticas
 */
async function getItemsWithStats(filters = {}) {
    let query = `
        SELECT 
            id, name, image, type,
            mob_sources, container_sources, total_sources,
            min_rate, max_rate, avg_rate
        FROM item_statistics
        WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Filtros opcionais
    if (filters.hasContainerSources) {
        query += ` AND container_sources > 0`;
    }
    
    if (filters.hasMobSources) {
        query += ` AND mob_sources > 0`;
    }
    
    if (filters.minRate) {
        query += ` AND max_rate >= $${paramIndex}`;
        params.push(filters.minRate);
        paramIndex++;
    }
    
    if (filters.itemType) {
        query += ` AND type = $${paramIndex}`;
        params.push(filters.itemType);
        paramIndex++;
    }

    query += ` ORDER BY total_sources DESC, avg_rate DESC`;

    if (filters.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    return result.rows;
}

/**
 * Relatório de itens mais valiosos (múltiplas fontes)
 * @returns {Promise<Array>} Relatório de itens
 */
async function getValuableItemsReport() {
    const result = await pool.query(`
        SELECT 
            i.*,
            CASE 
                WHEN mob_sources > 0 AND container_sources > 0 THEN 'hybrid'
                WHEN mob_sources > 0 THEN 'mob_only'
                WHEN container_sources > 0 THEN 'container_only'
                ELSE 'unknown'
            END as availability_type,
            ROUND(avg_rate::numeric, 4) as avg_drop_rate
        FROM item_statistics i
        WHERE total_sources > 1  -- Itens com múltiplas fontes
        ORDER BY total_sources DESC, avg_rate DESC
        LIMIT 50
    `);

    return result.rows;
}

/**
 * Busca duplicatas (itens que aparecem tanto em mobs quanto containers)
 * @returns {Promise<Array>} Lista de itens duplicados
 */
async function getDuplicateItems() {
    const result = await pool.query(`
        SELECT 
            i.*,
            mob_sources,
            container_sources,
            ROUND(avg_rate::numeric, 4) as avg_drop_rate
        FROM item_statistics i
        WHERE mob_sources > 0 AND container_sources > 0
        ORDER BY total_sources DESC, avg_rate DESC
    `);

    return result.rows;
}

/**
 * Busca containers com informações dos itens que representam
 * @returns {Promise<Array>} Lista de containers com dados do item
 */
async function getContainersWithItemInfo() {
    const result = await pool.query(`
        SELECT 
            c.gid,
            c.name as container_name,
            c.item_id,
            i.name as item_name,
            i.image as item_image,
            i.type as item_type,
            COUNT(cd.item_id) as drops_count,
            ROUND(AVG(cd.rate)::numeric, 2) as avg_drop_rate
        FROM containers c
        LEFT JOIN items i ON c.item_id = i.id
        LEFT JOIN container_drops cd ON c.id = cd.container_id
        GROUP BY c.id, c.gid, c.name, c.item_id, i.name, i.image, i.type
        ORDER BY c.gid
    `);

    return result.rows;
}

/**
 * Busca containers que podem ser obtidos de mobs (recursivo)
 * @returns {Promise<Array>} Containers que são dropados por mobs
 */
async function getContainersFromMobs() {
    const result = await pool.query(`
        SELECT 
            c.name as container_name,
            c.gid as container_gid,
            i.name as item_name,
            m.name as mob_name,
            md.rate as mob_drop_rate,
            COUNT(cd.item_id) as container_drops_count
        FROM containers c
        JOIN items i ON c.item_id = i.id
        JOIN mob_drops md ON i.id = md.item_id
        JOIN mobs m ON md.mob_id = m.id
        LEFT JOIN container_drops cd ON c.id = cd.container_id
        GROUP BY c.id, c.name, c.gid, i.name, m.name, md.rate
        ORDER BY md.rate DESC
    `);

    return result.rows;
}
async function getDatabaseStats() {
    const stats = {};
    
    // Total de itens
    const itemsResult = await pool.query('SELECT COUNT(*) as total FROM items');
    stats.total_items = parseInt(itemsResult.rows[0].total);
    
    // Total de mobs
    const mobsResult = await pool.query('SELECT COUNT(*) as total FROM mobs');
    stats.total_mobs = parseInt(mobsResult.rows[0].total);
    
    // Total de containers
    const containersResult = await pool.query('SELECT COUNT(*) as total FROM containers');
    stats.total_containers = parseInt(containersResult.rows[0].total);
    
    // Itens únicos de mobs
    const mobItemsResult = await pool.query('SELECT COUNT(DISTINCT item_id) as total FROM mob_drops');
    stats.items_from_mobs = parseInt(mobItemsResult.rows[0].total);
    
    // Itens únicos de containers
    const containerItemsResult = await pool.query('SELECT COUNT(DISTINCT item_id) as total FROM container_drops');
    stats.items_from_containers = parseInt(containerItemsResult.rows[0].total);
    
    // Itens híbridos (tanto de mobs quanto containers)
    const hybridResult = await pool.query(`
        SELECT COUNT(*) as total 
        FROM item_statistics 
        WHERE mob_sources > 0 AND container_sources > 0
    `);
    stats.hybrid_items = parseInt(hybridResult.rows[0].total);
    
    return stats;
}

// Se executado diretamente, cria as views
if (require.main === module) {
    createItemViews()
        .then(() => {
            console.log('Views criadas com sucesso!');
            process.exit(0);
        })
        .catch(err => {
            console.error('Erro ao criar views:', err);
            process.exit(1);
        });
}

module.exports = {
    createItemViews,
    getItemsWithStats,
    getValuableItemsReport,
    getDuplicateItems,
    getDatabaseStats,
    getContainersWithItemInfo,
    getContainersFromMobs
};
