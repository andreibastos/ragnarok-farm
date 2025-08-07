# 🎯 Ragnarok Farm Creator - UI

Interface moderna e modular para criação de configurações de farm no Ragnarok Online.

## 📁 Estrutura do Projeto

```
ui/
├── src/                    # Código fonte
│   ├── js/                 # Módulos JavaScript
│   │   ├── main.js         # Entrada principal da aplicação
│   │   ├── database.js     # Gerenciamento do banco de dados
│   │   ├── search.js       # Funcionalidades de busca
│   │   ├── ui.js           # Gerenciamento da interface
│   │   ├── form.js         # Gerenciamento de formulários
│   │   ├── maps.js         # Gerenciamento de mapas
│   │   └── modals.js       # Gerenciamento de modais
│   ├── css/                # Estilos customizados
│   │   └── styles.css      # CSS principal
│   └── index.html          # Template HTML
├── dist/                   # Build de produção
├── package.json            # Dependências do projeto
└── webpack.config.js       # Configuração do Webpack
```

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
cd ui
npm install
```

### 2. Desenvolvimento

Para desenvolvimento com hot reload:

```bash
npm run dev
```

Ou para servir com servidor de desenvolvimento:

```bash
npm start
```

### 3. Build de Produção

```bash
npm run build
```

Os arquivos serão gerados na pasta `dist/`.

## 🏗️ Arquitetura

### Módulos Principais

- **main.js**: Ponto de entrada, inicialização e coordenação entre módulos
- **database.js**: Gerenciamento do IndexedDB usando Dexie
- **search.js**: Funcionalidades de busca por itens e monstros
- **ui.js**: Renderização de elementos da interface
- **form.js**: Gerenciamento de formulários e coleta de dados
- **maps.js**: Gerenciamento de mapas e suas configurações
- **modals.js**: Sistema de modais para visualização de dados

### Vantagens da Nova Arquitetura

✅ **Modularidade**: Código separado por responsabilidades
✅ **Manutenibilidade**: Fácil de encontrar e modificar funcionalidades
✅ **Escalabilidade**: Novos recursos podem ser adicionados facilmente
✅ **Performance**: Bundle otimizado com Webpack
✅ **Desenvolvimento**: Hot reload para desenvolvimento ágil

## 🔧 Configuração

### Webpack Features

- **Hot Module Replacement**: Atualizações em tempo real
- **Code Splitting**: Separação automática de chunks
- **Asset Management**: Gerenciamento de CSS e outros assets
- **Development Server**: Servidor local com proxy

### Dependências

- **dexie**: Wrapper para IndexedDB
- **webpack**: Bundler moderno
- **html-webpack-plugin**: Geração automática de HTML
- **copy-webpack-plugin**: Cópia de assets estáticos

## 📝 Scripts Disponíveis

```bash
npm run build    # Build de produção
npm run dev      # Build de desenvolvimento com watch
npm run serve    # Servidor de desenvolvimento
npm start        # Alias para npm run serve
```

## 🌟 Funcionalidades

- 🔍 Busca inteligente por itens e monstros
- 🗺️ Visualização de monstros por mapa
- 🎁 Visualização de drops por monstro
- ⚙️ Configuração avançada de magias e mapas
- 📱 Interface responsiva
- 💾 Importação de banco de dados JSON
- 🎯 Geração de configuração JSON final

## 🔄 Migração do Código Antigo

O código foi refatorado do arquivo `index.html` monolítico para uma arquitetura modular:

1. **HTML**: Simplificado, foca apenas na estrutura
2. **CSS**: Separado em arquivo próprio com melhorias
3. **JavaScript**: Dividido em módulos especializados
4. **Build**: Sistema de build automatizado

## 🐛 Debug

Para debuggar a aplicação:

1. Abra as ferramentas de desenvolvedor (F12)
2. A instância principal está disponível em `window.farmApp`
3. Cada módulo pode ser acessado através da instância principal

## 📦 Deploy

Para fazer deploy:

1. Execute `npm run build`
2. Copie o conteúdo da pasta `dist/` para seu servidor
3. Certifique-se de que o arquivo JSON de dados esteja disponível

## 🤝 Contribuição

Para contribuir com melhorias:

1. Crie um novo módulo na pasta `src/js/`
2. Importe e inicialize no `main.js`
3. Adicione testes se necessário
4. Execute o build e teste a funcionalidade
