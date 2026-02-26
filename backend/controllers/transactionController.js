// controllers/transactionController.js
const asyncHandler = require('../utils/asyncHandler');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const { getOrCreateByIdempotency } = require('../utils/idempotency');
const { verifyProviderSignature } = require('../utils/paymentUtils'); // implement provider-specific verification

// Helper: sanitize transaction output
function sanitizeTransaction(tx) {
  if (!tx) return null;
  const t = tx.toObject ? tx.toObject() : tx;
  // remove any internal fields if present
  delete t.__v;
  return t;
}

// POST /api/transactions
// Create transaction with idempotency, atomic stock reservation, server-side totals
const createTransaction = asyncHandler(async (req, res, next) => {
  const idempotencyKey = req.header('Idempotency-Key') || req.body.idempotencyKey;
  const payload = req.body;

  if (!Array.isArray(payload.products) || payload.products.length === 0) {
    return next(new ErrorResponse('Products are required', 400));
  }

  const result = await getOrCreateByIdempotency(idempotencyKey, async () => {
    const reservedItems = [];
    let sellerId = null;
    let totalAmount = 0;
    const items = [];

    try {
      for (const item of payload.products) {
        if (!item.product || !item.quantity) throw new ErrorResponse('Invalid product item', 400);
        const prod = await Product.findById(item.product);
        if (!prod) throw new ErrorResponse(`Product not found: ${item.product}`, 404);
        if (item.quantity <= 0) throw new ErrorResponse('Quantity must be > 0', 400);

        if (!sellerId) sellerId = prod.seller.toString();
        if (prod.seller.toString() !== sellerId) throw new ErrorResponse('All items must belong to the same seller', 400);

        // Reserve stock atomically
        const reserved = await Product.reserveStock(prod._id, item.quantity);
        if (!reserved) throw new ErrorResponse(`Insufficient stock for ${prod.title || prod.name}`, 400);

        reservedItems.push({ productId: prod._id, qty: item.quantity });

        const unitPrice = prod.price;
        const totalPrice = unitPrice * item.quantity;
        totalAmount += totalPrice;
        items.push({
          product: prod._id,
          quantity: item.quantity,
          unitPrice,
          totalPrice
        });
      }

      const transaction = await Transaction.create({
        idempotencyKey: idempotencyKey || undefined,
        transactionId: `tx_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        buyer: req.user.id,
        seller: sellerId,
        products: items,
        totalAmount,
        paymentMethod: payload.paymentMethod,
        paymentStatus: 'pending',
        deliveryAddress: payload.deliveryAddress,
        status: 'active'
      });

      return transaction;
    } catch (err) {
      // rollback reserved stock on error
      for (const r of reservedItems) {
        try { await Product.releaseStock(r.productId, r.qty); } catch (e) { /* log if needed */ }
      }
      throw err;
    }
  });

  const transaction = result.existing || result;
  res.status(result.created === false ? 200 : 201).json({ success: true, data: sanitizeTransaction(transaction) });
});

// POST /api/transactions/:id/pay/initiate
// Initiate payment with provider (store paymentReference, set processing). Provider integration required.
const initiatePayment = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id);
  if (!transaction) return next(new ErrorResponse('Transaction not found', 404));
  if (transaction.buyer.toString() !== req.user.id.toString()) return next(new ErrorResponse('Not authorized', 403));
  if (transaction.paymentStatus !== 'pending') return next(new ErrorResponse('Payment already initiated or completed', 400));

  // Example: call provider SDK here and get providerPayload and paymentReference
  // const providerPayload = await paymentProvider.createPayment({ amount: transaction.totalAmount, ... });
  // transaction.paymentDetails = { transactionRef: providerPayload.reference, provider: 'momo' };
  // transaction.paymentStatus = 'processing';
  // await transaction.save();

  // For now, store a placeholder reference and set processing
  transaction.paymentDetails = transaction.paymentDetails || {};
  transaction.paymentDetails.transactionRef = `payref_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  transaction.paymentStatus = 'processing';
  await transaction.save();

  res.status(200).json({ success: true, data: { paymentReference: transaction.paymentDetails.transactionRef } });
});

// POST /webhooks/payments
// Provider webhook: verify signature, update transaction, append paymentEvents, release stock on failure
const paymentWebhook = asyncHandler(async (req, res) => {
  // raw body or req.body depending on provider; verify signature
  const signature = req.header('X-Signature') || req.header('x-provider-signature');
  const verified = verifyProviderSignature(req.rawBody || req.body, signature);
  if (!verified) return res.status(400).send('Invalid signature');

  const payload = req.body;
  const paymentReference = payload.paymentReference || payload.transactionRef || (payload.data && payload.data.reference);
  if (!paymentReference) return res.status(400).send('Missing payment reference');

  const tx = await Transaction.findOne({ $or: [{ 'paymentDetails.transactionRef': paymentReference }, { paymentReference }, { paymentReference: paymentReference }] });
  if (!tx) return res.status(404).send('Transaction not found');

  tx.paymentEvents = tx.paymentEvents || [];
  tx.paymentEvents.push({ event: payload.status || payload.event || 'unknown', payload, receivedAt: new Date() });

  const status = (payload.status || payload.event || '').toString().toLowerCase();
  if (status.includes('success') || status.includes('completed')) {
    tx.paymentStatus = 'completed';
    tx.status = 'completed';
    // update seller/buyer stats
    await User.findByIdAndUpdate(tx.buyer, { $inc: { totalPurchases: tx.totalAmount } }).exec();
    await User.findByIdAndUpdate(tx.seller, { $inc: { totalSales: tx.totalAmount } }).exec();
  } else if (status.includes('failed') || status.includes('cancel')) {
    tx.paymentStatus = 'failed';
    tx.status = 'cancelled';
    // release reserved stock
    for (const p of tx.products) {
      try { await Product.releaseStock(p.product, p.quantity); } catch (e) { /* log */ }
    }
  } else {
    tx.paymentStatus = 'processing';
  }

  await tx.save();
  res.status(200).send('ok');
});

// GET /api/transactions (admin) with pagination
const getAllTransactions = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin') return next(new ErrorResponse('Not authorized', 403));
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, parseInt(req.query.limit || '25', 10));
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    Transaction.find().populate('buyer seller', 'firstName lastName email phone').populate('products.product', 'title images price').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Transaction.countDocuments()
  ]);

  res.status(200).json({ success: true, page, limit, total, count: transactions.length, data: transactions });
});

