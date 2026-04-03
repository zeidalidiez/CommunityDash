import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, useWindowDimensions, Image } from 'react-native';
import { useDashboardStore } from '../../store/dashboardStore';
import DashboardCard from '../../components/DashboardCard';
import { Link } from 'expo-router';
import { useAppTheme } from '../../hooks/useAppTheme';

export default function DailyScreen() {
  const { colors, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const dashboards = useDashboardStore((state) => state.dashboards);
  const incrementValue = useDashboardStore((state) => state.incrementValue);
  const decrementValue = useDashboardStore((state) => state.decrementValue);
  const removeDashboard = useDashboardStore((state) => state.removeDashboard);

  // Determine number of columns based on width
  const numColumns = useMemo(() => {
    if (width >= 1500) return 5;
    if (width >= 1200) return 4;
    if (width >= 900) return 3;
    if (width >= 600) return 2;
    return 1;
  }, [width]);

  const completed = dashboards.filter((d) => d.currentValue >= d.targetValue).length;
  const total = dashboards.length;
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  if (dashboards.length === 0) {
    return (
      <SafeAreaView style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Image 
          source={require('../../assets/images/communitydashlogo.png')} 
          style={{ width: 100, height: 100, marginBottom: 24, opacity: 0.8 }}
          resizeMode="contain"
        />
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
        key={`grid-${numColumns}`} // Force re-render when columns change
        numColumns={numColumns}
        data={dashboards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.cardWrapper, { width: `${100 / numColumns}%` }]}>
            <DashboardCard
              item={item}
              onIncrement={() => incrementValue(item.id)}
              onDecrement={() => decrementValue(item.id)}
              onDelete={() => removeDashboard(item.id)}
            />
          </View>
        )}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.heroSection}>
            <View style={[styles.heroIcon, { backgroundColor: `${colors.primary}20` }]}>
              <Image 
                source={require('../../assets/images/communitydashlogo.png')} 
                style={{ width: 40, height: 40 }}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Hello there!</Text>
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
              You are tracking {total} goal{total !== 1 ? 's' : ''} today.
            </Text>
          </View>
        }
      />

      <View style={[styles.tallyWrapper]}>
        <View style={[styles.tallyContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <Text style={[styles.tallyText, { color: colors.text }]}>
            {completed} / {total} Goals Met
          </Text>
          <View style={[styles.progressBarBackground, { backgroundColor: isDark ? '#333' : '#e6e6e6' }]}>
            <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: colors.success }]} />
          </View>
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
    width: '100%',
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
    paddingBottom: 140, // padding for the floating tally
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    paddingHorizontal: 8,
  },
  cardWrapper: {
    padding: 0, // DashboardCard has its own margins
  },
  tallyWrapper: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  tallyContainer: {
    width: '100%',
    maxWidth: 600, // Constrain tally width on desktop
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
