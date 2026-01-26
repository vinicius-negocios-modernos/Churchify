
import React, { createContext, useContext, useState } from 'react';
import { User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Simula um usuário logado permanentemente para pular a tela de login
  const [user] = useState<any>({ 
    uid: 'admin-user', 
    email: 'admin@churchify.com',
    displayName: 'Administrador'
  });
  
  const loading = false;

  const signIn = async () => {
    console.log("Autenticação desativada (Acesso direto)");
  };

  const logout = async () => {
    console.log("Logout desativado");
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
