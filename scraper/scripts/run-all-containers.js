const { scrapeAndSaveContainer, listAvailableContainers } = require('../scrapers/item-scraper');
const { getItemsBySource } = require('../db/insert-items');

async function scrapeAllContainers() {
    const containers = listAvailableContainers();
    const results = [];
    
    console.log('🎯 Iniciando scraping de todos os containers...\n');
    console.log(`📦 Total de containers: ${containers.length}`);
    console.log(`📋 Lista: ${containers.join(', ')}\n`);
    
    for (let i = 0; i < containers.length; i++) {
        const containerName = containers[i];
        console.log(`\n[${i + 1}/${containers.length}] 🔍 Processando: ${containerName}`);
        console.log('='.repeat(50));
        
        try {
            const result = await scrapeAndSaveContainer(containerName);
            results.push({
                container: containerName,
                success: result.success,
                itemsFound: result.success ? result.scraping.itemsFound : 0,
                itemsProcessed: result.success ? result.database.itemsProcessed : 0,
                dropsInserted: result.success ? result.database.dropsInserted : 0,
                error: result.error || null
            });
            
            if (result.success) {
                console.log(`✅ ${containerName}: ${result.database.dropsInserted} itens salvos`);
            } else {
                console.log(`❌ ${containerName}: ${result.error}`);
            }
            
        } catch (error) {
            console.log(`💥 ${containerName}: Erro fatal - ${error.message}`);
            results.push({
                container: containerName,
                success: false,
                itemsFound: 0,
                itemsProcessed: 0,
                dropsInserted: 0,
                error: error.message
            });
        }
        
        // Pequena pausa entre containers para não sobrecarregar o site
        if (i < containers.length - 1) {
            console.log('⏱️  Aguardando 2 segundos...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    // Relatório final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO FINAL');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const totalItems = successful.reduce((sum, r) => sum + r.dropsInserted, 0);
    
    console.log(`✅ Containers processados com sucesso: ${successful.length}`);
    console.log(`❌ Containers com falha: ${failed.length}`);
    console.log(`📦 Total de itens coletados: ${totalItems}`);
    
    if (successful.length > 0) {
        console.log('\n🏆 Containers bem-sucedidos:');
        successful.forEach(result => {
            console.log(`   ${result.container}: ${result.dropsInserted} itens`);
        });
    }
    
    if (failed.length > 0) {
        console.log('\n💔 Containers com falha:');
        failed.forEach(result => {
            console.log(`   ${result.container}: ${result.error}`);
        });
    }
    
    console.log('\n🎉 Scraping de containers concluído!');
}

console.log('🎮 Container Scraper - Todos os Containers');
console.log('==========================================\n');

scrapeAllContainers().catch(console.error);
