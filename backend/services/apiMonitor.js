const axios = require('axios');
const Wallet = require('../models/Wallet');
const SMSService = require('./sms');

class APIMonitor {
  constructor() {
    this.providers = {
      groq: {
        key: process.env.GROQ_KEY,
        balance: 0,
        checkUrl: 'https://api.groq.com/openai/v1/balance',
        lastCheck: 0
      },
      gemini: {
        key: process.env.GEMINI_KEY,
        balance: 0,
        checkUrl: 'https://generativelanguage.googleapis.com/v1beta/billing',
        lastCheck: 0
      },
      replicate: {
        key: process.env.REPLICATE_KEY,
        balance: 0
      }
    };
    
    // چک کردن هر ۵ دقیقه
    setInterval(() => this.checkAllBalances(), 5 * 60 * 1000);
    
    console.log('🔍 API Monitor started - checking every 5 minutes');
  }
  
  async checkAllBalances() {
    console.log('🔍 Checking API balances...');
    
    for (const [name, provider] of Object.entries(this.providers)) {
      try {
        const balance = await this.checkBalance(name);
        provider.balance = balance;
        provider.lastCheck = Date.now();
        
        console.log(`💰 ${name.toUpperCase()} Balance: $${balance.toFixed(2)}`);
        
        // اگر موجودی کم بود → Auto-Recharge
        if (balance < 10 && name !== 'replicate') {
          console.log(`⚠️ ${name.toUpperCase()} balance low! Starting Auto-Recharge...`);
          await this.triggerAutoRecharge(name);
        }
      } catch (error) {
        console.error(`❌ Error checking ${name} balance:`, error.message);
      }
    }
  }
  
  async checkBalance(providerName) {
    const provider = this.providers[providerName];
    
    if (providerName === 'groq') {
      try {
        const response = await axios.get(provider.checkUrl, {
          headers: { 'Authorization': `Bearer ${provider.key}` },
          timeout: 5000
        });
        return response.data.balance || 0;
      } catch (error) {
        console.log('Groq balance check failed, using cached value');
        return provider.balance;
      }
    }
    
    if (providerName === 'gemini') {
      try {
        const response = await axios.get(provider.checkUrl, {
          headers: { 'Authorization': `Bearer ${provider.key}` },
          timeout: 5000
        });
        return response.data.prepayBalance || 0;
      } catch (error) {
        console.log('Gemini balance check failed, using cached value');
        return provider.balance;
      }
    }
    
    return provider.balance || 0;
  }
  
  async triggerAutoRecharge(providerName) {
    try {
      const wallet = await Wallet.findOne({ type: 'admin' });
      
      if (!wallet || !wallet.autoRecharge.enabled) {
        console.log('❌ Auto-Recharge disabled');
        return;
      }
      
      // بررسی موجودی زرین‌پال
      const zarinpalBalance = await this.getZarinpalBalance();
      const requiredAmount = wallet.autoRecharge.rechargeAmount * parseInt(process.env.USD_RATE || '60000');
      
      if (zarinpalBalance < requiredAmount) {
        console.log(`❌ Insufficient ZarinPal balance: ${zarinpalBalance} < ${requiredAmount}`);
        await this.sendAlertToAdmin(`⚠️ موجودی زرین‌پال کافی نیست!
موجودی: ${(zarinpalBalance/1000).toLocaleString()} هزار تومان
نیاز: ${(requiredAmount/1000).toLocaleString()} هزار تومان`);
        return;
      }
      
      // شروع خرید API Credit
      await this.purchaseAPICredit(providerName, wallet);
      
    } catch (error) {
      console.error('❌ Auto-Recharge error:', error.message);
      await this.sendAlertToAdmin(`❌ خطا در Auto-Recharge: ${error.message}`);
    }
  }
  
  async getZarinpalBalance() {
    // شبیه‌سازی - در واقعیت باید از API زرین‌پال بگیری
    return 10000000; // 10 میلیون تومان فرضی
  }
  
  async purchaseAPICredit(providerName, wallet) {
    const amount = wallet.autoRecharge.rechargeAmount; // $50
    
    try {
      console.log(`💳 Purchasing $${amount} credit for ${providerName}...`);
      
      if (providerName === 'groq') {
        await axios.post('https://console.groq.com/api/billing/credits', {
          amount: amount,
          payment_method: 'default'
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_ADMIN_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`✅ $${amount} credit added to Groq`);
      }
      
      if (providerName === 'gemini') {
        await axios.post(
          `https://cloud.google.com/billing/v1/projects/${process.env.GOOGLE_PROJECT_ID}:purchaseCredits`,
          { amount: amount },
          {
            headers: {
              'Authorization': `Bearer ${process.env.GOOGLE_ADMIN_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log(`✅ $${amount} credit added to Gemini`);
      }
      
      // کسر پول از زرین‌پال (شبیه‌سازی)
      const amountToman = amount * parseInt(process.env.USD_RATE || '60000');
      console.log(`💸 ${amountToman.toLocaleString()} تومان از زرین‌پال کسر شد`);
      
      // ثبت در تاریخچه
      wallet.transactions.push({
        type: 'api_purchase',
        amount: -amountToman,
        description: `Auto-Recharge ${providerName.toUpperCase()} - $${amount}`,
        createdAt: new Date()
      });
      
      wallet.autoRecharge.lastRecharge = new Date();
      await wallet.save();
      
      // ارسال نوتیفیکیشن به ادمین
      await this.sendAlertToAdmin(`✅ Auto-Recharge موفق!
${providerName.toUpperCase()}: $${amount}
هزینه: ${(amountToman/1000).toLocaleString()} هزار تومان`);
      
    } catch (error) {
      console.error('❌ API Credit purchase error:', error.message);
      throw error;
    }
  }
  
  async sendAlertToAdmin(message) {
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.ADMIN_CHAT_ID) {
      console.log('📱 Alert:', message);
      return;
    }
    
    try {
      await axios.post(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          chat_id: process.env.ADMIN_CHAT_ID,
          text: message,
          parse_mode: 'Markdown'
        },
        { timeout: 5000 }
      );
      console.log('📱 Telegram alert sent');
    } catch (error) {
      console.error('❌ Telegram error:', error.message);
    }
  }
}

module.exports = new APIMonitor();
