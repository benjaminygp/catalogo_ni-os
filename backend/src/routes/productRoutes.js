const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { requireAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// GET /api/products - Consulta pública de productos con filtros
router.get('/', ProductController.getAll);

// GET /api/products/:id - Consulta de producto específico
router.get('/:id', ProductController.getById);

// Middleware de subida para múltiples imágenes (hasta 50 fotos por producto)
const uploadProductPhotos = upload.fields([
  { name: 'images', maxCount: 50 },
  { name: 'image', maxCount: 1 }
]);

// POST /api/products - Crear nuevo producto (Solo Admin + Almacenamiento local de fotos)
router.post('/', requireAdmin, uploadProductPhotos, ProductController.create);

// PUT /api/products/:id - Actualizar producto (Solo Admin + Almacenamiento local de fotos)
router.put('/:id', requireAdmin, uploadProductPhotos, ProductController.update);

// DELETE /api/products/:id - Eliminar producto (Solo Admin)
router.delete('/:id', requireAdmin, ProductController.delete);

module.exports = router;
