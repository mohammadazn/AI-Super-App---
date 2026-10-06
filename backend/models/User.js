const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    match: /^09[0-9]{9}$/, // Iranian phone format
    trim: true
  },
  
  verificationCode: {
    code: String,
    expiresAt: Date,
    verified: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 }
  },
  
  profile: {
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    location: { type: String, default: '' }
  },
  
  credits: {
    type: Number,
    default: 10000 // 10,000 Credit هدیه اولیه
  },
  
  subscription: {
    plan: { 
      type: String, 
      enum: ['free', 'pro', 'premium'], 
      default: 'free' 
    },
    expiresAt: Date,
    autoRenew: { type: Boolean, default: false }
  },
  
  cryptoWallet: {
    binanceConnected: { type: Boolean, default: false },
    binanceApiKey: String,
    binanceSecret: String,
    nobitexConnected: { type: Boolean, default: false },
    nobitexApiKey: String
  },
  
  usageStats: {
    videosCreated: { type: Number, default: 0 },
    videosEdited: { type: Number, default: 0 },
    codesGenerated: { type: Number, default: 0 },
    tradesExecuted: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 } // تومان
  },
  
  preferences: {
    language: { type: String, default: 'fa' },
    notifications: {
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    tradingStrategy: {
      riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      autoTrade: { type: Boolean, default: false }
    }
  },
  
  deviceInfo: [{
    deviceId: String,
    deviceType: { type: String, enum: ['web', 'android', 'ios'] },
    lastLogin: Date,
    pushToken: String
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes
userSchema.index({ phone: 1 });
userSchema.index({ 'deviceInfo.deviceId': 1 });

module.exports = mongoose.model('User', userSchema);

//nwe
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true
  },

  phoneVerified: {
    type: Boolean,
    default: false
  },

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  profile: {
    firstName: String,
    lastName: String
  },

  kycStatus: {
    type: String,
    default: 'not_started'
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
