const express = require('express');
const authRoutes = require('./auth.routes');

const router = express.Router();

router.get('/v1/ping', (req, res) => {
  res.json({ success: true, message: 'pong' });
});

router.use('/auth', authRoutes);

module.exports = router;


