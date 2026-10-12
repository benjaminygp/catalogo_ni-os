// ==========================================================================
// CATALOGO CABALLEROS - MÓDULO DE GESTIÓN Y PANEL DEL ADMINISTRADOR
// ==========================================================================

const AdminModule = {
  // Lista en memoria de subcategorías obtenidas del servidor
  allSubcategories: [],

  // Gestión de múltiples fotos (hasta 50 fotos por publicación)
  selectedFiles: [],       // Archivos nuevos seleccionados (objetos File)
  existingPhotos: [],      // URLs de fotos ya guardadas en el producto (al editar)

  init() {
    this.bindEvents();
    this.fetchSubcategories();
  },

  bindEvents() {
    // Abrir modal de nuevo producto (Desktop y Celular)
    const btnOpenCreate = document.getElementById('btnOpenCreateProductModal');
    if (btnOpenCreate) {
      btnOpenCreate.addEventListener('click', () => this.openCreateModal());
    }

    const btnOpenCreateMobile = document.getElementById('btnOpenCreateProductModalMobile');
    if (btnOpenCreateMobile) {
      btnOpenCreateMobile.addEventListener('click', () => this.openCreateModal());
    }

    // Cerrar modal de producto
    const productModal = document.getElementById('productModalOverlay');
    const btnCloseModal = document.getElementById('btnCloseProductModal');
    const btnCancelModal = document.getElementById('btnCancelProductModal');
    if (btnCloseModal) btnCloseModal.addEventListener('click', () => this.closeProductModal());
    if (btnCancelModal) btnCancelModal.addEventListener('click', () => this.closeProductModal());
    if (productModal) {
      productModal.addEventListener('click', (e) => {
        if (e.target === productModal) this.closeProductModal();
      });
    }

    // Toggle Panel en tiempo real de usuarios (Desktop y Celular)
    const btnToggleAdminPanel = document.getElementById('btnToggleAdminPanel');
    const btnToggleAdminPanelMobile = document.getElementById('btnToggleAdminPanelMobile');
    const btnCloseAdminPanel = document.getElementById('btnCloseAdminPanel');

    if (btnToggleAdminPanel) {
      btnToggleAdminPanel.addEventListener('click', () => this.toggleAdminPanel());
    }
    if (btnToggleAdminPanelMobile) {
      btnToggleAdminPanelMobile.addEventListener('click', () => this.toggleAdminPanel());
    }
    if (btnCloseAdminPanel) {
      btnCloseAdminPanel.addEventListener('click', () => this.toggleAdminPanel(false));
    }

    // Cambio dinámico de categoría en el formulario de producto
    const prodCategorySelect = document.getElementById('prodCategorySelect');
    if (prodCategorySelect) {
      prodCategorySelect.addEventListener('change', (e) => {
        this.populateSubcategoriesSelect(Number(e.target.value));
      });
    }

    // Manejo de subida local de hasta 50 fotos (PROHIBIDO CLOUDINARY)
    this.setupLocalFileUpload();

    // Envío del formulario de producto
    const productForm = document.getElementById('productForm');
    if (productForm) {
      productForm.addEventListener('submit', (e) => this.handleProductFormSubmit(e));
    }
  },

  // Cargar subcategorías desde la API
  async fetchSubcategories() {
    try {
      const res = await fetch('/api/categories/subcategories');
      const data = await res.json();
      if (data.success) {
        this.allSubcategories = data.data;
        this.populateSubcategoriesSelect(1); // Por defecto Ropa
      }
    } catch (err) {
      console.error('Error al cargar subcategorías:', err);
    }
  },

  // Poblar select de subcategorías agrupadas estrictamente
  populateSubcategoriesSelect(categoryId, selectedSubcatId = null) {
    const select = document.getElementById('prodSubcategorySelect');
    if (!select) return;

    select.innerHTML = '';
    const filtered = this.allSubcategories.filter(sc => sc.categoria_id === categoryId);

    if (categoryId === 1) {
      // ROPA: Dividida en 'Marcas' y 'Normal'
      const marcasGroup = document.createElement('optgroup');
      marcasGroup.label = 'Marcas';
      const normalGroup = document.createElement('optgroup');
      normalGroup.label = 'Normal';

      filtered.forEach(sc => {
        const opt = document.createElement('option');
        opt.value = sc.id;
        opt.textContent = sc.name;
        if (selectedSubcatId && Number(selectedSubcatId) === sc.id) {
          opt.selected = true;
        }

        if (sc.tipo_grupo === 'Marcas') {
          marcasGroup.appendChild(opt);
        } else {
          normalGroup.appendChild(opt);
        }
      });

      select.appendChild(marcasGroup);
      select.appendChild(normalGroup);
    } else {
      // CALZADO: Zapatillas, Zapatos, Sandalias
      const calzadoGroup = document.createElement('optgroup');
      calzadoGroup.label = 'Calzado';

      filtered.forEach(sc => {
        const opt = document.createElement('option');
        opt.value = sc.id;
        opt.textContent = sc.name;
        if (selectedSubcatId && Number(selectedSubcatId) === sc.id) {
          opt.selected = true;
        }
        calzadoGroup.appendChild(opt);
      });

      select.appendChild(calzadoGroup);
    }
  },

  // ==========================================================================
  // GESTIÓN DE SUBIDA LOCAL DE FOTOS (HASTA 50 FOTOS POR PUBLICACIÓN)
  // ==========================================================================
  setupLocalFileUpload() {
    const fileZone = document.getElementById('fileUploadZone');
    const fileInput = document.getElementById('prodFileInput');
    const btnAddMore = document.getElementById('btnAddMorePhotos');
    const btnClearAll = document.getElementById('btnClearAllPhotos');

    if (!fileZone || !fileInput) return;

    fileZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileZone.style.borderColor = 'var(--fucsia-primary)';
      fileZone.style.background = 'var(--fucsia-light)';
    });

    fileZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      fileZone.style.borderColor = 'var(--celeste-border)';
      fileZone.style.background = 'var(--celeste-light)';
    });

    fileZone.addEventListener('drop', (e) => {
      e.preventDefault();
      fileZone.style.borderColor = 'var(--celeste-border)';
      fileZone.style.background = 'var(--celeste-light)';
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        this.addFiles(Array.from(e.dataTransfer.files));
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        this.addFiles(Array.from(fileInput.files));
        fileInput.value = ''; // Limpiar para permitir volver a seleccionar los mismos si se desea
      }
    });

    if (btnAddMore) {
      btnAddMore.addEventListener('click', () => {
        fileInput.click();
      });
    }

    if (btnClearAll) {
      btnClearAll.addEventListener('click', () => {
        this.clearAllPhotos();
      });
    }
  },

  addFiles(newFiles) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'image/jfif', 'image/bmp', 'image/heic', 'image/heif'];
    const filtered = newFiles.filter(f => (f.type && f.type.startsWith('image/')) || validTypes.includes(f.type) || f.name.match(/\.(jpe?g|png|webp|svg|gif|jfif|bmp|heic|heif)$/i));

    if (filtered.length < newFiles.length) {
      window.showToast('⚠️ Se omitieron algunos archivos que no son imágenes.', 'azul');
    }

    const currentTotal = this.selectedFiles.length + this.existingPhotos.length;
    const remainingSlots = 50 - currentTotal;

    if (remainingSlots <= 0) {
      window.showToast('⚠️ Ya alcanzaste el límite máximo de 50 fotos para esta prenda.', 'fucsia');
      return;
    }

    let filesToAdd = filtered;
    if (filesToAdd.length > remainingSlots) {
      filesToAdd = filesToAdd.slice(0, remainingSlots);
      window.showToast(`ℹ️ Límite alcanzado: Se agregaron ${remainingSlots} fotos (máximo 50 por publicación).`, 'fucsia');
    }

    this.selectedFiles.push(...filesToAdd);
    this.renderPhotosPreviewGrid();
  },

  removeSelectedFile(index) {
    this.selectedFiles.splice(index, 1);
    this.renderPhotosPreviewGrid();
  },

  removeExistingPhoto(index) {
    this.existingPhotos.splice(index, 1);
    this.renderPhotosPreviewGrid();
  },

  clearAllPhotos() {
    this.selectedFiles = [];
    this.existingPhotos = [];
    this.renderPhotosPreviewGrid();
  },

  renderPhotosPreviewGrid() {
    const placeholder = document.getElementById('uploadPlaceholder');
    const toolbar = document.getElementById('uploadGalleryToolbar');
    const grid = document.getElementById('photosPreviewGrid');
    const countChip = document.getElementById('photosCountChip');
    const galleryCountNum = document.getElementById('galleryCountNum');

    const totalCount = this.existingPhotos.length + this.selectedFiles.length;

    if (countChip) countChip.textContent = `📷 ${totalCount} / 50 fotos`;
    if (galleryCountNum) galleryCountNum.textContent = totalCount;

    if (totalCount === 0) {
      if (placeholder) placeholder.classList.remove('hidden');
      if (toolbar) toolbar.classList.add('hidden');
      if (grid) {
        grid.classList.add('hidden');
        grid.innerHTML = '';
      }
      return;
    }

    if (placeholder) placeholder.classList.remove('hidden'); // Dejar visible para que puedan seguir arrastrando
    if (toolbar) toolbar.classList.remove('hidden');
    if (grid) grid.classList.remove('hidden');

    let html = '';
    let itemIndex = 0;

    // 1. Fotos existentes (del producto en edición)
    this.existingPhotos.forEach((url, i) => {
      const isCover = itemIndex === 0;
      html += `
        <div class="photo-preview-item" data-type="existing" data-index="${i}">
          <img src="${url}" alt="Foto ${itemIndex + 1}">
          <span class="photo-number-tag">#${itemIndex + 1}</span>
          ${isCover ? '<span class="photo-cover-tag">Portada</span>' : ''}
          <button type="button" class="btn-remove-thumb" onclick="AdminModule.removeExistingPhoto(${i})" title="Quitar foto">✕</button>
        </div>
      `;
      itemIndex++;
    });

    // 2. Fotos nuevas seleccionadas para subir
    this.selectedFiles.forEach((file, i) => {
      const isCover = itemIndex === 0;
      const objectUrl = URL.createObjectURL(file);
      html += `
        <div class="photo-preview-item" data-type="new" data-index="${i}">
          <img src="${objectUrl}" alt="${file.name}">
          <span class="photo-number-tag">#${itemIndex + 1}</span>
          ${isCover ? '<span class="photo-cover-tag">Portada</span>' : ''}
          <button type="button" class="btn-remove-thumb" onclick="AdminModule.removeSelectedFile(${i})" title="Quitar foto">✕</button>
        </div>
      `;
      itemIndex++;
    });

    if (grid) {
      grid.innerHTML = html;
    }
  },

  openCreateModal() {
    const modal = document.getElementById('productModalOverlay');
    const form = document.getElementById('productForm');
    const title = document.getElementById('productModalTitle');
    const submitBtn = document.getElementById('saveProductBtnText');
    const editId = document.getElementById('editProductId');
    const codeInput = document.getElementById('prodCodeInput');

    form.reset();
    editId.value = '';
    const titleInput = document.getElementById('prodTitleInput');
    if (titleInput) titleInput.value = '';
    if (codeInput) codeInput.value = '';
    title.textContent = 'Agregar Nuevo Producto';
    submitBtn.textContent = 'Guardar y Sincronizar';

    this.clearAllPhotos();
    this.populateSubcategoriesSelect(1);
    modal.classList.remove('hidden');

    // Desplazar al inicio del formulario para mejor experiencia en celular
    const modalContent = modal.querySelector('.modal-card');
    if (modalContent) modalContent.scrollTop = 0;
  },

  openEditModal(product) {
    const modal = document.getElementById('productModalOverlay');
    const title = document.getElementById('productModalTitle');
    const submitBtn = document.getElementById('saveProductBtnText');
    const editId = document.getElementById('editProductId');
    const codeInput = document.getElementById('prodCodeInput');

    editId.value = product.id;
    title.textContent = `Editar Producto #${product.id}`;
    submitBtn.textContent = 'Actualizar y Sincronizar';

    const titleInput = document.getElementById('prodTitleInput');
    if (titleInput) titleInput.value = (product.title && product.title !== 'Prenda') ? product.title : '';
    if (codeInput) codeInput.value = product.code || '';
    const catSelect = document.getElementById('prodCategorySelect');
    if (catSelect) catSelect.value = product.categoria_id;
    this.populateSubcategoriesSelect(product.categoria_id, product.subcategoria_id);
    const sizesInput = document.getElementById('prodSizesInput');
    if (sizesInput) sizesInput.value = product.sizes || '';
    const descInput = document.getElementById('prodDescInput');
    if (descInput) descInput.value = product.description || '';

    // Cargar fotos existentes del producto (hasta 50)
    this.selectedFiles = [];
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      this.existingPhotos = [...product.images];
    } else if (product.image_url) {
      this.existingPhotos = [product.image_url];
    } else {
      this.existingPhotos = [];
    }

    this.renderPhotosPreviewGrid();
    modal.classList.remove('hidden');

    const modalContent = modal.querySelector('.modal-card');
    if (modalContent) modalContent.scrollTop = 0;
  },

  closeProductModal() {
    const modal = document.getElementById('productModalOverlay');
    if (modal) modal.classList.add('hidden');
    this.clearAllPhotos();
  },

  // Procesar guardado (Crear o Actualizar) con hasta 50 fotos - sin campos obligatorios
  async handleProductFormSubmit(e) {
    e.preventDefault();

    const currentUser = window.AppState ? window.AppState.currentUser : null;
    if (!currentUser || currentUser.role !== 'admin') {
      alert('Solo el Administrador puede gestionar productos.');
      return;
    }

    const editId = document.getElementById('editProductId').value;
    const isEdit = Boolean(editId);

    const formData = new FormData();
    const titleInput = document.getElementById('prodTitleInput');
    const titleVal = titleInput ? titleInput.value.trim() : '';
    const codeVal = document.getElementById('prodCodeInput') ? document.getElementById('prodCodeInput').value.trim() : '';
    const catSelect = document.getElementById('prodCategorySelect');
    const subcatSelect = document.getElementById('prodSubcategorySelect');
    const sizesInput = document.getElementById('prodSizesInput');
    const descInput = document.getElementById('prodDescInput');

    const catVal = catSelect ? catSelect.value : '1';
    const subcatVal = subcatSelect ? subcatSelect.value : '1';
    const sizesVal = sizesInput ? sizesInput.value.trim() : '';
    const descVal = descInput ? descInput.value.trim() : '';

    formData.append('code', codeVal);
    formData.append('title', titleVal || (codeVal ? `Prenda ${codeVal}` : 'Prenda'));
    formData.append('categoria_id', catVal);
    formData.append('subcategoria_id', subcatVal);
    formData.append('price', '0');
    formData.append('original_price', '');
    formData.append('sizes', sizesVal || 'Estándar');
    formData.append('stock', '999');
    formData.append('badge', '');
    formData.append('description', descVal);

    // Adjuntar todas las fotos nuevas (hasta 50)
    this.selectedFiles.forEach(file => {
      formData.append('images', file);
    });

    // Adjuntar lista de fotos existentes conservadas
    if (isEdit) {
      formData.append('existing_images', JSON.stringify(this.existingPhotos));
    }

    const submitBtn = document.getElementById('saveProductBtnText');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Guardando fotos permanentemente en la nube...';

    try {
      const url = isEdit ? `/api/products/${editId}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al guardar el producto.');
      }

      this.closeProductModal();
      window.showToast(isEdit ? '✅ Producto actualizado correctamente' : '🎉 Producto publicado exitosamente en tiempo real');

    } catch (err) {
      console.error('Error al guardar producto:', err);
      alert(err.message || 'Error en la petición.');
    } finally {
      submitBtn.textContent = originalText;
    }
  },

  // Confirmar y eliminar producto
  async deleteProduct(productId, productTitle) {
    const currentUser = window.AppState ? window.AppState.currentUser : null;
    if (!currentUser || currentUser.role !== 'admin') {
      alert('Acceso no autorizado.');
      return;
    }

    const confirmDelete = confirm(`¿Estás seguro de eliminar el producto "${productTitle}"?\nEsta acción actualizará las pantallas de todos los usuarios de inmediato.`);
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudo eliminar el producto.');
      }

      window.showToast('🗑️ Producto eliminado exitosamente.');
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      alert(err.message || 'Error al eliminar producto.');
    }
  },

  // Toggle de visibilidad del Panel en Tiempo Real
  toggleAdminPanel(forceState = null) {
    const panelWrapper = document.getElementById('adminLivePanelWrapper');
    if (!panelWrapper) return;

    if (forceState !== null) {
      if (forceState) panelWrapper.classList.remove('hidden');
      else panelWrapper.classList.add('hidden');
    } else {
      panelWrapper.classList.toggle('hidden');
    }
  },

  // Renderizar la lista de usuarios conectados en vivo
  renderLiveUsers(data) {
    const users = (data && data.users) ? data.users : [];
    const count = (data && typeof data.count === 'number') ? data.count : users.length;

    // Actualizar badges de conteo (Desktop y Celular)
    const liveCountBadge = document.getElementById('adminLiveCountBadge');
    const liveCountBadgeMobile = document.getElementById('adminLiveCountBadgeMobile');
    const panelUserCount = document.getElementById('adminPanelUserCount');
    const activeUsersChip = document.getElementById('activeUsersCount');

    if (liveCountBadge) liveCountBadge.textContent = count;
    if (liveCountBadgeMobile) liveCountBadgeMobile.textContent = count;
    if (panelUserCount) panelUserCount.textContent = count;
    if (activeUsersChip) activeUsersChip.textContent = count;

    // Actualizar contenedor
    const container = document.getElementById('liveUsersList');
    if (!container) return;

    if (users.length === 0) {
      container.innerHTML = '<div class="empty-state-small">No hay otros usuarios conectados actualmente.</div>';
      return;
    }

    container.innerHTML = users.map(u => {
      const isAdmin = u.role === 'admin';
      const initial = (u.username || 'U').charAt(0).toUpperCase();
      const connectedTime = u.connected_at ? new Date(u.connected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ahora';

      return `
        <div class="user-card-live" id="user-socket-${u.socket_id}">
          <div class="user-card-info">
            <div class="user-avatar-badge ${isAdmin ? 'avatar-admin' : 'avatar-cliente'}">
              ${initial}
            </div>
            <div class="user-details">
              <h4>${u.username}</h4>
              <span>Rol: <strong>${isAdmin ? '👑 Administrador' : '👤 Cliente'}</strong></span>
            </div>
          </div>
          <div class="user-card-meta">
            <span class="badge-status-online">Online</span>
            <span style="font-size: 0.72rem; color: #94a3b8;">${connectedTime}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  // Actualizar la interfaz según el rol del usuario (Admin vs Cliente)
  updateAdminUIState(isAdmin) {
    const adminElements = document.querySelectorAll('.btn-admin-only');
    adminElements.forEach(el => {
      if (isAdmin) el.classList.remove('hidden');
      else el.classList.add('hidden');
    });

    const adminPanelWrapper = document.getElementById('adminLivePanelWrapper');
    if (!isAdmin && adminPanelWrapper) {
      adminPanelWrapper.classList.add('hidden');
    }
  }
};

window.AdminModule = AdminModule;
