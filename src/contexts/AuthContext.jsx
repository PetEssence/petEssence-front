import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { message } from "antd";

export const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setCarregando(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      message.success("Login realizado com sucesso!");
    } catch (error) {
      message.error("Erro ao fazer login: E-mail ou senha incorretos ");
      throw error;
    }
  };

  const redefinirSenha = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      message.success("E-mail de redefinição de senha enviado!");
    } catch (error) {
      message.error("Erro ao enviar e-mail: " + error.message);
      throw error;
    }
  };

  const registrar = async (email, senha, nome) => {
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        senha
      );
      await updateProfile(user, { displayName: nome });
    } catch (error) {
      message.error("Erro ao criar conta: " + error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      message.success("Logout realizado com sucesso!");
    } catch (error) {
      message.error("Erro ao fazer logout: " + error.message);
      throw error;
    }
  };

  const value = {
    usuario,
    carregando,
    login,
    registrar,
    logout,
    redefinirSenha
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (contexto === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return contexto;
}
