import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { useAppTheme } from '@/hooks/useAppTheme';
import { useDashboardStore } from '../store/dashboardStore';

// Prevent the splash screen from auto-hiding until state is hydrated
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const { isDark, colors } = useAppTheme();
  const checkDailyReset = useDashboardStore((state) => state.checkDailyReset);
  const hasHydrated = useDashboardStore((state) => state._hasHydrated);

  useEffect(() => {
    if (hasHydrated) {
      checkDailyReset();
      // Hide the splash screen once we know the user's data and theme are loaded
      SplashScreen.hideAsync();
    }

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && hasHydrated) {
        checkDailyReset();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [hasHydrated, checkDailyReset]);

  if (!hasHydrated) {
    return null; // Keep rendering nothing until the splash screen hides
  }

  return (
    <View style={[styles.webContainer, { backgroundColor: colors.background }]}>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </ThemeProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 600 : '100%',
    marginHorizontal: 'auto',
    overflow: 'hidden',
  },
});
