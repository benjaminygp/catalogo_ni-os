const db = require('../config/database');

const SessionModel = {
  // Registrar o actualizar sesión activa
  upsertSession({ socket_id, user_id, username, role, ip_address, user_agent }) {
    const existing = db.get('SELECT id FROM sesiones_activas WHERE socket_id = ?', [socket_id]);
    if (existing) {
      db.run(
        `UPDATE sesiones_activas 
         SET username = ?, role = ?, status = 'online', last_active = CURRENT_TIMESTAMP
         WHERE socket_id = ?`,
        [username, role, socket_id]
      );
      return existing.id;
    } else {
      const res = db.run(
        `INSERT INTO sesiones_activas (socket_id, user_id, username, role, ip_address, user_agent, status, connected_at, last_active)
         VALUES (?, ?, ?, ?, ?, ?, 'online', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [socket_id, user_id || null, username, role, ip_address || '', user_agent || '']
      );
      return res.lastInsertRowid;
    }
  },

  // Obtener todas las sesiones actualmente activas
  getActiveSessions() {
    return db.all(`
      SELECT id, socket_id, user_id, username, role, ip_address, user_agent, status, connected_at, last_active
      FROM sesiones_activas
      WHERE status = 'online'
      ORDER BY connected_at DESC
    `);
  },

  // Marcar como desconectado o eliminar al cerrar conexión
  removeBySocketId(socket_id) {
    return db.run('DELETE FROM sesiones_activas WHERE socket_id = ?', [socket_id]);
  },

  // Limpiar todas las sesiones al reiniciar el servidor
  resetAll() {
    return db.run('DELETE FROM sesiones_activas');
  }
};

module.exports = SessionModel;
