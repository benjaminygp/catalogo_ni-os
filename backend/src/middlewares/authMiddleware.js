const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'catalogo_caballeros_jwt_secure_key_452416_pattyps';

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Middleware para verificar autenticación general (Admin o Cliente)
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Token de autorización requerido.' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ success: false, error: 'Token inválido o expirado.' });
  }

  req.user = decoded;
  next();
}

// Middleware para proteger exclusivamente las rutas del Administrador
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado. Se requieren privilegios de Administrador.'
    });
  });
}

module.exports = {
  generateToken,
  verifyToken,
  requireAuth,
  requireAdmin
};
