"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Loader from "@/components/Loader"
import { useAuth } from "@/context/AuthContext"
import { useSettings } from "@/context/SettingsContext"

export default function HomePage() {
    const router = useRouter()
    const { user, isConfigured, loading } = useAuth()
    const { settings } = useSettings()

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

        if (!settings.mediaRoot) {
            router.replace("/settings-setup")
            return
        }

        router.replace("/dashboard")
    }, [loading, isConfigured, user, settings.mediaRoot, router])

    return <Loader />
}
