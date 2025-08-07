# Farm Creator - Sistema de Testes

Este projeto agora inclui um sistema completo de testes unitários para garantir a qualidade e funcionalidade do código.

## 🧪 Estrutura de Testes

```
ui/
├── tests/
│   ├── unit/                          # Testes unitários
│   │   ├── farm-storage-core.test.js  # Testes principais do FarmStorage
│   │   └── farm-storage-simple.test.js # Testes básicos
│   └── setup.js                       # Configuração global dos testes
├── jest.config.js                     # Configuração do Jest
├── babel.config.json                  # Configuração do Babel
└── package.json                       # Scripts de teste
```

## 🚀 Como Executar os Testes

### Executar todos os testes
```bash
cd ui/
npm test
```

### Executar testes específicos
```bash
# Testes do FarmStorage
npm test -- farm-storage

# Testes com watch mode (re-executa quando arquivos mudam)
npm run test:watch

# Testes com relatório de cobertura
npm run test:coverage

# Testes com saída detalhada
npm run test:verbose
```

### Executar um arquivo específico
```bash
npx jest tests/unit/farm-storage-core.test.js
```

## 📋 Scripts Disponíveis

| Script | Comando | Descrição |
|--------|---------|-----------|
| `test` | `jest` | Executa todos os testes |
| `test:watch` | `jest --watch` | Executa testes em modo watch |
| `test:coverage` | `jest --coverage` | Gera relatório de cobertura |
| `test:verbose` | `jest --verbose` | Executa com saída detalhada |

## 🔧 Tecnologias de Teste

- **Jest**: Framework de testes JavaScript
- **@testing-library/jest-dom**: Matchers personalizados para DOM
- **jsdom**: Ambiente DOM simulado para Node.js
- **Babel**: Transformação de módulos ES6 para testes

## 📊 Cobertura de Testes

### Módulos Testados

#### ✅ FarmStorage (`farm-storage.js`)
- ✅ Criação e inicialização
- ✅ Salvamento de farms (`saveFarm`)
- ✅ Recuperação de farms (`getAllFarms`, `getFarm`)
- ✅ Exclusão de farms (`deleteFarm`)
- ✅ Limpeza de dados (`clearAllFarms`)
- ✅ Geração de IDs únicos
- ✅ Manipulação de localStorage

### Casos de Teste

#### FarmStorage - Core Functionality
1. **Criação de instância**: Verifica se a classe pode ser instanciada corretamente
2. **Salvamento e recuperação**: Testa o ciclo completo de salvar e buscar farms
3. **Busca por ID**: Verifica se é possível recuperar um farm específico
4. **Exclusão**: Testa a remoção de farms do storage
5. **Limpeza total**: Verifica se todos os farms podem ser removidos
6. **Storage vazio**: Testa comportamento com storage vazio
7. **IDs únicos**: Garante que cada farm tem um ID único

## 🎯 Benefícios dos Testes

1. **Qualidade**: Garantem que o código funciona conforme esperado
2. **Refatoração segura**: Permitem mudanças no código com confiança
3. **Documentação**: Servem como documentação viva do comportamento esperado
4. **Detecção precoce**: Identificam bugs antes da produção
5. **Manutenibilidade**: Facilitam a manutenção do código a longo prazo

## 🔍 Exemplo de Execução

```bash
$ npm test

> ragnarok-farm-creator-ui@1.0.0 test
> jest

 PASS  tests/unit/farm-storage-core.test.js
  FarmStorage - Core Functionality
    ✓ should create FarmStorage instance (2 ms)
    ✓ should save and retrieve farms (1 ms)
    ✓ should get individual farm by ID (1 ms)
    ✓ should delete farms
    ✓ should clear all farms (1 ms)
    ✓ should handle empty storage (1 ms)
    ✓ should generate unique IDs (1 ms)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        0.802 s
```

## 📈 Próximos Passos

### Módulos para Teste Futuro
- [ ] `FormManager` - Validação e coleta de dados do formulário
- [ ] `SearchManager` - Funcionalidades de busca
- [ ] `UIManager` - Renderização de elementos UI
- [ ] `DatabaseManager` - Gerenciamento da base de dados
- [ ] `FarmRenderer` - Renderização de farms
- [ ] `FarmManager` - Operações avançadas de farms

### Tipos de Teste a Adicionar
- [ ] Testes de integração
- [ ] Testes de interface (E2E)
- [ ] Testes de performance
- [ ] Testes de acessibilidade

## 💡 Contribuindo

Para adicionar novos testes:

1. Crie arquivos `.test.js` na pasta `tests/unit/`
2. Use a estrutura de `describe` e `test` do Jest
3. Mock dependências externas conforme necessário
4. Execute os testes para verificar se passam
5. Documente os novos casos de teste neste README

---

O sistema de testes garante que o Farm Creator seja robusto, confiável e fácil de manter! 🎮✨
