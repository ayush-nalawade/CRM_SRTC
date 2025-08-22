const { z } = require('zod');
const {
	countLeadsByStagePartition,
	listOwnerIdsFromLeads,
	countLeadsByOwnerPartition,
	listJourneysByDayRange,
} = require('../models/reporting.model');

async function handleLeadsByStage(req, res, next) {
	try {
		const orgId = req.auth.organizationId;
		// In a real system, you would list stages first; here accept stage_ids in query or return empty
		const stageIds = (req.query.stage_ids ? String(req.query.stage_ids).split(',') : []);
		const results = [];
		for (const sid of stageIds) {
			const count = await countLeadsByStagePartition(orgId, sid);
			results.push({ stage_id: sid, count });
		}
		return res.json({ success: true, items: results });
	} catch (err) { return next(err); }
}

async function handleLeadsByOwner(req, res, next) {
	try {
		const orgId = req.auth.organizationId;
		const ownerIds = await listOwnerIdsFromLeads(orgId);
		const counts = [];
		for (const oid of ownerIds) {
			const count = await countLeadsByOwnerPartition(orgId, oid);
			counts.push({ owner_id: oid, count });
		}
		counts.sort((a, b) => b.count - a.count);
		return res.json({ success: true, items: counts });
	} catch (err) { return next(err); }
}

async function handleFunnel(req, res, next) {
	try {
		const orgId = req.auth.organizationId;
		const from = req.query.from;
		const to = req.query.to;
		if (!from || !to) return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'from and to are required' });
		const rows = await listJourneysByDayRange(orgId, from, to);
		const byStage = new Map();
		for (const r of rows) {
			const key = r.to_stage_id;
			byStage.set(key, (byStage.get(key) || 0) + 1);
		}
		const items = Array.from(byStage.entries()).map(([stage_id, count]) => ({ stage_id, count }))
			.sort((a, b) => b.count - a.count);
		return res.json({ success: true, items });
	} catch (err) { return next(err); }
}

module.exports = { handleLeadsByStage, handleLeadsByOwner, handleFunnel };
