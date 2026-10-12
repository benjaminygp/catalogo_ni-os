const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware');

// POST /api/auth/login - Inicio de sesión (con regla estricta para Admin PATTYps y fallback a Cliente)
router.post('/login', AuthController.login);

// GET /api/auth/me - Consulta del usuario autenticado
router.get('/me', requireAuth, AuthController.me);

module.exports = router;
