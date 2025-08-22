const {
	createStageService,
	listStagesService,
	getStageService,
	updateStageService,
	deleteStageService,
} = require('../services/stages.service');

async function handleCreateStage(req, res, next) {
	try {
		const orgId = req.auth.organizationId;
		const stage = await createStageService(orgId, req.body);
		return res.status(201).json({ success: true, stage });
	} catch (err) {
		return next(err);
	}
}

async function handleListStages(req, res, next) {
	try {
		const orgId = req.auth.organizationId;
		const stages = await listStagesService(orgId);
		return res.json({ success: true, stages });
	} catch (err) {
		return next(err);
	}
}

async function handleGetStage(req, res, next) {
	try {
		const orgId = req.auth.organizationId;
		const stage = await getStageService(orgId, req.params.id);
		return res.json({ success: true, stage });
	} catch (err) {
		return next(err);
	}
}

async function handleUpdateStage(req, res, next) {
	try {
		const orgId = req.auth.organizationId;
		const stage = await updateStageService(orgId, req.params.id, req.body);
		return res.json({ success: true, stage });
	} catch (err) {
		return next(err);
	}
}

async function handleDeleteStage(req, res, next) {
	try {
		const orgId = req.auth.organizationId;
		await deleteStageService(orgId, req.params.id);
		return res.status(204).send();
	} catch (err) {
		return next(err);
	}
}

module.exports = {
	handleCreateStage,
	handleListStages,
	handleGetStage,
	handleUpdateStage,
	handleDeleteStage,
};
