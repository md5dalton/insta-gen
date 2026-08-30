"use client"
import { useAuth } from "@/context/AuthContext"
import { ReactNode } from "react"
import Loader from "./Loader"
import { redirect } from "next/navigation"

export default ({ children }: { children: ReactNode }) => {
    const { user, isConfigured, loading } = useAuth()

    if (loading) return <Loader />
    if (!isConfigured) redirect("/auth/setup")
    if (!user) redirect("/auth/login")

    return (
        <>{children}</>
    )
}