// Testes unitários e de integração de API (rápidos, sem navegador e sem banco real).
module.exports = {
    testEnvironment: 'node',
    testMatch: ['<rootDir>/tests/unit/**/*.test.js', '<rootDir>/tests/api/**/*.test.js'],
    verbose: true
};
