import Dashboard from "@/components/Dashboard"
import { SettingsProvider } from "@/context/SettingsContext"
import { StatsProvider } from "@/context/StatsContext"
import { ReactNode } from "react"

export default ({ children }: { children: ReactNode }) => (
    <SettingsProvider>
        <StatsProvider>
            <Dashboard>
                {children}
            </Dashboard>
        </StatsProvider>
    </SettingsProvider>
)
