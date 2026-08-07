import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const identifier = localStorage.getItem("identifier");
    if (token && role) {
      return { role, identifier: identifier || "" };
    }
    return null;
  });

  function login(token, role, identifier) {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("identifier", identifier || "");
    setUser({ role, identifier: identifier || "" });
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("identifier");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
