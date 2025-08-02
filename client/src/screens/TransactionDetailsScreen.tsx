// src/screens/TransactionDetailsScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

interface Transaction {
  id: number;
  amount: number;
  receiver: string;
  status: string;
  method: string;
  createdAt: string;
  updatedAt: string;
  transactionId: string;
  description?: string;
}

interface TransactionDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      transaction: Transaction;
    };
  };
}

export default function TransactionDetailsScreen({ 
  navigation, 
  route, 
}: TransactionDetailsScreenProps) {
  const { transaction } = route.params;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success': return '#4CAF50';
      case 'failed': return '#f44336';
      case 'pending': return '#ff9800';
      default: return '#666';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };
  };

  const createdDate = formatDate(transaction.createdAt);
  const updatedDate = formatDate(transaction.updatedAt);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) }]}>
              <Text style={styles.statusText}>{transaction.status.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={styles.amount}>₹{transaction.amount.toFixed(2)}</Text>
          </View>

          <View style={styles.detailsSection}>
            <DetailRow label="Transaction ID" value={transaction.transactionId} />
            <DetailRow label="Receiver" value={transaction.receiver} />
            <DetailRow 
              label="Payment Method" 
              value={transaction.method.replace('_', ' ').toUpperCase()} 
            />
            
            {transaction.description && (
              <DetailRow label="Description" value={transaction.description} />
            )}

            <View style={styles.dateSection}>
              <Text style={styles.dateLabel}>Created On</Text>
              <Text style={styles.dateValue}>{createdDate.date}</Text>
              <Text style={styles.timeValue}>{createdDate.time}</Text>
            </View>

            {transaction.createdAt !== transaction.updatedAt && (
              <View style={styles.dateSection}>
                <Text style={styles.dateLabel}>Last Updated</Text>
                <Text style={styles.dateValue}>{updatedDate.date}</Text>
                <Text style={styles.timeValue}>{updatedDate.time}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Share Transaction</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Download Receipt</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

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
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  detailsSection: {
    gap: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1.5,
    textAlign: 'right',
  },
  dateSection: {
    paddingVertical: 5,
  },
  dateLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  dateValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  timeValue: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  actionsSection: {
    padding: 20,
    gap: 15,
  },
  actionButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});