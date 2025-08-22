const express = require('express');
const { verifyJWT } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { audit } = require('../middleware/audit');
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
router.post('/leads', verifyJWT, requireRole('admin', 'manager', 'sales'), audit('lead', 'create'), handleCreateLead);

// List leads (manager and admin view all; sales will still see all for now)
router.get('/leads', verifyJWT, requireRole('admin', 'manager', 'sales'), handleListLeads);

// Get lead by id
router.get('/leads/:id', verifyJWT, requireRole('admin', 'manager', 'sales'), handleGetLead);

// Update lead (sales can update)
router.patch('/leads/:id', verifyJWT, requireRole('admin', 'manager', 'sales'), audit('lead', 'update'), handleUpdateLead);

// Delete lead (admin or manager only)
router.delete('/leads/:id', verifyJWT, requireRole('admin', 'manager'), audit('lead', 'delete'), handleDeleteLead);

// Stage transition (sales and above)
router.post('/leads/:id/transition', verifyJWT, requireRole('admin', 'manager', 'sales'), audit('lead', 'transition'), handleTransitionLeadStage);

module.exports = router;


