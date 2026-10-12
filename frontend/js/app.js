// ==========================================================================
// CATALOGO CABALLEROS - APLICACIÓN PRINCIPAL (FRONT-END)
// ==========================================================================

const AppState = {
  currentUser: null,
  categories: [],
  products: [],
  filteredProducts: [],
  activeCategory: 'all', // 'all', 'ropa', 'calzado'
  activeSubcategorySlug: null,
  searchQuery: ''
};

window.AppState = AppState;

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  restoreUserSession();
  initEventListeners();
  AdminModule.init();
  initSocketConnection();

  await loadCategories();
  await loadProducts();
}

// ==========================================================================
// RESTAURACIÓN Y GESTIÓN DE SESIÓN
// ==========================================================================
function restoreUserSession() {
  try {
    const saved = localStorage.getItem('catalogo_caballeros_session');
    if (saved) {
      AppState.currentUser = JSON.parse(saved);
      console.log('👤 Sesión restaurada:', AppState.currentUser);
    }
  } catch (e) {
    console.error('Error al restaurar sesión:', e);
    AppState.currentUser = null;
  }
  updateUserUI();
}

function updateUserUI() {
  const user = AppState.currentUser;
  const nameLabel = document.getElementById('userNameLabel');
  const roleBadge = document.getElementById('userRoleBadge');
  const loginBtnText = document.getElementById('loginBtnText');

  if (user) {
    nameLabel.textContent = user.username;
    if (user.role === 'admin') {
      roleBadge.textContent = 'Admin';
      roleBadge.className = 'user-role-badge badge-admin';
    } else {
      roleBadge.textContent = 'Cliente';
      roleBadge.className = 'user-role-badge badge-cliente';
    }
    loginBtnText.textContent = 'Cerrar Sesión';
    AdminModule.updateAdminUIState(user.role === 'admin');
  } else {
    nameLabel.textContent = 'Invitado';
    roleBadge.textContent = 'Cliente';
    roleBadge.className = 'user-role-badge badge-cliente';
    loginBtnText.textContent = 'Iniciar Sesión';
    AdminModule.updateAdminUIState(false);
  }
}

