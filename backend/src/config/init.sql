-- ===================================================
-- CATALOGO CABALLEROS - SCHEMA SQL DE BASE DE DATOS
-- ===================================================

-- 1. TABLA DE ROLES
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA DE USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255),
    role_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles (id)
);

-- 3. TABLA DE SESIONES ACTIVAS (TIEMPO REAL)
CREATE TABLE IF NOT EXISTS sesiones_activas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    socket_id VARCHAR(100) UNIQUE,
    user_id INTEGER,
    username VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'cliente',
    ip_address VARCHAR(100),
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'online',
    connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES usuarios (id) ON DELETE SET NULL
);

-- 4. TABLA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50)
);

-- 5. TABLA DE SUBCATEGORIAS
CREATE TABLE IF NOT EXISTS subcategorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria_id INTEGER NOT NULL,
    tipo_grupo VARCHAR(50) NOT NULL, -- 'Marcas', 'Normal' o 'Calzado'
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias (id) ON DELETE CASCADE
);

-- 6. TABLA DE PRODUCTOS
CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(100), -- Código de producto / SKU / Referencia
    title VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    image_url TEXT NOT NULL,
    images TEXT, -- Lista JSON de fotos (hasta 50 por producto)
    categoria_id INTEGER NOT NULL,
    subcategoria_id INTEGER NOT NULL,
    sizes VARCHAR(100) DEFAULT 'S, M, L, XL',
    stock INTEGER DEFAULT 10,
    badge VARCHAR(50), -- e.g. 'Nuevo', 'Exclusivo', 'Oferta'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias (id),
    FOREIGN KEY (subcategoria_id) REFERENCES subcategorias (id)
);

-- Índices para optimizar búsquedas y filtros
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos (categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_subcategoria ON productos (subcategoria_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_socket ON sesiones_activas (socket_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_status ON sesiones_activas (status);
