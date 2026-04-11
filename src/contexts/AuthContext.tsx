import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import keycloak from '../auth/keycloak';
import { driverApi } from '../services/api';

export type UserRole = 'driver' | 'fleet-manager';

interface User {
  id: string;
  name: string;
  role: UserRole;
  driverId?: string;
  keycloakRoles: string[];
}

interface AuthContextType {
  user: User | null;
  authenticated: boolean;
  setUser: (user: User | null) => void;
  login: () => void;
  loginWith: (idpHint: 'google' | 'apple') => void;
  register: () => void;
  loginAsDriver: (driverId: string, driverName: string) => void;
  loginAsManager: () => void;
  isDriver: boolean;
  isFleetManager: boolean;
  hasBothRoles: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [initialized, setInitialized] = useState(false);
  const [user, setUserState] = useState<User | null>(null);

  useEffect(() => {
    keycloak
      .init({ onLoad: 'check-sso', checkLoginIframe: false, pkceMethod: 'S256' })
      .then(async (authenticated) => {
        if (authenticated) {
          const token = keycloak.tokenParsed as any;
          const roles: string[] = token?.realm_access?.roles ?? [];
          const hasDriverRole = roles.includes('fleet_driver');
          const hasManagerRole = roles.includes('fleet_manager') || roles.includes('fleet_admin');

          const primaryRole: UserRole = hasDriverRole && !hasManagerRole ? 'driver' : hasManagerRole ? 'fleet-manager' : 'driver';

          let driverId: string | undefined;
          if (hasDriverRole) {
            try {
              const driverProfile = await driverApi.getMe();
              driverId = driverProfile.id;
            } catch {
              console.warn('No driver profile linked to this Keycloak account');
            }
          }

          setUserState({
            id: token?.sub ?? '',
            name: token?.name ?? token?.preferred_username ?? '',
            role: primaryRole,
            driverId,
            keycloakRoles: roles,
          });
        }
        setInitialized(true);

        setInterval(() => {
          if (keycloak.authenticated) {
            keycloak.updateToken(60).catch(() => keycloak.logout());
          }
        }, 30000);
      })
      .catch(() => setInitialized(true));
  }, []);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const keycloakRoles = user?.keycloakRoles ?? [];
  const hasDriverRole = keycloakRoles.includes('fleet_driver');
  const hasManagerRole = keycloakRoles.includes('fleet_manager') || keycloakRoles.includes('fleet_admin');

  const value: AuthContextType = {
    user,
    authenticated: !!user,
    setUser: setUserState,
    login: () => keycloak.login({ redirectUri: window.location.origin }),
    loginWith: (idpHint) =>
      keycloak.login({ redirectUri: window.location.origin, idpHint }),
    register: () => keycloak.register({ redirectUri: window.location.origin }),
    loginAsDriver: () => {},
    loginAsManager: () => {},
    isDriver: user?.role === 'driver',
    isFleetManager: user?.role === 'fleet-manager',
    hasBothRoles: hasDriverRole && hasManagerRole,
    logout: () => keycloak.logout({ redirectUri: window.location.origin }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
