const { createLead, getLead, updateLead, removeLead, listLeads } = require('../services/leads.service');

async function handleCreateLead(req, res, next) {
	try {
		const orgId = req.auth.organizationId;
		const actor = req.auth.userId;
		const lead = await createLead(orgId, actor, req.body);
		return res.status(201).json({ success: true, lead });
	} catch (err) {
		return next(err);
	}
}

async function handleGetLead(req, res, next) {
	try {
		const orgId = req.auth.organizationId;
		const lead = await getLead(orgId, req.params.id);
		return res.json({ success: true, lead });
	} catch (err) {
		return next(err);
	}
}

async function handleUpdateLead(req, res, next) {
	try {
		const orgId = req.auth.organizationId;
		const actor = req.auth;
		const lead = await updateLead(orgId, req.params.id, actor, req.body);
		return res.json({ success: true, lead });
	} catch (err) {
		return next(err);
	}
}

async function handleDeleteLead(req, res, next) {
	try {
		const orgId = req.auth.organizationId;
		await removeLead(orgId, req.params.id);
		return res.status(204).send();
	} catch (err) {
		return next(err);
	}
}

async function handleListLeads(req, res, next) {
	try {
		const orgId = req.auth.organizationId;
		const { stage_id, status, assigned_to, limit, pageState, q } = req.query;
		const parsed = {
			stage_id,
			status,
			assigned_to,
			limit: limit ? Number(limit) : undefined,
			pageState,
			q,
		};
		const result = await listLeads(orgId, parsed);
		return res.json({ success: true, ...result });
	} catch (err) {
		return next(err);
	}
}

module.exports = {
	handleCreateLead,
	handleGetLead,
	handleUpdateLead,
	handleDeleteLead,
	handleListLeads,
};


