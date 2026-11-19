import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { hydrateAddresses } from '@/store/addresses';
import { hydrateBookingDraft } from '@/store/booking';
import { hydrateBookings } from '@/store/bookings';
import { hydratePlans } from '@/store/plans';
import { hydrateQuotes } from '@/store/quotes';
import { restoreSession } from '@/store/session';
import { auth } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const [sessionRestored, setSessionRestored] = useState(false);

  useEffect(() => {
    // Restore before the first screen renders: the splash route needs the session, the order
    // flow needs any saved draft, and the bookings tab needs saved booking history.
    Promise.all([
      restoreSession(),
      hydrateBookingDraft(),
      hydrateBookings(),
      hydratePlans(),
      hydrateAddresses(),
      hydrateQuotes(),
    ]).finally(() => setSessionRestored(true));
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && sessionRestored) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, sessionRestored]);

  if ((!fontsLoaded && !fontError) || !sessionRestored) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: auth.bgTop },
            animation: 'slide_from_right',
          }}>
          <Stack.Screen name="index" options={{ animation: 'fade' }} />
          <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
          <Stack.Screen name="welcome-back" options={{ animation: 'fade' }} />
          <Stack.Screen name="login" />
          <Stack.Screen name="sign-up" />
          <Stack.Screen name="otp" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="area-select" options={{ presentation: 'modal' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen
            name="book/[slug]/details"
            options={{
              presentation: Platform.OS === 'ios' ? 'modal' : 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="book/[slug]/add-ons"
            options={{
              presentation: Platform.OS === 'ios' ? 'modal' : 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="book/[slug]/schedule"
            options={{
              presentation: Platform.OS === 'ios' ? 'modal' : 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="book/[slug]/location"
            options={{
              presentation: Platform.OS === 'ios' ? 'modal' : 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="book/[slug]/review"
            options={{
              presentation: Platform.OS === 'ios' ? 'modal' : 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="payment/[id]"
            options={{
              presentation: Platform.OS === 'ios' ? 'modal' : 'card',
              animation: 'slide_from_right',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="book/[slug]/confirmed"
            options={{
              presentation: Platform.OS === 'ios' ? 'modal' : 'card',
              animation: 'fade',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen name="booking/plans" />
          <Stack.Screen name="booking/[id]" />
          <Stack.Screen name="quote/[slug]" />
          <Stack.Screen name="offers" />
          <Stack.Screen name="refer" />
          <Stack.Screen name="addresses/index" />
          <Stack.Screen name="addresses/[id]" />
          <Stack.Screen name="search" />
          <Stack.Screen name="service/[slug]" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
