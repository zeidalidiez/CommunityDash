import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { DashboardItem, useDashboardStore, VisualType } from '../store/dashboardStore';
import {
  LiquidWave,
  NeonGlowRing,
  BatteryCore,
  GradientBar,
  PizzaSlices,
  SunHorizon,
  Hourglass,
  RadarScope,
} from './Visualizations';
import { Minus, Plus, Trash2, Palette, Pencil } from 'lucide-react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useRouter } from 'expo-router';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface DashboardCardProps {
  item: DashboardItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onDelete: () => void;
}

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

export default function DashboardCard({
  item,
  onIncrement,
  onDecrement,
  onDelete,
}: DashboardCardProps) {
  const { colors, isDark } = useAppTheme();
  const updateDashboard = useDashboardStore((state) => state.updateDashboard);
  const router = useRouter();

  const progress =
    item.targetValue > 0 ? item.currentValue / item.targetValue : 0;
  const isCompleted = item.currentValue >= item.targetValue;
  const isOverflow = item.currentValue > item.targetValue;
  const overflowPct =
    item.targetValue > 0
      ? Math.round(((item.currentValue - item.targetValue) / item.targetValue) * 100)
      : 0;

  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);

  const pulseScale = useSharedValue(1);
  useEffect(() => {
    pulseScale.value = withTiming(1.04, { duration: 120 }, () => {
      pulseScale.value = withTiming(1, { duration: 180 });
    });
  }, [item.currentValue, pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const handleDelete = (e: any) => {
    e?.stopPropagation?.();
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Are you sure you want to stop tracking "${item.title}"?`
      );
      if (confirmed) onDelete();
    } else {
      Alert.alert('Delete Goal', `Are you sure you want to stop tracking "${item.title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]);
    }
  };

  const handleIncrement = (e: any) => {
    e?.stopPropagation?.();
    onIncrement();
  };

  const handleDecrement = (e: any) => {
    e?.stopPropagation?.();
    onDecrement();
  };

  const handleEdit = (e: any) => {
    e?.stopPropagation?.();
    router.push({ pathname: '/create', params: { id: item.id } });
  };

  const renderVisual = () => {
    const actualColor = isOverflow
      ? '#f39c12'
      : isCompleted
        ? colors.success
        : item.colorTheme;
    const tColor = isDark ? '#333' : '#e6e6e6';
    const visProps = {
      progress,
      color: actualColor,
      trackColor: tColor,
      targetValue: item.targetValue,
      currentValue: item.currentValue,
      overflow: isOverflow,
    };

    switch (item.visualType) {
      case 'neonGlow':
        return <NeonGlowRing {...visProps} />;
      case 'batteryCore':
        return <BatteryCore {...visProps} />;
      case 'gradientBar':
        return <GradientBar {...visProps} />;
      case 'pizzaSlices':
        return <PizzaSlices {...visProps} />;
      case 'sunHorizon':
        return <SunHorizon {...visProps} />;
      case 'hourglass':
        return <Hourglass {...visProps} />;
      case 'radarScope':
        return <RadarScope {...visProps} />;
      case 'liquidWave':
      default:
        return <LiquidWave {...visProps} />;
    }
  };

  return (
    <>
      <Pressable
        onPress={toggleExpand}
        style={[
          styles.card,
          { backgroundColor: colors.card },
          isCompleted && {
            backgroundColor: isDark ? '#1a3320' : '#f9fff9',
            borderColor: isOverflow ? '#f39c12' : colors.success,
            borderWidth: 1,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.valueCol}>
            <Text
              style={[
                styles.valueText,
                { color: isOverflow ? '#f39c12' : colors.textSecondary },
              ]}
            >
              {item.currentValue} / {item.targetValue} {item.unit}
            </Text>
            {isOverflow && (
              <View style={[styles.overflowChip, { backgroundColor: '#f39c1222' }]}>
                <Text style={styles.overflowChipText}>+{overflowPct}% over</Text>
              </View>
            )}
          </View>
        </View>

        <Animated.View style={[styles.visualContainer, pulseStyle]}>
          {renderVisual()}
        </Animated.View>

        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: isDark ? '#444' : '#e0e0e0' }]}
            onPress={handleDecrement}
            activeOpacity={0.7}
            accessibilityLabel={`Decrease ${item.title} by ${item.stepSize}`}
          >
            <Minus color={isDark ? '#fff' : '#333'} size={24} />
          </TouchableOpacity>
          <Text style={[styles.stepHint, { color: colors.textSecondary }]}>
            ±{item.stepSize}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: item.colorTheme }]}
            onPress={handleIncrement}
            activeOpacity={0.7}
            accessibilityLabel={`Increase ${item.title} by ${item.stepSize}`}
          >
            <Plus color="#fff" size={24} />
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <View style={[styles.expandedArea, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}
              onPress={handleEdit}
              activeOpacity={0.7}
            >
              <Pencil color={colors.textSecondary} size={18} />
              <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>
                Edit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}
              onPress={(e) => {
                e?.stopPropagation?.();
                setModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Palette color={colors.textSecondary} size={18} />
              <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>
                Visual
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.danger + '15' }]}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Trash2 color={colors.danger} size={20} />
              <Text style={[styles.actionBtnText, { color: colors.danger }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </Pressable>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.card, shadowColor: colors.text },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Visual Style
            </Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {VISUAL_TYPES.map((type) => {
                const isActive = item.visualType === type.value;
                return (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.modalOption,
                      { borderBottomColor: colors.border },
                      isActive && { backgroundColor: colors.primary + '15' },
                    ]}
                    onPress={() => {
                      updateDashboard(item.id, { visualType: type.value });
                      setModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        { color: isActive ? colors.primary : colors.text },
                        isActive && { fontWeight: 'bold' },
                      ]}
                    >
                      {type.label}
                    </Text>
                    {isActive && (
                      <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.modalCloseText, { color: colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginVertical: 10,
    marginHorizontal: 16,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 16,
  },
  valueCol: {
    alignItems: 'flex-end',
  },
  valueText: {
    fontSize: 16,
    fontWeight: '600',
  },
  overflowChip: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  overflowChipText: {
    color: '#e67e22',
    fontSize: 11,
    fontWeight: '700',
  },
  visualContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    minHeight: 120,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingHorizontal: 24,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepHint: {
    fontSize: 13,
    fontWeight: '600',
  },
  expandedArea: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
  },
  modalOptionText: {
    fontSize: 16,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalCloseBtn: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
