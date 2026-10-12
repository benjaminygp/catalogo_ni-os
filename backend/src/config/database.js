const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'catalogo.sqlite');
const initSqlPath = path.resolve(__dirname, 'init.sql');

// Instancia de base de datos SQL
const db = new DatabaseSync(dbPath);

// Habilitar claves foráneas y modo WAL con sincronización física garantizada en disco
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA synchronous = FULL;');
db.exec('PRAGMA wal_autocheckpoint = 100;');

// Inicializar esquema si las tablas no existen
function initDatabase() {
  try {
    if (fs.existsSync(initSqlPath)) {
      const sql = fs.readFileSync(initSqlPath, 'utf-8');
      db.exec(sql);
      console.log('✅ [DATABASE] Tablas y esquema SQL inicializados correctamente.');
    }

    // 1. Auto-migración segura de columnas en caso de bases de datos preexistentes
    const columns = db.prepare('PRAGMA table_info(productos)').all().map(c => c.name);
    if (!columns.includes('code')) {
      db.exec('ALTER TABLE productos ADD COLUMN code VARCHAR(100);');
      console.log('✅ [DATABASE] Columna `code` agregada a productos.');
    }
    if (!columns.includes('images')) {
      db.exec('ALTER TABLE productos ADD COLUMN images TEXT;');
      console.log('✅ [DATABASE] Columna `images` agregada a productos.');
    }

    // 2. Roles
    db.exec(`
      INSERT OR IGNORE INTO roles (id, name, description) VALUES
      (1, 'admin', 'Administrador con control total del catálogo'),
      (2, 'cliente', 'Cliente visitante del catálogo');
    `);

    // 3. Usuario Administrador PATTYps
    const adminUser = process.env.ADMIN_USER || 'PATTYps';
    const adminPass = process.env.ADMIN_PASS || 'PATTYpschincha452416';
    const existingAdmin = db.prepare('SELECT id FROM usuarios WHERE username = ?').get(adminUser);
    if (!existingAdmin) {
      db.prepare('INSERT INTO usuarios (username, password_hash, role_id) VALUES (?, ?, ?)')
        .run(adminUser, adminPass, 1);
      console.log('👑 [DATABASE] Usuario Administrador PATTYps creado.');
    }

    // 4. Categorías fijas
    db.exec(`
      INSERT OR IGNORE INTO categorias (id, name, slug, icon) VALUES
      (1, 'Ropa', 'ropa', 'shirt'),
      (2, 'Calzado', 'calzado', 'footprints');
    `);

    // 5. Subcategorías exactas para Catálogo Niños
    db.exec('DELETE FROM subcategorias;');

    const subcats = [
      // ROPA - Niñas
      { id: 1, categoria_id: 1, tipo_grupo: 'Niñas', name: 'vestidos', slug: 'vestidos-ninas' },
      { id: 2, categoria_id: 1, tipo_grupo: 'Niñas', name: 'polos de marca', slug: 'polos-de-marca-ninas' },
      { id: 3, categoria_id: 1, tipo_grupo: 'Niñas', name: 'conjuntos', slug: 'conjuntos-ninas' },
      { id: 4, categoria_id: 1, tipo_grupo: 'Niñas', name: 'polos y blusas', slug: 'polos-y-blusas-ninas' },
      { id: 5, categoria_id: 1, tipo_grupo: 'Niñas', name: 'pantalones shorts faldas', slug: 'pantalones-shorts-faldas-ninas' },
      { id: 6, categoria_id: 1, tipo_grupo: 'Niñas', name: 'poleras chompas casacas', slug: 'poleras-chompas-casacas-ninas' },
      { id: 7, categoria_id: 1, tipo_grupo: 'Niñas', name: 'ropa de baño', slug: 'ropa-de-bano-ninas' },

      // ROPA - Niños
      { id: 8, categoria_id: 1, tipo_grupo: 'Niños', name: 'polos de marca', slug: 'polos-de-marca-ninos' },
      { id: 9, categoria_id: 1, tipo_grupo: 'Niños', name: 'pantalones y shorts', slug: 'pantalones-y-shorts-ninos' },
      { id: 10, categoria_id: 1, tipo_grupo: 'Niños', name: 'polos y camisas', slug: 'polos-y-camisas-ninos' },
      { id: 11, categoria_id: 1, tipo_grupo: 'Niños', name: 'conjuntos', slug: 'conjuntos-ninos' },
      { id: 12, categoria_id: 1, tipo_grupo: 'Niños', name: 'poleras chompas casacas', slug: 'poleras-chompas-casacas-ninos' },
      { id: 13, categoria_id: 1, tipo_grupo: 'Niños', name: 'ropa de baño', slug: 'ropa-de-bano-ninos' },

      // CALZADO
      { id: 14, categoria_id: 2, tipo_grupo: 'Calzado', name: 'zapatillas', slug: 'zapatillas' },
      { id: 15, categoria_id: 2, tipo_grupo: 'Calzado', name: 'zapatos', slug: 'zapatos' },
      { id: 16, categoria_id: 2, tipo_grupo: 'Calzado', name: 'sandalias', slug: 'sandalias' },
      { id: 17, categoria_id: 2, tipo_grupo: 'Calzado', name: 'botines', slug: 'botines' },
      { id: 18, categoria_id: 2, tipo_grupo: 'Calzado', name: 'balerinas', slug: 'balerinas' }
    ];

    const insertSubcat = db.prepare(`
      INSERT INTO subcategorias (id, categoria_id, tipo_grupo, name, slug)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const sc of subcats) {
      insertSubcat.run(sc.id, sc.categoria_id, sc.tipo_grupo, sc.name, sc.slug);
    }
  } catch (error) {
    console.error('❌ [DATABASE] Error al inicializar esquema SQL:', error);
  }
}

initDatabase();

// Métodos auxiliares para consultas limpias y seguras
const dbHelper = {
  // Retorna todas las filas encontradas
  all(sql, params = []) {
    try {
      const stmt = db.prepare(sql);
      const rows = stmt.all(...params);
      // Convertir prototipos u objetos limpios
      return rows.map(r => ({ ...r }));
    } catch (err) {
      console.error(`[DB ERROR all] ${sql}`, err);
      throw err;
    }
  },

  // Retorna una única fila
  get(sql, params = []) {
    try {
      const stmt = db.prepare(sql);
      const row = stmt.get(...params);
      return row ? { ...row } : null;
    } catch (err) {
      console.error(`[DB ERROR get] ${sql}`, err);
      throw err;
    }
  },

  // Ejecuta INSERT, UPDATE o DELETE
  run(sql, params = []) {
    try {
      const stmt = db.prepare(sql);
      const result = stmt.run(...params);
      return {
        changes: Number(result.changes),
        lastInsertRowid: Number(result.lastInsertRowid)
      };
    } catch (err) {
      console.error(`[DB ERROR run] ${sql}`, err);
      throw err;
    }
  },

  // Ejecuta sentencias directas
  exec(sql) {
    return db.exec(sql);
  },

  raw: db
};

module.exports = dbHelper;
