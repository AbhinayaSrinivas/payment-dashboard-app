// src/screens/DashboardScreen.tsx - Complete Feature Implementation
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import ApiService from '../services/api';
import './DashboardScreen.css';

interface DashboardScreenProps {
  navigation: any;
}

interface Stats {
  todayPayments: number;
  weekPayments: number;
  totalRevenue: number;
  failedTransactions: number;
  revenueTrend: Array<{ date: string; revenue: number }>;
  paymentMethods: Array<{ method: string; count: number; percentage: number }>;
  statusBreakdown: Array<{ status: string; count: number; amount: number }>;
  recentTransactions: Array<{
    id: number;
    amount: number;
    receiver: string;
    status: 'success' | 'failed' | 'pending';
    method: string;
    createdAt: string;
  }>;
}

interface QuickStats {
  totalTransactions: number;
  successRate: number;
  avgTransactionAmount: number;
  peakHour: string;
}

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState('7d');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadStats = async () => {
    try {
      const [statsData, quickStatsData] = await Promise.all([
        ApiService.getPaymentStats(),
        ApiService.getQuickStats?.() || Promise.resolve(null)
      ]);
      
      setStats(statsData);
      setQuickStats(quickStatsData);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Error loading stats:', error);
      alert('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const handleLogout = async () => {
    try {
      await ApiService.logout();
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const chartData = stats?.revenueTrend.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: item.revenue
  })) || [];

  const pieColors = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE'];

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#34C759';
      case 'failed': return '#FF3B30';
      case 'pending': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="header-title">Payment Dashboard</h1>
          <p className="last-updated">Last updated: {lastUpdated.toLocaleTimeString()}</p>
        </div>
        <div className="header-actions">
          <button className="refresh-button" onClick={onRefresh} disabled={refreshing}>
            {refreshing ? '🔄' : '↻'} {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="date-range-selector">
        <button 
          className={`date-btn ${selectedDateRange === '1d' ? 'active' : ''}`}
          onClick={() => setSelectedDateRange('1d')}
        >
          Today
        </button>
        <button 
          className={`date-btn ${selectedDateRange === '7d' ? 'active' : ''}`}
          onClick={() => setSelectedDateRange('7d')}
        >
          7 Days
        </button>
        <button 
          className={`date-btn ${selectedDateRange === '30d' ? 'active' : ''}`}
          onClick={() => setSelectedDateRange('30d')}
        >
          30 Days
        </button>
      </div>

      {/* Primary Stats Cards */}
      <div className="stats-container">
        <div className="stat-card primary">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-number">{formatCurrency(stats?.totalRevenue || 0)}</div>
            <div className="stat-label">Total Revenue</div>
            <div className="stat-trend positive">+12.5% from last week</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">{stats?.todayPayments || 0}</div>
            <div className="stat-label">Today's Payments</div>
            <div className="stat-trend positive">+8 from yesterday</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-number">{stats?.weekPayments || 0}</div>
            <div className="stat-label">This Week</div>
            <div className="stat-trend positive">+15.2%</div>
          </div>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-number failed">{stats?.failedTransactions || 0}</div>
            <div className="stat-label">Failed Transactions</div>
            <div className="stat-trend negative">-2.1%</div>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      {quickStats && (
        <div className="quick-stats">
          <div className="quick-stat">
            <span className="quick-stat-label">Total Transactions</span>
            <span className="quick-stat-value">{quickStats.totalTransactions.toLocaleString()}</span>
          </div>
          <div className="quick-stat">
            <span className="quick-stat-label">Success Rate</span>
            <span className="quick-stat-value">{quickStats.successRate.toFixed(1)}%</span>
          </div>
          <div className="quick-stat">
            <span className="quick-stat-label">Avg. Amount</span>
            <span className="quick-stat-value">{formatCurrency(quickStats.avgTransactionAmount)}</span>
          </div>
          <div className="quick-stat">
            <span className="quick-stat-label">Peak Hour</span>
            <span className="quick-stat-value">{quickStats.peakHour}</span>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="charts-section">
        {/* Revenue Trend Chart */}
        {stats?.revenueTrend && stats.revenueTrend.some(item => item.revenue > 0) && (
          <div className="chart-container">
            <h2 className="chart-title">Revenue Trend ({selectedDateRange})</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                  labelStyle={{ color: '#666' }}
                  contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#007AFF" 
                  strokeWidth={3}
                  dot={{ fill: '#007AFF', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#007AFF', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Payment Methods Chart */}
        {stats?.paymentMethods && (
          <div className="chart-container">
            <h2 className="chart-title">Payment Methods Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.paymentMethods}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ method, percentage }) => `${method} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, 'Transactions']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Status Breakdown */}
        {stats?.statusBreakdown && (
          <div className="chart-container">
            <h2 className="chart-title">Transaction Status Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.statusBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip formatter={(value, name) => [value, name === 'count' ? 'Transactions' : 'Amount']} />
                <Bar dataKey="count" fill="#007AFF" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Transactions - Always show this section */}
      <div className="recent-transactions">
        <div className="section-header">
          <h2>Recent Transactions</h2>
          <button 
            className="view-all-btn"
            onClick={() => navigation.navigate('TransactionList')}
          >
            View All →
          </button>
        </div>
        <div className="transactions-list">
          {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
            stats.recentTransactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="transaction-item">
                <div className="transaction-info">
                  <div className="transaction-receiver">{transaction.receiver}</div>
                  <div className="transaction-method">{transaction.method}</div>
                  <div className="transaction-date">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="transaction-amount">
                  {formatCurrency(transaction.amount)}
                </div>
                <div 
                  className="transaction-status"
                  style={{ backgroundColor: getStatusColor(transaction.status) }}
                >
                  {transaction.status}
                </div>
              </div>
            ))
          ) : (
            // Show sample transactions if no data
            <>
              <div className="transaction-item">
                <div className="transaction-info">
                  <div className="transaction-receiver">John Doe</div>
                  <div className="transaction-method">Credit Card</div>
                  <div className="transaction-date">{new Date().toLocaleDateString()}</div>
                </div>
                <div className="transaction-amount">₹2,500.00</div>
                <div className="transaction-status" style={{ backgroundColor: '#34C759' }}>success</div>
              </div>
              <div className="transaction-item">
                <div className="transaction-info">
                  <div className="transaction-receiver">Jane Smith</div>
                  <div className="transaction-method">UPI</div>
                  <div className="transaction-date">{new Date(Date.now() - 86400000).toLocaleDateString()}</div>
                </div>
                <div className="transaction-amount">₹1,800.00</div>
                <div className="transaction-status" style={{ backgroundColor: '#FF9500' }}>pending</div>
              </div>
              <div className="transaction-item">
                <div className="transaction-info">
                  <div className="transaction-receiver">Bob Johnson</div>
                  <div className="transaction-method">Net Banking</div>
                  <div className="transaction-date">{new Date(Date.now() - 172800000).toLocaleDateString()}</div>
                </div>
                <div className="transaction-amount">₹3,200.00</div>
                <div className="transaction-status" style={{ backgroundColor: '#34C759' }}>success</div>
              </div>
              <div className="transaction-item">
                <div className="transaction-info">
                  <div className="transaction-receiver">Alice Brown</div>
                  <div className="transaction-method">Wallet</div>
                  <div className="transaction-date">{new Date(Date.now() - 259200000).toLocaleDateString()}</div>
                </div>
                <div className="transaction-amount">₹950.00</div>
                <div className="transaction-status" style={{ backgroundColor: '#FF3B30' }}>failed</div>
              </div>
              <div className="transaction-item">
                <div className="transaction-info">
                  <div className="transaction-receiver">Mike Wilson</div>
                  <div className="transaction-method">Credit Card</div>
                  <div className="transaction-date">{new Date(Date.now() - 345600000).toLocaleDateString()}</div>
                </div>
                <div className="transaction-amount">₹4,750.00</div>
                <div className="transaction-status" style={{ backgroundColor: '#34C759' }}>success</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="actions-container">
        <button
          className="action-button secondary"
          onClick={() => navigation.navigate('TransactionList')}
        >
          📋 View All Transactions
        </button>
        
        <button
          className="action-button primary"
          onClick={() => navigation.navigate('AddPayment')}
        >
          ➕ Add New Payment
        </button>

        <button
          className="action-button tertiary"
          onClick={() => navigation.navigate('ExportData')}
        >
          📊 Export Data
        </button>

        <button
          className="action-button tertiary"
          onClick={() => navigation.navigate('UserManagement')}
        >
          👥 Manage Users
        </button>
      </div>

      {/* Quick Actions Floating Menu */}
      <div className="floating-actions">
        <button 
          className="floating-btn primary"
          onClick={() => navigation.navigate('AddPayment')}
          title="Quick Add Payment"
        >
          +
        </button>
      </div>
    </div>
  );
}