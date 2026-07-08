import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useDashboardStore, VisualType } from '../../store/dashboardStore';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '../../hooks/useAppTheme';

const COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#34495e'];
const VISUAL_TYPES: { label: string; value: VisualType }[] = [
  { label: 'Liquid Wave', value: 'liquidWave' },
  { label: 'Neon Glow', value: 'neonGlow' },
  { label: 'Battery', value: 'batteryCore' },
  { label: 'Gradient Bar', value: 'gradientBar' },
  { label: 'Pizza Slices', value: 'pizzaSlices' },
  { label: 'Sun Horizon', value: 'sunHorizon' },
  { label: 'Hourglass', value: 'hourglass' },
  { label: 'Radar Scope', value: 'radarScope' },
];

export default function CreateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = typeof params.id === 'string' ? params.id : undefined;
  const { colors } = useAppTheme();
  const dashboards = useDashboardStore((s) => s.dashboards);
  const addDashboard = useDashboardStore((s) => s.addDashboard);
  const updateDashboard = useDashboardStore((s) => s.updateDashboard);
  const addToHistory = useDashboardStore((s) => s.addToHistory);

  const existing = editId ? dashboards.find((d) => d.id === editId) : undefined;
  const isEdit = Boolean(existing);

  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState('10');
  const [stepSize, setStepSize] = useState('1');
  const [unit, setUnit] = useState('');
  const [visualType, setVisualType] = useState<VisualType>('liquidWave');
  const [colorTheme, setColorTheme] = useState(COLORS[0]);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setTargetValue(String(existing.targetValue));
      setStepSize(String(existing.stepSize ?? 1));
      setUnit(existing.unit);
      setVisualType(existing.visualType);
      setColorTheme(existing.colorTheme);
    }
  }, [existing?.id]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    const target = parseInt(targetValue, 10);
    if (isNaN(target) || target <= 0) {
      Alert.alert('Error', 'Target must be a positive number');
      return;
    }
    const step = parseFloat(stepSize);
    if (isNaN(step) || step <= 0) {
      Alert.alert('Error', 'Step size must be a positive number');
      return;
    }

    if (isEdit && existing) {
      updateDashboard(existing.id, {
        title: title.trim(),
        targetValue: target,
        stepSize: step,
        unit: unit.trim(),
        visualType,
        colorTheme,
      });
      router.replace('/');
      return;
    }

    addDashboard({
      title: title.trim(),
      targetValue: target,
      stepSize: step,
      unit: unit.trim(),
      visualType,
      colorTheme,
      resetInterval: 'daily',
    });

    addToHistory({
      title: title.trim(),
      targetValue: target,
      stepSize: step,
      unit: unit.trim(),
      visualType,
      colorTheme,
    });

    setTitle('');
    setTargetValue('10');
    setStepSize('1');
    setUnit('');
    setVisualType('liquidWave');
    setColorTheme(COLORS[0]);
    router.replace('/');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Title</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
          ]}
          placeholder="e.g., Water Intake"
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Daily Target</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
          ]}
          placeholder="e.g., 8"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={targetValue}
          onChangeText={setTargetValue}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Step Size (+/−)</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
          ]}
          placeholder="e.g., 1 or 250"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={stepSize}
          onChangeText={setStepSize}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Unit (Optional)</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
          ]}
          placeholder="e.g., glasses"
          placeholderTextColor={colors.textSecondary}
          value={unit}
          onChangeText={setUnit}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Visual Style</Text>
        <View style={styles.row}>
          {VISUAL_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeButton,
                { backgroundColor: colors.card, borderColor: colors.border },
                visualType === type.value && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setVisualType(type.value)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  { color: colors.text },
                  visualType === type.value && styles.typeButtonTextActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Color Theme</Text>
        <View style={styles.colorRow}>
          {COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorCircle,
                { backgroundColor: color },
                colorTheme === color && [styles.colorCircleActive, { borderColor: colors.text }],
              ]}
              onPress={() => setColorTheme(color)}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.success }]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>
            {isEdit ? 'Save Changes' : 'Create Dashboard'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeButton: {
    width: '47%',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  typeButtonText: { fontWeight: '600' },
  typeButtonTextActive: { color: '#fff' },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
  },
  colorCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorCircleActive: {},
  saveButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
