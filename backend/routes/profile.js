const express = require('express');
const { auth } = require('./auth');
const User = require('../models/User');
const router = express.Router();

// دریافت پروفایل
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-verificationCode -cryptoWallet');
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// آپدیت پروفایل
router.put('/update', auth, async (req, res) => {
  try {
    const { firstName, lastName, bio, location } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { 
        'profile.firstName': firstName,
        'profile.lastName': lastName,
        'profile.bio': bio,
        'profile.location': location
      },
      { new: true }
    );
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// آپلود آواتار
router.post('/avatar', auth, async (req, res) => {
  try {
    const { avatarUrl } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { 'profile.avatar': avatarUrl },
      { new: true }
    );
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// آمار کاربر
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    res.json({
      success: true,
      stats: {
        videosCreated: user.usageStats.videosCreated,
        codesGenerated: user.usageStats.codesGenerated,
        tradesExecuted: user.usageStats.tradesExecuted,
        totalSpent: user.usageStats.totalSpent,
        creditsRemaining: user.credits
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
