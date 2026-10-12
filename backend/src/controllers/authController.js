const UserModel = require('../models/userModel');
const { generateToken } = require('../middlewares/authMiddleware');

const ADMIN_USERNAME = process.env.ADMIN_USER || 'PATTYps';
const ADMIN_PASSWORD = process.env.ADMIN_PASS || 'PATTYpschincha452416';

const AuthController = {
  // Proceso de Login con verificación estricta de roles
  login(req, res) {
    try {
      let { username, password } = req.body;

      username = (username || '').trim();
      password = (password || '').trim();

      // Si no envía nombre de usuario, asignarle un nombre de cliente amigable
      if (!username) {
        username = `Cliente_${Math.floor(100 + Math.random() * 900)}`;
      }

      let assignedRole = 'cliente';
      let finalUsername = username;

      // REGLA ESTRICTA DE ROL ADMIN:
      // Nombre PATTYps (insensible a mayúsculas/minúsculas) y clave exacta PATTYpschincha452416
      const isMatchAdminUser = username.toLowerCase() === ADMIN_USERNAME.toLowerCase();
      const isMatchAdminPass = password === ADMIN_PASSWORD;

      if (isMatchAdminUser && isMatchAdminPass) {
        assignedRole = 'admin';
        finalUsername = ADMIN_USERNAME;
      } else {
        // Por seguridad, cualquier otra combinación se cataloga automáticamente como Rol Cliente
        assignedRole = 'cliente';
        if (isMatchAdminUser && !isMatchAdminPass) {
          finalUsername = `Cliente_${ADMIN_USERNAME}_invitado`;
        }
      }

      // Obtener o registrar usuario en base de datos
      let user = UserModel.findByUsername(finalUsername);
      const roleRecord = UserModel.getRoleByName(assignedRole);
      const roleId = roleRecord ? roleRecord.id : (assignedRole === 'admin' ? 1 : 2);

      if (!user) {
        user = UserModel.create({
          username: finalUsername,
          password_hash: assignedRole === 'admin' ? ADMIN_PASSWORD : null,
          role_id: roleId
        });
      } else if (user.role_name !== assignedRole && assignedRole === 'admin') {
        // En caso de que se haya reasignado
        user.role_name = 'admin';
      }

      const tokenPayload = {
        id: user.id,
        username: finalUsername,
        role: assignedRole
      };

      const token = generateToken(tokenPayload);

      return res.status(200).json({
        success: true,
        message: assignedRole === 'admin'
          ? 'Acceso concedido como Administrador.'
          : 'Sesión iniciada como Cliente.',
        role: assignedRole,
        user: {
          id: user.id,
          username: finalUsername,
          role: assignedRole
        },
        token
      });
    } catch (error) {
      console.error('[AUTH ERROR login]', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno al procesar el inicio de sesión.'
      });
    }
  },

  // Obtener perfil actual a partir del token
  me(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'No autenticado.' });
      }
      return res.status(200).json({
        success: true,
        user: req.user
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Error al verificar sesión.' });
    }
  }
};

module.exports = AuthController;
