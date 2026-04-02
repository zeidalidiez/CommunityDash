import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { useDashboardStore } from '../store/dashboardStore';

export const colors = {
  light: {
    background: '#f4f4f8',
    card: '#ffffff',
    text: '#1a1a1a',
    textSecondary: '#666666',
    border: '#e0e0e0',
    primary: '#3498db',
    danger: '#e74c3c',
    success: '#2ecc71',
    surface: '#f9f9f9',
    tabBar: '#ffffff',
    tabBarActive: '#3498db',
    tabBarInactive: '#8e8e93',
  },
  dark: {
    background: '#121212',
    card: '#1e1e1e',
    text: '#ffffff',
    textSecondary: '#a0a0a0',
    border: '#2c2c2c',
    primary: '#3498db',
    danger: '#e74c3c',
    success: '#2ecc71',
    surface: '#252525',
    tabBar: '#1a1a1a',
    tabBarActive: '#3498db',
    tabBarInactive: '#8e8e93',
  },
};

export function useAppTheme() {
  const storeTheme = useDashboardStore((state) => state.theme);
  const deviceTheme = useDeviceColorScheme();

  const isDark = storeTheme === 'dark' || (storeTheme === 'system' && deviceTheme === 'dark');
  const activeColors = isDark ? colors.dark : colors.light;

  return {
    isDark,
    colors: activeColors,
  };
}
