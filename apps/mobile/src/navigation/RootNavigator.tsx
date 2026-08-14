import { NavigationContainer } from '@react-navigation/native';

import { useAuth } from '../hooks';
import { BootstrapScreen } from '../screens';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';

/**
 * Top-level switch: bootstrap (restoring JWT) -> auth stack (unauthenticated)
 * -> role-scoped app stack (authenticated). Swapping the whole navigator tree
 * on auth state change is the pattern React Navigation's auth flow guide uses.
 */
export function RootNavigator() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  return (
    <NavigationContainer>
      {isBootstrapping ? <BootstrapScreen /> : isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
