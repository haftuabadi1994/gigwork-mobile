import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { CurrencyProvider } from './src/context/CurrencyContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CurrencyProvider>
          <StatusBar style="dark" />
          <AppNavigator />
        </CurrencyProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
