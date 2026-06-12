import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useGlobalSearchParams, usePathname } from "expo-router";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PendoSDK, NavigationLibraryType, WithPendoExpoRouter } from "rn-pendo-sdk";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ScreenshotProvider } from "@/context/ScreenshotContext";

const VISITOR_ID_KEY = "@pendo_visitor_id";

async function getOrCreateVisitorId(): Promise<string> {
  let visitorId = await AsyncStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId =
      Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
    await AsyncStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

PendoSDK.setup("6b0aaade-d00c-42d4-9893-27c1ca42be98", {
  library: NavigationLibraryType.ExpoRouter,
});

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

function RootLayout(props: any) {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const pathname = usePathname();
  const params = useGlobalSearchParams();

  useEffect(() => {
    props.onExpoRouterStateChange(pathname, params);
  }, [pathname, params, props]);

  useEffect(() => {
    getOrCreateVisitorId().then((visitorId) => {
      PendoSDK.startSession(visitorId, "", {}, {});
    });
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <ScreenshotProvider>
                <RootLayoutNav />
              </ScreenshotProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

export default WithPendoExpoRouter(RootLayout);
