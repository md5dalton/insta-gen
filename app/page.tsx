"use client"
import { useState, useEffect } from "react"
import { AuthSetupPage } from "@/components/AuthSetupPage"
import { DashboardHomePage } from "@/components/DashboardHomePage"
import { MediaLibraryPage } from "@/components/MediaLibraryPage"
import { ProcessingPage } from "@/components/ProcessingPage"
import { CollectionsPage } from "@/components/CollectionsPage"
import { AccessPage } from "@/components/AccessPage"
import { SettingsPage } from "@/components/SettingsPage"
import { useAuth } from "@/context/AuthContext"
import Loader from "@/components/Loader"
import { LoginPage } from "@/components/LoginPage"
import { LibraryStats } from "@/types/types"
import { api } from "@/lib/api"
import Dashboard from "@/components/Dashboard"

export default () => {
    const { user, isConfigured, loading } = useAuth()
    const [currentTab, setCurrentTab] = useState<
        "dashboard" | "media" | "processing" | "collections" | "access" | "settings"
    >("dashboard")
    const [stats, setStats] = useState<LibraryStats | null>(null)

    const fetchStats = async () => {
        if (!user) return

        try {
            const s = await api.getStats()
            setStats(s)
        } catch (err) {
            console.error("Failed to fetch stats", err)
        }
    }

    useEffect(() => {
        if (user) {
            fetchStats()
            const interval = setInterval(fetchStats, 15000)
            return () => clearInterval(interval)
        }
    }, [user, currentTab])

    if (loading) return <Loader />

    // Initial Administrator Setup Flow (if not configured)
    if (!isConfigured) return <AuthSetupPage />

    // Administrator Login Flow (if not authenticated)
    if (!user) return <LoginPage />

    // Main Administrative Application
    return (
        <Dashboard
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            stats={stats}
            onRefreshStats={fetchStats}
        >
            {currentTab === "dashboard" && (
                <DashboardHomePage stats={stats} onNavigate={setCurrentTab} />
            )}
            {currentTab === "media" && <MediaLibraryPage />}
            {currentTab === "processing" && <ProcessingPage />}
            {currentTab === "collections" && <CollectionsPage />}
            {currentTab === "access" && <AccessPage />}
            {currentTab === "settings" && <SettingsPage />}
        </Dashboard>
    )
}
