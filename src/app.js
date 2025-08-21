const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const apiRoutes = require('./routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok' });
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;


