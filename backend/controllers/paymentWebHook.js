// controllers/paymentWebhook.js
const asyncHandler = require('../utils/asyncHandler');
const Transaction = require('../models/Transaction');

const paymentWebhook = asyncHandler(async (req, res) => {
  // Verify signature here (provider-specific)
  const signature = req.header('X-Signature') || req.header('x-provider-signature');
  const verified = verifyProviderSignature(req.rawBody || req.body, signature); // implement verifyProviderSignature
  if (!verified) return res.status(400).send('Invalid signature');

  const { paymentReference, status, metadata } = req.body; // provider payload
  const tx = await Transaction.findOne({ 'paymentDetails.transactionRef': paymentReference }) || await Transaction.findOne({ paymentReference });
  if (!tx) return res.status(404).send('Transaction not found');

  tx.paymentEvents = tx.paymentEvents || [];
  tx.paymentEvents.push({ event: status, payload: req.body, receivedAt: new Date() });

  if (status === 'SUCCESS' || status === 'COMPLETED') {
    tx.paymentStatus = 'completed';
    tx.status = 'completed';
    // optionally update seller/buyer stats here
  } else if (status === 'FAILED') {
    tx.paymentStatus = 'failed';
    // release reserved stock
    for (const p of tx.products) {
      await Product.releaseStock(p.product, p.quantity);
    }
  } else {
    tx.paymentStatus = 'processing';
  }

  await tx.save();
  res.status(200).send('ok');
});