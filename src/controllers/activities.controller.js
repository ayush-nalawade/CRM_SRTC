const { z } = require('zod');
const { insertActivity, listActivities } = require('../models/activities.model');

const createActivitySchema = z.object({
	type: z.enum(['call', 'email', 'note', 'meeting', 'task']),
	description: z.string().min(1),
	details: z.any().optional(),
});

async function handleCreateActivity(req, res, next) {
	try {
		const orgId = req.auth.organizationId;
		const userId = req.auth.userId;
		const leadId = req.params.id;
		const data = createActivitySchema.parse(req.body);
		// Ensure details is JSON-stringifiable
		let details = null;
		if (typeof data.details !== 'undefined') {
			try { JSON.stringify(data.details); details = data.details; } catch { details = String(data.details); }
		}
		const act = await insertActivity({ organization_id: orgId, lead_id: leadId, created_by: userId, ...data, details });
		return res.status(201).json({ success: true, activity: act });
	} catch (err) { return next(err); }
}

async function handleListActivities(req, res, next) {
	try {
		const orgId = req.auth.organizationId;
		const leadId = req.params.id;
		const limit = req.query.limit ? Number(req.query.limit) : 50;
		const pageState = req.query.pageState;
		const result = await listActivities(orgId, leadId, { limit, pageState });
		return res.json({ success: true, items: result.items, pageState: result.pageState });
	} catch (err) { return next(err); }
}

module.exports = { handleCreateActivity, handleListActivities };
