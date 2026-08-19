module.exports = {
  testEnvironment: 'node',
  // Carrega as variaveis do .env.test antes de cada arquivo de teste.
  setupFiles: ['<rootDir>/src/tests/setup-env.js'],
  // Aplica as migrations no banco de teste antes da suite comecar.
  globalSetup: '<rootDir>/src/tests/global-setup.js',
  testMatch: ['<rootDir>/src/tests/**/*.test.js'],
};
