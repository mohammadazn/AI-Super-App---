const express = require('express');
const { auth } = require('./auth');
const User = require('../models/User');
const Trade = require('../models/Trade');
const CryptoTradeService = require('../services/cryptoTrade');
const router = express.Router();

// اتصال کیف پول بایننس
router.post('/connect-wallet', auth, async (req, res) => {
  try {
    const { apiKey, apiSecret } = req.body;
    
    const user = await User.findById(req.user.userId);
    user.cryptoWallet = {
      binanceConnected: true,
      binanceApiKey: apiKey,
      binanceSecret: apiSecret
    };
    await user.save();
    
    res.json({ success: true, message: 'کیف پول بایننس متصل شد' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// قیمت لحظه‌ای
router.get('/price/:symbol', async (req, res) => {
  try {
    const price = await CryptoTradeService.getPrice(req.params.symbol);
    res.json({ success: true, price, symbol: req.params.symbol });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// سیگنال هوشمند
router.get('/signal/:symbol', async (req, res) => {
  try {
    const signal = await CryptoTradeService.getSignal(req.params.symbol);
    res.json({ success: true, signal, symbol: req.params.symbol });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// خرید خودکار
router.post('/buy', auth, async (req, res) => {
  try {
    const { symbol, amount } = req.body;
    
    const user = await User.findById(req.user.userId);
    
    if (!user.cryptoWallet.binanceConnected) {
      return res.status(400).json({ error: 'کیف پول بایننس متصل نیست' });
    }
    
    const order = await CryptoTradeService.buy(
      user.cryptoWallet.binanceApiKey,
      user.cryptoWallet.binanceSecret,
      symbol,
      amount
    );
    
    user.usageStats.tradesExecuted += 1;
    await user.save();
    
    await Trade.create({
      userId: user._id,
      exchange: 'binance',
      type: 'buy',
      symbol,
      amount,
      price: order.price,
      total: order.cumulativeQuoteQty,
      orderId: order.orderId,
      status: order.status.toLowerCase()
    });
    
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// فروش خودکار
router.post('/sell', auth, async (req, res) => {
  try {
    const { symbol, amount } = req.body;
    
    const user = await User.findById(req.user.userId);
    
    if (!user.cryptoWallet.binanceConnected) {
      return res.status(400).json({ error: 'کیف پول بایننس متصل نیست' });
    }
    
    const order = await CryptoTradeService.sell(
      user.cryptoWallet.binanceApiKey,
      user.cryptoWallet.binanceSecret,
      symbol,
      amount
    );
    
    user.usageStats.tradesExecuted += 1;
    await user.save();
    
    await Trade.create({
      userId: user._id,
      exchange: 'binance',
      type: 'sell',
      symbol,
      amount,
      price: order.price,
      total: order.cumulativeQuoteQty,
      orderId: order.orderId,
      status: order.status.toLowerCase()
    });
    
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// تاریخچه معاملات
router.get('/history', auth, async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.user.userId })
      .sort({ executedAt: -1 })
      .limit(50);
    
    res.json({ success: true, trades });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
