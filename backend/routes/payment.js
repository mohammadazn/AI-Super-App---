const express = require('express');
const axios = require('axios');
const { auth } = require('./auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const router = express.Router();

// ایجاد فاکتور زرین‌پال
router.post('/create', auth, async (req, res) => {
  try {
    const { amount } = req.body; // تومان
    const credits = Math.floor(amount / 1000); // هر 1000 تومان = 1 Credit
    
    const response = await axios.post('https://api.zarinpal.com/pg/v4/payment/request.json', {
      merchant_id: process.env.ZARINPAL_MERCHANT_ID,
      amount: amount,
      callback_url: `${process.env.FRONTEND_URL}/payment/verify`,
      description: `خرید ${credits} Credit`,
      metadata: { userId: req.user.userId }
    });
    
    const { authority } = response.data.data;
    
    // ذخیره تراکنش
    await Transaction.create({
      userId: req.user.userId,
      type: 'deposit',
      amount,
      credits,
      paymentMethod: 'zarinpal',
      paymentDetails: { authority },
      status: 'pending'
    });
    
    res.json({
      success: true,
      authority,
      url: `https://www.zarinpal.com/pg/StartPay/${authority}`
    });
    
  } catch (error) {
    console.error('Payment Error:', error);
    res.status(500).json({ success: false, error: 'خطا در ایجاد پرداخت' });
  }
});

// تأیید پرداخت
router.get('/verify', auth, async (req, res) => {
  try {
    const { authority, Status } = req.query;
    
    if (Status !== 'OK') {
      return res.json({ success: false, error: 'پرداخت لغو شد' });
    }
    
    const transaction = await Transaction.findOne({ 
      'paymentDetails.authority': authority 
    }).sort({ createdAt: -1 });
    
    if (!transaction || transaction.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'تراکنش نامعتبر' });
    }
    
    // تأیید نهایی
    const response = await axios.post('https://api.zarinpal.com/pg/v4/payment/verify.json', {
      merchant_id: process.env.ZARINPAL_MERCHANT_ID,
      authority,
      amount: transaction.amount
    });
    
    if (response.data.data.code === 100) {
      // پرداخت موفق
      const user = await User.findById(req.user.userId);
      user.credits += transaction.credits;
      user.usageStats.totalSpent += transaction.amount;
      await user.save();
      
      transaction.status = 'completed';
      transaction.paymentDetails.refId = response.data.data.ref_id;
      await transaction.save();
      
      res.json({ 
        success: true, 
        credits: transaction.credits,
        message: 'پرداخت موفقیت‌آمیز بود' 
      });
    } else {
      transaction.status = 'failed';
      await transaction.save();
      
      res.status(400).json({ success: false, error: 'پرداخت ناموفق' });
    }
    
  } catch (error) {
    console.error('Verify Error:', error);
    res.status(500).json({ success: false, error: 'خطا در تأیید پرداخت' });
  }
});

// بسته‌های Credit
router.get('/packages', (req, res) => {
  const packages = [
    { name: 'پایه', credits: 50000, price: 50000, bonus: 0 },
    { name: 'حرفه‌ای', credits: 200000, price: 200000, bonus: 20000 },
    { name: 'سازمانی', credits: 500000, price: 500000, bonus: 100000 }
  ];
  
  res.json({ success: true, packages });
});

module.exports = router;
