const express = require('express');

const { SupabaseConfigurationError, supabaseConfigured } = require('../utils/config');
const { getLatestRates, getRates } = require('../utils/ratesService');

const router = express.Router();

const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

router.get(
  '/rates',
  asyncHandler(async (req, res) => {
    const limitParam = req.query.limit;
    let limit;

    if (limitParam !== undefined) {
      limit = Number.parseInt(limitParam, 10);
      if (Number.isNaN(limit) || limit <= 0) {
        return res.status(400).json({ error: 'Query parameter "limit" must be a positive integer.' });
      }
    }

    try {
      const data = await getRates(limit);
      return res.json({ data, count: data.length });
    } catch (error) {
      if (error instanceof SupabaseConfigurationError) {
        return res.status(503).json({ error: error.message });
      }
      throw error;
    }
  }),
);

router.get(
  '/rates/latest',
  asyncHandler(async (req, res) => {
    try {
      const data = await getLatestRates();
      return res.json({ data, count: data.length });
    } catch (error) {
      if (error instanceof SupabaseConfigurationError) {
        return res.status(503).json({ error: error.message });
      }
      throw error;
    }
  }),
);

router.get(
  '/health',
  asyncHandler(async (req, res) => {
    res.json({
      status: 'ok',
      supabase_configured: supabaseConfigured(),
    });
  }),
);

module.exports = router;
