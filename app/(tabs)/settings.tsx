import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Linking,
  ScrollView,
  TextInput,
  Platform,
  Modal,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useDashboardStore, ThemeMode } from '../../store/dashboardStore';
import { Trash2, Heart, Sun, Moon, Monitor, Download, Upload, History } from 'lucide-react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

const KOFI_URL = 'https://ko-fi.com/zeiddiez';

export default function SettingsScreen() {
  const { colors } = useAppTheme();
  const clearAll = useDashboardStore((s) => s.clearAll);
  const clearHistory = useDashboardStore((s) => s.clearHistory);
  const exportBackup = useDashboardStore((s) => s.exportBackup);
  const importBackup = useDashboardStore((s) => s.importBackup);
  const theme = useDashboardStore((s) => s.theme);
  const setTheme = useDashboardStore((s) => s.setTheme);

  const [importVisible, setImportVisible] = useState(false);
  const [importJson, setImportJson] = useState('');

  const notify = (title: string, message: string) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const confirm = (title: string, message: string, onYes: () => void) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) onYes();
    } else {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', style: 'destructive', onPress: onYes },
      ]);
    }
  };

  const handleClearAll = () => {
    confirm(
      'Warning',
      'This will delete all dashboards, goal history, templates, and chart snapshots forever. Are you sure?',
      clearAll
    );
  };

  const handleClearHistory = () => {
    confirm(
      'Clear chart history',
      'This removes daily completion snapshots only. Active goals stay.',
      clearHistory
    );
  };

  const handleExportBackup = async () => {
    const json = exportBackup();
    await Clipboard.setStringAsync(json);
    notify('Backup copied', 'Full app data JSON was copied to the clipboard. Store it somewhere safe.');
  };

  const handleImportBackup = () => {
    const ok = importBackup(importJson);
    if (ok) {
      setImportJson('');
      setImportVisible(false);
      notify('Restored', 'Backup imported successfully.');
    } else {
      notify('Error', 'Invalid backup JSON.');
    }
  };

  const openDonate = () => {
    Linking.openURL(KOFI_URL);
  };

  const themeOptions: { label: string; value: ThemeMode; icon: any }[] = [
    { label: 'System', value: 'system', icon: Monitor },
    { label: 'Light', value: 'light', icon: Sun },
    { label: 'Dark', value: 'dark', icon: Moon },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.settingsWrapper}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
          <View
            style={[styles.themeRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
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
                  <Text
                    style={[
                      styles.themeButtonText,
                      { color: isActive ? colors.primary : colors.textSecondary },
                    ]}
                  >
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
            style={[styles.dataButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleExportBackup}
          >
            <Download color={colors.primary} size={20} />
            <Text style={[styles.dataButtonText, { color: colors.text }]}>
              Export full backup (JSON)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dataButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setImportVisible(true)}
          >
            <Upload color={colors.primary} size={20} />
            <Text style={[styles.dataButtonText, { color: colors.text }]}>
              Import full backup
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dataButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleClearHistory}
          >
            <History color={colors.textSecondary} size={20} />
            <Text style={[styles.dataButtonText, { color: colors.text }]}>
              Clear chart history only
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dangerButton, { backgroundColor: colors.card, borderColor: colors.danger }]}
            onPress={handleClearAll}
          >
            <Trash2 color={colors.danger} size={20} />
            <Text style={[styles.dangerButtonText, { color: colors.danger }]}>
              Erase All App Data
            </Text>
          </TouchableOpacity>
          <Text style={styles.hintText}>Full wipe cannot be undone. Export a backup first.</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Support</Text>
          <TouchableOpacity style={styles.donateButton} onPress={openDonate}>
            <Heart color="#fff" size={20} />
            <Text style={styles.donateButtonText}>Buy the dev a coffee</Text>
          </TouchableOpacity>
          <Text style={styles.hintText}>CommunityDash is 100% free forever.</Text>
        </View>
      </ScrollView>

      <Modal visible={importVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Import backup JSON</Text>
            <TextInput
              style={[
                styles.importInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              multiline
              value={importJson}
              onChangeText={setImportJson}
              placeholder="Paste backup JSON..."
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setImportVisible(false)}>
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleImportBackup}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Import</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  settingsWrapper: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    padding: 16,
    paddingBottom: 40,
  },
  section: { marginBottom: 32 },
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
  themeButtonText: { fontSize: 14, fontWeight: '600' },
  dataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 12,
  },
  dataButtonText: { fontSize: 16, fontWeight: '600' },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  dangerButtonText: { fontSize: 16, fontWeight: 'bold' },
  donateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b81',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  donateButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  hintText: {
    fontSize: 13,
    color: '#888',
    marginTop: 8,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  importInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 160,
    textAlignVertical: 'top',
    fontSize: 13,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 24,
    marginTop: 16,
  },
});
