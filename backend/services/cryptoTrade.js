const axios = require('axios');
const crypto = require('crypto');

class CryptoTradeService {
  // امضای درخواست
  static signRequest(params, secret) {
    const query = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return crypto
      .createHmac('sha256', secret)
      .update(query)
      .digest('hex');
  }
  
  // قیمت لحظه‌ای
  static async getPrice(symbol = 'BTCUSDT') {
    const response = await axios.get(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
    );
    return response.data.price;
  }
  
  // خرید
  static async buy(apiKey, secret, symbol, amount) {
    const params = {
      symbol,
      side: 'BUY',
      type: 'MARKET',
      quantity: amount,
      timestamp: Date.now()
    };
    
    const signature = this.signRequest(params, secret);
    
    const response = await axios.post(
      'https://api.binance.com/api/v3/order',
      null,
      {
        params: { ...params, signature },
        headers: { 'X-MBX-APIKEY': apiKey }
      }
    );
    
    return response.data;
  }
  
  // فروش
  static async sell(apiKey, secret, symbol, amount) {
    const params = {
      symbol,
      side: 'SELL',
      type: 'MARKET',
      quantity: amount,
      timestamp: Date.now()
    };
    
    const signature = this.signRequest(params, secret);
    
    const response = await axios.post(
      'https://api.binance.com/api/v3/order',
      null,
      {
        params: { ...params, signature },
        headers: { 'X-MBX-APIKEY': apiKey }
      }
    );
    
    return response.data;
  }
  
  // سیگنال هوشمند
  static async getSignal(symbol) {
    const response = await axios.get(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=24`
    );
    
    const prices = response.data.map(k => parseFloat(k[4]));
    const sma = prices.reduce((a, b) => a + b, 0) / prices.length;
    const currentPrice = prices[prices.length - 1];
    
    if (currentPrice > sma * 1.02) {
      return { signal: 'SELL', confidence: 70, reason: 'Price above SMA' };
    } else if (currentPrice < sma * 0.98) {
      return { signal: 'BUY', confidence: 70, reason: 'Price below SMA' };
    } else {
      return { signal: 'HOLD', confidence: 50, reason: 'Price near SMA' };
    }
  }
}

module.exports = CryptoTradeService;
