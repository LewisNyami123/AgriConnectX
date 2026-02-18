const asyncHandler = require('../utils/asyncHandler');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private/Admin
const getAllTransactions = asyncHandler(async (req, res, next) => {
  const transactions = await Transaction.find()
    .populate('buyer seller', 'firstName lastName email phone')
    .populate('products.product', 'name images basePrice')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: transactions.length,
    data: transactions
  });
});

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
const getTransactionById = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id)
    .populate('buyer seller', 'firstName lastName email phone')
    .populate('products.product', 'name images basePrice');

  if (!transaction) {
    return next(new ErrorResponse(`Transaction not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is buyer, seller, or admin
  if (
    transaction.buyer.toString() !== req.user.id.toString() &&
    transaction.seller.toString() !== req.user.id.toString() &&
    req.user.role !== 'admin'
  ) {
    return next(new ErrorResponse('Not authorized to view this transaction', 401));
  }

  res.status(200).json({
    success: true,
    data: transaction
  });
});

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private/Buyer
const createTransaction = asyncHandler(async (req, res, next) => {
  const { products, totalAmount, paymentMethod, deliveryAddress } = req.body;

  // Verify products exist and have enough quantity
  for (const item of products) {
    const product = await Product.findById(item.product);
    if (!product) {
      return next(new ErrorResponse(`Product not found with id of ${item.product}`, 404));
    }
    if (product.quantityAvailable < item.quantity) {
      return next(new ErrorResponse(`Insufficient quantity for ${product.name}`, 400));
    }
  }

  // Create transaction ID
  const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

  const transaction = await Transaction.create({
    transactionId,
    buyer: req.user.id,
    seller: products[0].seller || (await Product.findById(products[0].product)).seller, // Assuming all items are from same seller for now
    products,
    totalAmount,
    paymentMethod,
    deliveryAddress,
    status: 'active'
  });

  // Update product quantities
  for (const item of products) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { quantityAvailable: -item.quantity, soldCount: item.quantity }
    });
  }

  // Update user stats
  await User.findByIdAndUpdate(req.user.id, {
    $inc: { totalPurchases: totalAmount }
  });

  await User.findByIdAndUpdate(transaction.seller, {
    $inc: { totalSales: totalAmount }
  });

  res.status(201).json({
    success: true,
    data: transaction
  });
});

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = asyncHandler(async (req, res, next) => {
  let transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    return next(new ErrorResponse(`Transaction not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is buyer, seller, or admin
  if (
    transaction.buyer.toString() !== req.user.id.toString() &&
    transaction.seller.toString() !== req.user.id.toString() &&
    req.user.role !== 'admin'
  ) {
    return next(new ErrorResponse('Not authorized to update this transaction', 401));
  }

  transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: transaction
  });
});

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private/Admin
const deleteTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    return next(new ErrorResponse(`Transaction not found with id of ${req.params.id}`, 404));
  }

  await transaction.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get user transactions
// @route   GET /api/transactions/user/:userId
// @access  Private
const getUserTransactions = asyncHandler(async (req, res, next) => {
  if (req.params.userId !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to view these transactions', 401));
  }

  const transactions = await Transaction.find({
    $or: [
      { buyer: req.params.userId },
      { seller: req.params.userId }
    ]
  })
    .populate('buyer seller', 'firstName lastName email phone')
    .populate('products.product', 'name images basePrice')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: transactions.length,
    data: transactions
  });
});

// @desc    Process payment for transaction
// @route   POST /api/transactions/process-payment/:id
// @access  Private/Buyer
const processPayment = asyncHandler(async (req, res, next) => {
  const { paymentDetails } = req.body;
  const transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    return next(new ErrorResponse(`Transaction not found with id of ${req.params.id}`, 404));
  }

  if (transaction.buyer.toString() !== req.user.id.toString()) {
    return next(new ErrorResponse('Not authorized to process payment for this transaction', 401));
  }

  if (transaction.paymentStatus !== 'pending') {
    return next(new ErrorResponse('Payment already processed', 400));
  }

  // In a real implementation, we would integrate with payment providers here
  // For now, we'll simulate the payment processing
  transaction.paymentDetails = paymentDetails;
  transaction.paymentStatus = 'completed';
  transaction.status = 'active';

  await transaction.save();

  res.status(200).json({
    success: true,
    data: transaction
  });
});

module.exports = { getAllTransactions, getTransactionById,  createTransaction, 
  updateTransaction, 
  deleteTransaction,
  getUserTransactions,
  processPayment}