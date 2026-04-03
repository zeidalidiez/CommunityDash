import { Slot, usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, SafeAreaView, ScrollView, LayoutAnimation, UIManager } from 'react-native';
import { Home, PlusCircle, Share2, Settings as SettingsIcon, LayoutDashboard, Info, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AppLayout() {
  const { colors, isDark } = useAppTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { name: '/', label: 'Home', icon: Home },
    { name: '/create', label: 'New Goal', icon: PlusCircle },
    { name: '/templates', label: 'Hub', icon: Share2 },
    { name: '/settings', label: 'Settings', icon: SettingsIcon },
    { name: '/about', label: 'About', icon: Info },
  ];

  const toggleSidebar = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCollapsed(!isCollapsed);
  };

  // Map pathname to title
  const getHeaderTitle = () => {
    if (pathname === '/') return 'CommunityDash';
    if (pathname === '/create') return 'Create New Goal';
    if (pathname === '/templates') return 'Templates Hub';
    if (pathname === '/settings') return 'Settings';
    if (pathname === '/about') return 'About';
    return 'CommunityDash';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.contentRow}>

        {/* SIDEBAR (Fully Collapsible) */}
        <View style={[
          styles.sidebar, 
          { backgroundColor: colors.card, borderRightColor: colors.border, width: isCollapsed ? 0 : 100 }
        ]}>
          {!isCollapsed && (
            <>
              <View style={styles.logoContainer}>
                <LayoutDashboard color={colors.primary} size={32} />
              </View>

              <ScrollView contentContainerStyle={styles.navContainer} showsVerticalScrollIndicator={false}>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.name;

                  return (
                    <TouchableOpacity
                      key={item.name}
                      style={[
                        styles.navButton,
                        { width: 80, height: 70 },
                        isActive && { backgroundColor: colors.primary },
                        !isActive && { backgroundColor: isDark ? '#333' : '#f0f0f0' }
                      ]}
                      onPress={() => router.replace(item.name as any)}
                      activeOpacity={0.7}
                    >
                      <Icon 
                        color={isActive ? '#fff' : colors.textSecondary} 
                        size={24} 
                      />
                      <Text style={[
                        styles.navLabel,
                        { color: isActive ? '#fff' : colors.textSecondary },
                        isActive && styles.navLabelActive
                      ]} numberOfLines={1}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}
        </View>

        {/* Floating Toggle Button (On the outside) */}
        <TouchableOpacity 
          style={[
            styles.floatingToggle, 
            { 
              backgroundColor: isDark ? '#2c2c2c' : '#ffffff',
              left: isCollapsed ? 0 : 84, // Positioned at the edge
              borderTopRightRadius: 12,
              borderBottomRightRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              borderLeftWidth: isCollapsed ? 1 : 0,
            }
          ]} 
          onPress={toggleSidebar}
          activeOpacity={0.8}
        >
          {isCollapsed ? <ChevronRight color={colors.primary} size={24} /> : <ChevronLeft color={colors.primary} size={24} />}
        </TouchableOpacity>

        {/* MAIN CONTENT AREA */}
        <View style={styles.mainContent}>
          {/* Custom Header for the screens */}
          <View style={[styles.header, { backgroundColor: colors.background, paddingLeft: isCollapsed ? 48 : 20 }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{getHeaderTitle()}</Text>
          </View>

          <Slot />
        </View>

      </View>
    </SafeAreaView>
  );
  }

  const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    paddingVertical: 24,
    alignItems: 'center',
    borderRightWidth: 1,
    elevation: 4,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    zIndex: 10,
    overflow: 'hidden',
  },
  logoContainer: {
    marginBottom: 32,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
  },
  floatingToggle: {
    position: 'absolute',
    top: 16,
    width: 36,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navContainer: {
    gap: 16,
    alignItems: 'center',
    paddingBottom: 24,
  },
  navButton: {
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  navLabelActive: {
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    paddingVertical: 16,
    justifyContent: 'center',
    zIndex: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  });
