import React from 'react';
import { Stack } from 'expo-router';

export default function RecruiterLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="workspace" />
      <Stack.Screen name="create-job" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
