import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { loginAPI } from '../services/api';
import {
  initVault,
  saveSession,
  logout as clearSession,
  getUser,
  updateUser,
  isAuthenticated as checkAuth,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // On mount: restore session from encrypted vault (survives refresh)
  useEffect(() => {
    (async () => {
      try {
        const restoredUser = await initVault();
        if (restoredUser) {
          setUser(restoredUser);
          setAuthenticated(true);
        }
      } catch {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await loginAPI(username, password);

    if (res.statusCode === 200) {
      await saveSession(res);
      const u = await getUser();
      setUser(u);
      setAuthenticated(true);
      return u;
    }

    throw new Error(res.message || 'Login failed');
  }, []);

  /** Switch the active section (and default to its first role). */
  const switchSection = useCallback(async (sectionId) => {
    const current = await getUser();
    if (!current?.sections) return;
    const section = current.sections.find((s) => s.sectionId === sectionId);
    if (!section) return;
    const firstRole = section.roles?.[0] || null;
    const updated = await updateUser({
      activeSectionId: section.sectionId,
      sectionName: section.sectionName,
      activeRoleId: firstRole?.roleId ?? null,
      role: firstRole?.roleName || 'User',
    });
    setUser(updated);
  }, []);

  /** Switch the active role within the current section. */
  const switchRole = useCallback(async (roleId) => {
    const current = await getUser();
    if (!current?.sections) return;
    const section = current.sections.find((s) => s.sectionId === current.activeSectionId);
    if (!section) return;
    const match = section.roles.find((r) => r.roleId === roleId);
    if (!match) return;
    const updated = await updateUser({
      role: match.roleName,
      activeRoleId: match.roleId,
    });
    setUser(updated);
  }, []);

  const logout = useCallback(async () => {
    await clearSession();
    setUser(null);
    setAuthenticated(false);
  }, []);

  // Show nothing while vault is decrypting on initial load
  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, authenticated, login, logout, switchRole, switchSection }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
