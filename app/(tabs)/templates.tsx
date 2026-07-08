import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  useWindowDimensions,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useDashboardStore } from '../../store/dashboardStore';
import {
  exportTemplate,
  exportNamedTemplate,
  importTemplateResult,
} from '../../utils/templateUtils';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Trash2, PlusCircle, Copy, Share2 } from 'lucide-react-native';

export default function TemplatesScreen() {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const dashboards = useDashboardStore((s) => s.dashboards);
  const history = useDashboardStore((s) => s.history);
  const templates = useDashboardStore((s) => s.templates);
  const importTemplate = useDashboardStore((s) => s.importTemplate);
  const addDashboard = useDashboardStore((s) => s.addDashboard);
  const removeFromHistory = useDashboardStore((s) => s.removeFromHistory);
  const saveTemplate = useDashboardStore((s) => s.saveTemplate);
  const deleteTemplate = useDashboardStore((s) => s.deleteTemplate);
  const applyTemplate = useDashboardStore((s) => s.applyTemplate);

  const [importString, setImportString] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');

  const historyColumns = useMemo(() => {
    if (width >= 1200) return 3;
    if (width >= 800) return 2;
    return 1;
  }, [width]);

  const notify = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleExportCurrent = async () => {
    if (dashboards.length === 0) {
      notify('Notice', 'No active dashboards to export.');
      return;
    }
    const code = exportTemplate('My Dashboards', dashboards);
    await Clipboard.setStringAsync(code);
    notify('Success', 'Template share code copied to clipboard.');
  };

  const handleExportNamed = async (id: string) => {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    const code = exportNamedTemplate(tpl);
    await Clipboard.setStringAsync(code);
    notify('Success', `"${tpl.templateName}" share code copied.`);
  };

  const handleImport = () => {
    const result = importTemplateResult(importString.trim());
    if (!result.ok) {
      notify('Error', result.error);
      return;
    }
    importTemplate(result.template);
    setImportString('');
    notify(
      'Success',
      `Imported "${result.template.templateName}" with ${result.template.dashboards.length} items.`
    );
  };

  const handleSaveNamed = () => {
    const id = saveTemplate(newTemplateName);
    if (!id) {
      notify('Error', 'Enter a name and ensure you have active dashboards.');
      return;
    }
    setNewTemplateName('');
    notify('Saved', 'Named template created from your current dashboards.');
  };

  const handleReuse = (item: (typeof history)[0]) => {
    addDashboard({
      title: item.title,
      targetValue: item.targetValue,
      stepSize: item.stepSize ?? 1,
      unit: item.unit,
      visualType: item.visualType,
      colorTheme: item.colorTheme,
      resetInterval: 'daily',
    });
    notify('Added', `"${item.title}" was added to your daily goals.`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Previous goals */}
        {history.length > 0 && (
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.card, maxWidth: width > 1000 ? 1200 : 800 },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>Previous Goals</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Quickly reuse goals you&apos;ve created in the past (deduped, capped).
            </Text>
            <View style={styles.historyGrid}>
              {history.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.historyItem,
                    { borderColor: colors.border, width: `${100 / historyColumns}%` as any },
                  ]}
                >
                  <View style={styles.historyInfo}>
                    <Text style={[styles.historyTitle, { color: colors.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.historyTarget, { color: colors.textSecondary }]}>
                      Target: {item.targetValue} {item.unit} · step {item.stepSize ?? 1}
                    </Text>
                  </View>
                  <View style={styles.historyActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                      onPress={() => handleReuse(item)}
                      accessibilityLabel={`Reuse ${item.title}`}
                    >
                      <PlusCircle color="#fff" size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.danger }]}
                      onPress={() => removeFromHistory(item.id)}
                      accessibilityLabel={`Delete ${item.title} from history`}
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
          {/* Named templates */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Named Templates</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Save your current dashboards as a reusable multi-goal pack.
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                  minHeight: 48,
                },
              ]}
              placeholder="Template name, e.g. Hydration Station"
              placeholderTextColor={colors.textSecondary}
              value={newTemplateName}
              onChangeText={setNewTemplateName}
            />
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary, marginTop: 12 }]}
              onPress={handleSaveNamed}
            >
              <Text style={styles.buttonText}>Save Current as Template</Text>
            </TouchableOpacity>

            {templates.length > 0 && (
              <View style={{ marginTop: 20, gap: 12 }}>
                {templates.map((tpl) => (
                  <View
                    key={tpl.id}
                    style={[styles.templateRow, { borderColor: colors.border }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.historyTitle, { color: colors.text }]}>
                        {tpl.templateName}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                        {tpl.dashboards.length} goals
                      </Text>
                    </View>
                    <View style={styles.historyActions}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                        onPress={() => {
                          applyTemplate(tpl.id);
                          notify('Applied', `"${tpl.templateName}" added to active goals.`);
                        }}
                        accessibilityLabel={`Apply template ${tpl.templateName}`}
                      >
                        <PlusCircle color="#fff" size={18} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#9b59b6' }]}
                        onPress={() => handleExportNamed(tpl.id)}
                        accessibilityLabel={`Share template ${tpl.templateName}`}
                      >
                        <Copy color="#fff" size={18} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.danger }]}
                        onPress={() => deleteTemplate(tpl.id)}
                        accessibilityLabel={`Delete template ${tpl.templateName}`}
                      >
                        <Trash2 color="#fff" size={18} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Share Your Dashboards</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Export current dashboards as a versioned share code (lz-string). Others paste it below.
            </Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleExportCurrent}
            >
              <Share2 color="#fff" size={18} style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Copy My Setup to Clipboard</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Import from Friend</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Paste a dashboard template share code to append goals.
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholderTextColor={colors.textSecondary}
              placeholder="Paste string here..."
              value={importString}
              onChangeText={setImportString}
              multiline
            />
            <TouchableOpacity
              style={[styles.button, styles.importButton]}
              onPress={handleImport}
            >
              <Text style={styles.buttonText}>Import Template</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    flexDirection: 'row',
    justifyContent: 'center',
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
  historyInfo: { flex: 1, marginRight: 8 },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  historyTarget: { fontSize: 13 },
  historyActions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
});
