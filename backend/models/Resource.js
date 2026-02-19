// models/Resource.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  comment: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
  isHidden: { type: Boolean, default: false }
}, { _id: false });

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  mimeType: { type: String, required: true }, // e.g., image/jpeg, video/mp4, application/pdf
  caption: String
}, { _id: false });

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, index: true },
  content: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: [
      'agricultural_tips', 'weather_updates', 'farming_inputs',
      'market_prices', 'pest_control', 'soil_health', 'crop_rotation',
      'livestock_management', 'fertilizers', 'seeds', 'equipment'
    ],
    index: true
  },
  tags: [{ type: String, index: true }],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  authorName: { type: String, trim: true },
  isPublic: { type: Boolean, default: true, index: true },
  isFeatured: { type: Boolean, default: false, index: true },
  resourceType: { type: String, enum: ['article', 'video', 'guide', 'tip', 'news', 'report'], default: 'article' },
  media: [mediaSchema],
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
  comments: [commentSchema],
  publishedAt: Date,
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moderatedAt: Date,
  isArchived: { type: Boolean, default: false }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Text index for search across title, content, tags
resourceSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Atomic view increment helper
resourceSchema.methods.incrementViews = function() {
  return this.model('Resource').findByIdAndUpdate(this._id, { $inc: { views: 1 } }, { new: true }).exec();
};

// Toggle like: adds or removes userId; returns new like count
resourceSchema.methods.toggleLike = async function(userId) {
  const userObjectId = mongoose.Types.ObjectId(userId);
  const idx = this.likes.findIndex(id => id.equals(userObjectId));
  if (idx === -1) {
    this.likes.push(userObjectId);
  } else {
    this.likes.splice(idx, 1);
  }
  await this.save();
  return this.likes.length;
};

// Pre-save: derive authorName if missing
resourceSchema.pre('save', async function(next) {
  if (!this.authorName && this.author) {
    try {
      const User = mongoose.model('User');
      const user = await User.findById(this.author).select('firstName lastName');
      if (user) this.authorName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    } catch (err) {
      // ignore and continue
    }
  }
  next();
});

module.exports = mongoose.model('Resource', resourceSchema);