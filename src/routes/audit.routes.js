const express = require('express');
const { verifyJWT } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { listAudits } = require('../models/audit.model');

const router = express.Router();

router.get('/audit', verifyJWT, requireRole('admin'), async (req, res, next) => {
	try {
		const orgId = req.auth.organizationId;
		const { from, to, entity_type, limit, pageState } = req.query;
		const result = await listAudits(orgId, {
			from,
			to,
			entity_type,
			limit: limit ? Number(limit) : 50,
			pageState,
		});
		return res.json({ success: true, items: result.items, pageState: result.pageState });
	} catch (err) { return next(err); }
});

module.exports = router;
