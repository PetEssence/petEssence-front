import { createContext, useContext, useEffect, useState } from "react"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth"
import { auth } from "../config/firebase"
import { message } from "antd"

export const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      message.success("Login realizado com sucesso!")
    } catch (error) {
      message.error("Erro ao fazer login: " + error.message)
      throw error
    }
  }

  const register = async (email, password, displayName) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(user, { displayName })
      message.success("Conta criada com sucesso!")
    } catch (error) {
      message.error("Erro ao criar conta: " + error.message)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      message.success("Logout realizado com sucesso!")
    } catch (error) {
      message.error("Erro ao fazer logout: " + error.message)
      throw error
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

