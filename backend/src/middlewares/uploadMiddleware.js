const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Carpeta local de almacenamiento en el servidor
// ¡PROHIBIDO ABSOLUTO USAR CLOUDINARY!
const uploadsDir = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de almacenamiento local en disco
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `prod-${cleanName}-${uniqueSuffix}${ext}`);
  }
});

// Validación flexible y segura de archivos de imagen (hasta 50 fotos)
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.jfif', '.bmp', '.heic', '.heif'];
  const mime = (file.mimetype || '').toLowerCase();

  if (mime.startsWith('image/') || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Formato no permitido. Solo se permiten imágenes (JPG, PNG, WEBP, SVG, etc.).'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB máximo por foto
    files: 50 // Hasta 50 fotos por publicación
  }
});

module.exports = upload;
