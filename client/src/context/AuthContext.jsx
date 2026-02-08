import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { authAPI } from '../api';

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
      try {
        const parsed = JSON.parse(savedUser);
        // 基本完整性校验：确保解析出的用户对象包含 id
        if (parsed && typeof parsed === 'object' && parsed.id) {
          setToken(savedToken);
          setUser(parsed);
          setLoading(false);
          return;
        }
      } catch {
        // localStorage 数据损坏，清除并重新认证
        console.warn('本地用户数据损坏，已清除');
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    // 检查是否为独立模式（使用带超时的 api 实例，避免后端未启动时请求一直挂起导致页面打不开）
    try {
      const { data: config } = await api.get('/config');
      if (config.standalone) {
        setStandalone(true);
        localStorage.setItem('standalone', 'true');
        const { data } = await api.post('/auth/demo');
        login(data.user, data.token);
      } else {
        setStandalone(false);
        localStorage.removeItem('standalone');
      }
    } catch (e) {
      // 请求失败（后端未启动、超时等）不改变 standalone，保证下面 finally 会执行
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, tokenStr) => {
    setUser(userData);
    setToken(tokenStr);
    localStorage.setItem('token', tokenStr);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = useCallback(async () => {
    // 先通知服务端使 token 失效（忽略失败，确保客户端总能登出）
    try {
      await authAPI.logout();
    } catch {
      // 网络错误或 token 已过期 — 不阻塞登出流程
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

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
