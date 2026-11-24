import fs from 'node:fs';
import path from 'node:path';

/*
 * One place for everything that differs between environments.
 * Values come from the process environment or from a local .env file (see .env.example);
 * the defaults point at the public demo sites, so a fresh clone runs with no setup.
 */
const envFile = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const read = (name: string, fallback: string): string => process.env[name]?.trim() || fallback;

export const env = {
  ui: {
    baseUrl: read('UI_BASE_URL', 'https://www.saucedemo.com'),
    password: read('UI_PASSWORD', 'secret_sauce'),
  },
  api: {
    baseUrl: read('API_BASE_URL', 'https://restful-booker.herokuapp.com'),
    username: read('API_USERNAME', 'admin'),
    password: read('API_PASSWORD', 'password123'),
  },
} as const;
