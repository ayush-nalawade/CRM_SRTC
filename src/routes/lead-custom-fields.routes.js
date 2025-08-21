const express = require('express');
const { verifyJWT } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const {
	handlePutLeadCustomFields,
	handleGetLeadCustomFields,
} = require('../controllers/customFields.controller');

const router = express.Router();

router.put('/leads/:id/custom-fields', verifyJWT, requireRole('admin', 'manager', 'sales'), handlePutLeadCustomFields);
router.get('/leads/:id/custom-fields', verifyJWT, requireRole('admin', 'manager', 'sales'), handleGetLeadCustomFields);

module.exports = router;


