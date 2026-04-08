// routes/products.js
const express = require('express');
const { validationResult } = require('express-validator');
const router = express.Router();
const multer = require('multer');

const { protect } = require('../middleware/auth');
const productController = require('../controllers/productController');
const validators = require('../validators/productValidator');


function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/products/');   // Make sure this folder exists
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});



router.get('/', validators.pagination, handleValidation, productController.getAllProducts);
router.get('/search', productController.searchProducts);
router.get('/category/:category', productController.getProductsByCategory);
router.get('/location/:location', productController.getProductsByLocation);
router.get('/:id', productController.getProductById);

router.post('/', protect, validators.createProduct, handleValidation, upload.single('images'), productController.createProduct);
router.put('/:id', protect, validators.updateProduct, handleValidation, upload.single('images'), productController.updateProduct);
router.delete('/:id', protect, productController.deleteProduct);

module.exports = router;
