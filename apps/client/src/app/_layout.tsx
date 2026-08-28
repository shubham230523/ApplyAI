import { Stack, useRouter, useSegments } from 'expo-router';
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

  // Set the document title with branch name on Web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const branchName = process.env.EXPO_PUBLIC_GIT_BRANCH;
      const baseTitle = 'ApplyAI';
      document.title = branchName ? `${baseTitle} | ${branchName}` : baseTitle;
    }
  }, []);

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
      // If we are still verifying the true role from the backend, don't redirect yet
      // This prevents the "flash" of the candidate screen for recruiters
      if (loading) return;

      // Logged in users should be sent to their respective workspace if they try to access auth or selection screens
      if (role === 'recruiter') {
        if (inCandidateGroup || inAuthGroup || isAtSelectionScreen) {
          router.replace('/workspace');
        }
      } else if (role === 'candidate') {
        if (inRecruiterGroup || inAuthGroup || isAtSelectionScreen) {
          router.replace('/assistant');
        }
      } else {
        // If role is null (missing metadata), default to candidate but allow manual group access
        if (inAuthGroup || isAtSelectionScreen) {
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
