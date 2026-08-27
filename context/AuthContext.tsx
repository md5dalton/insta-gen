"use client"

import { createContext, useContext, useState, useEffect, FC, ReactNode } from "react"
import { api, setAuthToken, clearAuthToken, getAuthToken } from "@/lib/api"
import { AdminUser } from "@/types/types"

interface AuthContextType {
    user: AdminUser | null
    isConfigured: boolean
    loading: boolean
    login: (data: { email: string; password: string }) => Promise<void>
    setup: (data: {
        name: string
        email: string
        password: string
        confirmPassword: string
    }) => Promise<void>
    logout: () => Promise<void>
    refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AdminUser | null>(null)
    const [isConfigured, setIsConfigured] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(true)

    const checkAuth = async () => {
        try {
            setLoading(true)
            const res = await api.getAuthStatus()
            setIsConfigured(res.isConfigured)

            if (res.isAuthenticated && res.user) {
                setUser(res.user)
            } else {
                setUser(null)
                if (!getAuthToken()) clearAuthToken()
            }
        } catch (err: any) {
            if (err.data?.isConfigured) setIsConfigured(true)
            setUser(null)
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
            setUser(res.user)
            setIsConfigured(true)
        }
    }

    const setup = async (data: {
        name: string
        email: string
        password: string
        confirmPassword: string
    }) => {
        const res = await api.setupAdmin(data)
        if (res.token) {
            setAuthToken(res.token)
            setUser(res.user)
            setIsConfigured(true)
        }
    }

    const logout = async () => {
        await api.logout()
        setUser(null)
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isConfigured,
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
