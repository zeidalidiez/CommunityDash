import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import Svg, { Polyline, Line, Circle, Rect } from 'react-native-svg';
import { useDashboardStore } from '../../store/dashboardStore';
import { useAppTheme } from '../../hooks/useAppTheme';

export default function HistoryScreen() {
  const { colors, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const dailySnapshots = useDashboardStore((s) => s.dailySnapshots);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...dailySnapshots].sort((a, b) => a.date.localeCompare(b.date)),
    [dailySnapshots]
  );

  const chartWidth = Math.min(width - 48, 720);
  const chartHeight = 160;
  const pad = 16;

  const points = useMemo(() => {
    if (sorted.length === 0) return '';
    const maxX = sorted.length - 1 || 1;
    return sorted
      .map((s, i) => {
        const x = pad + (i / maxX) * (chartWidth - pad * 2);
        const y =
          chartHeight - pad - (Math.min(100, Math.max(0, s.percentage)) / 100) * (chartHeight - pad * 2);
        return `${x},${y}`;
      })
      .join(' ');
  }, [sorted, chartWidth]);

  const selected = selectedDate
    ? sorted.find((s) => s.date === selectedDate)
    : sorted.length
      ? sorted[sorted.length - 1]
      : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: colors.card, maxWidth: 800 }]}>
          <Text style={[styles.title, { color: colors.text }]}>Completion over time</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            Daily % of goals met (device local calendar).
          </Text>

          {sorted.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              Not enough data yet. Log some goals — snapshots appear as you track and after day
              boundaries.
            </Text>
          ) : (
            <>
              <Svg width={chartWidth} height={chartHeight}>
                <Line
                  x1={pad}
                  y1={chartHeight - pad}
                  x2={chartWidth - pad}
                  y2={chartHeight - pad}
                  stroke={colors.border}
                  strokeWidth={1}
                />
                <Line
                  x1={pad}
                  y1={pad}
                  x2={pad}
                  y2={chartHeight - pad}
                  stroke={colors.border}
                  strokeWidth={1}
                />
                {/* 50% guide */}
                <Line
                  x1={pad}
                  y1={chartHeight / 2}
                  x2={chartWidth - pad}
                  y2={chartHeight / 2}
                  stroke={colors.border}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                {points ? (
                  <Polyline
                    points={points}
                    fill="none"
                    stroke={colors.primary}
                    strokeWidth={3}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ) : null}
                {sorted.map((s, i) => {
                  const maxX = sorted.length - 1 || 1;
                  const x = pad + (i / maxX) * (chartWidth - pad * 2);
                  const y =
                    chartHeight -
                    pad -
                    (Math.min(100, Math.max(0, s.percentage)) / 100) * (chartHeight - pad * 2);
                  const active = selected?.date === s.date;
                  return (
                    <Circle
                      key={s.date}
                      cx={x}
                      cy={y}
                      r={active ? 6 : 4}
                      fill={active ? colors.success : colors.primary}
                      onPress={() => setSelectedDate(s.date)}
                    />
                  );
                })}
              </Svg>

              <View style={styles.dayList}>
                {[...sorted].reverse().map((s) => (
                  <TouchableOpacity
                    key={s.date}
                    style={[
                      styles.dayRow,
                      { borderColor: colors.border },
                      selected?.date === s.date && { backgroundColor: `${colors.primary}15` },
                    ]}
                    onPress={() => setSelectedDate(s.date)}
                  >
                    <Text style={[styles.dayDate, { color: colors.text }]}>{s.date}</Text>
                    <Text style={[styles.dayPct, { color: colors.textSecondary }]}>
                      {s.completedCount}/{s.totalCount} ({Math.round(s.percentage)}%)
                    </Text>
                    <View
                      style={[
                        styles.miniBarBg,
                        { backgroundColor: isDark ? '#333' : '#e6e6e6' },
                      ]}
                    >
                      <View
                        style={[
                          styles.miniBarFill,
                          {
                            width: `${Math.min(100, s.percentage)}%` as any,
                            backgroundColor: colors.success,
                          },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {selected && (
          <View style={[styles.card, { backgroundColor: colors.card, maxWidth: 800 }]}>
            <Text style={[styles.title, { color: colors.text }]}>Day detail — {selected.date}</Text>
            {Object.keys(selected.goals).length === 0 ? (
              <Text style={[styles.empty, { color: colors.textSecondary }]}>No goals that day.</Text>
            ) : (
              Object.entries(selected.goals).map(([id, g]) => (
                <View key={id} style={[styles.goalRow, { borderBottomColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.goalTitle, { color: colors.text }]}>{g.title}</Text>
                    <Text style={{ color: colors.textSecondary }}>
                      {g.currentValue} / {g.targetValue} {g.unit}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: g.completed
                          ? `${colors.success}22`
                          : isDark
                            ? '#333'
                            : '#eee',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: g.completed ? colors.success : colors.textSecondary,
                        fontWeight: '700',
                        fontSize: 12,
                      }}
                    >
                      {g.completed ? 'Met' : 'Missed'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, alignItems: 'center' },
  card: {
    width: '100%',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  sub: { fontSize: 14, marginBottom: 16, lineHeight: 20 },
  empty: { fontSize: 15, lineHeight: 22, paddingVertical: 12 },
  dayList: { marginTop: 16, gap: 8 },
  dayRow: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  dayDate: { fontWeight: '700', fontSize: 15 },
  dayPct: { marginTop: 4, marginBottom: 8, fontSize: 13 },
  miniBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  miniBarFill: { height: '100%' },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  goalTitle: { fontWeight: '600', fontSize: 16, marginBottom: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
});
