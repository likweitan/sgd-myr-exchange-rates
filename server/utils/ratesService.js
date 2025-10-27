const { BASE_CURRENCY, TARGET_CURRENCY } = require('./config');
const { fetchRows, insertRows } = require('./supabaseClient');

const insertRates = async (rates) => {
  if (!rates?.length) {
    return [];
  }

  const enrichedRates = rates.map((rate) => ({
    ...rate,
    base_currency: rate.base_currency || BASE_CURRENCY,
    target_currency: rate.target_currency || TARGET_CURRENCY,
  }));

  return insertRows(enrichedRates);
};

const getRates = async (limit) => fetchRows(limit);

const getLatestRates = async () => {
  const rates = await getRates();
  const latestByPlatform = new Map();

  for (const rate of rates) {
    const platform = rate.platform;
    if (!latestByPlatform.has(platform)) {
      latestByPlatform.set(platform, rate);
    }
  }

  return [...latestByPlatform.values()];
};

module.exports = {
  getLatestRates,
  getRates,
  insertRates,
};
