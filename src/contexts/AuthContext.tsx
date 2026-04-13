import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import keycloak from '../auth/keycloak';
import { driverApi } from '../services/api';
import i18n from '../i18n';

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
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    keycloak
      .init({ onLoad: 'check-sso', checkLoginIframe: false, pkceMethod: 'S256' })
      .then(async (authenticated) => {
        if (authenticated) {
          const token = keycloak.tokenParsed as any;
          const userLocale = token?.locale || 'tr';
          i18n.changeLanguage(userLocale);
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

          refreshIntervalRef.current = setInterval(() => {
            if (keycloak.authenticated) {
              keycloak.updateToken(60).catch((err) => {
                // Only logout if the refresh token is actually expired/invalid,
                // not on transient network errors
                if (err instanceof Error && err.message?.includes('network')) {
                  console.warn('Token refresh failed due to network error, will retry', err);
                } else if (keycloak.isTokenExpired(0)) {
                  console.error('Refresh token expired, logging out');
                  keycloak.logout();
                } else {
                  console.warn('Token refresh failed, will retry on next interval', err);
                }
              });
            }
          }, 30000);
        }
        setInitialized(true);
      })
      .catch(() => setInitialized(true));

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
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
    // Only true when the user actually has the Keycloak role.
    // A role-less self-signup should not be treated as a driver.
    isDriver: hasDriverRole,
    isFleetManager: hasManagerRole,
    hasBothRoles: hasDriverRole && hasManagerRole,
    logout: () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      keycloak.logout({ redirectUri: window.location.origin });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
