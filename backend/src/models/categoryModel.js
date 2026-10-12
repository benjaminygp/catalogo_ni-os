const db = require('../config/database');

const CategoryModel = {
  getAllCategories() {
    return db.all('SELECT * FROM categorias ORDER BY id ASC');
  },

  getAllSubcategories() {
    return db.all('SELECT * FROM subcategorias ORDER BY id ASC');
  },

  getSubcategoriesByCategoryId(categoria_id) {
    return db.all('SELECT * FROM subcategorias WHERE categoria_id = ? ORDER BY id ASC', [categoria_id]);
  },

  getCategoryWithSubcategories() {
    const categories = db.all('SELECT * FROM categorias ORDER BY id ASC');
    const subcategories = db.all('SELECT * FROM subcategorias ORDER BY id ASC');

    return categories.map(cat => ({
      ...cat,
      subcategories: subcategories.filter(sc => sc.categoria_id === cat.id)
    }));
  }
};

module.exports = CategoryModel;
