const db = require('../config/database');

const UserModel = {
  findByUsername(username) {
    return db.get('SELECT u.*, r.name as role_name FROM usuarios u JOIN roles r ON u.role_id = r.id WHERE u.username = ?', [username]);
  },

  findById(id) {
    return db.get('SELECT u.*, r.name as role_name FROM usuarios u JOIN roles r ON u.role_id = r.id WHERE u.id = ?', [id]);
  },

  getRoleByName(roleName) {
    return db.get('SELECT * FROM roles WHERE name = ?', [roleName]);
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
