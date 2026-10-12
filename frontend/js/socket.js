// ==========================================================================
// CATALOGO CABALLEROS - MÓDULO SOCKET.IO Y TIEMPO REAL
// ==========================================================================

let socket = null;

function initSocketConnection() {
  try {
    if (typeof io === 'undefined') {
      console.warn('⚠️ Socket.IO cliente no cargado aún. Reintentando...');
      setTimeout(initSocketConnection, 500);
      return;
    }

    socket = io();

    // Evento de Conexión
    socket.on('connect', () => {
      console.log('⚡ Conectado al servidor en tiempo real. Socket ID:', socket.id);
      updateConnectionStatus(true);
      emitUserPresence();
    });

    // Evento de Desconexión
    socket.on('disconnect', () => {
      console.log('🔌 Desconectado del servidor en tiempo real.');
      updateConnectionStatus(false);
    });

    // Actualización de lista de usuarios conectados en tiempo real
    socket.on('active_users_updated', (data) => {
      if (window.handleActiveUsersUpdate) {
        window.handleActiveUsersUpdate(data);
      }
    });

    // SINCRONIZACIÓN EN TIEMPO REAL DE PRODUCTOS:
    // 1. Producto Creado por el Admin
    socket.on('product_created', (newProduct) => {
      console.log('📡 [REAL-TIME] Nuevo producto recibido:', newProduct);
      showToast(`✨ Nuevo producto añadido: "${newProduct.title}"`, 'toast-fucsia');
      if (window.onRealTimeProductCreated) {
        window.onRealTimeProductCreated(newProduct);
      }
    });

    // 2. Producto Editado por el Admin
    socket.on('product_updated', (updatedProduct) => {
      console.log('📡 [REAL-TIME] Producto actualizado:', updatedProduct);
      showToast(`🔄 Producto actualizado: "${updatedProduct.title}"`, 'toast-azul');
      if (window.onRealTimeProductUpdated) {
        window.onRealTimeProductUpdated(updatedProduct);
      }
    });

    // 3. Producto Eliminado por el Admin
    socket.on('product_deleted', (payload) => {
      console.log('📡 [REAL-TIME] Producto eliminado ID:', payload.id);
      showToast('🗑️ Un producto ha sido removido del catálogo.', 'toast-celeste');
      if (window.onRealTimeProductDeleted) {
        window.onRealTimeProductDeleted(payload.id);
      }
    });

  } catch (error) {
    console.error('Error al inicializar Socket.IO:', error);
  }
}

// Actualizar indicador visual de conexión
function updateConnectionStatus(isConnected) {
  const statusBadge = document.getElementById('liveStatusBadge');
  const statusText = document.getElementById('statusConnectionText');
  if (!statusBadge || !statusText) return;

  if (isConnected) {
    statusBadge.classList.remove('offline');
    statusText.textContent = 'En Línea';
  } else {
    statusBadge.classList.add('offline');
    statusText.textContent = 'Reconectando...';
  }
}

// Registrar presencia del usuario autenticado o invitado
function emitUserPresence() {
  if (!socket || !socket.connected) return;

  const currentUser = window.AppState ? window.AppState.currentUser : null;
  const username = currentUser ? currentUser.username : `Cliente_${Math.floor(100 + Math.random() * 900)}`;
  const role = currentUser ? currentUser.role : 'cliente';
  const userId = currentUser ? currentUser.id : null;

  socket.emit('register_presence', {
    username,
    role,
    userId
  });
}

// Toast flotante de notificaciones en tiempo real
function showToast(message, typeClass = 'toast-celeste') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-message ${typeClass}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 4000);
}

// Exponer funciones globales
window.initSocketConnection = initSocketConnection;
window.emitUserPresence = emitUserPresence;
window.showToast = showToast;
