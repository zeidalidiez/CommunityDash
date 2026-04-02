import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { useDashboardStore } from '../../store/dashboardStore';
import DashboardCard from '../../components/DashboardCard';
import { Link } from 'expo-router';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Activity } from 'lucide-react-native';

export default function DailyScreen() {
  const { colors, isDark } = useAppTheme();
  const dashboards = useDashboardStore((state) => state.dashboards);
  const incrementValue = useDashboardStore((state) => state.incrementValue);
  const decrementValue = useDashboardStore((state) => state.decrementValue);
  const removeDashboard = useDashboardStore((state) => state.removeDashboard);

  const completed = dashboards.filter((d) => d.currentValue >= d.targetValue).length;
  const total = dashboards.length;
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  if (dashboards.length === 0) {
    return (
      <SafeAreaView style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Activity size={64} color={colors.primary} style={{ marginBottom: 24, opacity: 0.8 }} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>You have no dashboards yet.</Text>
        <Link href="/create" style={[styles.emptyLink, { backgroundColor: colors.primary }]}>
          <Text style={styles.emptyLinkText}>Create your first dashboard</Text>
        </Link>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={dashboards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DashboardCard
            item={item}
            onIncrement={() => incrementValue(item.id)}
            onDecrement={() => decrementValue(item.id)}
            onDelete={() => removeDashboard(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.heroSection}>
            <View style={[styles.heroIcon, { backgroundColor: `${colors.primary}20` }]}>
              <Activity size={32} color={colors.primary} />
            </View>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Hello there!</Text>
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
              You are tracking {total} goal{total !== 1 ? 's' : ''} today.
            </Text>
          </View>
        }
      />

      <View style={[styles.tallyContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <Text style={[styles.tallyText, { color: colors.text }]}>
          {completed} / {total} Goals Met
        </Text>
        <View style={[styles.progressBarBackground, { backgroundColor: isDark ? '#333' : '#e6e6e6' }]}>
          <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: colors.success }]} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    alignItems: 'center',
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 100, // padding for the floating tally
  },
  tallyContainer: {
    position: 'absolute',
    bottom: 24, // Floating slightly above the bottom boundary
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tallyText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  progressBarBackground: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 24,
  },
  emptyLink: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyLinkText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
