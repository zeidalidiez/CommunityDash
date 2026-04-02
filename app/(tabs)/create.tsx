import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useDashboardStore, VisualType } from '../../store/dashboardStore';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../hooks/useAppTheme';

const COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#34495e'];
const VISUAL_TYPES: { label: string; value: VisualType }[] = [
  { label: 'Ring', value: 'progressRing' },
  { label: 'Counter', value: 'counter' },
  { label: 'Steps', value: 'segmentedSteps' },
  { label: 'Journey', value: 'stepJourney' },
  { label: 'Stars', value: 'starRating' },
  { label: 'Gauge', value: 'speedometer' },
  { label: 'Color Shift', value: 'colorCircle' },
];

export default function CreateScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const addDashboard = useDashboardStore((state) => state.addDashboard);
  const addToHistory = useDashboardStore((state) => state.addToHistory);

  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState('10');
  const [unit, setUnit] = useState('');
  const [visualType, setVisualType] = useState<VisualType>('progressRing');
  const [colorTheme, setColorTheme] = useState(COLORS[0]);

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

    addDashboard({
      title: title.trim(),
      targetValue: target,
      unit: unit.trim(),
      visualType,
      colorTheme,
      resetInterval: 'daily',
    });

    addToHistory({
      title: title.trim(),
      targetValue: target,
      unit: unit.trim(),
      visualType,
      colorTheme,
    });

    setTitle('');
    setTargetValue('10');
    setUnit('');
    setVisualType('progressRing');
    setColorTheme(COLORS[0]);

    router.replace('/');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Title</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          placeholder="e.g., Water Intake"
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Daily Target</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          placeholder="e.g., 8"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={targetValue}
          onChangeText={setTargetValue}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Unit (Optional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
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
                visualType === type.value && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setVisualType(type.value)}
            >
              <Text style={[
                styles.typeButtonText, 
                { color: colors.text },
                visualType === type.value && styles.typeButtonTextActive
              ]}>
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

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.success }]} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Create Dashboard</Text>
        </TouchableOpacity>
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
    paddingBottom: 32, // Normal padding at bottom
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
  typeButtonText: {
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
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
  colorCircleActive: {
    // border color applied inline
  },
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
