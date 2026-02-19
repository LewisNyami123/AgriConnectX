// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true, match: emailRegex },
  password:  { type: String, required: true, minlength: 6, select: false },
  phone:     { type: String, required: true, trim: true },
  role:      { type: String, enum: ['farmer', 'buyer', 'admin'], default: 'buyer' },
  profilePicture: { type: String, default: '' },
  farmName:  { type: String, trim: true },
  farmLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: { type: [Number], index: '2dsphere' }, // [lng, lat]
    address: String,
    region: String,
    department: String
  },
  idVerification: {
    documentType: { type: String, enum: ['national_id', 'passport', 'driver_license'] },
    documentFront: String,
    documentBack: String,
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  businessLicense: String,
  farmingDetails: {
    farmingType: [String],
    cropsGrown: [String],
    farmSize: Number,
    equipment: [String],
    certifications: [String]
  },
  isActive: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false },
  walletBalance: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  totalPurchases: { type: Number, default: 0 },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
}
);

/* ---------- Indexes ---------- */
// Ensure unique email index at DB level
userSchema.index({ email: 1 }, { unique: true });

/* ---------- Hooks ---------- */
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/* ---------- Instance Methods ---------- */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateJWT = function () {
  const payload = { id: this._id, role: this.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
  return token;
};

/* ---------- Static Helpers ---------- */
userSchema.statics.createAdminIfMissing = async function (opts = {}) {
  const User = this;
  const email = opts.email || 'admin@agriconnectx.cm';
  const existing = await User.findOne({ email }).select('+password');
  if (existing) return { created: false, user: existing };

  const adminData = {
    firstName: opts.firstName || 'System',
    lastName: opts.lastName || 'Admin',
    email,
    password: opts.password || (process.env.DEFAULT_ADMIN_PASSWORD || 'AdminStrongPassword123!'),
    phone: opts.phone || '600000000',
    role: 'admin',
    isActive: true,
    isApproved: true
  };

  const admin = new User(adminData);
  await admin.save();
  return { created: true, user: admin };
};

/* ---------- Safe output ---------- */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);