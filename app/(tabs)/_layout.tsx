import { Slot, usePathname, useRouter } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Text, Platform, SafeAreaView, ScrollView } from 'react-native';
import { Home, PlusCircle, Share2, Settings as SettingsIcon, LayoutDashboard, Info } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function AppLayout() {
  const { colors, isDark } = useAppTheme();
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: '/', label: 'Home', icon: Home },
    { name: '/create', label: 'New Goal', icon: PlusCircle },
    { name: '/templates', label: 'Hub', icon: Share2 },
    { name: '/settings', label: 'Settings', icon: SettingsIcon },
    { name: '/about', label: 'About', icon: Info },
  ];

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
        
        {/* SIDEBAR (The Menu Bar on its side with actual buttons) */}
        <View style={[styles.sidebar, { backgroundColor: colors.card, borderRightColor: colors.border }]}>
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
                    isActive && { backgroundColor: colors.primary },
                    !isActive && { backgroundColor: isDark ? '#333' : '#f0f0f0' } // Actual buttons look
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
        </View>

        {/* MAIN CONTENT AREA */}
        <View style={styles.mainContent}>
          {/* Custom Header for the screens */}
          <View style={[styles.header, { backgroundColor: colors.background }]}>
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
    width: 90, // Menu bar on its side
    paddingVertical: 24,
    alignItems: 'center',
    borderRightWidth: 1,
    elevation: 4,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    zIndex: 10, // above content
  },
  logoContainer: {
    marginBottom: 32,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
  },
  navContainer: {
    gap: 16,
    alignItems: 'center',
    paddingBottom: 24,
  },
  navButton: {
    width: 70,
    height: 70,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    // "actual buttons" aesthetic
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'center',
    zIndex: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
