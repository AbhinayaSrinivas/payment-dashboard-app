// src/screens/TransactionListScreen.tsx
import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import './TransactionListScreen.css';

interface Transaction {
  id: number;
  amount: number;
  receiver: string;
  status: 'success' | 'pending' | 'failed';
  method: string;
  createdAt: string;
}

interface TransactionListScreenProps {
  navigation: any;
}

export default function TransactionListScreen({ navigation }: TransactionListScreenProps) {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    method: '',
    startDate: '',
    endDate: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Sample data for when API fails
  const sampleTransactions: Transaction[] = [
    { id: 1, amount: 2500, receiver: 'John Doe', status: 'success', method: 'Credit Card', createdAt: '2024-01-15T10:30:00.000Z' },
    { id: 2, amount: 1800, receiver: 'Jane Smith', status: 'pending', method: 'UPI', createdAt: '2024-01-16T14:20:00.000Z' },
    { id: 3, amount: 3200, receiver: 'Bob Johnson', status: 'success', method: 'Net Banking', createdAt: '2024-01-17T09:15:00.000Z' },
    { id: 4, amount: 950, receiver: 'Alice Brown', status: 'failed', method: 'Wallet', createdAt: '2024-01-18T16:45:00.000Z' },
    { id: 5, amount: 4500, receiver: 'Charlie Wilson', status: 'success', method: 'UPI', createdAt: '2024-01-19T11:30:00.000Z' },
    { id: 6, amount: 2200, receiver: 'Diana Prince', status: 'pending', method: 'Credit Card', createdAt: '2024-01-20T13:20:00.000Z' },
  ];

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, allTransactions]);

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [filters]);

  // Add listener for when new payments are added (if using navigation focus)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Refresh transactions when screen comes into focus
      loadTransactions();
    });

    return unsubscribe;
  }, [navigation]);

  // Handle route params for refresh
  useEffect(() => {
    if (navigation.getState()?.routes) {
      const currentRoute = navigation.getState().routes[navigation.getState().index];
      if (currentRoute?.params?.shouldRefresh) {
        loadTransactions();
        // Clear the param to avoid repeated refreshes
        navigation.setParams({ shouldRefresh: false });
      }
    }
  }, [navigation]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      
      // Always try to load from localStorage first (for newly added payments)
      let localTransactions: Transaction[] = [];
      try {
        const storedTransactions = localStorage.getItem('transactions');
        if (storedTransactions) {
          const parsed = JSON.parse(storedTransactions);
          if (Array.isArray(parsed)) {
            localTransactions = parsed;
            console.log('Loaded from localStorage:', localTransactions.length, 'transactions');
          }
        }
      } catch (storageError) {
        console.warn('Error loading from local storage:', storageError);
      }

      // Try to load from API
      try {
        const response = await ApiService.getTransactions(filters, currentPage, itemsPerPage);
        const apiTransactions: Transaction[] = response.data || [];
        
        // Combine localStorage transactions with API transactions
        // Remove duplicates by ID and put localStorage transactions first
        const combinedTransactions = [...localTransactions];
        apiTransactions.forEach((apiTransaction: Transaction) => {
          if (!localTransactions.find(local => local.id === apiTransaction.id)) {
            combinedTransactions.push(apiTransaction);
          }
        });
        
        setAllTransactions(combinedTransactions);
        console.log('Combined transactions:', combinedTransactions.length, 'total');
      } catch (apiError) {
        console.error('API call failed:', apiError);
        
        // If API fails, use localStorage + sample data
        const fallbackTransactions = [...localTransactions, ...sampleTransactions]
          .filter((transaction, index, arr) => 
            arr.findIndex(t => t.id === transaction.id) === index
          ); // Remove duplicates
        
        setAllTransactions(fallbackTransactions);
        console.log('Using fallback data:', fallbackTransactions.length, 'transactions');
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setAllTransactions(sampleTransactions);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allTransactions];

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(transaction => 
        transaction.status === filters.status
      );
    }

    // Filter by method
    if (filters.method) {
      filtered = filtered.filter(transaction => 
        transaction.method === filters.method
      );
    }

    // Filter by date range
    if (filters.startDate) {
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.createdAt);
        const startDate = new Date(filters.startDate);
        return transactionDate >= startDate;
      });
    }

    if (filters.endDate) {
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.createdAt);
        const endDate = new Date(filters.endDate);
        // Set end date to end of day for inclusive filtering
        endDate.setHours(23, 59, 59, 999);
        return transactionDate <= endDate;
      });
    }

    setFilteredTransactions(filtered);
    
    // Calculate pagination
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    setTotalPages(totalPages);
  };

  // Get current page transactions
  const getCurrentPageTransactions = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTransactions.slice(startIndex, endIndex);
  };

  const handleFilterChange = (filterType: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleRefresh = async () => {
    await loadTransactions();
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      method: '',
      startDate: '',
      endDate: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#34C759';
      case 'failed': return '#FF3B30';
      case 'pending': return '#FF9500';
      default: return '#8E8E93';
    }
  };
  const handleClearLocalStorage = () => {
    localStorage.clear();
    alert("Local storage cleared!");
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const currentTransactions = getCurrentPageTransactions();

  return (
    <div className="transaction-list-container">
      <div className="transaction-header">
        <button className="back-button" onClick={() => navigation.goBack()}>
          ← Back
        </button>
        <h1>All Transactions</h1>
        <div className="header-actions">
          <button className="refresh-button" onClick={handleRefresh} disabled={loading}>
            🔄 Refresh
          </button>
          <button className="clear-storage-button" onClick={handleClearLocalStorage}>
            🗑️ Clear Local
          </button>
          <button className="export-button" onClick={() => ApiService.exportTransactions(filters)}>
            📊 Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <select 
          value={filters.status} 
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>

        <select 
          value={filters.method} 
          onChange={(e) => handleFilterChange('method', e.target.value)}
        >
          <option value="">All Methods</option>
          <option value="Credit Card">Credit Card</option>
          <option value="UPI">UPI</option>
          <option value="Net Banking">Net Banking</option>
          <option value="Wallet">Wallet</option>
        </select>

        <input 
          type="date" 
          value={filters.startDate}
          onChange={(e) => handleFilterChange('startDate', e.target.value)}
          placeholder="Start Date"
        />

        <input 
          type="date" 
          value={filters.endDate}
          onChange={(e) => handleFilterChange('endDate', e.target.value)}
          placeholder="End Date"
        />

        <button 
          className="clear-filters-btn"
          onClick={clearFilters}
          disabled={!filters.status && !filters.method && !filters.startDate && !filters.endDate}
        >
          Clear Filters
        </button>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <p>
          Showing {currentTransactions.length} of {filteredTransactions.length} transactions
          {filteredTransactions.length !== allTransactions.length && 
            ` (filtered from ${allTransactions.length} total)`
          }
        </p>
      </div>

      {/* Transaction List */}
      <div className="transactions-container scrollable">
        {loading ? (
          <div className="loading">Loading transactions...</div>
        ) : currentTransactions.length === 0 ? (
          <div className="no-transactions">
            <p>No transactions found matching your filters.</p>
            <button onClick={clearFilters}>Clear Filters</button>
          </div>
        ) : (
          currentTransactions.map((transaction) => (
            <div key={transaction.id} className="transaction-card">
              <div className="transaction-main">
                <div className="transaction-info">
                  <h3>{transaction.receiver}</h3>
                  <p>ID: #{transaction.id} • {transaction.method}</p>
                  <p>{new Date(transaction.createdAt).toLocaleString()}</p>
                </div>
                <div className="transaction-amount">
                  {formatCurrency(transaction.amount)}
                </div>
              </div>
              <div className="transaction-footer">
                <div 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(transaction.status) }}
                >
                  {transaction.status.toUpperCase()}
                </div>
                <button 
                  className="view-details-btn"
                  onClick={() => {
                    console.log('Navigating to transaction details:', transaction.id);
                    if (navigation && navigation.navigate) {
                      navigation.navigate('TransactionDetails', { transactionId: transaction.id });
                    } else {
                      alert(`View details for Transaction #${transaction.id}`);
                    }
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}