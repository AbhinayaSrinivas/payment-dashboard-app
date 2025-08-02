// App.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TransactionListScreen from './src/screens/TransactionListScreen';
// import TransactionDetailsScreen from './src/screens/TransactionDetailsScreen';
import AddPaymentScreen from './src/screens/AddPaymentScreen';
import { checkAuthToken } from './src/utils/auth';

const Stack = createStackNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const hasToken = await checkAuthToken();
      setIsAuthenticated(hasToken);
    };
    
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    // Show loading screen while checking auth
    return null;
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'Dashboard' : 'Login'}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="TransactionList" component={TransactionListScreen} />
        {/* <Stack.Screen name="TransactionDetails" component={TransactionDetailsScreen} /> */}
        <Stack.Screen name="AddPayment" component={AddPaymentScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}