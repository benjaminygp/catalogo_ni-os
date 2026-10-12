const express = require('express');
const router = express.Router();
const SessionController = require('../controllers/sessionController');
const { requireAdmin } = require('../middlewares/authMiddleware');

// GET /api/sessions/active - Panel en tiempo real de usuarios conectados (Solo Admin)
router.get('/active', requireAdmin, SessionController.getActiveSessions);

// DELETE /api/sessions/:socketId - Desconectar o cerrar sesión activa (Solo Admin)
router.delete('/:socketId', requireAdmin, SessionController.removeSession);

module.exports = router;
