

import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Update this to your backend URL
const API_BASE_URL = 'http://localhost:3000'; // Change to your computer's IP for physical device

class ApiService {
  private api: AxiosInstance;
  private authToken: string | null = null; // In-memory storage

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add token
    this.api.interceptors.request.use(
      async (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Clear invalid token
          this.authToken = null;
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(username: string, password: string): Promise<any> {
    try {
      console.log('Attempting login with:', { username, password });
      console.log('API URL:', `${API_BASE_URL}/auth/login`);
      
      const response: AxiosResponse = await this.api.post('/auth/login', {
        username,
        password,
      });

      console.log('Login response:', response.data);

      if (response.data && response.data.access_token) {
        // Store token in memory
        this.authToken = response.data.access_token;
        console.log('Token stored successfully');
        return response.data;
      } else {
        throw new Error('Invalid response format - no access_token received');
      }
    } catch (error: any) {
      console.log('Login failed:', error);
      
      // More detailed error logging
      if (error.response) {
        console.log('Error response data:', error.response.data);
        console.log('Error response status:', error.response.status);
        console.log('Error response headers:', error.response.headers);
      } else if (error.request) {
        console.log('Error request:', error.request);
        console.log('Network error - is backend running on', API_BASE_URL, '?');
      } else {
        console.log('Error message:', error.message);
      }
      
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.authToken = null;
    console.log('Logged out successfully');
  }

  async isAuthenticated(): Promise<boolean> {
    return !!this.authToken;
  }

  // Payment methods
  async getPayments(filters?: any): Promise<any> {
    try {
      const response = await this.api.get('/payments', { params: filters });
      return response.data;
    } catch (error) {
      console.log('Error fetching payments:', error);
      throw error;
    }
  }

  async getPaymentById(id: string): Promise<any> {
    try {
      const response = await this.api.get(`/payments/${id}`);
      return response.data;
    } catch (error) {
      console.log('Error fetching payment:', error);
      throw error;
    }
  }

  async createPayment(paymentData: any): Promise<any> {
    try {
      const response = await this.api.post('/payments', paymentData);
      return response.data;
    } catch (error) {
      console.log('Error creating payment:', error);
      throw error;
    }
  }

  async getPaymentStats(): Promise<any> {
    try {
      const response = await this.api.get('/payments/stats');
      return response.data;
    } catch (error) {
      console.log('Error fetching payment stats:', error);
      throw error;
    }
  }

  // User methods
  async getUsers(): Promise<any> {
    try {
      const response = await this.api.get('/users');
      return response.data;
    } catch (error) {
      console.log('Error fetching users:', error);
      throw error;
    }
  }

  async createUser(userData: any): Promise<any> {
    try {
      const response = await this.api.post('/users', userData);
      return response.data;
    } catch (error) {
      console.log('Error creating user:', error);
      throw error;
    }
  }
}

export default new ApiService();