// controllers/productController.js
const asyncHandler = require('../utils/asyncHandler');
const Product = require('../models/Product');
const ErrorResponse = require('../utils/errorResponse');
const pick = require('../utils/pick');

// GET /api/products
const getAllProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(50, parseInt(req.query.limit || '20', 10));
  const skip = (page - 1) * limit;

  const query = { isActive: true, isVerified: true, isArchived: { $ne: true } };

  const [total, products] = await Promise.all([
    Product.countDocuments(query),
    Product.find(query)
      .populate('seller', 'firstName lastName farmName profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
  ]);

  res.status(200).json({ success: true, page, limit, total, count: products.length, data: products });
});

// GET /api/products/:id
const getProductById = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate('seller', 'firstName lastName farmName profilePicture');
  if (!product || product.isArchived) return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  if (!product.isActive || !product.isVerified) return next(new ErrorResponse('Product not available', 404));

  // Atomic view increment
  await Product.findByIdAndUpdate(product._id, { $inc: { views: 1 } }).exec();

  const updated = await Product.findById(req.params.id).populate('seller', 'firstName lastName farmName profilePicture');
  res.status(200).json({ success: true, data: updated });
});

// POST /api/products
const createProduct = asyncHandler(async (req, res, next) => {
  // Only approved farmers can create
  if (req.user.role !== 'farmer' || !req.user.isApproved) {
    return next(new ErrorResponse('Not authorized to add products', 403));
  }

  // Whitelist allowed fields
  const allowed = ['sku', 'title', 'description', 'category', 'tags', 'price', 'currency', 'quantity', 'unit', 'images', 'location', 'isActive', 'isFeatured', 'metadata'];
  const payload = pick(req.body, allowed);
  payload.seller = req.user.id;

  const product = await Product.create(payload);
  res.status(201).json({ success: true, data: product });
});

// PUT /api/products/:id
const updateProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product || product.isArchived) return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));

  // Authorization: owner or admin
  if (product.seller.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this product', 403));
  }

  // Whitelist updatable fields
  const allowed = ['title', 'description', 'category', 'tags', 'price', 'currency', 'quantity', 'unit', 'images', 'location', 'isActive', 'isFeatured', 'metadata'];
  const updates = pick(req.body, allowed);

  Object.assign(product, updates);
  await product.save();

  res.status(200).json({ success: true, data: product });
});

// DELETE /api/products/:id (soft delete)
const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));

  if (product.seller.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this product', 403));
  }

  product.isArchived = true;
  product.isActive = false;
  await product.save();

  res.status(200).json({ success: true, data: {} });
});

// GET /api/products/category/:category
const getProductsByCategory = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(50, parseInt(req.query.limit || '20', 10));
  const skip = (page - 1) * limit;

  const query = { category: req.params.category, isActive: true, isVerified: true, isArchived: { $ne: true } };
  const [total, products] = await Promise.all([
    Product.countDocuments(query),
    Product.find(query).populate('seller', 'firstName lastName farmName profilePicture').sort({ createdAt: -1 }).skip(skip).limit(limit)
  ]);

  res.status(200).json({ success: true, page, limit, total, count: products.length, data: products });
});

// GET /api/products/location/:location
const getProductsByLocation = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(50, parseInt(req.query.limit || '20', 10));
  const skip = (page - 1) * limit;

  const query = { 'location.region': req.params.location, isActive: true, isVerified: true, isArchived: { $ne: true } };
  const [total, products] = await Promise.all([
    Product.countDocuments(query),
    Product.find(query).populate('seller', 'firstName lastName farmName profilePicture').sort({ createdAt: -1 }).skip(skip).limit(limit)
  ]);

  res.status(200).json({ success: true, page, limit, total, count: products.length, data: products });
});

// GET /api/products/search
const searchProducts = asyncHandler(async (req, res) => {
  const { keyword, category, minPrice, maxPrice, location, sortBy } = req.query;
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(50, parseInt(req.query.limit || '50', 10));
  const skip = (page - 1) * limit;

  const query = { isActive: true, isVerified: true, isArchived: { $ne: true } };

  if (keyword) {
    query.$or = [
      { title: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } },
      { tags: { $in: [new RegExp(keyword, 'i')] } }
    ];
  }

  if (category) query.category = category;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  if (location) query['location.region'] = { $regex: location, $options: 'i' };

  let sort = { createdAt: -1 };
  if (sortBy === 'price-low') sort = { price: 1 };
  else if (sortBy === 'price-high') sort = { price: -1 };
  else if (sortBy === 'rating') sort = { 'rating.average': -1 };

  const [total, products] = await Promise.all([
    Product.countDocuments(query),
    Product.find(query).populate('seller', 'firstName lastName farmName profilePicture').sort(sort).skip(skip).limit(limit)
  ]);

  res.status(200).json({ success: true, page, limit, total, count: products.length, data: products });
});

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  getProductsByLocation,
  searchProducts
};
