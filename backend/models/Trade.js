const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  exchange: {
    type: String,
    enum: ['binance', 'nobitex'],
    required: true
  },
  
  type: {
    type: String,
    enum: ['buy', 'sell'],
    required: true
  },
  
  symbol: {
    type: String,
    required: true // e.g., 'BTCUSDT'
  },
  
  amount: {
    type: Number,
    required: true // مقدار ارز
  },
  
  price: {
    type: Number,
    required: true // قیمت واحد به USDT
  },
  
  total: {
    type: Number,
    required: true // مقدار کل (amount * price)
  },
  
  orderId: {
    type: String,
    required: true
  },
  
  status: {
    type: String,
    enum: ['pending', 'filled', 'cancelled', 'failed'],
    default: 'pending'
  },
  
  signal: {
    type: String,
    enum: ['manual', 'auto_signal', 'auto_strategy']
  },
  
  profit: {
    type: Number // سود/ضرر به تومان (مثبت یا منفی)
  },
  
  executedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Indexes
tradeSchema.index({ userId: 1, executedAt: -1 });
tradeSchema.index({ symbol: 1 });
tradeSchema.index({ status: 1 });

module.exports = mongoose.model('Trade', tradeSchema);
