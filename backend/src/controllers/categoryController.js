const CategoryModel = require('../models/categoryModel');

const CategoryController = {
  getCategories(req, res) {
    try {
      const categories = CategoryModel.getCategoryWithSubcategories();
      return res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('[CATEGORY ERROR getCategories]', error);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener categorías y subcategorías.'
      });
    }
  },

  getAllSubcategories(req, res) {
    try {
      const subcategories = CategoryModel.getAllSubcategories();
      return res.status(200).json({
        success: true,
        data: subcategories
      });
    } catch (error) {
      console.error('[CATEGORY ERROR getAllSubcategories]', error);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener subcategorías.'
      });
    }
  }
};

module.exports = CategoryController;
