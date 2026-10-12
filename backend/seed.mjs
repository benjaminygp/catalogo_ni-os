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

// 4. Subcategorías Exactas
const subcats = [
  // Ropa - Marcas
  { id: 1, categoria_id: 1, tipo_grupo: 'Marcas', name: 'camisas de marca', slug: 'camisas-de-marca' },
  { id: 2, categoria_id: 1, tipo_grupo: 'Marcas', name: 'polos de marca', slug: 'polos-de-marca' },
  { id: 3, categoria_id: 1, tipo_grupo: 'Marcas', name: 'pantalones y shorts de marca', slug: 'pantalones-y-shorts-de-marca' },
  { id: 4, categoria_id: 1, tipo_grupo: 'Marcas', name: 'casacas y chompas de marca', slug: 'casacas-y-chompas-de-marca' },
  { id: 5, categoria_id: 1, tipo_grupo: 'Marcas', name: 'conjuntos de marca', slug: 'conjuntos-de-marca' },
  // Ropa - Normal
  { id: 6, categoria_id: 1, tipo_grupo: 'Normal', name: 'polo y camisas', slug: 'polo-y-camisas' },
  { id: 7, categoria_id: 1, tipo_grupo: 'Normal', name: 'pantalones y shorts', slug: 'pantalones-y-shorts' },
  { id: 8, categoria_id: 1, tipo_grupo: 'Normal', name: 'conjuntos', slug: 'conjuntos' },
  // Calzado
  { id: 9, categoria_id: 2, tipo_grupo: 'Calzado', name: 'Zapatillas', slug: 'zapatillas' },
  { id: 10, categoria_id: 2, tipo_grupo: 'Calzado', name: 'Zapatos', slug: 'zapatos' },
  { id: 11, categoria_id: 2, tipo_grupo: 'Calzado', name: 'Sandalias', slug: 'sandalias' }
];

const insertSubcat = db.prepare(`
  INSERT OR REPLACE INTO subcategorias (id, categoria_id, tipo_grupo, name, slug)
  VALUES (?, ?, ?, ?, ?)
`);
for (const sc of subcats) {
  insertSubcat.run(sc.id, sc.categoria_id, sc.tipo_grupo, sc.name, sc.slug);
}

console.log('✅ Categorías, subcategorías y roles inicializados sin fotos de muestra.');
console.log('📷 El catálogo está limpio y listo para que el Administrador suba sus propias fotos reales.');
