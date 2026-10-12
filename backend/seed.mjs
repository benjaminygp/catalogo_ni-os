import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'src/config/catalogo.sqlite');
const uploadsDir = path.resolve(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Inicializar DB
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON;');

// Ejecutar init.sql
const initSql = fs.readFileSync(path.resolve(__dirname, 'src/config/init.sql'), 'utf-8');
db.exec(initSql);

console.log('🔄 Ejecutando inicialización limpia de estructura...');

// 1. Roles
db.exec(`
  INSERT OR IGNORE INTO roles (id, name, description) VALUES
  (1, 'admin', 'Administrador con control total del catálogo y visualización de sesiones'),
  (2, 'cliente', 'Cliente visitante del catálogo');
`);

// 2. Usuario Administrador
// Credenciales estrictas: PATTYps / PATTYpschincha452416
const adminExisting = db.prepare('SELECT id FROM usuarios WHERE username = ?').get('PATTYps');
if (!adminExisting) {
  db.prepare(`
    INSERT INTO usuarios (username, password_hash, role_id)
    VALUES (?, ?, ?)
  `).run('PATTYps', 'PATTYpschincha452416', 1);
  console.log('👑 Usuario Administrador creado: PATTYps');
}

// 3. Categorías
db.exec(`
  INSERT OR IGNORE INTO categorias (id, name, slug, icon) VALUES
  (1, 'Ropa', 'ropa', 'shirt'),
  (2, 'Calzado', 'calzado', 'footprints');
`);

// 4. Subcategorías Exactas para Catálogo Niños
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

console.log('✅ Categorías, subcategorías y roles inicializados sin fotos de muestra.');
console.log('📷 El catálogo está limpio y listo para que el Administrador suba sus propias fotos reales.');
