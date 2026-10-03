import { createContext, useContext, useEffect, useState } from "react";
import {
  login as loginRequest,
  signup as signupRequest,
  getCurrentUser,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore logged-in user when the page is refreshed
  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("access_token");
          setUser(null);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Login
  const login = async (email, password) => {
    const data = await loginRequest(email, password);

    if (!data?.access_token) {
      throw new Error("Login response did not contain access_token");
    }

    localStorage.setItem("access_token", data.access_token);

    const currentUser = await getCurrentUser();

    setUser(currentUser);

    return currentUser;
  };

  // Register
  const register = async (userData) => {
    return await signupRequest(userData);
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}