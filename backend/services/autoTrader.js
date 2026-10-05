const axios = require('axios');
const Trade = require('../models/Trade');
const User = require('../models/User');
const CryptoTradeService = require('./cryptoTrade');

class AutoTraderService {
  constructor() {
    this.activeTrades = new Map(); // معاملات فعال
    // ⬇️ تغییر: هر ۳ دقیقه تحلیل می‌کنه
    this.analysisInterval = 3 * 60 * 1000; // 3 دقیقه
    
    // شروع تحلیل خودکار
    setInterval(() => this.analyzeAndTrade(), this.analysisInterval);
    
    console.log('🤖 Auto Trader started - analyzing every 3 minutes');
  }
  
  // تحلیل و ترید خودکار
  async analyzeAndTrade() {
    console.log(`🔍 [${new Date().toLocaleTimeString()}] Analyzing market...`);
    
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']; // ارزهای تحت تحلیل
    
    for (const symbol of symbols) {
      try {
        // دریافت داده‌های بازار
        const marketData = await this.getMarketData(symbol);
        
        // تحلیل تکنیکال
        const technicalAnalysis = this.technicalAnalysis(marketData);
        
        // تحلیل با هوش مصنوعی
        const aiAnalysis = await this.aiAnalysis(symbol, marketData);
        
        // تصمیم‌گیری نهایی
        const signal = this.makeDecision(technicalAnalysis, aiAnalysis);
        
        console.log(`📊 ${symbol} Signal: ${signal.action} (Confidence: ${signal.confidence}%)`);
        
        // اجرا کردن سیگنال
        if (signal.action !== 'HOLD' && signal.confidence >= 60) { // ⬅️ تغییر: فقط سیگنال‌های با اطمینان بالا
          await this.executeSignal(symbol, signal);
        }
        
      } catch (error) {
        console.error(`❌ Error analyzing ${symbol}:`, error.message);
      }
    }
  }
  
