const { createAllTables } = require('./create-table');
const { createItemViews } = require('./queries');
const pool = require('./db');

/**
 * Script para configurar completamente o banco de dados
 * - Cria todas as tabelas (mobs, itens, containers)
 * - Popula containers iniciais
 * - Cria índices para performance
 * - Cria views para consultas
 */
async function setupDatabase() {
    try {
        console.log('🚀 Iniciando configuração completa do banco de dados...\n');

        // 1. Cria todas as tabelas e configurações
        console.log('📋 Criando tabelas, índices e dados iniciais...');
        await createAllTables();

        // 2. Cria views para consultas avançadas
        console.log('\n👁️  Criando views para consultas...');
        await createItemViews();

        console.log('\n✅ Configuração do banco de dados finalizada!');
        console.log('\n📊 Próximos passos:');
        console.log('1. Execute scraping de mobs: node main.js');
        console.log('2. Execute scraping de containers: descomente scrapeAllContainersFunction() no main.js');
        console.log('3. Veja estatísticas: node exemplo-consultas.js');
        console.log('4. Veja relações: node demo-container-relation.js');

    } catch (error) {
        console.error('❌ Erro na configuração:', error);
    } finally {
        await pool.end();
    }
}

// Executa configuração
setupDatabase();
