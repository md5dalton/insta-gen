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
    mediaRoot: "not specified yet",
    mediaRootStatus: {
        exists: false,
        readable: false,
        writable: false,
        path: "not specified yet",
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

    const refreshSettings = useCallback(async () => {
        try {
            const nextSettings = await api.getSettings()
            setSettings(nextSettings)
            return nextSettings
        } catch (error) {
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