// ==========================================================================
// EVENT LISTENERS DE NAVEGACIÓN Y FILTROS
// ==========================================================================
function initEventListeners() {
  // 1. Selector de Categorías Principales (Todos, Ropa, Calzado)
  const categoryTabs = document.querySelectorAll('.cat-tab');
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      categoryTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.getAttribute('data-category');
      switchCategoryTab(cat);
    });
  });

  // 2. Selector de Subcategorías (Pills)
  const subcatPills = document.querySelectorAll('.subcat-pill');
  subcatPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const slug = pill.getAttribute('data-subcat-slug');
      if (AppState.activeSubcategorySlug === slug) {
        // Deseleccionar si ya estaba activo
        AppState.activeSubcategorySlug = null;
        pill.classList.remove('active');
      } else {
        subcatPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        AppState.activeSubcategorySlug = slug;
      }
      applyFilters();
    });
  });

  // 3. Botón de restablecer filtros
  const btnClearAllFilters = document.getElementById('btnClearAllFilters');
  if (btnClearAllFilters) {
    btnClearAllFilters.addEventListener('click', () => resetAllFilters());
  }

  // 4. Buscador en tiempo real
  const searchInput = document.getElementById('searchInput');
  const btnClearSearch = document.getElementById('btnClearSearch');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      AppState.searchQuery = e.target.value.trim().toLowerCase();
      if (btnClearSearch) {
        if (AppState.searchQuery) btnClearSearch.classList.remove('hidden');
        else btnClearSearch.classList.add('hidden');
      }
      applyFilters();
    });
  }

  if (btnClearSearch) {
    btnClearSearch.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      AppState.searchQuery = '';
      btnClearSearch.classList.add('hidden');
      applyFilters();
    });
  }

  // 5. Modales de Login
  const btnLoginToggle = document.getElementById('btnLoginToggle');
  const loginModalOverlay = document.getElementById('loginModalOverlay');
  const btnCloseLoginModal = document.getElementById('btnCloseLoginModal');
  const btnCancelLogin = document.getElementById('btnCancelLogin');
  const loginForm = document.getElementById('loginForm');

  if (btnLoginToggle) {
    btnLoginToggle.addEventListener('click', () => {
      if (AppState.currentUser) {
        // Cerrar sesión
        handleLogout();
      } else {
        openLoginModal();
      }
    });
  }

  if (btnCloseLoginModal) btnCloseLoginModal.addEventListener('click', () => closeLoginModal());
  if (btnCancelLogin) btnCancelLogin.addEventListener('click', () => closeLoginModal());

  // Selector de pestaña de Login (Cliente vs Admin)
  const tabLoginCliente = document.getElementById('tabLoginCliente');
  const tabLoginAdmin = document.getElementById('tabLoginAdmin');
  const usernameInput = document.getElementById('loginUsernameInput');
  const passwordInput = document.getElementById('loginPasswordInput');

  if (tabLoginCliente && tabLoginAdmin) {
    tabLoginCliente.addEventListener('click', () => {
      tabLoginCliente.classList.add('active');
      tabLoginAdmin.classList.remove('active');
      usernameInput.placeholder = 'Tu nombre de usuario';
      if (usernameInput.value === 'PATTYps') {
        usernameInput.value = '';
      }
    });

    tabLoginAdmin.addEventListener('click', () => {
      tabLoginAdmin.classList.add('active');
      tabLoginCliente.classList.remove('active');
      usernameInput.placeholder = 'Usuario de Administrador';
      // Autocompletar el campo con PATTYps para que nunca quede vacío ni confunda
      usernameInput.value = 'PATTYps';
      if (passwordInput) passwordInput.focus();
    });
  }

  // Botón para autorrellenar credenciales del Admin
  const btnFillAdmin = document.getElementById('btnFillAdminCredentials');
  if (btnFillAdmin) {
    btnFillAdmin.addEventListener('click', () => {
      usernameInput.value = 'PATTYps';
      passwordInput.value = 'PATTYpschincha452416';
      tabLoginAdmin.classList.add('active');
      tabLoginCliente.classList.remove('active');
      usernameInput.placeholder = 'Usuario de Administrador';
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => handleLoginSubmit(e));
  }

  // Modal de Detalle y carrusel
  const detailModalOverlay = document.getElementById('detailModalOverlay');
  const btnCloseDetailModal = document.getElementById('btnCloseDetailModal');
  const btnCloseDetailModalBottom = document.getElementById('btnCloseDetailModalBottom');

  const closeDetailModal = () => {
    if (detailModalOverlay) detailModalOverlay.classList.add('hidden');
  };

  if (btnCloseDetailModal) btnCloseDetailModal.addEventListener('click', closeDetailModal);
  if (btnCloseDetailModalBottom) btnCloseDetailModalBottom.addEventListener('click', closeDetailModal);

  // Cerrar al hacer clic en el fondo oscuro exterior
  if (detailModalOverlay) {
    detailModalOverlay.addEventListener('click', (e) => {
      if (e.target === detailModalOverlay) closeDetailModal();
    });
  }

  // Cerrar modal de login al hacer clic en el fondo oscuro exterior
  if (loginModalOverlay) {
    loginModalOverlay.addEventListener('click', (e) => {
      if (e.target === loginModalOverlay) closeLoginModal();
    });
  }

  // Cerrar cualquier modal al presionar la tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDetailModal();
      closeLoginModal();
      if (window.AdminModule && typeof window.AdminModule.closeProductModal === 'function') {
        window.AdminModule.closeProductModal();
      }
    }
  });

  const btnPrev = document.getElementById('btnDetailPrevPhoto');
  const btnNext = document.getElementById('btnDetailNextPhoto');
  if (btnPrev) btnPrev.addEventListener('click', () => switchDetailPhoto(-1));
  if (btnNext) btnNext.addEventListener('click', () => switchDetailPhoto(1));
}

// ==========================================================================
// CAMBIO DE CATEGORÍAS PRINCIPALES (Ropa / Calzado / Todos)
// ==========================================================================
function switchCategoryTab(category) {
  AppState.activeCategory = category;
  AppState.activeSubcategorySlug = null;

  // Limpiar selección de subcategorías
  document.querySelectorAll('.subcat-pill').forEach(p => p.classList.remove('active'));

  const groupRopa = document.getElementById('subcatGroupRopa');
  const groupCalzado = document.getElementById('subcatGroupCalzado');

  if (category === 'ropa') {
    if (groupRopa) groupRopa.classList.remove('hidden');
    if (groupCalzado) groupCalzado.classList.add('hidden');
  } else if (category === 'calzado') {
    if (groupRopa) groupRopa.classList.add('hidden');
    if (groupCalzado) groupCalzado.classList.remove('hidden');
  } else {
    // Todos
    if (groupRopa) groupRopa.classList.remove('hidden');
    if (groupCalzado) groupCalzado.classList.remove('hidden');
  }

  applyFilters();
}

