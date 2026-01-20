const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    timeout: 30000,
    expect: {
        timeout: 5000
    },
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
    },
    webServer: {
        command: 'node server.js',
        port: 3000,
        reuseExistingServer: true,
    },
});
