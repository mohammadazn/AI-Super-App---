const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const SMSService = require('../services/sms');
const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }
  next();
};

// ارسال کد تأیید
router.post('/send-code', [
  body('phone')
    .matches(/^09[0-9]{9}$/)
    .withMessage('شماره موبایل معتبر نیست')
  validate
], async (req, res) => {
  try {
    const { phone } = req.body;
    
    // ارسال SMS
    const result = await SMSService.sendVerificationCode(phone);
    
    if (!result.success) {
      return res.status(500).json({ 
        success: false, 
        error: 'خطا در ارسال پیامک' 
      });
    }
    
    // پیدا کردن یا ساخت کاربر
    let user = await User.findOne({ phone });
    
    if (!user) {
      user = await User.create({ 
        phone,
        verificationCode: {
          code: result.code,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          attempts: 0
        }
      });
    } else {
      user.verificationCode = {
        code: result.code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 0
      };
      await user.save();
    }
    
    res.json({ 
      success: true, 
      message: 'کد تأیید ارسال شد',
      userId: user._id,
      expiresIn: 300 // 5 minutes
    });
    
  } catch (error) {
    console.error('Send Code Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'خطای سرور' 
    });
  }
});

// تأیید کد و ورود
router.post('/verify-code', [
  body('userId').isMongoId().withMessage('userId نامعتبر است'),
  body('code').matches(/^[0-9]{6}$/).withMessage('کد ۶ رقمی وارد کنید'),
  validate
], async (req, res) => {
  try {
    const { userId, code } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'کاربر یافت نشد' 
      });
    }
    
    // بررسی تعداد تلاش‌ها
    if (user.verificationCode.attempts >= 5) {
      return res.status(429).json({ 
        success: false, 
        error: 'تعداد تلاش‌ها مجاز بیشتر شد. لطفاً دوباره درخواست کد دهید' 
      });
    }
    
    // بررسی کد
    if (user.verificationCode.code !== code) {
      user.verificationCode.attempts += 1;
      await user.save();
      
      return res.status(400).json({ 
        success: false, 
        error: 'کد تأیید اشتباه است',
        attemptsLeft: 5 - user.verificationCode.attempts
      });
    }
    
    // بررسی انقضا
    if (new Date() > user.verificationCode.expiresAt) {
      return res.status(400).json({ 
        success: false, 
        error: 'کد تأیید منقضی شده' 
      });
    }
    
    // تأیید کاربر
    user.verificationCode.verified = true;
    user.verificationCode.code = undefined;
    await user.save();
    
    // تولید JWT Token
    const token = jwt.sign(
      { userId: user._id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({
      success: true,
      message: 'ورود موفقیت‌آمیز بود',
      token,
      user: {
        id: user._id,
        phone: user.phone,
        profile: user.profile,
        credits: user.credits,
        subscription: user.subscription,
        createdAt: user.createdAt
      }
    });
    
  } catch (error) {
    console.error('Verify Code Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'خطای سرور' 
    });
  }
});

// Middleware احراز هویت
const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'احراز هویت لازم است' 
    });
  }
  
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      error: 'توکن نامعتبر است' 
    });
  }
};

// خروج
router.post('/logout', auth, async (req, res) => {
  res.json({
    success: true,
    message: 'خروج موفقیت‌آمیز بود'
  });
});

module.exports = { router, auth };
