import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/admin';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [autoTraderStats, setAutoTraderStats] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      const [statsRes, autoTraderRes, revenueRes] = await Promise.all([
        axios.get(`${API_BASE}/stats`),
        axios.get(`${API_BASE}/auto-trader/stats`),
        axios.get(`${API_BASE}/revenue/daily`)
      ]);
      
      setStats(statsRes.data.stats);
      setAutoTraderStats(autoTraderRes.data.stats);
      setRevenue(revenueRes.data.revenue);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="dashboard-loading">
        <h1>در حال بارگذاری...</h1>
      </div>
    );
  }
  
  return (
    <div className="admin-dashboard">
      <h1>📊 داشبورد مدیریت</h1>
      
      {/* آمار کلی */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>👥 کاربران</h3>
          <p className="stat-value">{stats?.users || 0}</p>
        </div>
        
        <div className="stat-card">
          <h3>💰 درآمد کل</h3>
          <p className="stat-value">{(stats?.revenue || 0).toLocaleString()} تومان</p>
        </div>
        
        <div className="stat-card">
          <h3>🎬 ویدیوها</h3>
          <p className="stat-value">{stats?.videos || 0}</p>
        </div>
        
        <div className="stat-card">
          <h3>📈 معاملات</h3>
          <p className="stat-value">{stats?.trades || 0}</p>
        </div>
      </div>
      
      {/* آمار Auto Trader */}
      <div className="section">
        <h2>🤖 آمار Auto Trader</h2>
        
        <div className="stats-grid">
          <div className="stat-card">
            <h3>📊 کل معاملات</h3>
            <p className="stat-value">{autoTraderStats?.totalTrades || 0}</p>
          </div>
          
          <div className="stat-card success">
            <h3>✅ معاملات برنده</h3>
            <p className="stat-value">{autoTraderStats?.winningTrades || 0}</p>
          </div>
          
          <div className="stat-card danger">
            <h3>❌ معاملات بازنده</h3>
            <p className="stat-value">{autoTraderStats?.losingTrades || 0}</p>
          </div>
          
          <div className="stat-card">
            <h3>🎯 نرخ برد</h3>
            <p className="stat-value">{autoTraderStats?.winRate || 0}%</p>
          </div>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <h3>💵 سود کل</h3>
            <p className="stat-value">${autoTraderStats?.totalProfit?.toFixed(2) || 0}</p>
          </div>
          
          <div className="stat-card success">
            <h3>💰 پورسانت تو (20%)</h3>
            <p className="stat-value">${autoTraderStats?.yourCommission?.toFixed(2) || 0}</p>
          </div>
          
          <div className="stat-card">
            <h3>👤 سود کاربران</h3>
            <p className="stat-value">${autoTraderStats?.userProfit?.toFixed(2) || 0}</p>
          </div>
          
          <div className="stat-card">
            <h3>👥 کاربران فعال</h3>
            <p className="stat-value">{autoTraderStats?.activeUsers || 0}</p>
          </div>
        </div>
      </div>
      
      {/* نمودار درآمد روزانه */}
      <div className="section">
        <h2>📈 درآمد روزانه (۷ روز آخر)</h2>
        
        <div className="chart-container">
          {revenue.map((day, index) => (
            <div key={index} className="bar-chart">
              <div className="bar-label">{day._id}</div>
              <div 
                className="bar" 
                style={{ 
                  height: `${Math.min((day.total / 1000000) * 100, 200)}px`,
                  width: '40px'
                }}
              ></div>
              <div className="bar-value">{(day.total / 1000).toLocaleString()}k</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* لینک‌های سریع */}
      <div className="section">
        <h2>🔗 لینک‌های سریع</h2>
        
        <div className="quick-links">
          <a href="/admin/users" className="link-card">
            <h3>👥 مدیریت کاربران</h3>
            <p>مشاهده و مدیریت کاربران</p>
          </a>
          
          <a href="/admin/transactions" className="link-card">
            <h3>💰 تراکنش‌ها</h3>
            <p>مشاهده تراکنش‌های اخیر</p>
          </a>
          
          <a href="/admin/auto-trader" className="link-card">
            <h3>🤖 Auto Trader</h3>
            <p>تنظیمات و معاملات خودکار</p>
          </a>
          
          <a href="/admin/settings" className="link-card">
            <h3>⚙️ تنظیمات</h3>
            <p>تنظیمات سیستم</p>
          </a>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
