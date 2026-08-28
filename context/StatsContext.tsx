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
import { useAuth } from "@/context/AuthContext"
import { useSettings } from "@/context/SettingsContext"
import type { LibraryStats } from "@/types/types"

const EMPTY_STATS: LibraryStats = {
    totalFiles: 0,
    readyFiles: 0,
    processingFiles: 0,
    errorFiles: 0,
    totalStorageBytes: 0,
    totalRootCollections: 0,
    totalCollections: 0,
    totalMediaUsers: 0,
    totalMedia: 0,
    imageCount: 0,
    videoCount: 0,
    newMediaCount: 0,
    needsProcessingCount: 0,
    processingFailuresCount: 0,
    markedDeletedCount: 0,
    readyCount: 0,
    processingCount: 0,
    renditions: {
        total: 0,
        ready: 0,
        missing: 0,
        failed: 0,
    },
    recentActivity: [],
}

interface StatsContextType {
    stats: LibraryStats | null
    loading: boolean
    refreshStats: () => Promise<LibraryStats | null>
}

const StatsContext = createContext<StatsContextType | undefined>(undefined)

export const StatsProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth()
    const { settings } = useSettings()
    const [stats, setStats] = useState<LibraryStats | null>(null)
    const [loading, setLoading] = useState(false)

    const refreshStats = useCallback(async () => {
        if (!user) {
            setStats(null)
            return null
        }

        if (!settings.mediaRoot || settings.mediaRoot === "not specified yet") {
            setStats(null)
            return null
        }

        try {
            setLoading(true)
            const nextStats = await api.getStats()
            setStats(nextStats)
            return nextStats
        } catch (error) {
            console.error("Failed to refresh stats", error)
            setStats(EMPTY_STATS)
            return EMPTY_STATS
        } finally {
            setLoading(false)
        }
    }, [user, settings.mediaRoot])

    useEffect(() => {
        void refreshStats()
    }, [refreshStats])

    const value = useMemo<StatsContextType>(
        () => ({
            stats,
            loading,
            refreshStats,
        }),
        [stats, loading, refreshStats]
    )

    return <StatsContext.Provider value={value}>{children}</StatsContext.Provider>
}

export const useStats = () => {
    const context = useContext(StatsContext)
    if (!context) {
        throw new Error("useStats must be used within a StatsProvider")
    }
    return context
}
