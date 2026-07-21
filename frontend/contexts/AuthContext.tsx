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
  organizationApproved?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<any>;
  logout: () => Promise<void>;

  /**
   * Updates only the supplied fields.
   * Example:
   * updateUser({ name: "New Name" });
   * updateUser({ avatarUrl: "/uploads/avatar.png" });
   */
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getResponseUser = (data: unknown): User | null => {
  if (!data || typeof data !== "object") return null;

  const candidate = "user" in data ? data.user : data;
  if (!candidate || typeof candidate !== "object") return null;

  const possibleUser = candidate as Partial<User>;
  if (
    typeof possibleUser.id !== "string" ||
    typeof possibleUser.name !== "string" ||
    typeof possibleUser.email !== "string" ||
    typeof possibleUser.role !== "string"
  ) {
    return null;
  }

  return possibleUser as User;
};

let pendingSessionRequest: Promise<User | null> | null = null;

const requestSessionUser = (): Promise<User | null> => {
  if (pendingSessionRequest) return pendingSessionRequest;

  const request = api
    .get('/auth/session')
    .then((response) => getResponseUser(response.data))
    .catch(() => null);

  pendingSessionRequest = request;
  void request.then(() => {
    if (pendingSessionRequest === request) {
      pendingSessionRequest = null;
    }
  });

  return request;
};

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /** Load the server-owned HttpOnly cookie session. */
  useEffect(() => {
    let active = true;

    // Remove bearer credentials left by versions that used localStorage.
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("user");

    const loadSession = async () => {
      try {
        const sessionUser = await requestSessionUser();
        if (active) {
          setUser(sessionUser);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const handleUnauthorized = () => setUser(null);
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    void loadSession();

    return () => {
      active = false;
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  /**
   * Login
   */
  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const authenticatedUser = getResponseUser(response.data);
      if (!authenticatedUser) {
        throw new Error("Login response did not include a valid user");
      }

      setUser(authenticatedUser);
    },
    [],
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
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Clear local UI state even if the already-expired session returns 401.
    } finally {
      setUser(null);
      window.location.href = "/";
    }
  }, []);

  /**
   * Update only changed user fields.
   */
  const updateUser = useCallback(
    (updates: Partial<User>) => {
      setUser((currentUser) => {
        if (currentUser) {
          return { ...currentUser, ...updates };
        }

        return getResponseUser(updates);
      });
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
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
