#!/usr/bin/env node

/**
 * Script de inicialização do projeto Scraper
 * Facilita o uso dos comandos principais
 */

const { spawn } = require('child_process');
const path = require('path');

function runScript(scriptPath, description) {
    console.log(`🚀 ${description}...`);
    const child = spawn('node', [scriptPath], {
        stdio: 'inherit',
        cwd: __dirname
    });
    
    return new Promise((resolve, reject) => {
        child.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ ${description} concluído!\n`);
                resolve();
            } else {
                console.error(`❌ Erro em: ${description}`);
                reject(new Error(`Script failed with code ${code}`));
            }
        });
    });
}

async function main() {
    const command = process.argv[2];
    
    console.log('🎯 Scraper Project Manager\n');
    
    switch (command) {
        case 'setup':
            await runScript('./db/setup-database.js', 'Configurando banco de dados');
            break;
            
        case 'scrape-mobs':
            await runScript('./main.js', 'Executando scraping de mobs');
            break;
            
        case 'scrape-containers':
            await runScript('./scripts/run-all-containers.js', 'Executando scraping de containers');
            break;
            
        case 'scrape-obb':
            await runScript('./scripts/run-obb-scraper.js', 'Executando scraping do Old Blue Box');
            break;
            
        case 'export':
            await runScript('./export.js', 'Exportando dados');
            break;
            
        default:
            console.log('📋 Comandos disponíveis:');
            console.log('  setup             - Configura o banco de dados');
            console.log('  scrape-mobs       - Executa scraping de mobs');
            console.log('  scrape-containers - Executa scraping de todos os containers');
            console.log('  scrape-obb        - Executa scraping do Old Blue Box');
            console.log('  export            - Exporta dados para JSON');
            console.log('');
            console.log('📖 Exemplos:');
            console.log('  node init.js setup');
            console.log('  node init.js scrape-obb');
            console.log('  node init.js scrape-containers');
            console.log('');
            console.log('🎯 Projeto Scraper - Coleta dados de mobs e containers');
            break;
    }
}

main().catch(console.error);
