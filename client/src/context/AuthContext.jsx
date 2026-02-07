import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    // 先检查本地缓存
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedStandalone = localStorage.getItem('standalone');

    if (savedStandalone === 'true') setStandalone(true);

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setLoading(false);
      return;
    }

    // 检查是否为独立模式
    try {
      const { data: config } = await axios.get('/api/config');
      if (config.standalone) {
        setStandalone(true);
        localStorage.setItem('standalone', 'true');
        const { data } = await axios.post('/api/auth/demo');
        login(data.user, data.token);
      }
    } catch (e) {
      // 非独立模式或请求失败
    }
    setLoading(false);
  };

  const login = (userData, tokenStr) => {
    setUser(userData);
    setToken(tokenStr);
    localStorage.setItem('token', tokenStr);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, standalone }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
