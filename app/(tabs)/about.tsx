import React from 'react';
import { Image, Linking, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

export default function AboutScreen() {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: `${colors.primary}20` }]}>
              <Image 
                source={require('../../assets/images/communitydashlogo.png')} 
                style={{ width: 60, height: 60 }}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>CommunityDash</Text>
            <Text style={[styles.version, { color: colors.textSecondary }]}>Version 1.0.0</Text>
          </View>

          <Text style={[styles.bodyText, { color: colors.text }]}>
            I created this tool after struggling to find a simple, free dashboard that was not so feature rich as to be distracting or overwhelming to me in my use case, which was simple dashboards to track things like water consumption and exercise. I was hoping others could benefit from the same.  </Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Built with React Native & Expo
          </Text>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            100% Free &{' '}
            <Text 
              style={{ color: colors.primary, textDecorationLine: 'underline' }} 
              onPress={() => Linking.openURL('https://github.com/zeidalidiez/CommunityDash')}
            >
              Open Source
            </Text>
          </Text>

          <View style={[styles.qaSection, { borderColor: colors.border }]}>
            <Text style={[styles.qaText, { color: colors.textSecondary }]}>
              Looking for the world's best QA team? Check out{' '}
              <Text 
                style={{ color: colors.primary, fontWeight: 'bold' }} 
                onPress={() => Linking.openURL('https://topnotchqa.com')}
              >
                Top Notch
              </Text>
            </Text>
            <View style={styles.qaLogoContainer}>
              <Image 
                source={{ uri: 'https://topnotchqa.com/wp-content/uploads/2018/05/tn-logo-small-white.png' }} 
                style={styles.qaLogo}
                resizeMode="contain"
              />
            </View>
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
  card: {
    width: '100%',
    maxWidth: 800,
    padding: 32,
    borderRadius: 24,
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
  },
  qaSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    alignItems: 'center',
    width: '100%',
  },
  qaText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  qaLogoContainer: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 12,
  },
  qaLogo: {
    width: 120,
    height: 40,
  }
});
