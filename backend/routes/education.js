const express = require('express');
const router = express.Router();

// آموزش‌ها
const tutorials = [
  {
    id: 1,
    title: 'آموزش ساخت ویدیو با AI',
    category: 'video',
    content: 'برای ساخت ویدیو کافیه متن خودت رو وارد کنی...',
    videoUrl: 'https://example.com/tutorial1.mp4'
  },
  {
    id: 2,
    title: 'راهنمای ترید ارز دیجیتال',
    category: 'crypto',
    content: 'اول باید کیف پول بایننس رو متصل کنی...',
    videoUrl: 'https://example.com/tutorial2.mp4'
  },
  {
    id: 3,
    title: 'آموزش برنامه‌نویسی با AI',
    category: 'code',
    content: 'می‌تونی کد پایتون، جاوااسکریپت و... تولید کنی...',
    videoUrl: 'https://example.com/tutorial3.mp4'
  }
];

// دریافت آموزش‌ها
router.get('/tutorials', (req, res) => {
  const { category } = req.query;
  
  let filtered = tutorials;
  if (category) {
    filtered = tutorials.filter(t => t.category === category);
  }
  
  res.json({ success: true, tutorials: filtered });
});

// سوالات متداول
const faqs = [
  {
    question: 'چطور می‌تونم Credit بخرم؟',
    answer: 'از صفحه پرداخت می‌تونی بسته‌های مختلف رو بخری.'
  },
  {
    question: 'آیا می‌تونم ویدیوها رو دانلود کنم؟',
    answer: 'بله، تمام ویدیوها قابل دانلود هستن.'
  },
  {
    question: 'ترید خودکار چطور کار می‌کنه؟',
    answer: 'بعد از اتصال کیف پول بایننس، می‌تونی سیگنال‌ها رو ببینی و خودکار ترید کنی.'
  }
];

router.get('/faqs', (req, res) => {
  res.json({ success: true, faqs });
});

module.exports = router;
