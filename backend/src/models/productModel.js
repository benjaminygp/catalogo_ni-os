const db = require('../config/database');

function formatProduct(p) {
  if (!p) return null;
  let parsedImages = [];
  try {
    if (p.images) {
      parsedImages = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
    }
  } catch (e) {
    parsedImages = [];
  }

  if (!Array.isArray(parsedImages) || parsedImages.length === 0) {
    parsedImages = p.image_url ? [p.image_url] : [];
  }

  return {
    ...p,
    code: p.code || '',
    images: parsedImages
  };
}

const ProductModel = {
  getAll({ categoria_id, subcategoria_id, search, min_price, max_price, tipo_grupo } = {}) {
    let sql = `
      SELECT 
        p.*,
        COALESCE(c.name, 'Ropa') as categoria_name,
        COALESCE(c.slug, 'ropa') as categoria_slug,
        COALESCE(sc.name, 'General') as subcategoria_name,
        COALESCE(sc.slug, 'general') as subcategoria_slug,
        COALESCE(sc.tipo_grupo, 'Normal') as subcategoria_grupo
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN subcategorias sc ON p.subcategoria_id = sc.id
      WHERE 1=1
    `;
    const params = [];

    if (categoria_id) {
      sql += ' AND p.categoria_id = ?';
      params.push(Number(categoria_id));
    }

    if (subcategoria_id) {
      sql += ' AND p.subcategoria_id = ?';
      params.push(Number(subcategoria_id));
    }

    if (tipo_grupo) {
      sql += ' AND sc.tipo_grupo = ?';
      params.push(tipo_grupo);
    }

    if (search) {
      sql += ' AND (p.title LIKE ? OR p.description LIKE ? OR sc.name LIKE ? OR p.code LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (min_price !== undefined && min_price !== '') {
      sql += ' AND p.price >= ?';
      params.push(Number(min_price));
    }

    if (max_price !== undefined && max_price !== '') {
      sql += ' AND p.price <= ?';
      params.push(Number(max_price));
    }

    sql += ' ORDER BY p.id DESC';

    const rows = db.all(sql, params);
    return rows.map(formatProduct);
  },

  getById(id) {
    const sql = `
      SELECT 
        p.*,
        COALESCE(c.name, 'Ropa') as categoria_name,
        COALESCE(c.slug, 'ropa') as categoria_slug,
        COALESCE(sc.name, 'General') as subcategoria_name,
        COALESCE(sc.slug, 'general') as subcategoria_slug,
        COALESCE(sc.tipo_grupo, 'Normal') as subcategoria_grupo
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN subcategorias sc ON p.subcategoria_id = sc.id
      WHERE p.id = ?
    `;
    const row = db.get(sql, [Number(id)]);
    return formatProduct(row);
  },

  create({ code, title, description, price, original_price, image_url, images, categoria_id, subcategoria_id, sizes, stock, badge }) {
    const imagesStr = Array.isArray(images) ? JSON.stringify(images) : (images || JSON.stringify([image_url]));
    const cleanCode = code ? String(code).trim() : null;
    const finalTitle = title ? String(title).trim() : (cleanCode ? `Prenda ${cleanCode}` : 'Prenda');
    const finalPrice = (price !== undefined && price !== '' && !isNaN(Number(price))) ? Number(price) : 0;
    const finalOriginalPrice = (original_price !== undefined && original_price !== '' && !isNaN(Number(original_price))) ? Number(original_price) : null;
    const finalCat = categoria_id ? Number(categoria_id) : 1;
    const finalSubcat = subcategoria_id ? Number(subcategoria_id) : 1;

    const sql = `
      INSERT INTO productos (code, title, description, price, original_price, image_url, images, categoria_id, subcategoria_id, sizes, stock, badge, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    const res = db.run(sql, [
      cleanCode,
      finalTitle,
      description || '',
      finalPrice,
      finalOriginalPrice,
      image_url,
      imagesStr,
      finalCat,
      finalSubcat,
      sizes || 'Estándar',
      stock !== undefined ? Number(stock) : 999,
      badge || null
    ]);

    return this.getById(res.lastInsertRowid);
  },

  update(id, { code, title, description, price, original_price, image_url, images, categoria_id, subcategoria_id, sizes, stock, badge }) {
    const existing = this.getById(id);
    if (!existing) return null;

    const cleanCode = code !== undefined ? (code ? String(code).trim() : null) : existing.code;
    const finalTitle = title !== undefined 
      ? (title ? String(title).trim() : (cleanCode ? `Prenda ${cleanCode}` : existing.title))
      : existing.title;
    const finalPrice = price !== undefined
      ? ((price !== '' && !isNaN(Number(price))) ? Number(price) : existing.price)
      : existing.price;
    const finalOriginalPrice = original_price !== undefined
      ? ((original_price !== '' && !isNaN(Number(original_price))) ? Number(original_price) : null)
      : existing.original_price;

    const finalImagesStr = images !== undefined 
      ? (Array.isArray(images) ? JSON.stringify(images) : images)
      : (existing.images ? JSON.stringify(existing.images) : JSON.stringify([existing.image_url]));

    const sql = `
      UPDATE productos
      SET code = ?,
          title = ?,
          description = ?,
          price = ?,
          original_price = ?,
          image_url = ?,
          images = ?,
          categoria_id = ?,
          subcategoria_id = ?,
          sizes = ?,
          stock = ?,
          badge = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    db.run(sql, [
      cleanCode,
      finalTitle,
      description !== undefined ? description : existing.description,
      finalPrice,
      finalOriginalPrice,
      image_url !== undefined ? image_url : existing.image_url,
      finalImagesStr,
      categoria_id !== undefined ? Number(categoria_id) : existing.categoria_id,
      subcategoria_id !== undefined ? Number(subcategoria_id) : existing.subcategoria_id,
      sizes !== undefined ? sizes : existing.sizes,
      stock !== undefined ? Number(stock) : existing.stock,
      badge !== undefined ? badge : existing.badge,
      id
    ]);

    return this.getById(id);
  },

  delete(id) {
    const existing = this.getById(id);
    if (!existing) return false;
    db.run('DELETE FROM productos WHERE id = ?', [id]);
    return true;
  },

  restoreAll(productsArray) {
    if (!Array.isArray(productsArray)) return;
    for (const p of productsArray) {
      if (!p) continue;
      const existing = p.id ? this.getById(p.id) : null;
      const imagesStr = Array.isArray(p.images) 
        ? JSON.stringify(p.images) 
        : (p.images || JSON.stringify([p.image_url]));

      if (existing) {
        const sql = `
          UPDATE productos
          SET code = ?, title = ?, description = ?, price = ?, original_price = ?,
              image_url = ?, images = ?, categoria_id = ?, subcategoria_id = ?,
              sizes = ?, stock = ?, badge = ?, updated_at = ?
          WHERE id = ?
        `;
        try {
          db.run(sql, [
            p.code || null,
            p.title || 'Prenda',
            p.description || '',
            p.price !== undefined ? Number(p.price) : 0,
            p.original_price !== undefined ? Number(p.original_price) : null,
            p.image_url || '',
            imagesStr,
            p.categoria_id ? Number(p.categoria_id) : 1,
            p.subcategoria_id ? Number(p.subcategoria_id) : 1,
            p.sizes || 'Estándar',
            p.stock !== undefined ? Number(p.stock) : 999,
            p.badge || null,
            p.updated_at || new Date().toISOString(),
            p.id
          ]);
        } catch (e) {
          console.error('[RESTORE UPDATE ERROR]', e.message);
        }
      } else {
        const sql = `
          INSERT INTO productos (id, code, title, description, price, original_price, image_url, images, categoria_id, subcategoria_id, sizes, stock, badge, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        try {
          db.run(sql, [
            p.id || null,
            p.code || null,
            p.title || 'Prenda',
            p.description || '',
            p.price !== undefined ? Number(p.price) : 0,
            p.original_price !== undefined ? Number(p.original_price) : null,
            p.image_url || '',
            imagesStr,
            p.categoria_id ? Number(p.categoria_id) : 1,
            p.subcategoria_id ? Number(p.subcategoria_id) : 1,
            p.sizes || 'Estándar',
            p.stock !== undefined ? Number(p.stock) : 999,
            p.badge || null,
            p.created_at || new Date().toISOString(),
            p.updated_at || new Date().toISOString()
          ]);
        } catch (e) {
          console.error('[RESTORE INSERT ERROR]', e.message);
        }
      }
    }
  }
};

module.exports = ProductModel;