function resetAllFilters() {
  AppState.activeCategory = 'all';
  AppState.activeSubcategorySlug = null;
  AppState.searchQuery = '';

  const searchInput = document.getElementById('searchInput');
  const btnClearSearch = document.getElementById('btnClearSearch');
  if (searchInput) searchInput.value = '';
  if (btnClearSearch) btnClearSearch.classList.add('hidden');

  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  const tabAll = document.getElementById('tabCategoryAll');
  if (tabAll) tabAll.classList.add('active');

  document.querySelectorAll('.subcat-pill').forEach(p => p.classList.remove('active'));

  const groupRopa = document.getElementById('subcatGroupRopa');
  const groupCalzado = document.getElementById('subcatGroupCalzado');
  if (groupRopa) groupRopa.classList.remove('hidden');
  if (groupCalzado) groupCalzado.classList.remove('hidden');

  applyFilters();
}

// ==========================================================================
// CARGA Y FILTRADO DE PRODUCTOS
// ==========================================================================
async function loadCategories() {
  try {
    const res = await fetch('/api/categories');
    const data = await res.json();
    if (data.success) {
      AppState.categories = data.data;
    }
  } catch (err) {
    console.error('Error al cargar categorías:', err);
  }
}

async function loadProducts() {
  const grid = document.getElementById('productsGrid');
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (data.success) {
      AppState.products = data.data;
      applyFilters();
    }
  } catch (err) {
    console.error('Error al cargar productos:', err);
    if (grid) {
      grid.innerHTML = `
        <div class="empty-catalog-state">
          <h3>Error al conectar con el catálogo</h3>
          <p>Verifica que el servidor esté activo.</p>
        </div>
      `;
    }
  }
}

function applyFilters() {
  let list = [...AppState.products];

  // 1. Filtro por categoría principal
  if (AppState.activeCategory === 'ropa') {
    list = list.filter(p => p.categoria_slug === 'ropa');
  } else if (AppState.activeCategory === 'calzado') {
    list = list.filter(p => p.categoria_slug === 'calzado');
  }

  // 2. Filtro por subcategoría específica
  if (AppState.activeSubcategorySlug) {
    list = list.filter(p => p.subcategoria_slug === AppState.activeSubcategorySlug);
  }

  // 3. Filtro por búsqueda (Título, descripción, subcategoría y código)
  if (AppState.searchQuery) {
    const q = AppState.searchQuery;
    list = list.filter(p => {
      const matchTitle = p.title && p.title.toLowerCase().includes(q);
      const matchDesc = p.description && p.description.toLowerCase().includes(q);
      const matchSub = p.subcategoria_name && p.subcategoria_name.toLowerCase().includes(q);
      const matchCode = p.code && p.code.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchSub || matchCode;
    });
  }

  AppState.filteredProducts = list;
  renderProductsGrid(list);
  updateFilterBreadcrumbs();
}

function updateFilterBreadcrumbs() {
  const breadcrumb = document.getElementById('filterBreadcrumbs');
  const resultsCount = document.getElementById('productResultsCount');
  const btnClearFilters = document.getElementById('btnClearAllFilters');

  let text = 'Mostrando: <strong>';
  if (AppState.activeCategory === 'ropa') text += 'Ropa';
  else if (AppState.activeCategory === 'calzado') text += 'Calzado';
  else text += 'Todos los productos';

  if (AppState.activeSubcategorySlug) {
    text += ` &bull; ${AppState.activeSubcategorySlug.replace(/-/g, ' ')}`;
  }

  if (AppState.searchQuery) {
    text += ` (Búsqueda: "${AppState.searchQuery}")`;
  }
  text += '</strong>';

  if (breadcrumb) breadcrumb.innerHTML = `<span class="breadcrumb-item">${text}</span>`;
  if (resultsCount) resultsCount.textContent = `${AppState.filteredProducts.length} prendas encontradas`;

  const isFiltering = AppState.activeCategory !== 'all' || AppState.activeSubcategorySlug !== null || Boolean(AppState.searchQuery);
  if (btnClearFilters) {
    if (isFiltering) btnClearFilters.classList.remove('hidden');
    else btnClearFilters.classList.add('hidden');
  }
}

