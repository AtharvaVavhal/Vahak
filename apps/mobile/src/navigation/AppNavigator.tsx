import { useAuth } from '../hooks';
import { UserRole } from '../types';
import { AdminNavigator } from './AdminNavigator';
import { ConductorNavigator } from './ConductorNavigator';
import { RecipientNavigator } from './RecipientNavigator';
import { SenderNavigator } from './SenderNavigator';

/**
 * Picks the role-scoped stack for the authenticated user. Only rendered once
 * RootNavigator has confirmed isAuthenticated, so `user` is expected to be set.
 */
export function AppNavigator() {
  const { user } = useAuth();

  switch (user?.role) {
    case UserRole.SENDER:
      return <SenderNavigator />;
    case UserRole.CONDUCTOR:
      return <ConductorNavigator />;
    case UserRole.RECIPIENT:
      return <RecipientNavigator />;
    case UserRole.ADMIN:
      return <AdminNavigator />;
    default:
      return null;
  }
}
