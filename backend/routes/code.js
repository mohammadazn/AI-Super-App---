const express = require('express');
const { auth } = require('./auth');
const User = require('../models/User');
const AICodeService = require('../services/aiCode');
const router = express.Router();

// تولید کد
router.post('/generate', auth, async (req, res) => {
  try {
    const { prompt, language } = req.body;
    const CODE_COST = 2000;
    
    const user = await User.findById(req.user.userId);
    
    if (user.credits < CODE_COST) {
      return res.status(402).json({ 
        success: false, 
        error: 'Credit کافی ندارید',
        currentCredits: user.credits
      });
    }
    
    user.credits -= CODE_COST;
    user.usageStats.codesGenerated += 1;
    await user.save();
    
    const code = await AICodeService.generateCode(prompt, language || 'javascript');
    
    res.json({
      success: true,
      code,
      language: language || 'javascript',
      remainingCredits: user.credits
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// توضیح کد
router.post('/explain', auth, async (req, res) => {
  try {
    const { code } = req.body;
    
    const explanation = await AICodeService.explainCode(code);
    
    res.json({ success: true, explanation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
