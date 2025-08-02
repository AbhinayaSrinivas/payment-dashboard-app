// src/utils/auth.ts
import * as SecureStore from 'expo-secure-store';

export const checkAuthToken = async (): Promise<boolean> => {
  try {
    const token = await SecureStore.getItemAsync('access_token');
    return !!token;
  } catch {
    return false;
  }
};

export const clearAuthData = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('user');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

export const getStoredUser = async (): Promise<any> => {
  try {
    const userString = await SecureStore.getItemAsync('user');
    return userString ? JSON.parse(userString) : null;
  } catch {
    return null;
  }
};