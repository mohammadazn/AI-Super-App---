const express = require('express');
const { auth } = require('./auth');
const User = require('../models/User');
const Video = require('../models/Video');
const AIVideoService = require('../services/aiVideo');
const router = express.Router();

// ساخت ویدیو از متن
router.post('/generate', auth, async (req, res) => {
  try {
    const { prompt, style, aspectRatio } = req.body;
    const VIDEO_COST = 5000;
    
    const user = await User.findById(req.user.userId);
    
    if (user.credits < VIDEO_COST) {
      return res.status(402).json({ 
        success: false, 
        error: 'Credit کافی ندارید',
        currentCredits: user.credits,
        requiredCredits: VIDEO_COST
      });
    }
    
    // کسر Credit
    user.credits -= VIDEO_COST;
    user.usageStats.videosCreated += 1;
    await user.save();
    
    // ساخت ویدیو
    const video = await AIVideoService.generateVideo({
      prompt,
      style: style || 'realistic',
      aspectRatio: aspectRatio || '9:16'
    });
    
    // ذخیره در دیتابیس
    const videoDoc = await Video.create({
      userId: user._id,
      type: 'generated',
      prompt,
      videoUrl: video.url,
      thumbnailUrl: video.thumbnail,
      duration: video.duration,
      creditsUsed: VIDEO_COST,
      metadata: { model: video.model, style }
    });
    
    res.json({
      success: true,
      video: videoDoc,
      remainingCredits: user.credits
    });
    
  } catch (error) {
    console.error('Video Generate Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ادیت برای اینستاگرام
router.post('/edit/instagram', auth, async (req, res) => {
  try {
    const { videoUrl } = req.body;
    const EDIT_COST = 3000;
    
    const user = await User.findById(req.user.userId);
    
    if (user.credits < EDIT_COST) {
      return res.status(402).json({ error: 'Credit کافی ندارید' });
    }
    
    user.credits -= EDIT_COST;
    user.usageStats.videosEdited += 1;
    await user.save();
    
    const edited = await AIVideoService.editForInstagram(videoUrl);
    
    const videoDoc = await Video.create({
      userId: user._id,
      type: 'edited_instagram',
      prompt: 'Instagram Edit',
      videoUrl: edited.url,
      creditsUsed: EDIT_COST,
      aspectRatio: '9:16'
    });
    
    res.json({ success: true, video: videoDoc, remainingCredits: user.credits });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ادیت برای یوتیوب
router.post('/edit/youtube', auth, async (req, res) => {
  try {
    const { videoUrl } = req.body;
    const EDIT_COST = 3000;
    
    const user = await User.findById(req.user.userId);
    
    if (user.credits < EDIT_COST) {
      return res.status(402).json({ error: 'Credit کافی ندارید' });
    }
    
    user.credits -= EDIT_COST;
    user.usageStats.videosEdited += 1;
    await user.save();
    
    const edited = await AIVideoService.editForYouTube(videoUrl);
    
    const videoDoc = await Video.create({
      userId: user._id,
      type: 'edited_youtube',
      prompt: 'YouTube Edit',
      videoUrl: edited.url,
      creditsUsed: EDIT_COST,
      aspectRatio: '16:9'
    });
    
    res.json({ success: true, video: videoDoc, remainingCredits: user.credits });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// دریافت ویدیوهای کاربر
router.get('/my-videos', auth, async (req, res) => {
  try {
    const videos = await Video.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ success: true, videos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
