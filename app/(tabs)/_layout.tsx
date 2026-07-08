import { Slot, usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  SafeAreaView,
  ScrollView,
  LayoutAnimation,
  UIManager,
  Image,
  useWindowDimensions,
} from 'react-native';
import {
  Home,
  PlusCircle,
  Share2,
  Settings as SettingsIcon,
  Info,
  ChevronLeft,
  ChevronRight,
  LineChart,
} from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const WIDE_BREAKPOINT = 768;

const navItems = [
  { name: '/', label: 'Home', icon: Home },
  { name: '/create', label: 'New Goal', icon: PlusCircle },
  { name: '/templates', label: 'Hub', icon: Share2 },
  { name: '/history', label: 'History', icon: LineChart },
  { name: '/settings', label: 'Settings', icon: SettingsIcon },
  { name: '/about', label: 'About', icon: Info },
];

export default function AppLayout() {
  const { colors, isDark } = useAppTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCollapsed(!isCollapsed);
  };

  const getHeaderTitle = () => {
    if (pathname === '/') return 'CommunityDash';
    if (pathname === '/create') return 'Create / Edit Goal';
    if (pathname === '/templates') return 'Templates Hub';
    if (pathname === '/history') return 'History';
    if (pathname === '/settings') return 'Settings';
    if (pathname === '/about') return 'About';
    return 'CommunityDash';
  };

  const isActive = (name: string) => pathname === name;

  const NavButton = ({
    item,
    compact,
  }: {
    item: (typeof navItems)[0];
    compact?: boolean;
  }) => {
    const Icon = item.icon;
    const active = isActive(item.name);
    return (
      <TouchableOpacity
        key={item.name}
        style={[
          compact ? styles.tabButton : styles.navButton,
          !compact && { width: 80, height: 70 },
          active && { backgroundColor: colors.primary },
          !active && {
            backgroundColor: compact
              ? 'transparent'
              : isDark
                ? '#333'
                : '#f0f0f0',
          },
        ]}
        onPress={() => router.replace(item.name as any)}
        activeOpacity={0.7}
        accessibilityLabel={item.label}
      >
        <Icon color={active ? (compact ? colors.primary : '#fff') : colors.textSecondary} size={compact ? 22 : 24} />
        <Text
          style={[
            compact ? styles.tabLabel : styles.navLabel,
            {
              color: active
                ? compact
                  ? colors.primary
                  : '#fff'
                : colors.textSecondary,
            },
            active && styles.navLabelActive,
          ]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.contentRow}>
        {isWide && (
          <>
            <View
              style={[
                styles.sidebar,
                {
                  backgroundColor: colors.card,
                  borderRightColor: colors.border,
                  width: isCollapsed ? 0 : 100,
                },
              ]}
            >
              {!isCollapsed && (
                <>
                  <View style={styles.logoContainer}>
                    <Image
                      source={require('../../assets/images/communitydashlogo.png')}
                      style={{ width: 40, height: 40 }}
                      resizeMode="contain"
                    />
                  </View>
                  <ScrollView
                    contentContainerStyle={styles.navContainer}
                    showsVerticalScrollIndicator={false}
                  >
                    {navItems.map((item) => (
                      <NavButton key={item.name} item={item} />
                    ))}
                  </ScrollView>
                </>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.floatingToggle,
                {
                  backgroundColor: isDark ? '#2c2c2c' : '#ffffff',
                  left: isCollapsed ? 0 : 84,
                  borderTopRightRadius: 12,
                  borderBottomRightRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderLeftWidth: isCollapsed ? 1 : 0,
                },
              ]}
              onPress={toggleSidebar}
              activeOpacity={0.8}
              accessibilityLabel={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight color={colors.primary} size={24} />
              ) : (
                <ChevronLeft color={colors.primary} size={24} />
              )}
            </TouchableOpacity>
          </>
        )}

        <View style={styles.mainContent}>
          <View
            style={[
              styles.header,
              {
                backgroundColor: colors.background,
                paddingLeft: isWide && isCollapsed ? 48 : 20,
              },
            ]}
          >
            <Text style={[styles.headerTitle, { color: colors.text }]}>{getHeaderTitle()}</Text>
          </View>
          <View style={styles.slot}>
            <Slot />
          </View>

          {!isWide && (
            <View
              style={[
                styles.tabBar,
                {
                  backgroundColor: colors.card,
                  borderTopColor: colors.border,
                },
              ]}
            >
              {navItems.map((item) => (
                <NavButton key={item.name} item={item} compact />
              ))}
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentRow: { flex: 1, flexDirection: 'row' },
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
  navLabel: { fontSize: 10, fontWeight: '600' },
  navLabelActive: { fontWeight: 'bold' },
  mainContent: { flex: 1, flexDirection: 'column' },
  header: {
    paddingVertical: 16,
    justifyContent: 'center',
    zIndex: 5,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  slot: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
    paddingTop: 4,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 2,
    borderRadius: 10,
    marginHorizontal: 2,
  },
  tabLabel: { fontSize: 9, fontWeight: '600' },
});
