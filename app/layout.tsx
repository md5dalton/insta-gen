import { AuthProvider } from "@/context/AuthContext"
import { SettingsProvider } from "@/context/SettingsContext"
import { ReactNode } from "react"

import "./globals.css"

export const metadata = {
    title: "Media Management Dashboard",
    description: "Admin interface",
}

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    <SettingsProvider>{children}</SettingsProvider>
                </AuthProvider>
            </body>
        </html>
    )
}
