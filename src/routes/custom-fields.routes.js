const express = require('express');
const { verifyJWT } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const {
	handleCreateDefinition,
	handleListDefinitions,
	handleUpdateDefinition,
	handleDeleteDefinition,
} = require('../controllers/customFields.controller');

const router = express.Router();

router.post('/custom-fields', verifyJWT, requireRole('admin'), handleCreateDefinition);
router.get('/custom-fields', verifyJWT, handleListDefinitions);
router.patch('/custom-fields/:id', verifyJWT, requireRole('admin'), handleUpdateDefinition);
router.delete('/custom-fields/:id', verifyJWT, requireRole('admin'), handleDeleteDefinition);

module.exports = router;


