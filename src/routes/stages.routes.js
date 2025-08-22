const express = require('express');
const { verifyJWT } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const {
	handleCreateStage,
	handleListStages,
	handleGetStage,
	handleUpdateStage,
	handleDeleteStage,
} = require('../controllers/stages.controller');

const router = express.Router();

// Admin only for mutations
router.post('/stages', verifyJWT, requireRole('admin'), handleCreateStage);
router.get('/stages', verifyJWT, handleListStages);
router.get('/stages/:id', verifyJWT, handleGetStage);
router.patch('/stages/:id', verifyJWT, requireRole('admin'), handleUpdateStage);
router.delete('/stages/:id', verifyJWT, requireRole('admin'), handleDeleteStage);

module.exports = router;
