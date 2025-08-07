const pool = require('./db');

/**
 * Cria todas as tabelas relacionadas aos mobs
 */
async function createMobTables() {
    console.log('🐉 Criando tabelas de mobs...');
    
    await pool.query(`
        CREATE TABLE IF NOT EXISTS mobs (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            image TEXT,
            mode TEXT[],
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS mob_respawns (
            id SERIAL PRIMARY KEY,
            mob_id INTEGER REFERENCES mobs(id) ON DELETE CASCADE,
            map TEXT,
            count INTEGER,
            respawn_rules JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS mob_drops (
            id SERIAL PRIMARY KEY,
            mob_id INTEGER REFERENCES mobs(id) ON DELETE CASCADE,
            item_id INTEGER,
            name TEXT,
            image TEXT,
            rate FLOAT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS mob_skills (
            id SERIAL PRIMARY KEY,
            mob_id INTEGER REFERENCES mobs(id) ON DELETE CASCADE,
            name TEXT,
            link TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS mob_stats (
            mob_id INTEGER PRIMARY KEY REFERENCES mobs(id) ON DELETE CASCADE,
            hp INTEGER,
            level INTEGER,
            base_exp INTEGER,
            job_exp INTEGER,
            attack TEXT,
            defense INTEGER,
            magic_def INTEGER,
            flee_95 TEXT,
            hit_100 TEXT,
            atk_delay TEXT,
            atk_range TEXT,
            delay_after_hit TEXT,
            str INTEGER,
            agi INTEGER,
            vit INTEGER,
            int_stat INTEGER,
            dex INTEGER,
            luk INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS mob_elements (
            mob_id INTEGER REFERENCES mobs(id) ON DELETE CASCADE,
            element TEXT,
            value INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (mob_id, element)
        );
    `);

    console.log('✅ Tabelas de mobs criadas.');
}

/**
 * Cria todas as tabelas relacionadas aos itens e containers
 */
async function createItemTables() {
    console.log('📦 Criando tabelas de itens e containers...');
    
    // Tabela principal de itens
    await pool.query(`
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            image TEXT,
            type TEXT,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Tabela de containers/caixas
    await pool.query(`
        CREATE TABLE IF NOT EXISTS containers (
            id SERIAL PRIMARY KEY,
            gid INTEGER UNIQUE NOT NULL,
            name TEXT NOT NULL,
            item_id INTEGER REFERENCES items(id) ON DELETE SET NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Tabela de drops de containers
    await pool.query(`
        CREATE TABLE IF NOT EXISTS container_drops (
            id SERIAL PRIMARY KEY,
            container_id INTEGER REFERENCES containers(id) ON DELETE CASCADE,
            item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
            rate FLOAT NOT NULL,
            quantity INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(container_id, item_id)
        );
    `);

    console.log('✅ Tabelas de itens e containers criadas.');
}

/**
 * Cria índices para melhor performance
 */
async function createIndexes() {
    console.log('📊 Criando índices...');
    
    // Índices para mob_drops
    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_mob_drops_mob ON mob_drops(mob_id);
    `);
    
    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_mob_drops_item ON mob_drops(item_id);
    `);

    // Índices para container_drops
    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_container_drops_container ON container_drops(container_id);
    `);
    
    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_container_drops_item ON container_drops(item_id);
    `);

    // Índices para containers
    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_containers_item ON containers(item_id);
    `);
    
    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_containers_gid ON containers(gid);
    `);

    // Índices para mob_respawns
    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_mob_respawns_mob ON mob_respawns(mob_id);
    `);

    console.log('✅ Índices criados.');
}

/**
 * Popula a tabela de containers com dados iniciais
 */
async function seedContainers() {
    console.log('🌱 Populando tabela de containers...');
    
    const containers = [
        { gid: 1, name: 'Old Blue Box', itemId: 603 },
        { gid: 2, name: 'Old Purple Box', itemId: 617 },
        { gid: 3, name: 'Old Card Album', itemId: 616 },
        { gid: 4, name: 'Gift Box', itemId: 665 },
        { gid: 25, name: 'Wrapped Mask', itemId: 12107 },
        { gid: 26, name: 'Jewelry Box', itemId: 12106 },
        { gid: 40, name: 'Old Red Box', itemId: 12186 },
        { gid: 38, name: 'Old Red Box 2', itemId: 12189 },
        { gid: 42, name: 'Old Yellow Box', itemId: 12240 },
        { gid: 43, name: 'Old Gift Box', itemId: 12244 },
        { gid: 44, name: 'Mystical Card Album', itemId: 12246 },
        { gid: 46, name: 'Fancy Ball Box', itemId: 12248 },
        { gid: 48, name: 'Masquerade Ball Box 2', itemId: 12286 },
        { gid: 51, name: 'Treasure Ed. Helm Box', itemId: 12334 },
        { gid: 52, name: 'Treasure Ed. Box', itemId: 12339 }
    ];

    for (const container of containers) {
        await pool.query(`
            INSERT INTO containers (gid, name, item_id) 
            VALUES ($1, $2, $3) 
            ON CONFLICT (gid) DO UPDATE SET 
                name = EXCLUDED.name,
                item_id = EXCLUDED.item_id,
                updated_at = CURRENT_TIMESTAMP
        `, [container.gid, container.name, container.itemId]);
    }

    console.log(`✅ ${containers.length} containers inseridos/atualizados.`);
}

/**
 * Cria todas as tabelas e configurações do banco de dados
 */
async function createAllTables() {
    try {
        console.log('🚀 Iniciando criação de todas as tabelas...\n');

        // 1. Cria tabelas de mobs
        await createMobTables();

        // 2. Cria tabelas de itens e containers
        await createItemTables();

        // 3. Cria índices para performance
        await createIndexes();

        // 4. Popula containers iniciais
        await seedContainers();

        console.log('\n✅ Todas as tabelas criadas com sucesso!');
        console.log('\n📊 Próximos passos:');
        console.log('1. Execute: node queries.js (para criar views)');
        console.log('2. Execute: node main.js (para scraping de mobs)');
        console.log('3. Configure scraping de containers no main.js');

    } catch (error) {
        console.error('❌ Erro ao criar tabelas:', error);
        throw error;
    }
}

/**
 * Função legada para compatibilidade
 */
async function createTables() {
    return createAllTables();
}

// Se executado diretamente
if (require.main === module) {
    createAllTables()
        .then(() => {
            console.log('\n🎯 Setup do banco finalizado!');
            process.exit(0);
        })
        .catch(err => {
            console.error('❌ Erro fatal:', err);
            process.exit(1);
        });
}

module.exports = {
    createAllTables,
    createMobTables,
    createItemTables,
    createIndexes,
    seedContainers,
    createTables // Para compatibilidade
};
