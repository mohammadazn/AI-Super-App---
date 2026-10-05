const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  type: { type: String, enum: ['user', 'admin'], default: 'user' },
  
  credits: { type: Number, default: 0 },
  apiBalance: { type: Number, default: 0 }, // دلار
  
  autoRecharge: {
    enabled: { type: Boolean, default: true },
    triggerBalance: { type: Number, default: 10 },
    rechargeAmount: { type: Number, default: 50 },
    lastRecharge: Date
  },
  
  transactions: [{
    type: { type: String, enum: ['deposit', 'withdrawal', 'api_purchase'] },
    amount: Number, // تومان
    description: String,
    createdAt: { type: Date, default: Date.now }
  }],
  
  createdAt: { type: Date, default: Date.now }
});

walletSchema.index({ type: 1 });

module.exports = mongoose.model('Wallet', walletSchema);