  // دریافت داده‌های بازار
  async getMarketData(symbol) {
    // ⬇️ تغییر: دریافت کندل‌های ۱۵ دقیقه‌ای برای تحلیل دقیق‌تر
    const response = await axios.get(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=15m&limit=50`
    );
    
    const candles = response.data.map(c => ({
      time: c[0],
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[5])
    }));
    
    // دریافت قیمت لحظه‌ای
    const priceResponse = await axios.get(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
    );
    
    return {
      candles,
      currentPrice: parseFloat(priceResponse.data.price),
      priceChange24h: this.calculatePriceChange(candles)
    };
  }
  
  // تحلیل تکنیکال
  technicalAnalysis(marketData) {
    const { candles, currentPrice } = marketData;
    const closes = candles.map(c => c.close);
    
    // محاسبه RSI
    const rsi = this.calculateRSI(closes, 14);
    
    // محاسبه MACD
    const macd = this.calculateMACD(closes);
    
    // محاسبه Moving Average
    const ma20 = this.calculateMA(closes, 20);
    const ma50 = this.calculateMA(closes, 50);
    const ma200 = this.calculateMA(closes, 200);
    
    // ⬇️ تغییر: اضافه کردن Bollinger Bands برای تشخیص نوسان
    const bb = this.calculateBollingerBands(closes, 20);
    
    // سیگنال‌ها
    let buySignals = 0;
    let sellSignals = 0;
    const signals = [];
    
    // RSI Signals
    if (rsi < 30) {
      buySignals += 2; // Oversold - سیگنال قوی
      signals.push('RSI Oversold');
    } else if (rsi < 40) {
      buySignals += 1;
      signals.push('RSI Low');
    } else if (rsi > 70) {
      sellSignals += 2; // Overbought - سیگنال قوی
      signals.push('RSI Overbought');
    } else if (rsi > 60) {
      sellSignals += 1;
      signals.push('RSI High');
    }
    
    // MACD Signals
    if (macd.histogram > 0 && macd.histogram > macd.prevHistogram) {
      buySignals++;
      signals.push('MACD Bullish');
    } else if (macd.histogram < 0 && macd.histogram < macd.prevHistogram) {
      sellSignals++;
      signals.push('MACD Bearish');
    }
    
    // Moving Average Signals
    if (currentPrice > ma20 && ma20 > ma50 && ma50 > ma200) {
      buySignals += 2; // روند صعودی قوی
      signals.push('Strong Uptrend');
    } else if (currentPrice < ma20 && ma20 < ma50 && ma50 < ma200) {
      sellSignals += 2; // روند نزولی قوی
      signals.push('Strong Downtrend');
    } else if (currentPrice > ma50 && ma50 > ma200) {
      buySignals++;
      signals.push('Uptrend');
    } else if (currentPrice < ma50 && ma50 < ma200) {
      sellSignals++;
      signals.push('Downtrend');
    }
    
    // ⬇️ تغییر: Bollinger Bands Signals
    if (currentPrice < bb.lower) {
      buySignals += 2; // قیمت پایین‌تر از باند پایینی - احتمال برگشت
      signals.push('Price Below BB Lower');
    } else if (currentPrice > bb.upper) {
      sellSignals += 2; // قیمت بالاتر از باند بالایی - احتمال برگشت
      signals.push('Price Above BB Upper');
    }
    
    // Golden/Death Cross
    const ma50Prev = this.calculateMA(closes.slice(0, -1), 50);
    const ma200Prev = this.calculateMA(closes.slice(0, -1), 200);
    
    if (ma50 > ma200 && ma50Prev <= ma200Prev) {
      buySignals += 3; // Golden Cross - سیگنال خیلی قوی
      signals.push('Golden Cross!');
    } else if (ma50 < ma200 && ma50Prev >= ma200Prev) {
      sellSignals += 3; // Death Cross - سیگنال خیلی قوی
      signals.push('Death Cross!');
    }
    
    const recommendation = buySignals > sellSignals ? 'BUY' : sellSignals > buySignals ? 'SELL' : 'HOLD';
    
    return {
      rsi,
      macd,
      ma20,
      ma50,
      ma200,
      bollinger: bb,
      buySignals,
      sellSignals,
      signals,
      recommendation,
      strength: Math.abs(buySignals - sellSignals)
    };
  }
  
  // تحلیل با هوش مصنوعی
  async aiAnalysis(symbol, marketData) {
    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are an expert crypto trader with 10 years experience. Analyze the market carefully and give a clear BUY/SELL/HOLD recommendation with confidence percentage. Be conservative and risk-averse.'
            },
            {
              role: 'user',
              content: `
Analyze ${symbol} for a 3-minute trading strategy:

Current Price: $${marketData.currentPrice}
24h Change: ${marketData.priceChange24h.toFixed(2)}%

Technical Indicators:
- RSI (14): ${marketData.technical.rsi.toFixed(2)}
- MA20: $${marketData.technical.ma20.toFixed(2)}
- MA50: $${marketData.technical.ma50.toFixed(2)}
- MA200: $${marketData.technical.ma200.toFixed(2)}
- Bollinger Upper: $${marketData.technical.bollinger.upper.toFixed(2)}
- Bollinger Lower: $${marketData.technical.bollinger.lower.toFixed(2)}

Technical Signals: ${marketData.technical.signals.join(', ')}
Technical Recommendation: ${marketData.technical.recommendation}

Give recommendation: BUY, SELL, or HOLD
Also provide confidence percentage (0-100%)
Explain your reasoning in one short sentence.
              `
            }
          ],
          temperature: 0.3, // ⬅️ تغییر: کمتر برای تصمیم‌گیری محافظه‌کارانه
          max_tokens: 200
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const analysis = response.data.choices[0].message.content;
      
      // استخراج سیگنال از متن
      const action = analysis.includes('BUY') ? 'BUY' : analysis.includes('SELL') ? 'SELL' : 'HOLD';
      const confidenceMatch = analysis.match(/(d+)%/);
      const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;
      
      return { 
        action, 
        confidence, 
        analysis,
        reasoning: analysis.split('
').pop() // آخرین جمله به عنوان دلیل
      };
      
    } catch (error) {
      console.error('AI Analysis Error:', error.message);
      return { action: 'HOLD', confidence: 0, reasoning: 'Error in AI analysis' };
    }
  }
  
  // تصمیم‌گیری نهایی
  makeDecision(technical, ai) {
    // ⬇️ تغییر: فقط اگر هر دو تحلیل هم‌سو بودن و اطمینان بالا بود
    if (technical.recommendation === ai.action) {
      const combinedConfidence = (technical.strength * 10) + ai.confidence;
      
      // فقط سیگنال‌های با اطمینان بالا (بالای ۶۰٪)
      if (combinedConfidence >= 60) {
        return {
          action: technical.recommendation,
          confidence: Math.min(combinedConfidence, 100),
          reasoning: `Technical: ${technical.signals.join(', ')} | AI: ${ai.reasoning}`
        };
      }
    }
    
    // اگر تحلیل‌ها متفاوت بود یا اطمینان پایین بود
    return {
      action: 'HOLD',
      confidence: 0,
      reasoning: 'Signals conflicting or low confidence'
    };
  }
  
  // اجرای سیگنال
  async executeSignal(symbol, signal) {
    // پیدا کردن کاربرانی که Auto-Trading روشن هست
    const users = await User.find({
      'preferences.tradingStrategy.autoTrade': true,
      'cryptoWallet.binanceConnected': true
    });
    
    for (const user of users) {
      try {
        // ⬇️ تغییر: بررسی اینکه کاربر قبلاً معامله باز نداره
        const hasActiveTrade = this.activeTrades.has(user._id.toString());
        
        if (signal.action === 'BUY' && !hasActiveTrade) {
          // ⬇️ تغییر: مقدار معامله بر اساس تنظیمات کاربر
          const tradeAmount = user.preferences.tradingStrategy.tradeAmount || 10; // دلار
          
          const order = await CryptoTradeService.buy(
            user.cryptoWallet.binanceApiKey,
            user.cryptoWallet.binanceSecret,
            symbol,
            tradeAmount
          );
          
          // ذخیره معامله
          await Trade.create({
            userId: user._id,
            exchange: 'binance',
            type: 'buy',
            symbol,
            amount: order.executedQty,
            price: order.price,
            total: order.cumulativeQuoteQty,
            orderId: order.orderId,
            signal: 'auto_signal',
            metadata: {
              confidence: signal.confidence,
              reasoning: signal.reasoning
            }
          });
          
          // ⬇️ تغییر: ذخیره با اطلاعات استاپ لاس و تیک پروفیت
          this.activeTrades.set(user._id.toString(), {
            symbol,
            buyPrice: order.price,
            amount: order.executedQty,
            orderId: order.orderId,
            stopLoss: order.price * 0.95, // 5% ضرر
            takeProfit: order.price * 1.10, // 10% سود
            createdAt: Date.now()
          });
          
          console.log(`✅ ${user.phone} - BUY ${symbol} at $${order.price} (Confidence: ${signal.confidence}%)`);
          
        } else if (signal.action === 'SELL' && hasActiveTrade) {
          // فروش
          const trade = this.activeTrades.get(user._id.toString());
          
          if (trade.symbol === symbol) {
            const order = await CryptoTradeService.sell(
              user.cryptoWallet.binanceApiKey,
              user.cryptoWallet.binanceSecret,
              symbol,
              trade.amount
            );
            
            // محاسبه سود
            const profit = (order.price - trade.buyPrice) * trade.amount;
            const profitPercent = ((order.price - trade.buyPrice) / trade.buyPrice) * 100;
            
            // محاسبه پورسانت تو (20% از سود)
            const yourCommission = profit * 0.20;
            const userProfit = profit - yourCommission;
            
            // ذخیره معامله
            await Trade.create({
              userId: user._id,
              exchange: 'binance',
              type: 'sell',
              symbol,
              amount: order.executedQty,
              price: order.price,
              total: order.cumulativeQuoteQty,
              orderId: order.orderId,
              signal: 'auto_signal',
              profit: profit,
              profitPercent: profitPercent,
              yourCommission: yourCommission,
              userProfit: userProfit,
              status: 'filled',
              metadata: {
                heldFor: Date.now() - trade.createdAt, // مدت زمان نگهداری
                stopLossHit: order.price <= trade.stopLoss,
                takeProfitHit: order.price >= trade.takeProfit
              }
            });
            
            console.log(`✅ ${user.phone} - SELL ${symbol}`);
            console.log(`💰 Profit: $${profit.toFixed(2)} (${profitPercent.toFixed(2)}%)`);
            console.log(`📊 Your Commission: $${yourCommission.toFixed(2)}`);
            console.log(`👤 User Profit: $${userProfit.toFixed(2)}`);
            
            // حذف از معاملات فعال
            this.activeTrades.delete(user._id.toString());
          }
        }
        
      } catch (error) {
        console.error(`Error executing signal for ${user.phone}:`, error.message);
      }
    }
  }
  
  // ⬇️ تغییر: اضافه کردن تابع جدید برای بررسی خودکار استاپ لاس و تیک پروفیت
  async checkStopLossAndTakeProfit() {
    for (const [userId, trade] of this.activeTrades.entries()) {
      try {
        const currentPrice = await CryptoTradeService.getPrice(trade.symbol);
        
        // بررسی Stop Loss
        if (currentPrice <= trade.stopLoss) {
          console.log(`⚠️ Stop Loss hit for ${trade.symbol} - Selling...`);
          await this.executeStopLoss(userId, trade);
        }
        
        // بررسی Take Profit
        if (currentPrice >= trade.takeProfit) {
          console.log(`🎯 Take Profit hit for ${trade.symbol} - Selling...`);
          await this.executeTakeProfit(userId, trade);
        }
        
      } catch (error) {
        console.error('Error checking SL/TP:', error.message);
      }
    }
  }
  
  async executeStopLoss(userId, trade) {
    const user = await User.findById(userId);
    if (!user) return;
    
    const order = await CryptoTradeService.sell(
      user.cryptoWallet.binanceApiKey,
      user.cryptoWallet.binanceSecret,
      trade.symbol,
      trade.amount
    );
    
    const loss = (trade.buyPrice - order.price) * trade.amount;
    
    await Trade.create({
      userId: user._id,
      exchange: 'binance',
      type: 'sell',
      symbol: trade.symbol,
      amount: order.executedQty,
      price: order.price,
      total: order.cumulativeQuoteQty,
      orderId: order.orderId,
      signal: 'auto_signal',
      profit: -loss,
      status: 'filled',
      metadata: {
        reason: 'Stop Loss',
        stopLossPrice: trade.stopLoss
      }
    });
    
    this.activeTrades.delete(userId);
    console.log(`🛑 Stop Loss executed for ${user.phone} - Loss: $${loss.toFixed(2)}`);
  }
  
  async executeTakeProfit(userId, trade) {
    const user = await User.findById(userId);
    if (!user) return;
    
    const order = await CryptoTradeService.sell(
      user.cryptoWallet.binanceApiKey,
      user.cryptoWallet.binanceSecret,
      trade.symbol,
      trade.amount
    );
    
    const profit = (order.price - trade.buyPrice) * trade.amount;
    const yourCommission = profit * 0.20;
    const userProfit = profit - yourCommission;
    
    await Trade.create({
      userId: user._id,
      exchange: 'binance',
      type: 'sell',
      symbol: trade.symbol,
      amount: order.executedQty,
      price: order.price,
      total: order.cumulativeQuoteQty,
      orderId: order.orderId,
      signal: 'auto_signal',
      profit: profit,
      yourCommission: yourCommission,
      userProfit: userProfit,
      status: 'filled',
      metadata: {
        reason: 'Take Profit',
        takeProfitPrice: trade.takeProfit
      }
    });
    
    this.activeTrades.delete(userId);
    console.log(`🎯 Take Profit executed for ${user.phone} - Profit: $${profit.toFixed(2)}`);
  }
  
  // توابع کمکی
  calculateRSI(closes, period = 14) {
    if (closes.length < period + 1) return 50;
    
    let gains = 0, losses = 0;
    
    for (let i = closes.length - period; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period || 1;
    const rs = avgGain / avgLoss;
    
    return 100 - (100 / (1 + rs));
  }
  
  calculateMA(closes, period) {
    if (closes.length < period) return closes[closes.length - 1];
    const slice = closes.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }
  
  calculateMACD(closes) {
    const ema12 = this.calculateMA(closes, 12);
    const ema26 = this.calculateMA(closes, 26);
    const macd = ema12 - ema26;
    const signal = this.calculateMA([macd, macd * 0.9, macd * 0.8], 3);
    const histogram = macd - signal;
    
    return { macd, signal, histogram, prevHistogram: histogram * 0.9 };
  }
  
  // ⬇️ تغییر: تابع جدید برای محاسبه Bollinger Bands
  calculateBollingerBands(closes, period = 20) {
    if (closes.length < period) {
      return { upper: closes[closes.length - 1], middle: closes[closes.length - 1], lower: closes[closes.length - 1] };
    }
    
    const slice = closes.slice(-period);
    const middle = slice.reduce((a, b) => a + b, 0) / period;
    
    const squaredDiffs = slice.map(price => Math.pow(price - middle, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const stdDev = Math.sqrt(variance);
    
    const upper = middle + (2 * stdDev);
    const lower = middle - (2 * stdDev);
    
    return { upper, middle, lower };
  }
  
  calculatePriceChange(candles) {
    const oldPrice = candles[0].close;
    const newPrice = candles[candles.length - 1].close;
    return ((newPrice - oldPrice) / oldPrice) * 100;
  }
}

module.exports = new AutoTraderService();
