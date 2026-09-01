"use client"

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type FC,
    type ReactNode,
} from "react"
import { api } from "@/lib/api"
import type { SystemSettings } from "@/types/types"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

const DEFAULT_SETTINGS: SystemSettings = {
    mediaRoot: "",
    mediaRootStatus: {
        exists: false,
        readable: false,
        writable: false,
        path: "",
    },
    databaseStatus: {
        connected: false,
        latencyMs: 0,
    },
    mediaProcessorStatus: {
        running: false,
        activeWorkers: 0,
        queuedJobs: 0,
    },
}

interface SettingsContextType {
    settings: SystemSettings
    loading: boolean
    refreshSettings: () => Promise<SystemSettings>
    updateMediaRoot: (path: string) => Promise<SystemSettings>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const SettingsProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()
    const { user } = useAuth()

    const refreshSettings = useCallback(async () => {
        try {
            const nextSettings = await api.getSettings()
            setSettings(nextSettings)
            return nextSettings
        } catch (error: any) {
            if (error?.data?.code === "MEDIA_ROOT_NOT_CONFIGURED") {
                setSettings(DEFAULT_SETTINGS)
                return DEFAULT_SETTINGS
            }

            console.error("Failed to refresh settings", error)
            return DEFAULT_SETTINGS
        } finally {
            setLoading(false)
        }
    }, [])

    const updateMediaRoot = useCallback(
        async (path: string) => {
            const res = await api.updateMediaRoot(path)
            setSettings(res.settings)
            return res.settings
        },
        []
    )

    useEffect(() => {
        void refreshSettings()
    }, [refreshSettings])

    useEffect(() => {
        if (loading) return
        if (!user) return

        if (!settings.mediaRoot) {
            if (!pathname?.startsWith("/settings-setup")) {
                router.replace("/settings-setup")
            }
            return
        }

        // If settings ready and we're on settings-setup, go to dashboard
        if (settings.mediaRoot && pathname?.startsWith("/settings-setup")) {
            router.replace("/dashboard")
        }
    }, [loading, user, settings.mediaRoot, pathname, router])

    const value = useMemo<SettingsContextType>(
        () => ({
            settings,
            loading,
            refreshSettings,
            updateMediaRoot,
        }),
        [settings, loading, refreshSettings, updateMediaRoot]
    )

    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export const useSettings = () => {
    const context = useContext(SettingsContext)
    if (!context) {
        throw new Error("useSettings must be used within a SettingsProvider")
    }
    return context
}
