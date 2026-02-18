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
const { protect, admin, farmer, buyer } = require('../middleware/auth');

// Public routes
router.route('/')
  .get(getAllProducts)
  .post(protect, farmer, createProduct);

router.route('/search')
  .get(searchProducts);

router.route('/category/:category')
  .get(getProductsByCategory);

router.route('/location/:location')
  .get(getProductsByLocation);

router.route('/:id')
  .get(getProductById)
  .put(protect, farmer, updateProduct)
  .delete(protect, farmer, deleteProduct);

module.exports = router;