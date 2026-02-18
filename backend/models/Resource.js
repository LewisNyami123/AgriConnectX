const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'agricultural_tips', 'weather_updates', 'farming_inputs', 
      'market_prices', 'pest_control', 'soil_health', 'crop_rotation',
      'livestock_management', 'fertilizers', 'seeds', 'equipment'
    ]
  },
  tags: [String],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  authorName: {
    type: String,
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  resourceType: {
    type: String,
    enum: ['article', 'video', 'guide', 'tip', 'news', 'report'],
    default: 'article'
  },
  media: [{
    url: String,
    type: String, // image, video, pdf, etc.
    caption: String
  }],
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Resource', resourceSchema);