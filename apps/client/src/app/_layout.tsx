import { Stack, useRouter, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../contexts/auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../global.css';

// Fix for NativeWind v4 color scheme issue on Web
if (typeof StyleSheet.setFlag === 'function') {
  StyleSheet.setFlag('darkMode', 'class');
}

const queryClient = new QueryClient();

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { session, loading, role } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Update browser tab title based on branch
  useEffect(() => {
    if (Platform.OS === 'web') {
      const branch = process.env.EXPO_PUBLIC_GIT_BRANCH;
      const baseTitle = 'ApplyAI';
      const fullTitle = branch ? `${baseTitle} (${branch})` : baseTitle;

      console.log(`[TabTitle] Setting title to: ${fullTitle} (Branch: ${branch})`);

      // Update immediately and again after a short delay to override Expo Router's automatic title
      document.title = fullTitle;
      const timeout = setTimeout(() => {
        document.title = fullTitle;
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [segments]); // Re-run on every navigation

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inRecruiterGroup = segments[0] === '(recruiter)';
    const inCandidateGroup = segments[0] === '(tabs)';
    const isAtSelectionScreen = segments.length === 0 || (segments.length === 1 && segments[0] === 'index');
    const isPublicRoute = segments[0] === 'job-form' || segments[0] === 'job';

    if (!session) {
      if (!inAuthGroup && !isAtSelectionScreen && !isPublicRoute) {
         router.replace('/');
      }
    } else {
      if (role === 'recruiter') {
        if (!inRecruiterGroup && !isPublicRoute && !isAtSelectionScreen) {
          router.replace('/workspace');
        }
      } else {
        // Allow candidates to access (tabs) group AND the job-form/job details
        if (!inCandidateGroup && !isPublicRoute && !isAtSelectionScreen) {
          router.replace('/assistant');
        }
      }
    }
  }, [session, loading, segments.join(','), role]);

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
