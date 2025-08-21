const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { run } = require('../config/cassandra');

const allowedTypes = ['text', 'number', 'date', 'dropdown', 'checkbox'];

async function createDefinition({ organization_id, entity_type, name, type, is_required = false, options = [] }) {
	if (!allowedTypes.includes(type)) {
		throw new Error('Invalid field type');
	}
	if (type === 'dropdown' && (!Array.isArray(options) || options.length === 0)) {
		throw new Error('Dropdown field requires non-empty options');
	}
	const id = uuidv4();
	const now = dayjs().toDate();
	const query = `INSERT INTO custom_field_definitions (
		organization_id, id, entity_type, name, type, is_required, options, created_at, updated_at
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
	const params = [organization_id, id, entity_type, name, type, !!is_required, options, now, now];
	await run(query, params);
	return { organization_id, id, entity_type, name, type, is_required: !!is_required, options, created_at: now, updated_at: now };
}

async function listDefinitionsByEntity(organization_id, entity_type) {
	const query = `SELECT organization_id, id, entity_type, name, type, is_required, options, created_at, updated_at
		FROM custom_field_definitions WHERE organization_id = ? AND entity_type = ?`;
	const result = await run(query, [organization_id, entity_type]);
	return result.rows || [];
}

async function getDefinitionById(organization_id, id) {
	const query = `SELECT organization_id, id, entity_type, name, type, is_required, options, created_at, updated_at
		FROM custom_field_definitions WHERE organization_id = ? AND id = ? LIMIT 1`;
	const result = await run(query, [organization_id, id]);
	return result && result.rowLength > 0 ? result.first() : null;
}

async function updateDefinition(organization_id, id, patch) {
	const allowed = ['name', 'type', 'is_required', 'options'];
	const setParts = [];
	const params = [];
	for (const key of allowed) {
		if (Object.prototype.hasOwnProperty.call(patch, key)) {
			if (key === 'type' && !allowedTypes.includes(patch[key])) {
				throw new Error('Invalid field type');
			}
			if (key === 'options' && patch['type'] === 'dropdown' && (!Array.isArray(patch[key]) || patch[key].length === 0)) {
				throw new Error('Dropdown field requires non-empty options');
			}
			setParts.push(`${key} = ?`);
			params.push(patch[key]);
		}
	}
	setParts.push('updated_at = ?');
	params.push(dayjs().toDate());
	const query = `UPDATE custom_field_definitions SET ${setParts.join(', ')} WHERE organization_id = ? AND id = ?`;
	params.push(organization_id, id);
	await run(query, params);
	return getDefinitionById(organization_id, id);
}

async function deleteDefinition(organization_id, id) {
	await run(`DELETE FROM custom_field_definitions WHERE organization_id = ? AND id = ?`, [organization_id, id]);
	return true;
}

module.exports = {
	allowedTypes,
	createDefinition,
	listDefinitionsByEntity,
	getDefinitionById,
	updateDefinition,
	deleteDefinition,
};


