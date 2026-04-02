import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, LayoutAnimation, Platform, UIManager, Alert, ScrollView, Modal } from 'react-native';
import { DashboardItem, useDashboardStore, VisualType } from '../store/dashboardStore';
import ProgressRing from './ProgressRing';
import { SegmentedSteps, StepJourney, StarRating, ColorCircle, Speedometer } from './Visualizations';
import { Minus, Plus, Trash2, Palette } from 'lucide-react-native';
import { useAppTheme } from '../hooks/useAppTheme';

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
  { label: 'Ring', value: 'progressRing' },
  { label: 'Counter', value: 'counter' },
  { label: 'Steps', value: 'segmentedSteps' },
  { label: 'Journey', value: 'stepJourney' },
  { label: 'Stars', value: 'starRating' },
  { label: 'Gauge', value: 'speedometer' },
  { label: 'Color Shift', value: 'colorCircle' },
];

export default function DashboardCard({ item, onIncrement, onDecrement, onDelete }: DashboardCardProps) {
  const { colors, isDark } = useAppTheme();
  const updateDashboard = useDashboardStore((state) => state.updateDashboard);
  
  const progress = item.targetValue > 0 ? item.currentValue / item.targetValue : 0;
  const isCompleted = item.currentValue >= item.targetValue;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const handleDelete = (e: any) => {
    e?.stopPropagation();

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to stop tracking "${item.title}"?`);
      if (confirmed) {
        onDelete();
      }
    } else {
      Alert.alert(
        'Delete Goal',
        `Are you sure you want to stop tracking "${item.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: onDelete },
        ]
      );
    }
  };

  const handleIncrement = (e: any) => {
    e?.stopPropagation();
    onIncrement();
  };

  const handleDecrement = (e: any) => {
    e?.stopPropagation();
    onDecrement();
  };

  const renderVisual = () => {
    const actualColor = isCompleted ? colors.success : item.colorTheme;
    const tColor = isDark ? '#333' : '#e6e6e6';
    
    switch(item.visualType) {
      case 'segmentedSteps':
        return <SegmentedSteps progress={progress} color={actualColor} trackColor={tColor} targetValue={item.targetValue} />;
      case 'stepJourney':
        return <StepJourney progress={progress} color={actualColor} trackColor={tColor} targetValue={item.targetValue} />;
      case 'starRating':
        return <StarRating progress={progress} color={actualColor} trackColor={tColor} targetValue={item.targetValue} />;
      case 'speedometer':
        return <Speedometer progress={progress} color={actualColor} trackColor={tColor} targetValue={item.targetValue} />;
      case 'colorCircle':
        return <ColorCircle progress={progress} color={actualColor} trackColor={tColor} targetValue={item.targetValue} />;
      case 'progressRing':
      default:
        if (item.visualType === 'counter') {
          return <Text style={[styles.counterText, { color: actualColor }]}>{Math.round(progress * 100)}%</Text>;
        }
        return <ProgressRing radius={48} strokeWidth={10} progress={progress} color={actualColor} trackColor={tColor} />;
    }
  };

  return (
    <>
      <Pressable 
        onPress={toggleExpand}
        style={[
          styles.card, 
          { backgroundColor: colors.card },
          isCompleted && { backgroundColor: isDark ? '#1a3320' : '#f9fff9', borderColor: colors.success, borderWidth: 1 }
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.valueText, { color: colors.textSecondary }]}>
            {item.currentValue} / {item.targetValue} {item.unit}
          </Text>
        </View>

        <View style={styles.visualContainer}>
          {renderVisual()}
        </View>

        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: isDark ? '#444' : '#e0e0e0' }]} 
            onPress={handleDecrement} 
            activeOpacity={0.7}
          >
            <Minus color={isDark ? '#fff' : '#333'} size={24} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: item.colorTheme }]} 
            onPress={handleIncrement} 
            activeOpacity={0.7}
          >
            <Plus color="#fff" size={24} />
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <View style={[styles.expandedArea, { borderTopColor: colors.border }]}>
            
            <TouchableOpacity 
              style={[styles.visualSelectorBtn, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]} 
              onPress={(e) => { e?.stopPropagation(); setModalVisible(true); }}
              activeOpacity={0.7}
            >
              <Palette color={colors.textSecondary} size={18} />
              <Text style={[styles.visualSelectorBtnText, { color: colors.textSecondary }]}>Change Visual Style</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.deleteButton, { backgroundColor: colors.danger + '15' }]} 
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Trash2 color={colors.danger} size={20} />
              <Text style={[styles.deleteText, { color: colors.danger }]}>Delete Goal</Text>
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
          <View style={[styles.modalContent, { backgroundColor: colors.card, shadowColor: colors.text }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Visual Style</Text>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {VISUAL_TYPES.map((type) => {
                const isActive = item.visualType === type.value;
                return (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.modalOption,
                      { borderBottomColor: colors.border },
                      isActive && { backgroundColor: colors.primary + '15' }
                    ]}
                    onPress={() => {
                      updateDashboard(item.id, { visualType: type.value });
                      setModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.modalOptionText,
                      { color: isActive ? colors.primary : colors.text },
                      isActive && { fontWeight: 'bold' }
                    ]}>
                      {type.label}
                    </Text>
                    {isActive && <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
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
    alignItems: 'baseline',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 16,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '600',
  },
  visualContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    minHeight: 120, // ensure enough space for visualizations
  },
  counterText: {
    fontSize: 36,
    fontWeight: '900',
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
  expandedArea: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  visualSelectorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  visualSelectorBtnText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  deleteText: {
    fontWeight: 'bold',
    fontSize: 14,
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
    backgroundColor: 'rgba(52, 152, 219, 0.1)', // Light primary tint
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});
