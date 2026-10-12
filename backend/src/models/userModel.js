const db = require('../config/database');

const UserModel = {
  // Búsqueda insensible a mayúsculas/minúsculas para evitar fallos por tipeo
  findByUsername(username) {
    if (!username) return null;
    return db.get(
      'SELECT u.*, r.name as role_name FROM usuarios u JOIN roles r ON u.role_id = r.id WHERE LOWER(u.username) = LOWER(?)',
      [username.trim()]
    );
  },

  findById(id) {
    return db.get(
      'SELECT u.*, r.name as role_name FROM usuarios u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [id]
    );
  },

  getRoleByName(roleName) {
    return db.get('SELECT * FROM roles WHERE LOWER(name) = LOWER(?)', [roleName.trim()]);
  },

  findAdminUser() {
    return db.get(
      "SELECT u.*, r.name as role_name FROM usuarios u JOIN roles r ON u.role_id = r.id WHERE r.name = 'admin' ORDER BY u.id ASC LIMIT 1"
    );
  },

  updateUserRole(id, roleId) {
    db.run('UPDATE usuarios SET role_id = ? WHERE id = ?', [roleId, id]);
    return this.findById(id);
  },

  create({ username, password_hash, role_id }) {
    const res = db.run(
      'INSERT INTO usuarios (username, password_hash, role_id) VALUES (?, ?, ?)',
      [username, password_hash || null, role_id]
    );
    return this.findById(res.lastInsertRowid);
  }
};

module.exports = UserModel;

