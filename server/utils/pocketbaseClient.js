const {
  POCKETBASE_ADMIN_EMAIL,
  POCKETBASE_ADMIN_PASSWORD,
  POCKETBASE_COLLECTION,
  POCKETBASE_URL,
  PocketBaseConfigurationError,
  pocketbaseConfigured,
} = require('./config');

let cachedToken = null;
let tokenExpiry = 0;

const ensureConfigured = () => {
  if (!pocketbaseConfigured()) {
    throw new PocketBaseConfigurationError(
      'PocketBase URL is missing or invalid. Check your environment variables.',
    );
  }
};

const getAuthToken = async () => {
  if (!POCKETBASE_ADMIN_EMAIL || !POCKETBASE_ADMIN_PASSWORD) {
    return null;
  }

  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const res = await fetch(`${POCKETBASE_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identity: POCKETBASE_ADMIN_EMAIL,
      password: POCKETBASE_ADMIN_PASSWORD,
    }),
  });

  if (!res.ok) {
    throw new PocketBaseConfigurationError(
      `PocketBase admin auth failed: ${res.status} ${res.statusText}`,
    );
  }

  const body = await res.json();
  cachedToken = body.token;
  // Refresh 5 minutes before expiry (tokens typically last ~1 hour)
  tokenExpiry = Date.now() + 55 * 60 * 1000;
  return cachedToken;
};

const getHeaders = async () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = await getAuthToken();
  if (token) {
    headers.Authorization = token;
  }
  return headers;
};

const insertRows = async (rows) => {
  if (!rows?.length) {
    return [];
  }

  ensureConfigured();
  const headers = await getHeaders();
  const results = [];

  for (const row of rows) {
    const res = await fetch(
      `${POCKETBASE_URL}/api/collections/${POCKETBASE_COLLECTION}/records`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(row),
      },
    );

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`PocketBase insert failed: ${res.status} ${errorBody}`);
    }

    results.push(await res.json());
  }

  return results;
};

const fetchRows = async (limit) => {
  ensureConfigured();
  const headers = await getHeaders();

  const params = new URLSearchParams({
    sort: '-created',
    perPage: String(limit && Number.isInteger(limit) && limit > 0 ? limit : 200),
  });

  const res = await fetch(
    `${POCKETBASE_URL}/api/collections/${POCKETBASE_COLLECTION}/records?${params}`,
    { headers },
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`PocketBase fetch failed: ${res.status} ${errorBody}`);
  }

  const body = await res.json();
  return body.items ?? [];
};

module.exports = {
  fetchRows,
  insertRows,
};
