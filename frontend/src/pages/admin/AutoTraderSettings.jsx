import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/admin';

function AutoTraderSettings() {
  const [settings, setSettings] = useState({
    enabled: true,
    symbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'],
    maxTradeAmount: 100,
    stopLoss: 5,
    takeProfit: 10,
    commissionPercent: 20
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    fetchSettings();
  }, []);
  
  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE}/auto-trader/settings`);
      setSettings(response.data.settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };
  
  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      await axios.post(`${API_BASE}/auto-trader/settings/update`, settings);
      setMessage('✅ تنظیمات با موفقیت ذخیره شد');
    } catch (error) {
      setMessage('❌ خطا در ذخیره تنظیمات');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="settings-page">
      <h1>⚙️ تنظیمات Auto Trader</h1>
      
      {message && <div className="message">{message}</div>}
      
      <div className="settings-form">
        <div className="form-group">
          <label>وضعیت Auto Trader:</label>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
          />
          <span>{settings.enabled ? '✅ فعال' : '❌ غیرفعال'}</span>
        </div>
        
        <div className="form-group">
          <label>ارزهای تحت معامله:</label>
          <input
            type="text"
            value={settings.symbols.join(', ')}
            onChange={(e) => setSettings({
              ...settings,
              symbols: e.target.value.split(',').map(s => s.trim().toUpperCase())
            })}
            placeholder="BTCUSDT, ETHUSDT, BNBUSDT"
          />
        </div>
        
        <div className="form-group">
          <label>حداکثر مقدار هر معامله (دلار):</label>
          <input
            type="number"
            value={settings.maxTradeAmount}
            onChange={(e) => setSettings({ ...settings, maxTradeAmount: Number(e.target.value) })}
          />
        </div>
        
        <div className="form-group">
          <label>حد ضرر (Stop Loss) - درصد:</label>
          <input
            type="number"
            value={settings.stopLoss}
            onChange={(e) => setSettings({ ...settings, stopLoss: Number(e.target.value) })}
          />
        </div>
        
        <div className="form-group">
          <label>حد سود (Take Profit) - درصد:</label>
          <input
            type="number"
            value={settings.takeProfit}
            onChange={(e) => setSettings({ ...settings, takeProfit: Number(e.target.value) })}
          />
        </div>
        
        <div className="form-group">
          <label>پورسانت شما - درصد:</label>
          <input
            type="number"
            value={settings.commissionPercent}
            onChange={(e) => setSettings({ ...settings, commissionPercent: Number(e.target.value) })}
          />
        </div>
        
        <button 
          className="save-btn"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'در حال ذخیره...' : '💾 ذخیره تنظیمات'}
        </button>
      </div>
    </div>
  );
}

export default AutoTraderSettings;
