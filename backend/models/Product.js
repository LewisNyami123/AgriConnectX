const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'vegetables', 'fruits', 'grains', 'livestock', 'poultry', 
      'dairy', 'fish', 'root_crops', 'spices', 'nuts', 'other'
    ]
  },
  variety: {
    type: String,
    trim: true
  },
  images: [{
    type: String // Cloudinary URLs
  }],
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'piece', 'bunch', 'basket', 'bag', 'liter', 'ton']
  },
  quantityAvailable: {
    type: Number,
    required: true,
    min: 0
  },
  minOrderQuantity: {
    type: Number,
    default: 1
  },
  qualityGrade: {
    type: String,
    enum: ['premium', 'standard', 'basic']
  },
  harvestDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    },
    address: String,
    region: String,
    department: String
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  soldCount: {
    type: Number,
    default: 0
  },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  tags: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);