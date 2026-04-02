import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { LayoutDashboard } from 'lucide-react-native';

export default function AboutScreen() {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: `${colors.primary}20` }]}>
              <LayoutDashboard color={colors.primary} size={48} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>CommunityDash</Text>
            <Text style={[styles.version, { color: colors.textSecondary }]}>Version 1.0.0</Text>
          </View>

          <Text style={[styles.bodyText, { color: colors.text }]}>
            I created this tool because I couldn't remember all of the things I told myself I'd try to do in a given day. Any existing tools I found included too many distractions for me that I ended up getting lost in the sauce. I thought others may benefit too.
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Built with React Native & Expo
          </Text>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            100% Free & Open Source
          </Text>
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
  },
  card: {
    padding: 24,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    fontWeight: '600',
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  divider: {
    width: '100%',
    height: 1,
    marginBottom: 24,
  },
  footerText: {
    fontSize: 14,
    marginBottom: 8,
  }
});
