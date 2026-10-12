require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

// Base de datos y modelos
require('./src/config/database');
const SessionModel = require('./src/models/sessionModel');

// Rutas
const authRoutes = require('./src/routes/authRoutes');
const sessionRoutes = require('./src/routes/sessionRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const productRoutes = require('./src/routes/productRoutes');

const app = express();
const server = http.createServer(app);

// Configuración de WebSockets para sincronización en tiempo real
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const PORT = process.env.PORT || 3000;
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
const FRONTEND_DIR = path.resolve(__dirname, '../frontend');

// Limpiar sesiones activas anteriores al iniciar servidor
SessionModel.resetAll();
console.log('🧹 [SESSIONS] Sesiones anteriores reseteadas.');

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Inyectar Socket.IO en req para que los controladores puedan emitir eventos
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Servir archivos estáticos locales de imágenes (PROHIBIDO CLOUDINARY)
app.use('/uploads', express.static(UPLOADS_DIR));

// Servir frontend
app.use(express.static(FRONTEND_DIR));

// Montaje de rutas API
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);

// Manejo de eventos de Socket.IO en tiempo real
io.on('connection', (socket) => {
  console.log(`🔌 [SOCKET] Cliente conectado: ${socket.id}`);

  // Registrar presencia de usuario (Cliente o Administrador)
  socket.on('register_presence', (data) => {
    const username = (data && data.username) ? data.username : `Invitado_${socket.id.substring(0, 5)}`;
    const role = (data && data.role) ? data.role : 'cliente';
    const userId = (data && data.userId) ? data.userId : null;
    const ipAddress = socket.handshake.address || '';
    const userAgent = socket.handshake.headers['user-agent'] || '';

    SessionModel.upsertSession({
      socket_id: socket.id,
      user_id: userId,
      username,
      role,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    console.log(`👤 [PRESENCIA] Usuario registrado: ${username} (${role}) en socket ${socket.id}`);

    // Emitir lista actualizada a todos los clientes (en especial al Admin)
    const activeSessions = SessionModel.getActiveSessions();
    io.emit('active_users_updated', {
      count: activeSessions.length,
      users: activeSessions
    });
  });

  // Notificar al desconectarse
  socket.on('disconnect', () => {
    console.log(`❌ [SOCKET] Cliente desconectado: ${socket.id}`);
    SessionModel.removeBySocketId(socket.id);

    const activeSessions = SessionModel.getActiveSessions();
    io.emit('active_users_updated', {
      count: activeSessions.length,
      users: activeSessions
    });
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('💥 [SERVER ERROR]', err);
  if (err.message && err.message.includes('Formato de imagen no permitido')) {
    return res.status(400).json({ success: false, error: err.message });
  }
  return res.status(500).json({
    success: false,
    error: err.message || 'Error interno del servidor.'
  });
});

// Redireccionar cualquier ruta no encontrada al index.html del frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

const ADMIN_USER_LOG = process.env.ADMIN_USER || 'PATTYps';
const ADMIN_PASS_LOG = process.env.ADMIN_PASS || 'PATTYpschincha452416';

let currentPort = Number(PORT);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`⚠️ Puerto ${currentPort} ocupado. Reintentando en puerto ${currentPort + 1}...`);
    currentPort += 1;
    setTimeout(() => {
      server.listen(currentPort, '0.0.0.0');
    }, 200);
  } else {
    console.error('💥 Error del servidor HTTP:', err);
  }
});

server.listen(currentPort, '0.0.0.0', () => {
  console.log('========================================================');
  console.log(`🚀 SERVIDOR CATALOGO NIÑOS CORRIENDO EN: http://0.0.0.0:${currentPort}`);
  console.log(`☁️ ALMACENAMIENTO PERMANENTE EN NUBE: Cloudinary (hvoicb7h)`);
  console.log(`👑 ADMIN CREDENCIALES: Usuario "${ADMIN_USER_LOG}" | Clave "${ADMIN_PASS_LOG}"`);
  console.log('========================================================');

  // Sincronizar y restaurar automáticamente base de datos desde Cloudinary
  const { CloudinaryService } = require('./src/config/cloudinary');
  const ProductModel = require('./src/models/productModel');
  CloudinaryService.restoreDatabaseBackup().then(products => {
    if (products && Array.isArray(products) && products.length > 0) {
      ProductModel.restoreAll(products);
      console.log(`✅ [CLOUDINARY] Sincronizados ${products.length} productos en la base de datos local.`);
    }
  }).catch(err => {
    console.error('Error al sincronizar respaldo de Cloudinary:', err);
  });
});


