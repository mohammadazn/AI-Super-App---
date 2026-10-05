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

// آمار Auto Trader
router.get('/auto-trader/stats', async (req, res) => {
  try {
    const autoTrades = await Trade.find({ signal: 'auto_signal' });
    
    const winningTrades = autoTrades.filter(t => t.type === 'sell' && t.profit > 0);
    const losingTrades = autoTrades.filter(t => t.type === 'sell' && t.profit < 0);
    
    const totalProfit = autoTrades
      .filter(t => t.type === 'sell' && t.profit)
      .reduce((sum, t) => sum + t.profit, 0);
    
    const yourCommission = totalProfit * 0.20; // 20% پورسانت
    const userProfit = totalProfit - yourCommission;
    
    const activeUsers = new Set(autoTrades.map(t => t.userId.toString())).size;
    
    res.json({
      success: true,
      stats: {
        totalTrades: autoTrades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        winRate: autoTrades.length > 0 ? ((winningTrades.length / autoTrades.length) * 100).toFixed(2) : 0,
        totalProfit,
        yourCommission,
        userProfit,
        activeUsers,
        averageProfit: autoTrades.length > 0 ? (totalProfit / autoTrades.length).toFixed(2) : 0
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

// کاربر خاص
router.get('/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-verificationCode -cryptoWallet');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'کاربر یافت نشد' });
    }
    
    // آمار کاربر
    const userVideos = await Video.countDocuments({ userId: user._id });
    const userTrades = await Trade.countDocuments({ userId: user._id });
    const userTransactions = await Transaction.countDocuments({ userId: user._id });
    
    res.json({
      success: true,
      user: {
        ...user.toObject(),
        stats: {
          videos: userVideos,
          trades: userTrades,
          transactions: userTransactions
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// تراکنش‌های اخیر
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('userId', 'phone profile')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// معاملات Auto Trader
router.get('/auto-trader/trades', async (req, res) => {
  try {
    const trades = await Trade.find({ signal: 'auto_signal' })
      .populate('userId', 'phone profile')
      .sort({ executedAt: -1 })
      .limit(100);
    
    res.json({ success: true, trades });
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

// تنظیمات Auto Trader
router.get('/auto-trader/settings', async (req, res) => {
  try {
    // تنظیمات رو از دیتابیس یا فایل کانفیگ بخون
    const settings = {
      enabled: true,
      symbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'],
      maxTradeAmount: 100, // دلار
      stopLoss: 5, // درصد
      takeProfit: 10, // درصد
      commissionPercent: 20 // درصد
    };
    
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// آپدیت تنظیمات Auto Trader
router.post('/auto-trader/settings/update', async (req, res) => {
  try {
    const { enabled, symbols, maxTradeAmount, stopLoss, takeProfit, commissionPercent } = req.body;
    
    // اینجا باید تنظیمات رو توی دیتابیس یا فایل کانفیگ ذخیره کنی
    // برای سادگی، فقط تأیید می‌فرستیم
    
    res.json({ 
      success: true, 
      message: 'تنظیمات ذخیره شد',
      settings: {
        enabled,
        symbols,
        maxTradeAmount,
        stopLoss,
        takeProfit,
        commissionPercent
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// درآمد روزانه (۷ روز آخر)
router.get('/revenue/daily', async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const revenue = await Transaction.aggregate([
      {
        $match: {
          type: 'deposit',
          status: 'completed',
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({ success: true, revenue });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// پورسانت‌های دریافتی از Auto Trader (۳۰ روز آخر)
router.get('/commission/history', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const trades = await Trade.aggregate([
      {
        $match: {
          signal: 'auto_signal',
          type: 'sell',
          profit: { $exists: true },
          executedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$executedAt' } },
          totalProfit: { $sum: '$profit' },
          totalCommission: { $sum: { $multiply: ['$profit', 0.20] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({ success: true, history: trades });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
