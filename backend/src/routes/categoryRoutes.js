const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');

// GET /api/categories - Obtener categorías con sus subcategorías
router.get('/', CategoryController.getCategories);

// GET /api/categories/subcategories - Listado plano de todas las subcategorías
router.get('/subcategories', CategoryController.getAllSubcategories);

module.exports = router;
