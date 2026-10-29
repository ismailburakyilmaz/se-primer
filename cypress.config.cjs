const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 390,
    viewportHeight: 844,
    video: true,
    videoCompression: 32,
    defaultCommandTimeout: 8000,
    supportFile: 'cypress/support/e2e.js',
    specPattern: ['cypress/e2e/**/*.cy.js', 'cypress/video/*.cy.js'],
  },
});
