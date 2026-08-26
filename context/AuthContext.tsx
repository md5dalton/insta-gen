"use client"

import { createContext, useContext, useState, useEffect, FC, ReactNode } from "react"
import { api, setAuthToken, clearAuthToken, getAuthToken } from "@/lib/api"
import { AdminUser } from "@/types/types"

interface AuthContextType {
    admin: AdminUser | null
    setupRequired: boolean
    loading: boolean
    login: (data: { email: string; password: string }) => Promise<void>
    setup: (data: { name: string; email: string; password: string; confirmPassword: string }) => Promise<void>
    logout: () => Promise<void>
    refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [admin, setAdmin] = useState<AdminUser | null>(null)
    const [setupRequired, setSetupRequired] = useState<boolean>(true)
    const [loading, setLoading] = useState<boolean>(true)

    const checkAuth = async () => {
        try {
            setLoading(true)
            const res = await api.getAuthStatus()
            setSetupRequired(res.setupRequired)
            if (res.authenticated && res.admin) {
                setAdmin(res.admin)
            } else {
                setAdmin(null)
                if (!getAuthToken()) {
                clearAuthToken()
                }
            }
        } catch (err: any) {
            if (err.data?.setupRequired) {
                setSetupRequired(true)
            }
            setAdmin(null)
        } finally {
            setLoading(false)
        }
    }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = async (data: { email: string; password: string }) => {
    const res = await api.login(data)
    if (res.token) {
      setAuthToken(res.token)
      setAdmin(res.admin)
      setSetupRequired(false)
    }
  }

  const setup = async (data: { name: string; email: string; password: string; confirmPassword: string }) => {
    const res = await api.setupAdmin(data)
    if (res.token) {
      setAuthToken(res.token)
      setAdmin(res.admin)
      setSetupRequired(false)
    }
  }

  const logout = async () => {
    await api.logout()
    setAdmin(null)
  }

  return (
    <AuthContext.Provider
      value={{
        admin,
        setupRequired,
        loading,
        login,
        setup,
        logout,
        refreshAuth: checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
