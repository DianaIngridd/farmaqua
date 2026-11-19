// Suíte de testes funcionais automatizados (Selenium). Execute com: npm run test:e2e
module.exports = {
    testEnvironment: 'node',
    testMatch: ['<rootDir>/tests/e2e/**/*.e2e.js'],
    globalSetup: '<rootDir>/tests/e2e/global-setup.js',
    globalTeardown: '<rootDir>/tests/e2e/global-teardown.js',
    testTimeout: 60000,
    verbose: true
};
