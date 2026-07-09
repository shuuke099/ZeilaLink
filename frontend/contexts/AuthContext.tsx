"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "@/lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  preferredLanguage?: string;
  avatarUrl?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<any>;
  logout: () => void;

  /**
   * Updates only the supplied fields.
   * Example:
   * updateUser({ name: "New Name" });
   * updateUser({ avatarUrl: "/uploads/avatar.png" });
   */
  updateUser: (updates: Partial<User>, nextToken?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Load saved session
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error("Failed to restore session:", err);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Persist user and token
   */
  const persistUser = useCallback(
    (nextUser: User | null, nextToken?: string | null) => {
      setUser(nextUser);

      if (nextToken !== undefined) {
        setToken(nextToken);
      }

      if (typeof window === "undefined") return;

      if (nextUser) {
        localStorage.setItem("user", JSON.stringify(nextUser));
      } else {
        localStorage.removeItem("user");
      }

      if (nextToken !== undefined) {
        if (nextToken) {
          localStorage.setItem("token", nextToken);
        } else {
          localStorage.removeItem("token");
        }
      }
    },
    [],
  );

  /**
   * Login
   */
  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const { token, user } = response.data;

      persistUser(user, token);
    },
    [persistUser],
  );

  /**
   * Register
   * Registration no longer logs the user in.
   * User must verify email first.
   */
  const register = useCallback(async (data: any) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(() => {
    persistUser(null, null);

    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }, [persistUser]);

  /**
   * Update only changed user fields.
   */
  const updateUser = useCallback(
    (updates: Partial<User>, nextToken?: string) => {
      setUser((currentUser) => {
        if (!currentUser) return currentUser;

        const mergedUser: User = {
          ...currentUser,
          ...updates,
        };

        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(mergedUser));

          if (nextToken !== undefined) {
            if (nextToken) {
              localStorage.setItem("token", nextToken);
            } else {
              localStorage.removeItem("token");
            }
          }
        }

        if (nextToken !== undefined) {
          setToken(nextToken);
        }

        return mergedUser;
      });
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
