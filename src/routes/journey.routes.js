const express = require('express');
const { verifyJWT } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { handleGetLeadJourney } = require('../controllers/leads.controller');

const router = express.Router();

// View lead journey (sales and above)
router.get('/leads/:id/journey', verifyJWT, requireRole('admin', 'manager', 'sales'), handleGetLeadJourney);

module.exports = router;
