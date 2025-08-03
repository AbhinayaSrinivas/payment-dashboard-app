import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Update this to your backend URL
const API_BASE_URL = 'http://localhost:3000'; // Change to your computer's IP for physical device

class ApiService {
  private api: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from localStorage on initialization
    this.loadTokenFromStorage();

    // Request interceptor to add token
    this.api.interceptors.request.use(
      async (config) => {
        console.log('🔍 Making request to:', config.url);
        console.log('🔑 Current token:', this.authToken ? 'Token exists' : 'No token');
        
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
          console.log('✅ Added Authorization header');
        } else {
          console.log('❌ No token to add');
        }
        
        return config;
      },
      (error) => {
        console.log('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => {
        console.log('✅ Response received:', response.status, response.config.url);
        return response;
      },
      async (error) => {
        console.log('❌ Response error:', error.response?.status, error.config?.url);
        
        if (error.response?.status === 401) {
          console.log('🚨 401 Unauthorized - clearing token');
          this.clearToken();
        }
        return Promise.reject(error);
      }
    );
  }

  // Token management methods
  private loadTokenFromStorage(): void {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        this.authToken = token;
        console.log('🔑 Token loaded from localStorage');
      }
    } catch (error) {
      console.log('❌ Error loading token from localStorage:', error);
    }
  }

  private saveTokenToStorage(token: string): void {
    try {
      localStorage.setItem('token', token);
      this.authToken = token;
      console.log('💾 Token saved to localStorage');
    } catch (error) {
      console.log('❌ Error saving token to localStorage:', error);
      this.authToken = token; // At least keep it in memory
    }
  }

  private clearToken(): void {
    try {
      localStorage.removeItem('token');
    } catch (error) {
      console.log('❌ Error removing token from localStorage:', error);
    }
    this.authToken = null;
  }

  // Debug method to check token
  getTokenInfo(): { hasToken: boolean; tokenPreview?: string } {
    return {
      hasToken: !!this.authToken,
      tokenPreview: this.authToken ? `${this.authToken.substring(0, 20)}...` : undefined
    };
  }

  // Authentication
  async login(username: string, password: string): Promise<any> {
    try {
      console.log('🔐 Attempting login with:', { username, password });
      console.log('🌐 API URL:', `${API_BASE_URL}/auth/login`);
      
      const response: AxiosResponse = await this.api.post('/auth/login', {
        username,
        password,
      });

      console.log('📥 Login response status:', response.status);
      console.log('📥 Login response data:', JSON.stringify(response.data, null, 2));

      // Try different possible token field names
      let token = response.data.access_token || 
                  response.data.token || 
                  response.data.accessToken ||
                  response.data.jwt ||
                  response.data.authToken;

      if (token) {
        this.saveTokenToStorage(token);
        console.log('✅ Token stored successfully');
        console.log('🔑 Token preview:', token.substring(0, 30) + '...');
        return response.data;
      } else {
        console.log('❌ No token found in response');
        console.log('📋 Available fields:', Object.keys(response.data));
        throw new Error('No authentication token found in response');
      }
    } catch (error: any) {
      console.log('❌ Login failed:', error);
      
      if (error.response) {
        console.log('📥 Error response data:', error.response.data);
        console.log('📥 Error response status:', error.response.status);
        console.log('📥 Error response headers:', error.response.headers);
      } else if (error.request) {
        console.log('📤 Error request:', error.request);
        console.log('🌐 Network error - is backend running on', API_BASE_URL, '?');
      } else {
        console.log('💥 Error message:', error.message);
      }
      
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.clearToken();
    console.log('👋 Logged out successfully');
  }

  async isAuthenticated(): Promise<boolean> {
    const isAuth = !!this.authToken;
    console.log('🔍 Authentication check:', isAuth);
    return isAuth;
  }

  // Test endpoint to verify token
  async testAuth(): Promise<any> {
    try {
      console.log('🧪 Testing authentication...');
      const response = await this.api.get('/auth/profile');
      console.log('✅ Auth test successful:', response.data);
      return response.data;
    } catch (error) {
      console.log('❌ Auth test failed:', error);
      throw error;
    }
  }

  // Payment methods - Now using instance methods with proper authentication
  async getPaymentStats() {
    try {
      const response = await this.api.get('/payments/stats');
      
      // Transform data to match dashboard expectations
      const data = response.data;
      return {
        todayPayments: data.todayPayments || 0,
        weekPayments: data.weekPayments || 0,
        totalRevenue: data.totalRevenue || 0,
        failedTransactions: data.failedTransactions || 0,
        revenueTrend: data.revenueTrend || [
          { date: '2024-01-01', revenue: 1000 },
          { date: '2024-01-02', revenue: 1500 },
          { date: '2024-01-03', revenue: 1200 },
          { date: '2024-01-04', revenue: 1800 },
          { date: '2024-01-05', revenue: 2200 },
          { date: '2024-01-06', revenue: 1900 },
          { date: '2024-01-07', revenue: 2500 }
        ],
        paymentMethods: data.paymentMethods || [
          { method: 'Credit Card', count: 45, percentage: 45 },
          { method: 'UPI', count: 30, percentage: 30 },
          { method: 'Net Banking', count: 15, percentage: 15 },
          { method: 'Wallet', count: 10, percentage: 10 }
        ],
        statusBreakdown: data.statusBreakdown || [
          { status: 'success', count: 85, amount: 125000 },
          { status: 'pending', count: 10, amount: 15000 },
          { status: 'failed', count: 5, amount: 7500 }
        ],
        recentTransactions: data.recentTransactions || [
          {
            id: 1,
            amount: 2500,
            receiver: 'John Doe',
            status: 'success',
            method: 'Credit Card',
            createdAt: new Date().toISOString()
          },
          {
            id: 2,
            amount: 1800,
            receiver: 'Jane Smith',
            status: 'pending',
            method: 'UPI',
            createdAt: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 3,
            amount: 3200,
            receiver: 'Bob Johnson',
            status: 'success',
            method: 'Net Banking',
            createdAt: new Date(Date.now() - 7200000).toISOString()
          }
        ]
      };
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      throw error;
    }
  }

  async getQuickStats() {
    try {
      const response = await this.api.get('/payments/quick-stats');
      return response.data;
    } catch (error) {
      console.log('Using mock data for quick stats');
      // Return mock data if endpoint doesn't exist yet
      return {
        totalTransactions: 1245,
        successRate: 94.2,
        avgTransactionAmount: 1850,
        peakHour: '2:00 PM'
      };
    }
  }

  async getPaymentById(id: string): Promise<any> {
    try {
      console.log('📋 Fetching payment by ID:', id);
      const response = await this.api.get(`/payments/${id}`);
      console.log('✅ Payment fetched successfully');
      return response.data;
    } catch (error) {
      console.log('❌ Error fetching payment:', error);
      throw error;
    }
  }

  async getTransactions(filters = {}, page = 1, limit = 10) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });

      const response = await this.api.get(`/payments?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  async getTransaction(id: number) {
    try {
      const response = await this.api.get(`/payments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }

  async createPayment(paymentData: {
    amount: number;
    receiver: string;
    status: 'success' | 'pending' | 'failed';
    method: string;
  }) {
    try {
      const response = await this.api.post('/payments', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  // User methods
  async getUsers() {
    try {
      const response = await this.api.get('/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async createUser(userData: {
    username: string;
    password: string;
    role: 'admin' | 'viewer';
  }) {
    try {
      const response = await this.api.post('/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Export transactions to CSV
  async exportTransactions(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      
      const response = await this.api.get(`/payments/export?${params}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Error exporting transactions:', error);
      throw error;
    }
  }

  // Update payment status
  async updatePaymentStatus(id: number, status: 'success' | 'pending' | 'failed') {
    try {
      const response = await this.api.patch(`/payments/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  // Analytics methods
  async getRevenueByMethod() {
    try {
      const response = await this.api.get('/payments/analytics/revenue-by-method');
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue by method:', error);
      throw error;
    }
  }

  async getHourlyDistribution() {
    try {
      const response = await this.api.get('/payments/analytics/hourly-distribution');
      return response.data;
    } catch (error) {
      console.error('Error fetching hourly distribution:', error);
      throw error;
    }
  }

  async getSuccessRateTrend(days: number = 30) {
    try {
      const response = await this.api.get(`/payments/analytics/success-rate-trend?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching success rate trend:', error);
      throw error;
    }
  }
}

export default new ApiService();