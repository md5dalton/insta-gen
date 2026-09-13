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

const DEFAULT_SETTINGS: SystemSettings = {
    mediaRoot: {
        exists: false,
        readable: false,
        writable: false,
        path: "not configured",
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
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const SettingsProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS)
    const [loading, setLoading] = useState(true)

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

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const nextSettings = await api.getSettings()
                setSettings(nextSettings)
            } catch (error: any) {
                if (error?.data?.code === "MEDIA_ROOT_NOT_CONFIGURED") {
                    setSettings(DEFAULT_SETTINGS)
                } else {
                    console.error("Failed to load settings", error)
                }
            } finally {
                setLoading(false)
            }
        }

        void loadSettings()
    }, [])

    const value = useMemo<SettingsContextType>(
        () => ({
            settings,
            loading,
            refreshSettings,
        }),
        [settings, loading, refreshSettings]
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
