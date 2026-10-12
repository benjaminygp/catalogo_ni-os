const SessionModel = require('../models/sessionModel');

const SessionController = {
  // Obtener todas las sesiones en tiempo real (exclusivo para el Admin)
  getActiveSessions(req, res) {
    try {
      const sessions = SessionModel.getActiveSessions();
      return res.status(200).json({
        success: true,
        count: sessions.length,
        sessions
      });
    } catch (error) {
      console.error('[SESSION ERROR getActiveSessions]', error);
      return res.status(500).json({
        success: false,
        error: 'Error al consultar sesiones activas.'
      });
    }
  },

  // Eliminar una sesión por socket_id si el admin lo requiere
  removeSession(req, res) {
    try {
      const { socketId } = req.params;
      SessionModel.removeBySocketId(socketId);

      // Notificar vía WebSockets si está disponible
      if (req.io) {
        const updated = SessionModel.getActiveSessions();
        req.io.emit('active_users_updated', {
          count: updated.length,
          users: updated
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Sesión removida con éxito.'
      });
    } catch (error) {
      console.error('[SESSION ERROR removeSession]', error);
      return res.status(500).json({
        success: false,
        error: 'Error al remover sesión.'
      });
    }
  }
};

module.exports = SessionController;
