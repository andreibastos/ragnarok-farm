const { scrapeAndSaveContainer } = require('../scrapers/item-scraper');
const { getItemsBySource } = require('../db/insert-items');

async function scrapeOldBlueBox() {
    try {
        console.log('🎯 Iniciando scraping completo do Old Blue Box...\n');
        
        // Fazer scraping e salvar
        const result = await scrapeAndSaveContainer('Old Blue Box');
        
        console.log('\n📊 Resultado final:');
        if (result.success) {
            console.log(`✅ Sucesso!`);
            console.log(`📦 Itens encontrados: ${result.scraping.itemsFound}`);
            console.log(`📂 Categorias: ${result.scraping.categories.join(', ')}`);
            console.log(`💾 Itens processados: ${result.database.itemsProcessed}`);
            console.log(`🎲 Drops inseridos: ${result.database.dropsInserted}`);
            
            // Verificar dados no banco
            console.log('\n🔍 Verificando dados salvos...');
            const containerItems = await getItemsBySource('container', 1);
            console.log(`📦 Total de itens no banco para Old Blue Box: ${containerItems.length}`);
            
            if (containerItems.length > 0) {
                // Estatísticas por categoria
                const categoryStats = {};
                containerItems.forEach(item => {
                    categoryStats[item.type] = (categoryStats[item.type] || 0) + 1;
                });
                
                console.log('\n📈 Estatísticas por categoria:');
                Object.entries(categoryStats)
                    .sort((a, b) => b[1] - a[1])
                    .forEach(([type, count]) => {
                        console.log(`   ${type}: ${count} itens`);
                    });
                
                console.log('\n📝 Alguns exemplos de itens:');
                const examples = containerItems.slice(0, 8);
                examples.forEach(item => {
                    console.log(`   - ${item.name} (${item.type})`);
                });
                
                if (containerItems.length > 8) {
                    console.log(`   ... e mais ${containerItems.length - 8} itens`);
                }
            }
            
        } else {
            console.log(`❌ Falha: ${result.error}`);
        }
        
    } catch (error) {
        console.error('❌ Erro no scraping:', error.message);
        process.exit(1);
    }
}

console.log('🎮 Old Blue Box Scraper');
console.log('=======================\n');

scrapeOldBlueBox();
