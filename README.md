# 🎮 Ragnarok Online Farm Creator

Sistema completo para criação e análise de farms no Ragnarok Online, composto por um scraper de dados do RateMyServer.net e uma interface web moderna para gerenciamento de configurações de farm.

## 📋 Visão Geral

O projeto consiste em duas partes principais:
- **Scraper**: Coleta dados de mobs, itens e containers do RateMyServer.net
- **UI**: Interface web para criação e análise de configurações de farm

## 🏗️ Estrutura do Projeto

```
ragmaniacos-scrapper/
├── scraper/                    # 🤖 Módulo de scraping
│   ├── scrapers/              # Scrapers específicos (mobs, itens, containers)
│   ├── db/                    # Módulo de banco de dados
│   ├── utils/                 # Utilitários (browser, parser)
│   └── scripts/               # Scripts de execução
├── ui/                        # 🎨 Interface web
│   ├── src/                   # Código fonte da UI
│   ├── tests/                 # Testes unitários
│   └── coverage/              # Relatórios de cobertura
├── docker-compose.yaml        # 🐳 Configuração dos containers
└── package.json               # Dependências principais
```

## 🚀 Início Rápido

### 1. **Pré-requisitos**
- Node.js 18+
- Docker e Docker Compose
- Google Chrome ou Chromium (para Selenium)

### 2. **Instalação**

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd ragmaniacos-scrapper

# Instale as dependências do scraper
npm install

# Instale as dependências da UI
cd ui
npm install
cd ..
```

### 3. **Configuração do Banco de Dados**

```bash
# Inicie os containers PostgreSQL e PgAdmin
docker-compose up -d

# Configure o banco de dados
cd scraper
node db/setup-database.js
```

### 4. **Executando o Scraper**

```bash
cd scraper

# Para scraping de mobs específicos
node main.js

# Para containers específicos (ex: Old Blue Box)
node scripts/run-obb-scraper.js

# Para todos os containers disponíveis
node scripts/run-all-containers.js
```

### 5. **Executando a UI**

```bash
cd ui

# Desenvolvimento (com hot-reload)
npm run dev

# Build de produção
npm run build

# Servidor local
npm start
```

## 🗄️ Banco de Dados

O sistema utiliza PostgreSQL com as seguintes tabelas principais:

### **Entidades Principais**
- `items` - Itens únicos do jogo
- `mobs` - Monstros do jogo
- `containers` - Caixas e containers

### **Relacionamentos**
- `mob_drops` - Drops de mobs
- `container_drops` - Drops de containers
- `mob_respawns` - Locais de respawn
- `mob_stats` - Estatísticas dos mobs

### **Views Especiais**
- `item_sources_unified` - Todas as fontes de itens
- `item_statistics` - Estatísticas consolidadas

## 🛠️ Principais Funcionalidades

### **Scraper**
- ✅ Scraping automático de dados do RateMyServer.net
- ✅ Coleta de mobs, itens e containers
- ✅ Prevenção de duplicatas
- ✅ Retry automático em falhas
- ✅ Logging detalhado

### **Interface Web**
- ✅ Busca avançada de itens e mobs
- ✅ Criação de configurações de farm
- ✅ Análise de viabilidade de drops
- ✅ Interface responsiva e moderna
- ✅ Testes unitários com Jest

## 🐳 Docker

### **Serviços Disponíveis**
- **PostgreSQL**: Banco de dados principal (porta 5432)
- **PgAdmin**: Interface de administração (porta 8085)

### **Acesso ao PgAdmin**
- URL: http://localhost:8085
- Email: admin@mobfarm.com
- Senha: admin

## 🧪 Testes

```bash
cd ui

# Executar todos os testes
npm test

# Testes com cobertura
npm run test:coverage

# Testes em modo watch
npm run test:watch
```

## 📁 Scripts Úteis

### **Scraper**
```bash
# Scraping de mob específico
node scraper/main.js

# Exportar dados para JSON
node scraper/export.js

# Estatísticas do banco
node scraper/db/queries.js
```

### **UI**
```bash
# Build para produção
npm run build

# Servidor de desenvolvimento
npm run serve

# Análise de código
npm run test:verbose
```

## 🔧 Configuração

### **Banco de Dados**
- Host: localhost
- Porta: 5432
- Usuário: ragnarok
- Senha: ragnarok
- Database: ragnarok_db

### **Selenium**
- Browser: Chrome/Chromium
- Modo headless: Configurável
- Timeout: 30 segundos

## 📚 Dependências Principais

### **Scraper**
- `selenium-webdriver` - Automação web
- `pg` - Cliente PostgreSQL
- `webpack-cli` - Build tools

### **UI**
- `webpack` - Module bundler
- `babel` - Transpilação JS
- `jest` - Framework de testes
- `@testing-library` - Utilitários de teste

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para dúvidas ou problemas:
- Abra uma issue no GitHub
- Consulte a documentação nos READMEs dos módulos específicos
