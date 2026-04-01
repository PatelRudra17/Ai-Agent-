import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import { getToken } from './src/services/storage';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await getToken();
    setIsLoggedIn(!!token);
    setLoading(false);
  };

  if (loading) return null;

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {isLoggedIn ? (
        <MainNavigator onLogout={() => setIsLoggedIn(false)} />
      ) : (
        <AuthNavigator onLogin={() => setIsLoggedIn(true)} />
      )}
    </NavigationContainer>
  );
}
