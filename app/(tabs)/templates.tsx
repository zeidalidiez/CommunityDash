import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Alert, Clipboard, useWindowDimensions } from 'react-native';
import { useDashboardStore } from '../../store/dashboardStore';
import { exportTemplate, importTemplateFromString } from '../../utils/templateUtils';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Trash2, PlusCircle } from 'lucide-react-native';

export default function TemplatesScreen() {
  const { colors, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const dashboards = useDashboardStore((state) => state.dashboards);
  const history = useDashboardStore((state) => state.history);
  const importTemplate = useDashboardStore((state) => state.importTemplate);
  const addDashboard = useDashboardStore((state) => state.addDashboard);
  const removeFromHistory = useDashboardStore((state) => state.removeFromHistory);
  const [importString, setImportString] = useState('');

  // Determine number of columns for history grid
  const historyColumns = useMemo(() => {
    if (width >= 1200) return 3;
    if (width >= 800) return 2;
    return 1;
  }, [width]);

  const handleExport = () => {
    if (dashboards.length === 0) {
      Alert.alert('Notice', 'No active dashboards to export.');
      return;
    }
    const templateString = exportTemplate('My Dashboards', dashboards);
    Clipboard.setString(templateString);
    Alert.alert('Success', 'Template copied to clipboard! You can share this text with others.');
  };

  const handleImport = () => {
    if (!importString.trim()) {
      Alert.alert('Error', 'Please paste a valid template string.');
      return;
    }
    const template = importTemplateFromString(importString.trim());
    if (template) {
      importTemplate(template);
      setImportString('');
      Alert.alert('Success', `Imported "${template.templateName}" with ${template.dashboards.length} items!`);
    } else {
      Alert.alert('Error', 'Invalid or corrupted template string.');
    }
  };

  const handleReuse = (item: any) => {
    addDashboard({
      title: item.title,
      targetValue: item.targetValue,
      unit: item.unit,
      visualType: item.visualType,
      colorTheme: item.colorTheme,
      resetInterval: 'daily',
    });
    Alert.alert('Added', `"${item.title}" was added to your daily goals!`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {history.length > 0 && (
          <View style={[styles.sectionCard, { backgroundColor: colors.card, maxWidth: width > 1000 ? 1200 : 800 }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Previous Goals</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Quickly reuse goals you've created in the past.
            </Text>
            <View style={styles.historyGrid}>
              {history.map((item) => (
                <View 
                  key={item.id} 
                  style={[
                    styles.historyItem, 
                    { borderColor: colors.border, width: `${100 / historyColumns}%` }
                  ]}
                >
                  <View style={styles.historyInfo}>
                    <Text style={[styles.historyTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.historyTarget, { color: colors.textSecondary }]}>
                      Target: {item.targetValue} {item.unit}
                    </Text>
                  </View>
                  <View style={styles.historyActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                      onPress={() => handleReuse(item)}
                    >
                      <PlusCircle color="#fff" size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.danger }]}
                      onPress={() => removeFromHistory(item.id)}
                    >
                      <Trash2 color="#fff" size={18} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.formContainer}>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Share Your Dashboards</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Export your current dashboards into a shareable text snippet. Others can paste it to duplicate your setup.
            </Text>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleExport}>
              <Text style={styles.buttonText}>Copy My Setup to Clipboard</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Import from Friend</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Paste a dashboard template string here to add it to your app.
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholderTextColor={colors.textSecondary}
              placeholder="Paste string here..."
              value={importString}
              onChangeText={setImportString}
              multiline
            />
            <TouchableOpacity style={[styles.button, styles.importButton]} onPress={handleImport}>
              <Text style={styles.buttonText}>Import Template</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  sectionCard: {
    width: '100%',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formContainer: {
    width: '100%',
    maxWidth: 800,
    gap: 24,
  },
  card: {
    padding: 20,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  importButton: {
    backgroundColor: '#9b59b6',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  historyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  historyInfo: {
    flex: 1,
    marginRight: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  historyTarget: {
    fontSize: 13,
  },
  historyActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
