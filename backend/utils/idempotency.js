// utils/idempotency.js
const Transaction = require('../models/Transaction');

async function getOrCreateByIdempotency(key, createFn) {
  if (!key) {
    const created = await createFn();
    return { existing: created, created: true };
  }
  const existing = await Transaction.findOne({ idempotencyKey: key });
  if (existing) return { existing, created: false };
  const created = await createFn();
  return { existing: created, created: true };
}

module.exports = { getOrCreateByIdempotency };