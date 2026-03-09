const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/crops', require('./routes/crops'));
app.use('/api/advisories', require('./routes/advisories'));
app.use('/api/queries', require('./routes/queries'));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Krishi Support API is running' });
});

module.exports = app;
