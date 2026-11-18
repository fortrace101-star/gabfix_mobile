import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect } from 'react';

import { BrandTabBar } from '@/components/navigation/brand-tab-bar';
import { colors } from '@/theme';
import { useSessionStatus } from '@/store/session';

/**
 * P4–P6 shell: the four top-level tabs share one custom brand tab bar and one session guard.
 * The Home tab is `/home` (not `/`) so the splash route keeps its own URL.
 */
export default function TabsLayout() {
  const sessionStatus = useSessionStatus();

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') router.replace('/login');
  }, [sessionStatus]);

  if (sessionStatus !== 'authenticated') return null;

  return (
    <Tabs
      tabBar={(props) => <BrandTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="services" options={{ title: 'Services' }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
