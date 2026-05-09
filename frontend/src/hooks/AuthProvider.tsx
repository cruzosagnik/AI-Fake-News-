import { useState, type ReactNode } from 'react';
import { register as apiRegister, login as apiLogin } from '../lib/api';
import type { User } from '../types';
import { AuthContext } from './useAuth';

function getStoredAuth() {
  const storedToken = localStorage.getItem('truthlens_token');
  const storedUser = localStorage.getItem('truthlens_user');

  if (!storedToken || !storedUser) {
    return { token: null, user: null };
  }

  try {
    return { token: storedToken, user: JSON.parse(storedUser) as User };
  } catch {
    localStorage.removeItem('truthlens_user');
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [storedAuth] = useState(getStoredAuth);
  const [user, setUser] = useState<User | null>(storedAuth.user);
  const [token, setToken] = useState<string | null>(storedAuth.token);
  const [loading] = useState(false);

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    localStorage.setItem('truthlens_token', res.token);
    localStorage.setItem('truthlens_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await apiRegister(name, email, password);
    localStorage.setItem('truthlens_token', res.token);
    localStorage.setItem('truthlens_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('truthlens_token');
    localStorage.removeItem('truthlens_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
