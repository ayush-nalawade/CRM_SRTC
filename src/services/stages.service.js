const { z } = require('zod');
const createError = require('http-errors');
const {
	createStage,
	listStagesByOrg,
	getStageById,
	updateStage,
	deleteStage,
} = require('../models/stages.model');

const createStageSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
	is_final: z.boolean().optional(),
	order: z.number().int().min(0).optional(),
});

const updateStageSchema = z.object({
	name: z.string().min(1).optional(),
	description: z.string().optional(),
	is_final: z.boolean().optional(),
	order: z.number().int().min(0).optional(),
});

async function createStageService(orgId, payload) {
	const data = createStageSchema.parse(payload);
	const stage = await createStage({ organization_id: orgId, ...data });
	return stage;
}

async function listStagesService(orgId) {
	return listStagesByOrg(orgId);
}

async function getStageService(orgId, id) {
	const stage = await getStageById(orgId, id);
	if (!stage) {
		throw createError(404, 'Stage not found', { code: 'NOT_FOUND' });
	}
	return stage;
}

async function updateStageService(orgId, id, payload) {
	const data = updateStageSchema.parse(payload);
	const stage = await updateStage(orgId, id, data);
	if (!stage) {
		throw createError(404, 'Stage not found', { code: 'NOT_FOUND' });
	}
	return stage;
}

async function deleteStageService(orgId, id) {
	try {
		await deleteStage(orgId, id);
		return true;
	} catch (err) {
		if (err.message.includes('Cannot delete')) {
			throw createError(400, err.message, { code: 'STAGE_IN_USE' });
		}
		throw err;
	}
}

module.exports = {
	createStageService,
	listStagesService,
	getStageService,
	updateStageService,
	deleteStageService,
};
