import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { fontAssets } from '../src/typography';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

function RootNavigator() {
  const { token, isRestoring } = useAuth();
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isRestoring) return;

    const firstSegment = segments[0] as string | undefined;
    const inAuthGroup = firstSegment === '(auth)' || firstSegment === 'auth';

    if (!token && !inAuthGroup) {
      router.replace('/(auth)/login' as any);
    } else if (token && inAuthGroup) {
      router.replace('/(app)' as any);
    }
  }, [token, isRestoring, segments, router]);

  if (isRestoring || (!fontsLoaded && !fontError)) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#7B6CF6" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(app)/index" />
      <Stack.Screen name="(app)/new" />
      <Stack.Screen name="(app)/task/[id]" />
      <Stack.Screen name="(app)/profile" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="guia" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0C18',
  },
});
