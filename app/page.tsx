"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Loader from "@/components/Loader"
import { useAuth } from "@/context/AuthContext"

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

        router.replace("/dashboard")

    }, [loading, isConfigured, user, router])

    if (loading || !isConfigured || !user) return <Loader />
}