const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const defaultEnvResult = dotenv.config();

if (defaultEnvResult.error) {
  const rootEnvPath = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
  }
}

const POCKETBASE_URL = process.env.POCKETBASE_URL || '';
const POCKETBASE_ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || '';
const POCKETBASE_ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || '';
const POCKETBASE_COLLECTION = process.env.POCKETBASE_COLLECTION || 'exchange_rates';
const BASE_CURRENCY = process.env.BASE_CURRENCY || 'SGD';
const TARGET_CURRENCY = process.env.TARGET_CURRENCY || 'MYR';
const parsedPort = Number.parseInt(process.env.PORT || '5000', 10);
const PORT = Number.isNaN(parsedPort) ? 5000 : parsedPort;
const API_BEARER_TOKEN = process.env.API_BEARER_TOKEN || '';
const CORS_ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

class PocketBaseConfigurationError extends Error {
  constructor(message = 'PocketBase URL is not configured.') {
    super(message);
    this.name = 'PocketBaseConfigurationError';
  }
}

const pocketbaseConfigured = () => Boolean(POCKETBASE_URL && !POCKETBASE_URL.includes('YOUR_POCKETBASE_URL'));

module.exports = {
  API_BEARER_TOKEN,
  BASE_CURRENCY,
  CORS_ALLOWED_ORIGINS,
  POCKETBASE_ADMIN_EMAIL,
  POCKETBASE_ADMIN_PASSWORD,
  POCKETBASE_COLLECTION,
  POCKETBASE_URL,
  PocketBaseConfigurationError,
  PORT,
  TARGET_CURRENCY,
  pocketbaseConfigured,
};
