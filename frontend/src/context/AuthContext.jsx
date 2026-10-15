import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const refresh = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch (e) {
      setUser(null);
      if (e.response?.status !== 401) setError(true);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    refresh();
    const expired = () => {
      setUser(null);
      setError(false);
    };
    window.addEventListener("honeybee:session-expired", expired);
    return () =>
      window.removeEventListener("honeybee:session-expired", expired);
  }, []);
  const login = async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    setUser(data);
  };
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      if (e.response?.status !== 401) throw e;
    }
    setUser(null);
  };
  return (
    <AuthContext.Provider
      value={{ user, loading, error, refresh, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
