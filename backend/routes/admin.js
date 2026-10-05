const express = require('express');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Video = require('../models/Video');
const Trade = require('../models/Trade');
const Wallet = require('../models/Wallet');
const router = express.Router();

// آمار کلی
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    const totalVideos = await Video.countDocuments();
    const totalTrades = await Trade.countDocuments();
    
    const revenue = await Transaction.aggregate([
      { $match: { type: 'deposit', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    res.json({
      success: true,
      stats: {
        users: totalUsers,
        transactions: totalTransactions,
        videos: totalVideos,
        trades: totalTrades,
        revenue: revenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// لیست کاربران
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('-verificationCode -cryptoWallet')
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// تنظیمات Auto-Recharge
router.get('/auto-recharge', async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ type: 'admin' });
    res.json({ success: true, settings: wallet?.autoRecharge || {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// آپدیت Auto-Recharge
router.post('/auto-recharge/update', async (req, res) => {
  try {
    const { enabled, triggerBalance, rechargeAmount } = req.body;
    
    const wallet = await Wallet.findOneAndUpdate(
      { type: 'admin' },
      {
        'autoRecharge.enabled': enabled,
        'autoRecharge.triggerBalance': triggerBalance,
        'autoRecharge.rechargeAmount': rechargeAmount
      },
      { upsert: true, new: true }
    );
    
    res.json({ success: true, settings: wallet.autoRecharge });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
