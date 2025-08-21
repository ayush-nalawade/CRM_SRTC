const createError = require('http-errors');
const { z } = require('zod');
const {
	insertLead,
	getLeadById,
	updateLead: updateLeadModel,
	deleteLead,
	listLeadsByOrg,
} = require('../models/leads.model');

const createLeadSchema = z.object({
	first_name: z.string().min(1).optional(),
	last_name: z.string().min(1).optional(),
	email: z.string().email().optional(),
	phone: z.string().min(5).optional(),
	company: z.string().min(1).optional(),
	stage_id: z.string().min(1).optional(),
	status: z.string().min(1).optional(),
	assigned_to: z.string().min(1).optional(),
});

const updateLeadSchema = createLeadSchema; // partial updates

async function createLead(orgId, actorUserId, payload) {
	const data = createLeadSchema.parse(payload);
	const lead = await insertLead({ organization_id: orgId, created_by: actorUserId, ...data });
	return lead;
}

async function getLead(orgId, id) {
	const lead = await getLeadById(orgId, id);
	if (!lead) throw createError(404, 'Lead not found', { code: 'NOT_FOUND' });
	return lead;
}

async function updateLead(orgId, id, actor, payload) {
	const data = updateLeadSchema.parse(payload);
	// if actor is sales, you could enforce ownership here once the model carries owner
	const updated = await updateLeadModel(orgId, id, data);
	return updated;
}

async function removeLead(orgId, id) {
	await deleteLead(orgId, id);
	return true;
}

async function listLeads(orgId, filters) {
	const { stage_id, status, assigned_to, limit = 20, pageState, q } = filters || {};
	return listLeadsByOrg(orgId, { stage_id, status, assigned_to, limit, pageState, q });
}

module.exports = {
	createLead,
	getLead,
	updateLead,
	removeLead,
	listLeads,
};


