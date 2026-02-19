import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type UserRole = 'driver' | 'fleet-manager';

interface User {
  id: string;
  name: string;
  role: UserRole;
  driverId?: string; // If role is driver, this is their driver ID
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loginAsDriver: (driverId: string, driverName: string) => void;
  loginAsManager: () => void;
  isDriver: boolean;
  isFleetManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Load saved user from localStorage or default to manager
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('dev-auth-user');
    if (saved) {
      try {
        const parsedUser = JSON.parse(saved);

        // Validate driver UUID if present
        if (parsedUser.driverId) {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(parsedUser.driverId)) {
            console.warn('Invalid driver UUID in localStorage, clearing...');
            localStorage.removeItem('dev-auth-user');
            // Return default manager
            return {
              id: 'user-1',
              name: 'Fleet Manager',
              role: 'fleet-manager',
            };
          }
        }

        return parsedUser;
      } catch (e) {
        console.error('Failed to parse saved user:', e);
      }
    }
    return {
      id: 'user-1',
      name: 'Fleet Manager',
      role: 'fleet-manager',
    };
  });

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('dev-auth-user', JSON.stringify(user));
    }
  }, [user]);

  const loginAsDriver = (driverId: string, driverName: string) => {
    setUser({
      id: driverId,
      name: driverName,
      role: 'driver',
      driverId: driverId,
    });
  };

  const loginAsManager = () => {
    setUser({
      id: 'user-1',
      name: 'Fleet Manager',
      role: 'fleet-manager',
    });
  };

  const isDriver = user?.role === 'driver';
  const isFleetManager = user?.role === 'fleet-manager';

  return (
    <AuthContext.Provider value={{ user, setUser, loginAsDriver, loginAsManager, isDriver, isFleetManager }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
