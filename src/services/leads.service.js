const createError = require('http-errors');
const { z } = require('zod');
const {
	insertLead,
	getLeadById,
	updateLead: updateLeadModel,
	deleteLead,
	listLeadsByOrg,
} = require('../models/leads.model');
const { getStageById } = require('../models/stages.model');
const { insertJourneyEntry } = require('../models/leadJourney.model');
const {
	upsertLeadByStage,
	upsertLeadByOwner,
	deleteLeadByOwner,
	deleteLeadByStage,
	insertJourneyByDay,
} = require('../models/reporting.model');

const createLeadSchema = z.object({
	first_name: z.string().min(1).optional(),
	last_name: z.string().min(1).optional(),
	email: z.string().email().optional(),
	phone: z.string().min(5).optional(),
	company: z.string().min(1).optional(),
	stage_id: z.string().uuid().optional(),
	status: z.string().min(1).optional(),
	assigned_to: z.string().uuid().optional(),
	owner_id: z.string().uuid().optional(),
	source: z.string().min(1).optional(),
	title: z.string().min(1).optional(),
});

const updateLeadSchema = createLeadSchema; // partial updates

const transitionSchema = z.object({
	to_stage_id: z.string().uuid(),
	notes: z.string().optional(),
});

async function createLead(orgId, actorUserId, payload) {
	const data = createLeadSchema.parse(payload);
	const lead = await insertLead({ organization_id: orgId, owner_id: data.owner_id || actorUserId, ...data });
	// reporting tables
	await upsertLeadByOwner({ organization_id: orgId, owner_id: lead.owner_id || actorUserId, created_at: lead.created_at, id: lead.id });
	if (lead.stage_id) await upsertLeadByStage({ organization_id: orgId, stage_id: lead.stage_id, created_at: lead.created_at, id: lead.id });
	return lead;
}

async function getLead(orgId, id) {
	const lead = await getLeadById(orgId, id);
	if (!lead) throw createError(404, 'Lead not found', { code: 'NOT_FOUND' });
	return lead;
}

async function updateLead(orgId, id, actor, payload) {
	const prev = await getLeadById(orgId, id);
	const data = updateLeadSchema.parse(payload);
	const updated = await updateLeadModel(orgId, id, data);
	// reporting owner change
	if (data.owner_id && prev && prev.owner_id !== data.owner_id) {
		if (prev.owner_id) await deleteLeadByOwner({ organization_id: orgId, owner_id: prev.owner_id, created_at: prev.created_at, id });
		await upsertLeadByOwner({ organization_id: orgId, owner_id: data.owner_id, created_at: prev.created_at, id });
	}
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

async function transitionLeadStage(orgId, leadId, toStageId, userId, notes) {
	// Get current lead
	const lead = await getLeadById(orgId, leadId);
	if (!lead) {
		throw createError(404, 'Lead not found', { code: 'NOT_FOUND' });
	}

	// Validate target stage exists in same org
	const targetStage = await getStageById(orgId, toStageId);
	if (!targetStage) {
		throw createError(400, 'Target stage not found', { code: 'INVALID_STAGE' });
	}

	// Record journey entry
	const journey = await insertJourneyEntry({
		organization_id: orgId,
		lead_id: leadId,
		from_stage_id: lead.stage_id,
		to_stage_id: toStageId,
		changed_by: userId,
		notes,
	});

	// Update reporting tables
	if (lead.stage_id) await deleteLeadByStage({ organization_id: orgId, stage_id: lead.stage_id, created_at: lead.created_at, id: leadId });
	await upsertLeadByStage({ organization_id: orgId, stage_id: toStageId, created_at: lead.created_at, id: leadId });
	await insertJourneyByDay({ organization_id: orgId, yyyymmdd: require('dayjs')().format('YYYYMMDD'), changed_at: new Date(), lead_id: leadId, to_stage_id: toStageId });

	// Update lead stage
	const updated = await updateLeadModel(orgId, leadId, { stage_id: toStageId });
	return updated;
}

module.exports = {
	createLead,
	getLead,
	updateLead,
	removeLead,
	listLeads,
	transitionLeadStage,
};


