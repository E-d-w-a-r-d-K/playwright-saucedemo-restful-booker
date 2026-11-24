import { defineConfig } from 'allure';

// Allure 3 report settings. `npm run allure:generate` reads results from ./allure-results.
// historyPath keeps the trend between runs: CI restores ./allure-history from its cache before generating.
export default defineConfig({
  name: 'saucedemo UI + restful-booker API',
  output: './allure-report',
  historyPath: './allure-history/history.jsonl',
  plugins: {
    awesome: {
      options: {
        reportName: 'saucedemo UI + restful-booker API',
        groupBy: ['parentSuite', 'suite', 'subSuite'],
      },
    },
  },
});