function renderProductsGrid(products) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  if (products.length === 0) {
    const isAdmin = AppState.currentUser && AppState.currentUser.role === 'admin';
    const isFilterActive = AppState.activeCategory !== 'all' || AppState.activeSubcategorySlug !== null || Boolean(AppState.searchQuery);

    if (isFilterActive && AppState.products.length > 0) {
      grid.innerHTML = `
        <div class="empty-catalog-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <h3 style="margin-top: 12px; font-weight: 700;">No se encontraron prendas con los filtros actuales</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">Intenta con otra subcategoría o restablece los filtros.</p>
          <button class="btn btn-soft-celeste" style="margin-top: 16px;" onclick="resetAllFilters()">Restablecer Catálogo</button>
        </div>
      `;
    } else {
      grid.innerHTML = `
        <div class="empty-catalog-state">
          <div style="width: 56px; height: 56px; margin: 0 auto 14px; background: var(--celeste-subtle); color: var(--celeste-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10a2 2 0 002 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"/></svg>
          </div>
          <h3 style="margin-top: 6px; font-weight: 800; font-size: 1.25rem;">Catálogo listo y disponible</h3>
          <p style="color: var(--text-muted); font-size: 0.92rem; max-width: 480px; margin: 8px auto 18px;">
            ${isAdmin 
              ? 'Tus fotografías y publicaciones se mantendrán guardadas permanentemente en el catálogo.' 
              : 'El catálogo está preparado para recibir la nueva colección de prendas exclusivas.'}
          </p>
          ${isAdmin 
            ? '<button class="btn btn-fucsia" onclick="AdminModule.openCreateModal()">➕ Publicar Primer Producto</button>' 
            : '<button class="btn btn-azul" onclick="openLoginModal()">Iniciar Sesión (PATTYps)</button>'}
        </div>
      `;
    }
    return;
  }

  const isAdmin = AppState.currentUser && AppState.currentUser.role === 'admin';

  grid.innerHTML = products.map(p => {
    const badgeHtml = p.badge ? `<span class="card-badge badge-${p.badge.replace(/\s+/g, '')}">${p.badge}</span>` : '';
    const originalPriceHtml = p.original_price ? `<span class="price-original">S/. ${Number(p.original_price).toFixed(2)}</span>` : '';
    const codeTagHtml = p.code ? `<span class="card-code-pill">Cód: ${escapeHtml(p.code)}</span>` : '';
    
    // Indicador de múltiples fotos
    const photosCount = (p.images && Array.isArray(p.images)) ? p.images.length : (p.image_url ? 1 : 0);
    const photosChipHtml = photosCount > 1 
      ? `<span class="card-photos-chip" title="${photosCount} fotos disponibles">📷 ${photosCount} fotos</span>` 
      : '';

    // Tallas
    const sizesArray = p.sizes ? p.sizes.split(',').map(s => s.trim()).filter(Boolean) : [];
    const sizesHtml = sizesArray.length > 0 
      ? `<div class="card-sizes">${sizesArray.map(sz => `<span class="size-pill">${sz}</span>`).join('')}</div>`
      : '';

    // Acciones de Administrador
    const adminActionsHtml = isAdmin ? `
      <div class="card-admin-actions">
        <button class="btn-card-edit" onclick="handleEditProductClick(${p.id})">✏️ Editar</button>
        <button class="btn-card-delete" onclick="handleDeleteProductClick(${p.id}, '${escapeHtml(p.title)}')">🗑️ Eliminar</button>
      </div>
    ` : '';

    return `
      <article class="product-card" id="product-card-${p.id}">
        <div class="card-media" onclick="openProductDetail(${p.id})">
          ${badgeHtml}
          ${photosChipHtml}
          <img src="${p.image_url}" alt="${escapeHtml(p.title)}" loading="lazy">
        </div>
        <div class="card-body">
          <div class="card-category-row">
            <span class="card-category-tag">${escapeHtml(p.categoria_name)} &bull; ${escapeHtml(p.subcategoria_name)}</span>
            ${codeTagHtml}
          </div>
          <h3 class="card-title">${(p.title && p.title !== 'Prenda' && p.title !== ',') ? escapeHtml(p.title) : (p.code ? `Prenda ${escapeHtml(p.code)}` : escapeHtml(p.subcategoria_name))}</h3>
          <p class="card-description">${escapeHtml(p.description || '')}</p>
          
          ${sizesHtml}

          ${(p.price && Number(p.price) > 0) ? `
            <div class="card-pricing-row">
              <div>
                <span class="price-current">S/. ${Number(p.price).toFixed(2)}</span>
                ${originalPriceHtml}
              </div>
            </div>
          ` : ''}

          <div class="card-actions">
            <button class="btn-view-detail" onclick="openProductDetail(${p.id})">Ver Detalle</button>
            ${adminActionsHtml}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================================================
// DETALLE DE PRODUCTO (MODAL / LIGHTBOX CON CARRUSEL DE FOTOS)
// ==========================================================================
let currentDetailProduct = null;
let currentDetailPhotoIndex = 0;

function switchDetailPhoto(direction) {
  if (!currentDetailProduct) return;
  const photos = (currentDetailProduct.images && currentDetailProduct.images.length > 0)
    ? currentDetailProduct.images
    : [currentDetailProduct.image_url];
  
  if (photos.length <= 1) return;

  currentDetailPhotoIndex = (currentDetailPhotoIndex + direction + photos.length) % photos.length;
  renderDetailPhoto();
}

function selectDetailPhoto(index) {
  currentDetailPhotoIndex = index;
  renderDetailPhoto();
}

function renderDetailPhoto() {
  if (!currentDetailProduct) return;
  const photos = (currentDetailProduct.images && currentDetailProduct.images.length > 0)
    ? currentDetailProduct.images
    : [currentDetailProduct.image_url];

  const imgEl = document.getElementById('detailImg');
  const counterEl = document.getElementById('detailPhotoCounter');
  const stripEl = document.getElementById('detailThumbnailsStrip');
  const prevBtn = document.getElementById('btnDetailPrevPhoto');
  const nextBtn = document.getElementById('btnDetailNextPhoto');

  imgEl.src = photos[currentDetailPhotoIndex] || currentDetailProduct.image_url;

  if (photos.length > 1) {
    if (counterEl) {
      counterEl.textContent = `${currentDetailPhotoIndex + 1} / ${photos.length}`;
      counterEl.classList.remove('hidden');
    }
    if (prevBtn) prevBtn.classList.remove('hidden');
    if (nextBtn) nextBtn.classList.remove('hidden');
    if (stripEl) {
      stripEl.classList.remove('hidden');
      stripEl.innerHTML = photos.map((url, i) => `
        <button type="button" class="thumb-strip-btn ${i === currentDetailPhotoIndex ? 'active' : ''}" onclick="selectDetailPhoto(${i})" title="Ver foto ${i + 1}">
          <img src="${url}" alt="Miniatura ${i + 1}">
        </button>
      `).join('');
    }
  } else {
    if (counterEl) counterEl.classList.add('hidden');
    if (prevBtn) prevBtn.classList.add('hidden');
    if (nextBtn) nextBtn.classList.add('hidden');
    if (stripEl) {
      stripEl.classList.add('hidden');
      stripEl.innerHTML = '';
    }
  }
}

window.selectDetailPhoto = selectDetailPhoto;
window.switchDetailPhoto = switchDetailPhoto;

function openProductDetail(productId) {
  const product = AppState.products.find(p => p.id === productId);
  if (!product) return;

  currentDetailProduct = product;
  currentDetailPhotoIndex = 0;
  renderDetailPhoto();

  // Código de prenda en detalle
  const codeTag = document.getElementById('detailCodeTag');
  const codeVal = document.getElementById('detailCodeVal');
  if (product.code) {
    codeVal.textContent = product.code;
    codeTag.classList.remove('hidden');
  } else {
    codeTag.classList.add('hidden');
  }

  document.getElementById('detailCategoryTag').textContent = `${product.categoria_name} • ${product.subcategoria_name}`;
  
  const displayTitle = (product.title && product.title !== 'Prenda' && product.title !== ',') 
    ? product.title 
    : (product.code ? `Prenda ${product.code}` : product.subcategoria_name);
  document.getElementById('detailTitle').textContent = displayTitle;

  const priceBox = document.querySelector('.detail-price-box');
  const priceEl = document.getElementById('detailPrice');
  const origPriceEl = document.getElementById('detailOriginalPrice');

  if (product.price && Number(product.price) > 0) {
    priceEl.textContent = `S/. ${Number(product.price).toFixed(2)}`;
    priceEl.classList.remove('hidden');
    if (priceBox) priceBox.classList.remove('hidden');

    if (product.original_price) {
      origPriceEl.textContent = `S/. ${Number(product.original_price).toFixed(2)}`;
      origPriceEl.classList.remove('hidden');
    } else {
      origPriceEl.classList.add('hidden');
    }
  } else {
    if (priceBox) priceBox.classList.add('hidden');
  }

  document.getElementById('detailDescription').textContent = product.description || 'Prenda de alta calidad confeccionada con los mejores materiales.';
  document.getElementById('detailSizesChips').textContent = product.sizes || 'Estándar';

  const overlay = document.getElementById('detailModalOverlay');
  overlay.classList.remove('hidden');
  const modalCard = overlay.querySelector('.modal-card');
  if (modalCard) modalCard.scrollTop = 0;
}

// ==========================================================================
// LOGIN & AUTENTICACIÓN ESTRICTA
// ==========================================================================
function openLoginModal() {
  const modal = document.getElementById('loginModalOverlay');
  if (modal) modal.classList.remove('hidden');
}

function closeLoginModal() {
  const modal = document.getElementById('loginModalOverlay');
  if (modal) modal.classList.add('hidden');
}

async function handleLoginSubmit(e) {
  e.preventDefault();

  const usernameInput = document.getElementById('loginUsernameInput');
  const passwordInput = document.getElementById('loginPasswordInput');
  const tabLoginAdmin = document.getElementById('tabLoginAdmin');
  const submitBtn = document.getElementById('submitLoginBtnText') || document.getElementById('btnSubmitLogin');

  let username = (usernameInput ? usernameInput.value : '').trim();
  const password = (passwordInput ? passwordInput.value : '').trim();

  // Si está en Modo Administrador y el usuario está vacío, asignar PATTYps automáticamente
  if (tabLoginAdmin && tabLoginAdmin.classList.contains('active') && !username) {
    username = 'PATTYps';
    if (usernameInput) usernameInput.value = 'PATTYps';
  }

  const originalText = submitBtn ? submitBtn.textContent : 'Ingresar al Catálogo';
  if (submitBtn) submitBtn.textContent = 'Verificando...';

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al iniciar sesión.');
    }

    // Guardar usuario autenticado
    AppState.currentUser = {
      id: data.user.id,
      username: data.user.username,
      role: data.role,
      token: data.token
    };

    localStorage.setItem('catalogo_caballeros_session', JSON.stringify(AppState.currentUser));
    updateUserUI();
    closeLoginModal();

    // Actualizar presencia en sockets
    window.emitUserPresence();

    // Re-renderizar productos para mostrar botones de admin si corresponde
    applyFilters();

    if (data.role === 'admin') {
      window.showToast('👑 ¡Bienvenido Administrador PATTYps! Tienes control total.');
      AdminModule.toggleAdminPanel(true);
    } else {
      window.showToast(`👋 Bienvenido al catálogo, ${data.user.username}`);
    }

  } catch (err) {
    console.error('Error de login:', err);
    alert(err.message || 'Error al iniciar sesión.');
  } finally {
    if (submitBtn) submitBtn.textContent = originalText;
  }
}

function handleLogout() {
  const confirmLogout = confirm('¿Deseas cerrar tu sesión?');
  if (!confirmLogout) return;

  AppState.currentUser = null;
  localStorage.removeItem('catalogo_caballeros_session');
  updateUserUI();
  window.emitUserPresence();
  applyFilters();
  window.showToast('ℹ️ Has cerrado sesión.');
}

// ==========================================================================
// HANDLERS REAL-TIME DESDE SOCKET.IO
// ==========================================================================
window.handleActiveUsersUpdate = function(data) {
  AdminModule.renderLiveUsers(data);
};

window.onRealTimeProductCreated = function(newProduct) {
  // Agregar al inicio del arreglo
  AppState.products.unshift(newProduct);
  applyFilters();
};

window.onRealTimeProductUpdated = function(updatedProduct) {
  const idx = AppState.products.findIndex(p => p.id === updatedProduct.id);
  if (idx !== -1) {
    AppState.products[idx] = updatedProduct;
  } else {
    AppState.products.unshift(updatedProduct);
  }
  applyFilters();
};

window.onRealTimeProductDeleted = function(deletedId) {
  AppState.products = AppState.products.filter(p => p.id !== deletedId);
  applyFilters();
};

// Handlers auxiliares para los botones incrustados en HTML
window.handleEditProductClick = function(id) {
  const product = AppState.products.find(p => p.id === id);
  if (product) {
    AdminModule.openEditModal(product);
  }
};

window.handleDeleteProductClick = function(id, title) {
  AdminModule.deleteProduct(id, title);
};

window.openProductDetail = openProductDetail;
window.resetAllFilters = resetAllFilters;
