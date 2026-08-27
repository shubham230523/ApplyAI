import React from 'react';
import { Stack } from 'expo-router';

export default function RecruiterLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ href: null } as any} />
      <Stack.Screen name="workspace" />
    </Stack>
  );
}
