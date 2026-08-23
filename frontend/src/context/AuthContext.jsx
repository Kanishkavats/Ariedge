import { createContext, useContext, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.data.user))
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user: u, token } = res.data.data;
      localStorage.setItem('token', token);
      setUser(u);
      return { success: true, role: u.role };
    } catch (err) {
      return { success: false, message: getErrorMessage(err) };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const res = await api.post('/auth/signup', { name, email, password });
      const { user: u, token } = res.data.data;
      localStorage.setItem('token', token);
      setUser(u);
      return { success: true };
    } catch (err) {
      return { success: false, message: getErrorMessage(err) };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser((u) => ({ ...u, ...updatedUser }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
