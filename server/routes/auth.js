const express = require('express');

const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/verify', authMiddleware, (req, res) => {
  res.json({ authenticated: true });
});

module.exports = router;
