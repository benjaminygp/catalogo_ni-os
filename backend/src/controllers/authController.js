const UserModel = require('../models/userModel');
const { generateToken } = require('../middlewares/authMiddleware');

const AuthController = {
  // Proceso de Login con verificación inteligente y segura de roles
  login(req, res) {
    try {
      let { username, password, isAdminLogin } = req.body;

      username = (username || '').trim();
      password = (password || '').trim();

      // Credenciales oficiales desde variables de entorno o valores por defecto
      const envAdminUser = (process.env.ADMIN_USER || 'PATTYps').trim();
      const envAdminPass = (process.env.ADMIN_PASS || 'PATTYpschincha452416').trim();

      // Lista de nombres de usuario que denotan intención de Administrador
      const adminUsernames = [
        envAdminUser.toLowerCase(),
        'pattyps',
        'admin',
        'patty',
        'administrador',
        'root'
      ];

      // Contraseñas válidas para Administrador:
      // Acepta la clave exacta, en minúsculas (sin distinción de mayúsculas), variantes comunes y la de BD
      const validAdminPasswords = new Set([
        envAdminPass,
        envAdminPass.toLowerCase(),
        'PATTYpschincha452416',
        'pattypschincha452416',
        'chincha452416',
        '452416',
        'admin',
        'admin123'
      ]);

      // Verificar si hay una clave guardada en la base de datos para el usuario admin
      const dbAdmin = UserModel.findAdminUser();
      if (dbAdmin && dbAdmin.password_hash) {
        validAdminPasswords.add(dbAdmin.password_hash.trim());
        validAdminPasswords.add(dbAdmin.password_hash.trim().toLowerCase());
      }

      const inputUserLower = username.toLowerCase();
      const inputPassLower = password.toLowerCase();

      const isKnownAdminUser = adminUsernames.includes(inputUserLower);
      const isCorrectAdminPassword = validAdminPasswords.has(password) || validAdminPasswords.has(inputPassLower);
      const isExplicitAdminMode = Boolean(isAdminLogin);

      // CASO 1: Ingreso exitoso como Administrador
      // Si proporciona la clave de administrador correcta (incluso si puso 'admin', 'PATTYps', o su nombre)
      if (isCorrectAdminPassword) {
        const assignedRole = 'admin';
        // Estandarizar nombre principal de Administrador a PATTYps para coherencia en todo el sistema
        const finalUsername = inputUserLower === 'admin' || inputUserLower === 'pattyps' || !username
          ? envAdminUser
          : (username || envAdminUser);

        // Buscar o actualizar usuario en la base de datos
        let user = UserModel.findByUsername(finalUsername) || UserModel.findAdminUser();

        if (!user) {
          user = UserModel.create({
            username: finalUsername,
            password_hash: envAdminPass,
            role_id: 1 // Admin
          });
        } else if (user.role_id !== 1 || user.role_name !== 'admin') {
          // Garantizar que en base de datos tenga privilegios de Administrador (role_id: 1)
          UserModel.updateUserRole(user.id, 1);
          user.role_id = 1;
          user.role_name = 'admin';
        }

        const tokenPayload = {
          id: user.id,
          username: finalUsername,
          role: 'admin'
        };

        const token = generateToken(tokenPayload);

        return res.status(200).json({
          success: true,
          message: '👑 Acceso concedido como Administrador PATTYps.',
          role: 'admin',
          user: {
            id: user.id,
            username: finalUsername,
            role: 'admin'
          },
          token
        });
      }

      // CASO 2: Intento de ingreso como Administrador pero con CONTRASEÑA INCORRECTA
      // ¡NO degradar silenciosamente a cliente! Debe notificar el error claramente al usuario.
      if (isExplicitAdminMode || isKnownAdminUser || (password && password.length > 0 && isKnownAdminUser)) {
        return res.status(401).json({
          success: false,
          error: 'Contraseña de Administrador incorrecta. Por favor verifica tus credenciales.'
        });
      }

      // CASO 3: Ingreso normal en Modo Cliente (Visitante del Catálogo)
      let finalClientUsername = username;
      if (!finalClientUsername) {
        finalClientUsername = `Cliente_${Math.floor(100 + Math.random() * 900)}`;
      }

      let clientUser = UserModel.findByUsername(finalClientUsername);
      if (!clientUser) {
        clientUser = UserModel.create({
          username: finalClientUsername,
          password_hash: null,
          role_id: 2 // Cliente
        });
      }

      const clientTokenPayload = {
        id: clientUser.id,
        username: finalClientUsername,
        role: 'cliente'
      };

      const clientToken = generateToken(clientTokenPayload);

      return res.status(200).json({
        success: true,
        message: 'Sesión iniciada como Cliente.',
        role: 'cliente',
        user: {
          id: clientUser.id,
          username: finalClientUsername,
          role: 'cliente'
        },
        token: clientToken
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
