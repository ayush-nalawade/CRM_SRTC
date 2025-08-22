const express = require('express');
const { verifyJWT } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { handleLeadsByStage, handleLeadsByOwner, handleFunnel } = require('../controllers/reports.controller');

const router = express.Router();

router.get('/reports/leads-by-stage', verifyJWT, requireRole('admin', 'manager'), handleLeadsByStage);
router.get('/reports/leads-by-owner', verifyJWT, requireRole('admin', 'manager'), handleLeadsByOwner);
router.get('/reports/funnel', verifyJWT, requireRole('admin', 'manager'), handleFunnel);

module.exports = router;
