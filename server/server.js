const path = require('path');
const fs = require('fs');
const express = require('express');

const corsMiddleware = require('./middleware/cors');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const { PORT, SupabaseConfigurationError } = require('./utils/config');

const app = express();

app.use(express.json());
app.use(corsMiddleware);

app.use('/api/v1', apiRoutes);
app.use('/auth', authRoutes);

const clientDistPath = path.resolve(__dirname, '../client/dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.get('/', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
      return next();
    }
    return res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      name: 'sgd-myr-express-api',
      status: 'ok',
      notice: 'Client build not found. Run `npm --prefix client run build` to generate static assets.',
    });
  });
}

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof SupabaseConfigurationError) {
    return res.status(503).json({ error: err.message });
  }

  console.error(err);
  return res.status(500).json({ error: 'Internal Server Error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Express server listening on port ${PORT}`);
  });
}

const handler = (req, res) => app(req, res);

module.exports = app;
module.exports.handler = handler;
