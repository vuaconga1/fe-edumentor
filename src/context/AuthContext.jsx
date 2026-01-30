import { createContext, useContext, useEffect, useState } from 'react';
import userProfileApi from '../api/userProfile';
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from '../utils/avatar';
import { getRoleName } from '../utils/userRole';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await userProfileApi.getAll();
      const u = res?.data?.data;
      if (u) {
        setUser({
          id: u.id,
          name: u.fullName || 'User',
          email: u.email || '',
          avatar: normalizeAvatarUrl(u.avatarUrl) || buildDefaultAvatarUrl({
            id: u.id,
            email: u.email,
            fullName: u.fullName
          }),
          role: u.role, // 0=Student, 1=Mentor, 2=Admin
          roleName: getRoleName(u.role),
          raw: u // keep raw data if needed
        });
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error('Failed to load user:', e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh: loadUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
