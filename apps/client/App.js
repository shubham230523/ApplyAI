import { ExpoRoot } from 'expo-router';

// This component handles the Expo Router root
export function App() {
  // Use the standard src/app directory for the router context
  const ctx = require.context('./src/app');
  return <ExpoRoot context={ctx} />;
}

export default App;
