const { z } = require('zod');
const createError = require('http-errors');
const {
	allowedTypes,
	createDefinition,
	listDefinitionsByEntity,
	getDefinitionById,
	updateDefinition,
	deleteDefinition,
} = require('../models/customFieldDefs.model');
const { upsertValues, listValues } = require('../models/customFieldValues.model');

const createDefSchema = z.object({
	entity_type: z.enum(['lead']),
	name: z.string().min(1),
	type: z.enum(['text', 'number', 'date', 'dropdown', 'checkbox']),
	is_required: z.boolean().optional(),
	options: z.array(z.string()).optional(),
});

const updateDefSchema = z.object({
	name: z.string().min(1).optional(),
	type: z.enum(['text', 'number', 'date', 'dropdown', 'checkbox']).optional(),
	is_required: z.boolean().optional(),
	options: z.array(z.string()).optional(),
});

async function handleCreateDefinition(req, res, next) {
	try {
		const orgId = req.auth.organizationId;
		const data = createDefSchema.parse(req.body);
		const def = await createDefinition({ organization_id: orgId, ...data });
		return res.status(201).json({ success: true, definition: def });
	} catch (err) { return next(err); }
}

async function handleListDefinitions(req, res, next) {
	try {
		const orgId = req.auth.organizationId;
		const entity_type = req.query.entity_type || 'lead';
		const defs = await listDefinitionsByEntity(orgId, entity_type);
		return res.json({ success: true, definitions: defs });
	} catch (err) { return next(err); }
}

async function handleUpdateDefinition(req, res, next) {
	try {
		const orgId = req.auth.organizationId;
		const id = req.params.id;
		const data = updateDefSchema.parse(req.body);
		const updated = await updateDefinition(orgId, id, data);
		return res.json({ success: true, definition: updated });
	} catch (err) { return next(err); }
}

async function handleDeleteDefinition(req, res, next) {
	try {
		const orgId = req.auth.organizationId;
		const id = req.params.id;
		await deleteDefinition(orgId, id);
		return res.status(204).send();
	} catch (err) { return next(err); }
}

async function handlePutLeadCustomFields(req, res, next) {
	try {
		const orgId = req.auth.organizationId;
		const entityId = req.params.id;
		const defs = await listDefinitionsByEntity(orgId, 'lead');
		const defById = new Map((defs || []).map((d) => [String(d.id), d]));
		const payload = req.body && typeof req.body === 'object' ? req.body : {};
		// Validate based on definitions
		for (const [defId, def] of defById.entries()) {
			const hasVal = Object.prototype.hasOwnProperty.call(payload, defId);
			if (def.is_required && !hasVal) {
				throw createError(400, `Missing required field: ${def.name}`, { code: 'VALIDATION_ERROR' });
			}
			if (hasVal) {
				const val = payload[defId];
				switch (def.type) {
					case 'text':
						if (typeof val !== 'string') throw createError(400, `Field ${def.name} must be string`);
						break;
					case 'number':
						if (typeof val !== 'number') throw createError(400, `Field ${def.name} must be number`);
						break;
					case 'date':
						if (isNaN(Date.parse(val))) throw createError(400, `Field ${def.name} must be date (ISO)`);
						break;
					case 'dropdown':
						if (!def.options || !def.options.includes(val)) throw createError(400, `Field ${def.name} must be one of options`);
						break;
					case 'checkbox':
						if (typeof val !== 'boolean') throw createError(400, `Field ${def.name} must be boolean`);
						break;
					default:
						throw createError(400, `Unsupported field type for ${def.name}`);
				}
			}
		}
		await upsertValues(orgId, entityId, payload);
		return res.status(204).send();
	} catch (err) { return next(err); }
}

async function handleGetLeadCustomFields(req, res, next) {
	try {
		const orgId = req.auth.organizationId;
		const entityId = req.params.id;
		const values = await listValues(orgId, entityId);
		return res.json({ success: true, values });
	} catch (err) { return next(err); }
}

module.exports = {
	handleCreateDefinition,
	handleListDefinitions,
	handleUpdateDefinition,
	handleDeleteDefinition,
	handlePutLeadCustomFields,
	handleGetLeadCustomFields,
};


