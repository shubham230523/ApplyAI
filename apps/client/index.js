import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// This is the root component for Expo Router
export function App() {
  // @ts-ignore: require.context is provided by expo-router/babel
  const ctx = require.context('./src/app');
  return <ExpoRoot context={ctx} />;
}

// Register the component with Expo
registerRootComponent(App);

// Export for compatibility with hoisted expo/AppEntry.js
export default App;
