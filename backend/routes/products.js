// routes/products.js
const express = require('express');
const { validationResult } = require('express-validator');
const router = express.Router();

const { protect } = require('../middleware/auth');
const productController = require('../controllers/productController');
const validators = require('../validators/productValidator');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
}

router.get('/', validators.pagination, handleValidation, productController.getAllProducts);
router.get('/search', productController.searchProducts);
router.get('/category/:category', productController.getProductsByCategory);
router.get('/location/:location', productController.getProductsByLocation);
router.get('/:id', productController.getProductById);

router.post('/', protect, validators.createProduct, handleValidation, productController.createProduct);
router.put('/:id', protect, validators.updateProduct, handleValidation, productController.updateProduct);
router.delete('/:id', protect, productController.deleteProduct);

module.exports = router;
