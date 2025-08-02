// src/screens/TransactionListScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import ApiService from '../services/api';

interface Transaction {
  id: number;
  amount: number;
  receiver: string;
  status: string;
  method: string;
  createdAt: string;
  transactionId: string;
}

interface TransactionListScreenProps {
  navigation: any;
}

export default function TransactionListScreen({ navigation }: TransactionListScreenProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    method: '',
    startDate: '',
    endDate: '',
  });

  const loadTransactions = async (pageNum = 1, filterParams = filters) => {
    try {
      console.log('Loading transactions with params:', { pageNum, filterParams });
      
      // Updated API call to match the fixed ApiService
      const params = {
        page: pageNum,
        limit: 10,
        ...filterParams,
      };
      
      const response = await ApiService.getPayments(params);
      console.log('API Response:', response);
      
      // Handle different response formats from your backend
      let responseData;
      let totalPages = 1;
      let currentPage = pageNum;
      
      if (response.data && Array.isArray(response.data)) {
        // If response has data array
        responseData = response.data;
        totalPages = response.totalPages || 1;
        currentPage = response.page || pageNum;
      } else if (Array.isArray(response)) {
        // If response is directly an array
        responseData = response;
      } else {
        // Fallback
        responseData = [];
        console.warn('Unexpected response format:', response);
      }
      
      if (pageNum === 1) {
        setTransactions(responseData);
      } else {
        setTransactions(prev => [...prev, ...responseData]);
      }
      
      setHasMore(currentPage < totalPages);
      setPage(pageNum);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      
      let errorMessage = 'Failed to load transactions';
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        // Navigate to login screen
        navigation.replace('Login');
        return;
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to view transactions';
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadTransactions(1);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setLoading(true);
      loadTransactions(page + 1);
    }
  };

  const applyFilters = () => {
    setShowFilters(false);
    setLoading(true);
    setPage(1);
    setHasMore(true);
    loadTransactions(1, filters);
  };

  const clearFilters = () => {
    const emptyFilters = { status: '', method: '', startDate: '', endDate: '' };
    setFilters(emptyFilters);
    setShowFilters(false);
    setLoading(true);
    setPage(1);
    setHasMore(true);
    loadTransactions(1, emptyFilters);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success': 
      case 'completed': 
        return '#4CAF50';
      case 'failed': 
      case 'error': 
        return '#f44336';
      case 'pending': 
      case 'processing': 
        return '#ff9800';
      default: 
        return '#666';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-IN'),
      time: date.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    };
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const { date, time } = formatDate(item.createdAt);
    
    return (
      <TouchableOpacity
        style={styles.transactionCard}
        onPress={() => navigation.navigate('TransactionDetails', { transaction: item })}
      >
        <View style={styles.transactionHeader}>
          <Text style={styles.transactionId}>
            {item.transactionId || `TXN-${item.id}`}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        
        <View style={styles.transactionDetails}>
          <Text style={styles.amount}>{formatAmount(item.amount)}</Text>
          <Text style={styles.receiver}>To: {item.receiver}</Text>
          <Text style={styles.method}>
            {item.method.replace(/_/g, ' ').toUpperCase()}
          </Text>
          <Text style={styles.date}>{date} • {time}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loading || refreshing) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No transactions found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTransaction}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        contentContainerStyle={[
          styles.listContainer,
          transactions.length === 0 && styles.emptyListContainer
        ]}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.filterModal}>
          <View style={styles.filterHeader}>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.filterTitle}>Filters</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearButton}>Clear</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterContent}>
            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                style={styles.picker}
              >
                <Picker.Item label="All Statuses" value="" />
                <Picker.Item label="Success" value="success" />
                <Picker.Item label="Completed" value="completed" />
                <Picker.Item label="Failed" value="failed" />
                <Picker.Item label="Error" value="error" />
                <Picker.Item label="Pending" value="pending" />
                <Picker.Item label="Processing" value="processing" />
              </Picker>
            </View>

            <Text style={styles.filterLabel}>Payment Method</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filters.method}
                onValueChange={(value) => setFilters(prev => ({ ...prev, method: value }))}
                style={styles.picker}
              >
                <Picker.Item label="All Methods" value="" />
                <Picker.Item label="Credit Card" value="credit_card" />
                <Picker.Item label="Debit Card" value="debit_card" />
                <Picker.Item label="UPI" value="upi" />
                <Picker.Item label="Net Banking" value="net_banking" />
                <Picker.Item label="Wallet" value="wallet" />
                <Picker.Item label="Bank Transfer" value="bank_transfer" />
              </Picker>
            </View>

            {/* Amount Range Filters */}
            <Text style={styles.filterLabel}>Amount Range</Text>
            <View style={styles.amountContainer}>
              <TextInput
                style={styles.amountInput}
                placeholder="Min Amount"
                value={filters.startDate} // Reusing for min amount
                onChangeText={(value) => setFilters(prev => ({ ...prev, startDate: value }))}
                keyboardType="numeric"
              />
              <Text style={styles.amountSeparator}>to</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="Max Amount"
                value={filters.endDate} // Reusing for max amount
                onChangeText={(value) => setFilters(prev => ({ ...prev, endDate: value }))}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  transactionId: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  transactionDetails: {
    gap: 5,
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  receiver: {
    fontSize: 16,
    color: '#333',
  },
  method: {
    fontSize: 14,
    color: '#666',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  filterModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  clearButton: {
    fontSize: 16,
    color: '#ff4444',
  },
  filterContent: {
    padding: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginTop: 20,
  },
  pickerContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  picker: {
    height: 50,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8f8f8',
  },
  amountSeparator: {
    color: '#666',
    fontSize: 14,
  },
  applyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});