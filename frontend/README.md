# CATALOGO CABALLEROS - Aplicación Full-Stack

Aplicación web profesional completa (Back-End + Front-End) de catálogo para caballeros con arquitectura modular, base de datos SQL, autenticación estricta con roles, gestión de productos con almacenamiento local (sin servicios externos) y sincronización multi-usuario en tiempo real mediante WebSockets.

---

## 📁 Estructura del Proyecto

```text
catalogo__caballeros/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # Conexión y helpers SQL (SQLite nativo)
│   │   │   ├── init.sql             # Esquema SQL (roles, usuarios, sesiones, categorías, subcategorías, productos)
│   │   │   └── catalogo.sqlite      # Archivo de base de datos SQL local
│   │   ├── controllers/
│   │   │   ├── authController.js    # Lógica de login estricto y fallback de seguridad
│   │   │   ├── sessionController.js # Monitoreo de sesiones en tiempo real
│   │   │   ├── categoryController.js# Categorías y subcategorías exactas
│   │   │   └── productController.js # CRUD completo de productos con eventos Socket.io
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js    # JWT y protección exclusiva de rutas de administrador
│   │   │   └── uploadMiddleware.js  # Multer para almacenamiento local de imágenes en /uploads
│   │   ├── models/
│   │   │   ├── userModel.js         # Consultas SQL para usuarios y roles
│   │   │   ├── sessionModel.js      # Registro SQL de sesiones activas en tiempo real
│   │   │   ├── categoryModel.js     # Consultas SQL de categorías y subcategorías
│   │   │   └── productModel.js      # Consultas SQL para productos con filtros
│   │   └── routes/
│   │       ├── authRoutes.js        # Rutas /api/auth
│   │       ├── sessionRoutes.js     # Rutas /api/sessions (Panel en tiempo real)
│   │       ├── categoryRoutes.js    # Rutas /api/categories
│   │       └── productRoutes.js     # Rutas /api/products
│   ├── uploads/                     # Carpeta local para almacenar fotos (PROHIBIDO CLOUDINARY)
│   ├── .env                         # Variables de entorno
│   ├── index.js                     # Servidor Express + CORS + WebSockets (Socket.IO)
│   ├── package.json                 # Dependencias del backend
│   └── seed.mjs                     # Script de inicialización con datos y fotos de muestra
├── frontend/
│   ├── css/
│   │   └── styles.css               # Diseño minimalista en tonos suaves (Celeste, Fucsia, Azul, Rojo, Rosa)
│   ├── js/
│   │   ├── app.js                   # Lógica principal, filtros dinámicos, lightbox y estado
│   │   ├── socket.js                # Conexión WebSockets y presencia en tiempo real
│   │   └── admin.js                 # Formulario de productos, subida de fotos y panel en vivo
│   ├── assets/                      # Iconos y recursos estáticos
│   └── index.html                   # Interfaz interactiva ("CATALOGO CABALLEROS")
├── package.json                     # Scripts rápidos desde la raíz
└── README.md
```

---

## ⚡ Requerimientos e Instalación

### Requisitos Previos:
- **Node.js**: v18+ (probado y optimizado en Node v24).
- **NPM**: Gestor de paquetes estándar.

### Pasos de Instalación:
1. Clonar o ubicarse en la carpeta raíz del proyecto:
   ```bash
   cd d:\catalogo__caballeros
   ```

2. Instalar dependencias del backend:
   ```bash
   cd backend
   npm install
   ```

3. Poblar la base de datos SQL con las categorías, subcategorías, administrador y productos de muestra:
   ```bash
   npm run seed
   ```

4. Iniciar el servidor:
   ```bash
   npm start
   ```

5. Abrir en el navegador web:
   ```text
   http://localhost:3002
   ```

---

## 👑 Credenciales y Roles

- **Rol Administrador**:
  - **Usuario exacto**: `PATTYps`
  - **Contraseña exacta**: `PATTYpschincha452416`
  - **Privilegios**:
    - Subir nuevos productos con fotos guardadas en el disco local (`backend/uploads/`).
    - Editar y eliminar cualquier producto con sincronización en tiempo real.
    - Acceso al **Panel de Usuarios en Tiempo Real** para ver en vivo los nombres de los usuarios conectados.

- **Rol Cliente**:
  - Puede ingresar con cualquier nombre de usuario (contraseña opcional).
  - **Regla estricta de seguridad**: Si alguien introduce credenciales diferentes a las del administrador, el sistema lo cataloga de forma segura automáticamente como **Rol Cliente**.

---

## 📂 Categorías y Subcategorías Configuradas

- **Ropa**:
  - **Marcas**:
    * camisas de marca
    * polos de marca
    * pantalones y shorts de marca
    * casacas y chompas de marca
    * conjuntos de marca
  - **Normal**:
    * polo y camisas
    * pantalones y shorts
    * conjuntos
- **Calzado**:
  - Zapatillas
  - Zapatos
  - Sandalias

---

## 🎨 Paleta de Colores
Diseño moderno y minimalista basado en variaciones suaves de tonos claros:
- **Celeste**: `#f0f9ff`, `#e0f2fe`, `#0284c7`
- **Fucsia**: `#fdf2f8`, `#fce7f3`, `#db2777`
- **Azul**: `#eff6ff`, `#dbeafe`, `#2563eb`
- **Rojo**: `#fef2f2`, `#fee2e2`, `#ef4444`
- **Rosa**: `#fff1f2`, `#ffe4e6`, `#f43f5e`
