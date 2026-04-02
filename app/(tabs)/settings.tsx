import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Linking } from 'react-native';
import { useDashboardStore, ThemeMode } from '../../store/dashboardStore';
import { Trash2, Heart, Sun, Moon, Monitor } from 'lucide-react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

export default function SettingsScreen() {
  const { colors, isDark } = useAppTheme();
  const clearAll = useDashboardStore((state) => state.clearAll);
  const theme = useDashboardStore((state) => state.theme);
  const setTheme = useDashboardStore((state) => state.setTheme);

  const handleClearAll = () => {
    Alert.alert(
      'Warning',
      'This will delete all your dashboards and progress forever. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Delete All', style: 'destructive', onPress: clearAll },
      ]
    );
  };

  const openDonate = () => {
    Linking.openURL('https://ko-fi.com/zeiddiez');
  };

  const themeOptions: { label: string; value: ThemeMode; icon: any }[] = [
    { label: 'System', value: 'system', icon: Monitor },
    { label: 'Light', value: 'light', icon: Sun },
    { label: 'Dark', value: 'dark', icon: Moon },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
        <View style={[styles.themeRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isActive = theme === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.themeButton,
                  isActive && { backgroundColor: `${colors.primary}20` },
                ]}
                onPress={() => setTheme(option.value)}
              >
                <Icon color={isActive ? colors.primary : colors.textSecondary} size={24} />
                <Text style={[
                  styles.themeButtonText,
                  { color: isActive ? colors.primary : colors.textSecondary }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Data</Text>
        <TouchableOpacity 
          style={[styles.dangerButton, { backgroundColor: colors.card, borderColor: colors.danger }]} 
          onPress={handleClearAll}
        >
          <Trash2 color={colors.danger} size={20} />
          <Text style={[styles.dangerButtonText, { color: colors.danger }]}>Erase All App Data</Text>
        </TouchableOpacity>
        <Text style={styles.hintText}>This action cannot be undone.</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Support</Text>
        <TouchableOpacity style={styles.donateButton} onPress={openDonate}>
          <Heart color="#fff" size={20} />
          <Text style={styles.donateButtonText}>Buy the dev a coffee</Text>
        </TouchableOpacity>
        <Text style={styles.hintText}>CommunityDash is 100% free forever.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 1,
  },
  themeRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  themeButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  donateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b81',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  donateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hintText: {
    fontSize: 13,
    color: '#888',
    marginTop: 8,
    marginLeft: 4,
  },
});
