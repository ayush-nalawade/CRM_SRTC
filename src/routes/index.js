const express = require('express');

const router = express.Router();

router.get('/v1/ping', (req, res) => {
  res.json({ success: true, message: 'pong' });
});

module.exports = router;


