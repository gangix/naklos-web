import { createContext, useContext, useState } from 'react';
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
  isDriver: boolean;
  isFleetManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Default: Fleet manager for demo (can switch roles)
  const [user, setUser] = useState<User | null>({
    id: 'user-1',
    name: 'Fleet Manager',
    role: 'fleet-manager',
  });

  const isDriver = user?.role === 'driver';
  const isFleetManager = user?.role === 'fleet-manager';

  return (
    <AuthContext.Provider value={{ user, setUser, isDriver, isFleetManager }}>
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
