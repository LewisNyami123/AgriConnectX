// models/Product.js
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  mimeType: String,
  caption: String,
  order: { type: Number, default: 0 }
}, { _id: false });

const productSchema = new mongoose.Schema({
  sku: { type: String, unique: true, index: true }, // optional stock-keeping unit
  title: { type: String, required: true, trim: true, index: true },
  description: { type: String, required: true },
  category: { type: String, index: true },
  tags: [{ type: String, index: true }],
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'XAF' },
  quantity: { type: Number, default: 0, min: 0 }, // available stock
  unit: { type: String, default: 'kg' }, // e.g., kg, bag, unit
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  images: [imageSchema],
  location: { // optional geo point for local search
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: undefined } // [lng, lat]
  },
  isActive: { type: Boolean, default: true, index: true },
  isFeatured: { type: Boolean, default: false, index: true },
  isArchived: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Text index for search
productSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Geo index if you use location queries
productSchema.index({ location: '2dsphere' });

// Atomic view increment
productSchema.methods.incrementViews = function() {
  return this.model('Product').findByIdAndUpdate(this._id, { $inc: { views: 1 } }, { new: true }).exec();
};

// Reserve stock atomically (returns updated doc or null if insufficient)
productSchema.statics.reserveStock = async function(productId, qty) {
  if (qty <= 0) throw new Error('Quantity must be > 0');
  const res = await this.findOneAndUpdate(
    { _id: productId, quantity: { $gte: qty }, isActive: true, isArchived: false },
    { $inc: { quantity: -qty } },
    { new: true }
  ).exec();
  return res;
};

// Release stock (e.g., on order cancel)
productSchema.statics.releaseStock = function(productId, qty) {
  if (qty <= 0) throw new Error('Quantity must be > 0');
  return this.findByIdAndUpdate(productId, { $inc: { quantity: qty } }, { new: true }).exec();
};

module.exports = mongoose.model('Product', productSchema);