// GET /api/transactions/:id
const getTransactionById = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id).populate('buyer seller', 'firstName lastName email phone').populate('products.product', 'title images price');
  if (!transaction) return next(new ErrorResponse('Transaction not found', 404));
  if (transaction.buyer.toString() !== req.user.id.toString() && transaction.seller.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to view this transaction', 403));
  }
  res.status(200).json({ success: true, data: sanitizeTransaction(transaction) });
});

// PUT /api/transactions/:id  (partial updates; whitelist fields)
const updateTransaction = asyncHandler(async (req, res, next) => {
  const allowed = ['deliveryStatus', 'deliveryDate', 'rating', 'review', 'status'];
  const updates = {};
  for (const k of allowed) if (k in req.body) updates[k] = req.body[k];

  const tx = await Transaction.findById(req.params.id);
  if (!tx) return next(new ErrorResponse('Transaction not found', 404));
  if (req.user.role !== 'admin' && req.user.id !== tx.buyer.toString() && req.user.id !== tx.seller.toString()) {
    return next(new ErrorResponse('Not authorized to update this transaction', 403));
  }

  Object.assign(tx, updates);
  await tx.save();
  res.status(200).json({ success: true, data: sanitizeTransaction(tx) });
});

// DELETE /api/transactions/:id  (admin only -> soft delete)
const deleteTransaction = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin') return next(new ErrorResponse('Not authorized', 403));
  const tx = await Transaction.findById(req.params.id);
  if (!tx) return next(new ErrorResponse('Transaction not found', 404));
  tx.isArchived = true;
  tx.status = 'cancelled';
  // release stock if pending
  if (tx.paymentStatus !== 'completed') {
    for (const p of tx.products) {
      try { await Product.releaseStock(p.product, p.quantity); } catch (e) { /* log */ }
    }
  }
  await tx.save();
  res.status(200).json({ success: true, data: {} });
});

module.exports = {
  createTransaction,
  initiatePayment,
  paymentWebhook,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction
};