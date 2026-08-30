"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Loader from "@/components/Loader"
import { useAuth } from "@/context/AuthContext"
import { SettingsProvider, useSettings } from "@/context/SettingsContext"

export default function HomePage() {
    const router = useRouter()
    const { user, isConfigured, loading } = useAuth()
    
    useEffect(() => {
        if (loading) return

        if (!isConfigured) {
            router.replace("/auth/setup")
            return
        }

        if (!user) {
            router.replace("/auth/login")
            return
        }
    }, [loading, isConfigured, user, router])

    if (loading || !isConfigured || !user) return <Loader />
    
    return (
        <SettingsProvider>
            <HomeAfterAuth />
        </SettingsProvider>
    )
}

function HomeAfterAuth() {
    const router = useRouter()
    const { settings } = useSettings()
    
    useEffect(() => {
        if (!settings.mediaRoot) {
            router.replace("/settings-setup")
            return
        }

        router.replace("/dashboard")
    }, [settings.mediaRoot, router])

    return <Loader />
}
