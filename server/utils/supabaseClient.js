const { createClient } = require('@supabase/supabase-js');

const {
  SUPABASE_KEY,
  SUPABASE_TABLE,
  SUPABASE_URL,
  SupabaseConfigurationError,
  supabaseConfigured,
} = require('./config');

let cachedClient;

const getClient = () => {
  if (cachedClient) {
    return cachedClient;
  }

  if (!supabaseConfigured()) {
    throw new SupabaseConfigurationError(
      'Supabase credentials are missing or invalid. Check your environment variables.',
    );
  }

  cachedClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cachedClient;
};

const insertRows = async (rows) => {
  if (!rows?.length) {
    return [];
  }

  const client = getClient();
  const { data, error } = await client
    .from(SUPABASE_TABLE)
    .insert(rows)
    .select('*');

  if (error) {
    throw error;
  }

  return data ?? [];
};

const fetchRows = async (limit) => {
  const client = getClient();
  let query = client.from(SUPABASE_TABLE).select('*').order('retrieved_at', { ascending: false });

  if (Number.isInteger(limit) && limit > 0) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
};

module.exports = {
  fetchRows,
  getClient,
  insertRows,
};
