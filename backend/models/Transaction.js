const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'api_purchase', 'video_generation', 'code_generation', 'trade'],
    required: true
  },
  
  amount: {
    type: Number,
    required: true // تومان (مثبت برای واریز، منفی برای برداشت)
  },
  
  credits: {
    type: Number,
    required: true // تعداد Credit
  },
  
  paymentMethod: {
    type: String,
    enum: ['zarinpal', 'nextpay', 'crypto', 'api_credit']
  },
  
  paymentDetails: {
    authority: String, // زرین‌پال Authority
    refId: String, // زرین‌پال RefID
    txHash: String, // Crypto transaction hash
    apiProvider: String // Groq, Gemini, etc.
  },
  
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  
  description: String,
  
  metadata: {
    videoId: mongoose.Schema.Types.ObjectId,
    tradeId: mongoose.Schema.Types.ObjectId,
    packageName: String
  },
  
  createdAt: { type: Date, default: Date.now }
});

// Indexes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
