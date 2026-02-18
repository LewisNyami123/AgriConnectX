const asyncHandler = require('../utils/asyncHandler');
const Product = require('../models/Product');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getAllProducts = asyncHandler(async (req, res, next) => {
  const products = await Product.find({ isActive: true, isVerified: true })
    .populate('seller', 'firstName lastName farmName profilePicture')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('seller', 'firstName lastName farmName profilePicture');

  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  if (!product.isActive || !product.isVerified) {
    return next(new ErrorResponse('Product not available', 404));
  }

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Farmer
const createProduct = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.seller = req.user.id;

  // Check if user is approved farmer
  if (req.user.role !== 'farmer' || !req.user.isApproved) {
    return next(new ErrorResponse('Not authorized to add products', 401));
  }

  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    data: product
  });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Farmer
const updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is the product owner or admin
  if (product.seller.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this product', 401));
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Farmer
const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is the product owner or admin
  if (product.seller.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this product', 401));
  }

  await product.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
const getProductsByCategory = asyncHandler(async (req, res, next) => {
  const products = await Product.find({ 
    category: req.params.category, 
    isActive: true, 
    isVerified: true 
  })
    .populate('seller', 'firstName lastName farmName profilePicture')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Get products by location
// @route   GET /api/products/location/:location
// @access  Public
const getProductsByLocation = asyncHandler(async (req, res, next) => {
  const products = await Product.find({ 
    'location.region': req.params.location,
    isActive: true, 
    isVerified: true 
  })
    .populate('seller', 'firstName lastName farmName profilePicture')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
const searchProducts = asyncHandler(async (req, res, next) => {
  const { keyword, category, minPrice, maxPrice, location, sortBy } = req.query;

  let query = { isActive: true, isVerified: true };

  if (keyword) {
    query.$or = [
      { name: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } },
      { tags: { $in: [new RegExp(keyword, 'i')] } }
    ];
  }

  if (category) {
    query.category = category;
  }

  if (minPrice || maxPrice) {
    query.basePrice = {};
    if (minPrice) query.basePrice.$gte = Number(minPrice);
    if (maxPrice) query.basePrice.$lte = Number(maxPrice);
  }

  if (location) {
    query['location.region'] = { $regex: location, $options: 'i' };
  }

  let sort = { createdAt: -1 };
  if (sortBy === 'price-low') {
    sort.basePrice = 1;
  } else if (sortBy === 'price-high') {
    sort.basePrice = -1;
  } else if (sortBy === 'newest') {
    sort.createdAt = -1;
  } else if (sortBy === 'oldest') {
    sort.createdAt = 1;
  } else if (sortBy === 'rating') {
    sort['ratings.average'] = -1;
  }

  const products = await Product.find(query)
    .populate('seller', 'firstName lastName farmName profilePicture')
    .sort(sort);

  res.status(200).json({
    success: true,
    count: products.length,
    data: products
  });
});

module.exports = { getAllProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getProductsByCategory,
  getProductsByLocation,
  searchProducts}