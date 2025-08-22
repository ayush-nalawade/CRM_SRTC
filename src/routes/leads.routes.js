const express = require('express');
const { verifyJWT } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const {
	handleCreateLead,
	handleGetLead,
	handleUpdateLead,
	handleDeleteLead,
	handleListLeads,
	handleTransitionLeadStage,
} = require('../controllers/leads.controller');

const router = express.Router();

// Create lead (sales and above)
router.post('/leads', verifyJWT, requireRole('admin', 'manager', 'sales'), handleCreateLead);

// List leads (manager and admin view all; sales will still see all for now)
router.get('/leads', verifyJWT, requireRole('admin', 'manager', 'sales'), handleListLeads);

// Get lead by id
router.get('/leads/:id', verifyJWT, requireRole('admin', 'manager', 'sales'), handleGetLead);

// Update lead (sales can update)
router.patch('/leads/:id', verifyJWT, requireRole('admin', 'manager', 'sales'), handleUpdateLead);

// Delete lead (admin or manager only)
router.delete('/leads/:id', verifyJWT, requireRole('admin', 'manager'), handleDeleteLead);

// Stage transition (sales and above)
router.post('/leads/:id/transition', verifyJWT, requireRole('admin', 'manager', 'sales'), handleTransitionLeadStage);

module.exports = router;


