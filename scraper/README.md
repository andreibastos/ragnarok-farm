# Scraper Module

Este módulo é responsável por coletar dados de mobs e itens do site RateMyServer.net.

## Estrutura

```
scraper/
├── main.js                      # 🎯 Orquestrador principal
├── init.js                      # 🚀 Script de inicialização
├── scripts/                     # 📁 Scripts executores
│   ├── run-all-containers.js   # 📦 Executa scraping de todos containers
│   └── run-obb-scraper.js      # 🟦 Executa scraping do Old Blue Box
├── scrapers/                    # 📁 Módulos de scraping específicos
│   ├── mob-scraper.js          # 🐉 Scraper de mobs
│   ├── item-scraper.js         # 📦 Scraper de containers (caixas/boxes)
│   └── item-details-scraper.js # 🔍 Scraper de detalhes de itens individuais
├── utils/                       # 📁 Utilitários compartilhados
│   ├── browser.js              # 🌐 Configuração do browser
│   └── parser.js               # 🔧 Parsers de dados comuns
├── db/                          # 📁 Módulo de banco de dados
│   ├── db.js                   # 🗄️  Configuração do banco
│   ├── create-table.js         # 🏗️  Criação de todas as tabelas
│   ├── insert.js               # ➕ Inserções de mobs
│   ├── insert-items.js         # ➕ Inserções de itens e containers
│   ├── queries.js              # 🔍 Consultas avançadas e views
│   └── setup-database.js       # 🚀 Configuração inicial do banco
├── export.js                   # 📤 Exportação de dados
├── data.json                   # 📄 Dados
└── pages/                      # � Páginas HTML de teste
    └── obb.html                # � Página do Old Blue Box
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais
- **`items`** - Itens únicos (id, name, image, type)
- **`mobs`** - Mobs únicos (id, name, image, mode)
- **`containers`** - Containers/caixas (id, gid, name, **item_id**)

### Tabelas de Relacionamento
- **`mob_drops`** - Itens que mobs dropam
- **`container_drops`** - Itens que containers dropam
- **`mob_respawns`** - Locais de respawn dos mobs
- **`mob_stats`** - Estatísticas dos mobs

### Views Especiais
- **`item_sources_unified`** - União de todas as fontes de itens
- **`item_statistics`** - Estatísticas de itens (quantas fontes, rates, etc.)

## 🔗 Relação Container ↔ Item

Cada container tem um **`item_id`** que representa o item físico da caixa:

```javascript
'Old Blue Box': { gid: 1, name: 'Old Blue Box', itemId: 603 }
//                                              ↑
//                              Este é o item "Old Blue Box" no jogo
```

### Vantagens dessa relação:
✅ **Farm Recursivo**: Mob → Container → Itens  
✅ **Validação**: Verificar se container existe no jogo  
✅ **Consistência**: Referência direta ao item  
✅ **Análise**: Cadeia completa de obtenção

## 🚀 Configuração Inicial

### **Método Simples (Recomendado):**
```bash
# Configuração completa do banco
node init.js setup

# Scraping de mobs
node init.js scrape-mobs

# Scraping de containers
node init.js scrape-containers

# Scraping específico do Old Blue Box
node init.js scrape-obb
```

## 🎯 Comandos Disponíveis

O script `init.js` facilita o uso do projeto:

```bash
node init.js setup             # 🚀 Configura banco de dados
node init.js scrape-mobs       # 🐉 Scraping de mobs
node init.js scrape-containers # � Scraping de todos os containers
node init.js scrape-obb        # � Scraping do Old Blue Box
node init.js export            # 📤 Exporta dados
```

## Como usar

### Scraping de Mobs

```javascript
const { scrapeMobData } = require('./scrapers/mob-scraper');

// Coletar dados de um mob específico
const mobData = await scrapeMobData(1631);
```

### Scraping de Containers (Caixas/Boxes)

```javascript
const { scrapeAndSaveContainer, listAvailableContainers } = require('./scrapers/item-scraper');

// Listar containers disponíveis
const containers = listAvailableContainers();
console.log(containers);
// ['Old Blue Box', 'Old Purple Box ', 'Old Card Album', ...]

// Coletar e salvar itens de um container específico
const result = await scrapeAndSaveContainer('Old Blue Box');

// Executar scripts prontos
// node init.js scrape-containers  # Todos os containers
// node init.js scrape-obb         # Apenas Old Blue Box
```

### Scraping de Detalhes de Itens Individuais

```javascript
const { scrapeItemDetails, scrapeItemBasicInfo } = require('./scrapers/item-details-scraper');

// Coletar dados detalhados de um item específico
const itemDetails = await scrapeItemDetails(13304);

// Coletar dados básicos de um item
const itemBasics = await scrapeItemBasicInfo(13304);
```

## Containers Disponíveis

- Old Blue Box
- Old Purple Box  
- Old Card Album
- Gift Box
- Wrapped Mask
- Jewelry Box
- Old Red Box
- Old Red Box 2
- Old Yellow Box
- Old Gift Box
- Mystical Card Album
- Fancy Ball Box
- Masquerade Ball Box 2
- Treasure Ed. Helm Box
- Treasure Ed. Box

## Executar

### Usando init.js (Recomendado)
```bash
# Mobs
node init.js scrape-mobs

# Containers
node init.js scrape-containers

# Container específico
node init.js scrape-obb
```

### Executando diretamente
```bash
# Mobs
node main.js

# Todos os containers
node scripts/run-all-containers.js

# Old Blue Box específico
node scripts/run-obb-scraper.js
```

## Características

### Modular
- ✅ Separação clara por responsabilidades
- ✅ Pasta `db/` dedicada ao banco de dados
- ✅ Pasta `scrapers/` para diferentes scrapers
- ✅ Pasta `utils/` para utilitários compartilhados

### Extensível
- ✅ Fácil adicionar novos scrapers
- ✅ Estrutura de banco preparada para crescer

### Robusto
- ✅ Tratamento de erros
- ✅ Verificação de existência de dados
- ✅ Logs informativos
- ✅ Script de inicialização centralizado
- ✅ Estrutura organizada com separação clara de responsabilidades
