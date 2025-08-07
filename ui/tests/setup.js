import '@testing-library/jest-dom';

// Mock do localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

global.localStorage = localStorageMock;

// Mock do fetch
global.fetch = jest.fn();

// Mock do bootstrap
global.bootstrap = {
  Modal: {
    getInstance: jest.fn(),
    getOrCreateInstance: jest.fn(() => ({
      show: jest.fn(),
      hide: jest.fn()
    }))
  },
  Alert: {
    getInstance: jest.fn(),
    getOrCreateInstance: jest.fn(() => ({
      close: jest.fn()
    }))
  }
};

// Limpar mocks antes de cada teste
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});
