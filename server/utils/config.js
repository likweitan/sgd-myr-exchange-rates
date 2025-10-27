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

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const SUPABASE_TABLE = process.env.SUPABASE_TABLE || 'exchange_rates';
const BASE_CURRENCY = process.env.BASE_CURRENCY || 'SGD';
const TARGET_CURRENCY = process.env.TARGET_CURRENCY || 'MYR';
const parsedPort = Number.parseInt(process.env.PORT || '5000', 10);
const PORT = Number.isNaN(parsedPort) ? 5000 : parsedPort;
const API_BEARER_TOKEN = process.env.API_BEARER_TOKEN || '';
const CORS_ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

class SupabaseConfigurationError extends Error {
  constructor(message = 'Supabase credentials are not configured.') {
    super(message);
    this.name = 'SupabaseConfigurationError';
  }
}

const supabaseConfigured = () =>
  Boolean(
    SUPABASE_URL &&
      SUPABASE_KEY &&
      !SUPABASE_URL.includes('YOUR_SUPABASE_URL') &&
      !SUPABASE_KEY.includes('YOUR_SUPABASE_KEY'),
  );

module.exports = {
  API_BEARER_TOKEN,
  BASE_CURRENCY,
  CORS_ALLOWED_ORIGINS,
  PORT,
  SUPABASE_KEY,
  SUPABASE_TABLE,
  SUPABASE_URL,
  SupabaseConfigurationError,
  TARGET_CURRENCY,
  supabaseConfigured,
};
