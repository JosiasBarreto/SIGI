import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";
import apiClient from "../api/client";
import { configService } from "../services";

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Real initialization
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("access_token");
        // If token exists, we can optionally fetch /me, but since /me is 404, we rely on stored user object
        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      // Real logic
      const response = await apiClient.post<any, any>("/v1/auth/login", { email, password });
      if (response.access_token) {
         localStorage.setItem("access_token", response.access_token);
         if (response.refresh_token) {
           localStorage.setItem("refresh_token", response.refresh_token);
         }
         if (response.user) {
           // Let's adapt the user format to UI User format which has id, name, email, role, etc.
           const mappedUser: User = {
             id: String(response.user.id),
             name: response.user.name,
             email: response.user.email,
             contact: "",
             role: response.user.role,
             status: "Ativo",
             lastAccess: new Date().toISOString()
           };
           setUser(mappedUser);
           localStorage.setItem("user", JSON.stringify(mappedUser));
           configService.get();
         }
         apiClient.defaults.headers.common["Authorization"] = `Bearer ${response.access_token}`;
         return true; // Success
      }
      return false;
    } catch (err) {
      console.error("Login failed", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("sigi_auth_user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    delete apiClient.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

