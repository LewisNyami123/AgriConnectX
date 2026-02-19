// routes/products.js
const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  getProductsByLocation,
  searchProducts
} = require('../controllers/productController');

const { protect, authorize } = require('../middleware/auth');

// Public routes
router.route('/')
  .get(getAllProducts)
  .post(protect, authorize('farmer'), createProduct);

router.route('/search')
  .get(searchProducts);

router.route('/category/:category')
  .get(getProductsByCategory);

router.route('/location/:location')
  .get(getProductsByLocation);

// Keep parameter routes last to avoid conflicts
router.route('/:id')
  .get(getProductById)
  .put(protect, authorize('farmer'), updateProduct)
  .delete(protect, authorize('farmer'), deleteProduct);

module.exports = router;