// App.js
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { AppProvider, useAppContext } from './src/context/AppContext';
import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { getCurrentUser } from './src/lib/auth';
import { getOnboardingComplete } from './src/lib/onboarding';
import colors from './src/theme/colors';

// ── Loading Screen ────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingLogo}>ProAct</Text>
      <ActivityIndicator size="large" color="#FFFFFF" style={styles.spinner} />
      <Text style={styles.loadingText}>Loading your plan...</Text>
    </View>
  );
}

// ── App Content ───────────────────────────────────────────────────────────────
function AppContent({ isAuthenticated, isOnboarded, onAuthSuccess, onOnboardingComplete }) {
  const { isLoading } = useAppContext();

  if (isLoading) return <LoadingScreen />;

  if (!isAuthenticated) {
    return <AuthScreen onAuthSuccess={onAuthSuccess} />;
  }

  if (!isOnboarded) {
    return <OnboardingScreen onComplete={onOnboardingComplete} />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <AppNavigator />
    </NavigationContainer>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const [user, onboarded] = await Promise.all([
        getCurrentUser(),
        getOnboardingComplete(),
      ]);
      setIsAuthenticated(!!user);
      setIsOnboarded(onboarded);
    } catch {
      setIsAuthenticated(false);
      setIsOnboarded(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleOnboardingComplete = (name) => {
    setIsOnboarded(true);
  };

  if (checkingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingLogo}>ProAct</Text>
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.spinner} />
      </View>
    );
  }

  return (
    <AppProvider onSignOut={() => { setIsAuthenticated(false); setIsOnboarded(false); }}>
      <AppContent
        isAuthenticated={isAuthenticated}
        isOnboarded={isOnboarded}
        onAuthSuccess={handleAuthSuccess}
        onOnboardingComplete={handleOnboardingComplete}
      />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 40,
    letterSpacing: 2,
  },
  spinner: {
    marginBottom: 20,
    transform: [{ scaleX: 1.5 }, { scaleY: 1.5 }],
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
});
